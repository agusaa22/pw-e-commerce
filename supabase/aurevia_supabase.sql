-- ============================================================================
--  AUREVIA · SCRIPT MAESTRO DE BASE DE DATOS (PostgreSQL / Supabase)
-- ----------------------------------------------------------------------------
--  Incluye TODO lo necesario para el proyecto, alineado al Desafío Semana 12:
--    - 8 tablas con relaciones e índices
--    - ENUM `estado_orden`
--    - Triggers: perfil al registrarse, updated_at, validación de stock,
--                reposición de stock al borrar línea
--    - STORED PROCEDURE `crear_orden_completa` (transacción atómica
--                con rollback automático + validación de stock)
--    - Permisos para los 3 roles (anon, authenticated, service_role)
--    - Row Level Security con políticas por usuario y por rol
--    - Datos de prueba (3 categorías + 12 productos)
--
--  ⚠️  CORRELO UNA SOLA VEZ y queda todo armado.
--      Es idempotente: si lo corrés de nuevo, borra todo y vuelve a crear.
-- ============================================================================


-- ============================================================================
--  PASO 0 · LIMPIEZA
-- ============================================================================
drop function if exists public.crear_orden_completa(uuid, jsonb, integer, text, text, text, text) cascade;
drop function if exists public.es_admin()                  cascade;
drop function if exists public.handle_new_user()           cascade;
drop function if exists public.set_updated_at()            cascade;
drop function if exists public.decrementar_stock()         cascade;
drop function if exists public.reponer_stock()             cascade;

drop table if exists public.reviews        cascade;
drop table if exists public.favoritos      cascade;
drop table if exists public.orden_items    cascade;
drop table if exists public.ordenes        cascade;
drop table if exists public.carrito_items  cascade;
drop table if exists public.productos      cascade;
drop table if exists public.categorias     cascade;
drop table if exists public.perfiles       cascade;

drop type if exists public.estado_orden cascade;


-- ============================================================================
--  PASO 1 · TIPOS PERSONALIZADOS (ENUM)
-- ============================================================================

-- ENUM para los estados posibles de una orden.
-- Más seguro que usar text: la base no acepta valores inválidos.
create type public.estado_orden as enum (
  'pendiente',
  'pagada',
  'cancelada',
  'enviada'
);


-- ============================================================================
--  PASO 2 · TABLAS
-- ============================================================================

-- ── categorias ──────────────────────────────────────────────────────────────
create table public.categorias (
  id          bigint generated always as identity primary key,
  nombre      text        not null,
  slug        text        not null unique,
  descripcion text,
  created_at  timestamptz not null default now()
);

-- ── productos ───────────────────────────────────────────────────────────────
create table public.productos (
  id               bigint generated always as identity primary key,
  nombre           text        not null,
  slug             text        unique,
  descripcion      text,
  precio           integer     not null default 0,
  stock            integer     not null default 0 check (stock >= 0),
  categoria_id     bigint      references public.categorias(id) on delete set null,
  imagen_url       text,
  imagen_hogar_url text,
  aroma            text,
  tamanio          text,
  destacado        boolean     not null default false,
  activo           boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_productos_categoria on public.productos(categoria_id);
create index idx_productos_activo    on public.productos(activo);
create index idx_productos_destacado on public.productos(destacado);

-- ── perfiles ────────────────────────────────────────────────────────────────
create table public.perfiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  nombre     text,
  email      text,
  telefono   text,
  direccion  text,
  rol        text        not null default 'cliente',
  created_at timestamptz not null default now()
);

-- ── carrito_items ───────────────────────────────────────────────────────────
create table public.carrito_items (
  id          bigint generated always as identity primary key,
  usuario_id  uuid    not null references auth.users(id) on delete cascade,
  producto_id bigint  not null references public.productos(id) on delete cascade,
  cantidad    integer not null default 1 check (cantidad > 0),
  created_at  timestamptz not null default now(),
  unique (usuario_id, producto_id)
);
create index idx_carrito_usuario on public.carrito_items(usuario_id);

