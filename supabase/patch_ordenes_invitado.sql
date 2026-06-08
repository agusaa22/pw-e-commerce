-- =====================================================================
-- PATCH · Permitir órdenes de "cliente invitado" (sin usuario_id)
-- =====================================================================
-- QUÉ HACE: Permite que el admin cree órdenes manuales para clientes que
--           NO tienen cuenta registrada en la web (ej: ventas presenciales
--           o por WhatsApp). La orden se guarda igual, con los datos de
--           envío sueltos, pero sin un usuario asociado.
--
-- POR QUÉ: La columna ordenes.usuario_id era NOT NULL, así que la base
--          rechazaba la inserción si no apuntaba a un usuario real.
--
-- IDEMPOTENTE: Podés correr este patch las veces que quieras, no rompe nada.
-- =====================================================================

alter table public.ordenes
  alter column usuario_id drop not null;

-- Verificación rápida
select
  column_name,
  is_nullable,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'ordenes'
  and column_name  = 'usuario_id';
-- Esperado: is_nullable = 'YES'
