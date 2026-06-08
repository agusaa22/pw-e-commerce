-- =====================================================================
-- PATCH · Editar items de una orden (cantidad, precio, agregar/quitar)
-- =====================================================================
-- QUÉ HACE: Crea un stored procedure `reemplazar_items_orden` que reemplaza
--           los items de una orden de forma ATÓMICA:
--             1. Borra los items actuales (los triggers existentes
--                trg_reponer_stock devuelven el stock a los productos).
--             2. Valida que haya stock suficiente para los nuevos items.
--             3. Inserta los nuevos items (los triggers existentes
--                trg_decrementar_stock descuentan el stock).
--             4. Recalcula el total de la orden.
--           Todo dentro de una transacción: si CUALQUIER paso falla,
--           plpgsql hace ROLLBACK automático y el stock queda como estaba.
--
-- POR QUÉ: Para que el admin pueda modificar lo que pidió el cliente
--          (cambiar cantidades, agregar productos, cambiar precios) sin
--          riesgo de dejar el inventario desincronizado.
--
-- IDEMPOTENTE: Se puede correr varias veces, recrea la función en cada caso.
-- =====================================================================

drop function if exists public.reemplazar_items_orden(bigint, jsonb) cascade;

create or replace function public.reemplazar_items_orden(
  p_orden_id bigint,
  p_items    jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item            jsonb;
  v_total           integer := 0;
  v_stock_actual    integer;
  v_producto_nombre text;
begin
  -- Verificar que la orden existe
  if not exists (select 1 from public.ordenes where id = p_orden_id) then
    return jsonb_build_object('ok', false, 'error', 'Orden no encontrada');
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', false, 'error', 'La orden debe tener al menos un item');
  end if;

  -- (1) Borrar items actuales → los triggers reponen el stock automáticamente
  delete from public.orden_items where orden_id = p_orden_id;

  -- (2) Validar stock para los items nuevos ANTES de insertar
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select stock, nombre
      into v_stock_actual, v_producto_nombre
    from public.productos
    where id = (v_item->>'id')::bigint;

    if v_stock_actual is null then
      raise exception 'Producto no encontrado: id=%', v_item->>'id';
    end if;

    if (v_item->>'cantidad')::integer < 1 then
      raise exception 'La cantidad de "%" debe ser al menos 1', v_producto_nombre;
    end if;

    if (v_item->>'precio')::integer < 0 then
      raise exception 'El precio de "%" no puede ser negativo', v_producto_nombre;
    end if;

    if v_stock_actual < (v_item->>'cantidad')::integer then
      raise exception 'Stock insuficiente para "%": hay % unidades, querés llevar %',
        v_producto_nombre, v_stock_actual, (v_item->>'cantidad')::integer;
    end if;
  end loop;

  -- (3) Insertar nuevos items → los triggers decrementan el stock
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.orden_items (
      orden_id, producto_id, nombre_producto, precio_unitario, cantidad
    ) values (
      p_orden_id,
      (v_item->>'id')::bigint,
      v_item->>'nombre',
      (v_item->>'precio')::integer,
      (v_item->>'cantidad')::integer
    );

    v_total := v_total + (v_item->>'precio')::integer * (v_item->>'cantidad')::integer;
  end loop;

  -- (4) Actualizar el total de la orden
  update public.ordenes
    set total = v_total
    where id = p_orden_id;

  return jsonb_build_object(
    'ok', true,
    'orden_id', p_orden_id,
    'total', v_total
  );

exception when others then
  -- ROLLBACK automático de plpgsql. Devolvemos el error legible.
  return jsonb_build_object(
    'ok', false,
    'error', SQLERRM
  );
end;
$$;

grant execute on function public.reemplazar_items_orden(bigint, jsonb)
  to authenticated, service_role;

-- Verificación rápida: que la función existe y es callable
select 'OK: reemplazar_items_orden creada' as resultado
where exists (
  select 1 from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'reemplazar_items_orden'
);