-- ── ordenes (con ENUM, referencia_pago y pagado_en) ─────────────────────────
-- usuario_id es NULLABLE para soportar órdenes de "cliente invitado" creadas
-- desde el panel de admin (ventas presenciales o por WhatsApp).
-- Las órdenes de la web online siempre tienen usuario_id porque /checkout
-- exige sesión.
create table public.ordenes (
  id              bigint generated always as identity primary key,
  usuario_id      uuid     references auth.users(id) on delete cascade,
  total           integer  not null default 0,
  estado          estado_orden not null default 'pendiente',
  nombre_envio    text,
  email           text,
  direccion_envio text,
  metodo_pago     text,
  referencia_pago text,     -- id de pago de MP / Stripe / etc.
  pagado_en       timestamptz,
  created_at      timestamptz not null default now()
);
create index idx_ordenes_usuario on public.ordenes(usuario_id);
create index idx_ordenes_estado  on public.ordenes(estado);

-- ── orden_items ─────────────────────────────────────────────────────────────
create table public.orden_items (
  id              bigint generated always as identity primary key,
  orden_id        bigint  not null references public.ordenes(id) on delete cascade,
  producto_id     bigint  references public.productos(id) on delete set null,
  nombre_producto text    not null,
  precio_unitario integer not null,
  cantidad        integer not null check (cantidad > 0)
);
create index idx_orden_items_orden on public.orden_items(orden_id);

-- ── favoritos ───────────────────────────────────────────────────────────────
create table public.favoritos (
  id          bigint generated always as identity primary key,
  usuario_id  uuid   not null references auth.users(id) on delete cascade,
  producto_id bigint not null references public.productos(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (usuario_id, producto_id)
);

-- ── reviews ─────────────────────────────────────────────────────────────────
create table public.reviews (
  id          bigint generated always as identity primary key,
  usuario_id  uuid    not null references auth.users(id) on delete cascade,
  producto_id bigint  not null references public.productos(id) on delete cascade,
  puntaje     integer not null check (puntaje between 1 and 5),
  comentario  text,
  created_at  timestamptz not null default now()
);
create index idx_reviews_producto on public.reviews(producto_id);


-- ============================================================================
--  PASO 3 · FUNCIONES
-- ============================================================================

-- es_admin(): true si el usuario logueado tiene rol 'admin'
create or replace function public.es_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

-- handle_new_user(): crea automáticamente un perfil al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, email, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    new.email,
    'cliente'
  );
  return new;
end;
$$;

-- set_updated_at(): refresca updated_at en productos
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- decrementar_stock(): VALIDA y decrementa stock cuando se inserta una línea.
-- Si no hay stock suficiente, FALLA (raise exception) y la transacción se revierte.
create or replace function public.decrementar_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock_actual integer;
  v_producto_nombre text;
begin
  select stock, nombre
    into v_stock_actual, v_producto_nombre
  from public.productos
  where id = new.producto_id;

  if v_stock_actual is null then
    raise exception 'Producto no encontrado (id=%)', new.producto_id;
  end if;

  if v_stock_actual < new.cantidad then
    raise exception 'Stock insuficiente para "%": hay % disponibles, querés llevar %',
      v_producto_nombre, v_stock_actual, new.cantidad;
  end if;

  update public.productos
  set stock = stock - new.cantidad
  where id = new.producto_id;

  return new;
end;
$$;

-- reponer_stock(): devuelve stock si se borra una línea
create or replace function public.reponer_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.productos
  set stock = stock + old.cantidad
  where id = old.producto_id;
  return old;
end;
$$;

-- ============================================================================
--  STORED PROCEDURE · crear_orden_completa
-- ----------------------------------------------------------------------------
--  Crea la orden + sus items en UNA SOLA TRANSACCIÓN ATÓMICA:
--    1) Valida stock de TODOS los items antes de tocar nada
--    2) Crea la cabecera de la orden con el estado correcto según método de pago
--       (tarjeta/efectivo → pagada; mercadopago → pendiente)
--    3) Crea las líneas (esto dispara el trigger que decrementa stock)
--    4) Si CUALQUIER paso falla, se hace ROLLBACK automático y se devuelve error
--       (las funciones plpgsql son atómicas por defecto)
--
--  ENTRADA:
--    p_usuario_id      - UUID del usuario que compra
--    p_items           - JSONB array de productos: [{id, nombre, precio, cantidad}]
--    p_total           - Total de la compra (snapshot)
--    p_nombre_envio    - Nombre para la entrega
--    p_email           - Email de contacto
--    p_direccion_envio - Dirección de entrega
--    p_metodo_pago     - 'tarjeta' | 'efectivo' | 'mercadopago'
--
--  SALIDA: JSONB con { ok, orden_id, estado } si OK, o { error } si falla.
-- ============================================================================
create or replace function public.crear_orden_completa(
  p_usuario_id      uuid,
  p_items           jsonb,
  p_total           integer,
  p_nombre_envio    text,
  p_email           text,
  p_direccion_envio text,
  p_metodo_pago     text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orden_id        bigint;
  v_estado          estado_orden;
  v_item            jsonb;
  v_stock_actual    integer;
  v_producto_nombre text;
begin
  -- (1) VALIDAR STOCK de cada item ANTES de hacer nada
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select stock, nombre
      into v_stock_actual, v_producto_nombre
    from public.productos
    where id = (v_item->>'id')::bigint;

    if v_stock_actual is null then
      raise exception 'Producto no encontrado: id=%', v_item->>'id';
    end if;

    if v_stock_actual < (v_item->>'cantidad')::integer then
      raise exception 'Stock insuficiente para "%": hay % unidades, querés llevar %',
        v_producto_nombre, v_stock_actual, (v_item->>'cantidad')::integer;
    end if;
  end loop;

  -- (2) Estado inicial según método de pago
  v_estado := case
    when p_metodo_pago = 'mercadopago' then 'pendiente'::estado_orden
    else 'pagada'::estado_orden
  end;

  -- (3) Crear la cabecera de la orden
  insert into public.ordenes (
    usuario_id, total, estado,
    nombre_envio, email, direccion_envio,
    metodo_pago, pagado_en
  ) values (
    p_usuario_id, p_total, v_estado,
    p_nombre_envio, p_email, p_direccion_envio,
    p_metodo_pago,
    case when v_estado = 'pagada' then now() else null end
  )
  returning id into v_orden_id;

  -- (4) Crear las líneas (el trigger decrementa stock con validación adicional)
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.orden_items (
      orden_id, producto_id, nombre_producto, precio_unitario, cantidad
    ) values (
      v_orden_id,
      (v_item->>'id')::bigint,
      v_item->>'nombre',
      (v_item->>'precio')::integer,
      (v_item->>'cantidad')::integer
    );
  end loop;

  -- (5) Devolver resultado OK
  return jsonb_build_object(
    'ok', true,
    'orden_id', v_orden_id,
    'estado', v_estado::text
  );

-- Si CUALQUIER cosa falla en el medio, plpgsql hace ROLLBACK automático.
-- Capturamos la excepción para devolver un JSON con el error en vez de crashear.
exception when others then
  return jsonb_build_object(
    'ok', false,
    'error', SQLERRM
  );
end;
$$;


-- ============================================================================
--  PASO 4 · TRIGGERS
-- ============================================================================

-- Crear perfil al registrarse
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Refrescar updated_at en productos
drop trigger if exists trg_productos_updated on public.productos;
create trigger trg_productos_updated
  before update on public.productos
  for each row execute function public.set_updated_at();

-- Decrementar stock al crear línea de orden
drop trigger if exists trg_decrementar_stock on public.orden_items;
create trigger trg_decrementar_stock
  after insert on public.orden_items
  for each row execute function public.decrementar_stock();

-- Reponer stock al borrar línea de orden
drop trigger if exists trg_reponer_stock on public.orden_items;
create trigger trg_reponer_stock
  after delete on public.orden_items
  for each row execute function public.reponer_stock();


-- ============================================================================
--  PASO 5 · PERMISOS PARA LOS 3 ROLES
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to service_role;

-- EXECUTE en el stored procedure para que authenticated lo pueda llamar
grant execute on function public.crear_orden_completa(uuid, jsonb, integer, text, text, text, text)
  to authenticated, service_role;

-- Defaults para tablas futuras
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;
alter default privileges in schema public grant all on sequences to service_role;


-- ============================================================================
--  PASO 6 · ROW LEVEL SECURITY
-- ============================================================================

alter table public.categorias    enable row level security;
alter table public.productos     enable row level security;
alter table public.perfiles      enable row level security;
alter table public.carrito_items enable row level security;
alter table public.ordenes       enable row level security;
alter table public.orden_items   enable row level security;
alter table public.favoritos     enable row level security;
alter table public.reviews       enable row level security;

-- CATEGORÍAS
create policy "categorias visibles para todos"
  on public.categorias for select using (true);
create policy "categorias gestionadas por admin"
  on public.categorias for all
  using (public.es_admin()) with check (public.es_admin());

-- PRODUCTOS
create policy "productos activos visibles para todos"
  on public.productos for select
  using (activo = true or public.es_admin());
create policy "productos gestionados por admin"
  on public.productos for all
  using (public.es_admin()) with check (public.es_admin());

-- PERFILES
create policy "ver mi perfil"
  on public.perfiles for select
  using (auth.uid() = id or public.es_admin());
create policy "editar mi perfil"
  on public.perfiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- CARRITO
create policy "mi carrito"
  on public.carrito_items for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- ÓRDENES
create policy "ver mis ordenes"
  on public.ordenes for select
  using (auth.uid() = usuario_id or public.es_admin());
create policy "crear mis ordenes"
  on public.ordenes for insert
  with check (auth.uid() = usuario_id);
-- ⚠ ADMIN: necesario para editar estado y borrar órdenes desde /admin
create policy "admin actualiza ordenes"
  on public.ordenes for update
  using (public.es_admin()) with check (public.es_admin());
create policy "admin borra ordenes"
  on public.ordenes for delete
  using (public.es_admin());

-- ITEMS DE ORDEN
create policy "ver items de mis ordenes"
  on public.orden_items for select
  using (
    exists (
      select 1 from public.ordenes o
      where o.id = orden_id
        and (o.usuario_id = auth.uid() or public.es_admin())
    )
  );
create policy "crear items en mis ordenes"
  on public.orden_items for insert
  with check (
    exists (
      select 1 from public.ordenes o
      where o.id = orden_id and o.usuario_id = auth.uid()
    )
  );
-- ⚠ ADMIN: cuando se borra una orden, las orden_items caen por cascade.
-- El cascade salta RLS, pero por si el admin quiere borrar líneas sueltas:
create policy "admin gestiona orden_items"
  on public.orden_items for all
  using (public.es_admin()) with check (public.es_admin());

-- FAVORITOS
create policy "mis favoritos"
  on public.favoritos for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- REVIEWS
create policy "reviews visibles para todos"
  on public.reviews for select using (true);
create policy "gestionar mis reviews"
  on public.reviews for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);


-- ============================================================================
--  PASO 7 · DATOS DE PRUEBA (SEED)
-- ============================================================================

insert into public.categorias (nombre, slug, descripcion) values
  ('Velas',         'velas',         'Velas aromáticas de cera de soja, hechas a mano.'),
  ('Aromatizantes', 'aromatizantes', 'Brumas textiles para perfumar telas y ambientes.'),
  ('Sets',          'sets',          'Combos de vela + aromatizante en caja premium.');

insert into public.productos
  (nombre, slug, descripcion, precio, stock, categoria_id, imagen_url, imagen_hogar_url, aroma, tamanio, destacado, activo)
values
  ('Rose Velvet',   'rose-velvet',
   'Rosa empolvada, peonía blanca y un fondo suave de almizcle.',
   22500, 25, (select id from public.categorias where slug='velas'),
   '/prod-rose-velvet.png', '/prod-rose-velvet-hogar.png', 'Rosa y peonía', '180 g', true, true),

  ('Crème Lumière', 'creme-lumiere',
   'Vainilla tostada, haba tonka y una salida cálida y envolvente.',
   24900, 30, (select id from public.categorias where slug='velas'),
   '/prod-creme-lumiere.png', '/prod-creme-lumiere-hogar.png', 'Vainilla y haba tonka', '220 g', true, true),

  ('Blush Cotton',  'blush-cotton',
   'Lino limpio, pera blanca y notas frescas para todos los días.',
   21800, 40, (select id from public.categorias where slug='velas'),
   '/prod-blush-cotton.png', '/prod-blush-cotton-hogar.png', 'Lino y pera blanca', '200 g', true, true),

  ('Golden Amber',  'golden-amber',
   'Ámbar suave, madera cálida y una estela elegante de noche.',
   27300, 18, (select id from public.categorias where slug='velas'),
   '/prod-golden-amber.png', '/prod-golden-amber-hogar.png', 'Ámbar y madera', '300 g', true, true),

  ('Aromatizante Floral',  'aromatizante-floral',
   'Bruma textil floral para perfumar sábanas, cortinas y placares.',
   14500, 40, (select id from public.categorias where slug='aromatizantes'),
   '/arom-floral.png', null, 'Floral fresco', '250 ml', true, true),

  ('Aromatizante Cremoso', 'aromatizante-cremoso',
   'Bruma textil con notas cremosas de vainilla y haba tonka.',
   14500, 35, (select id from public.categorias where slug='aromatizantes'),
   '/arom-cremoso.png', null, 'Vainilla cremosa', '250 ml', true, true),

  ('Aromatizante Fresh',   'aromatizante-fresh',
   'Bruma textil fresca y limpia, ideal para ambientes activos.',
   14500, 50, (select id from public.categorias where slug='aromatizantes'),
   '/arom-fresh.png', null, 'Lino y cítricos', '250 ml', true, true),

  ('Aromatizante Luxury',  'aromatizante-luxury',
   'Bruma textil con notas profundas de ámbar y madera.',
   15900, 25, (select id from public.categorias where slug='aromatizantes'),
   '/arom-luxury.png', null, 'Ámbar y madera', '250 ml', true, true),

  ('Set Floral',  'set-floral',
   'Set de regalo: vela floral + aromatizante en caja premium.',
   38900, 18, (select id from public.categorias where slug='sets'),
   '/set-floral.png', null, 'Floral', 'Caja x2', true, true),

  ('Set Cremoso', 'set-cremoso',
   'Set de regalo: vela cremosa + aromatizante en caja premium.',
   39900, 20, (select id from public.categorias where slug='sets'),
   '/set-cremoso.png', null, 'Cremoso', 'Caja x2', true, true),

  ('Set Fresh',   'set-fresh',
   'Set de regalo: vela fresh + aromatizante en caja premium.',
   36900, 22, (select id from public.categorias where slug='sets'),
   '/set-fresh.png', null, 'Fresh', 'Caja x2', true, true),

  ('Set Luxury',  'set-luxury',
   'Set de regalo: vela luxury + aromatizante en caja premium.',
   44900, 15, (select id from public.categorias where slug='sets'),
   '/set-luxury.png', null, 'Luxury', 'Caja x2', true, true);


-- ============================================================================
--  PASO 8 · HACERTE ADMIN (descomentá y poné tu email)
-- ============================================================================
-- update public.perfiles set rol = 'admin' where email = 'TU-EMAIL@ejemplo.com';


-- ============================================================================
--  ¡LISTO! · CHEQUEO DE SALUD
-- ============================================================================
select 'categorias' as tabla, count(*)::text as cantidad from public.categorias
union all
select 'productos',           count(*)::text from public.productos
union all
select 'productos activos',   count(*)::text from public.productos where activo = true
union all
select 'perfiles',             count(*)::text from public.perfiles
union all
select 'admins',               count(*)::text from public.perfiles where rol = 'admin'
union all
select 'carrito_items',        count(*)::text from public.carrito_items
union all
select 'ordenes total',        count(*)::text from public.ordenes
union all
select 'ordenes pagadas',      count(*)::text from public.ordenes where estado = 'pagada'
union all
select 'orden_items',          count(*)::text from public.orden_items;
