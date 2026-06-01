-- ============================================================================
--  AUREVIA · SCRIPT MAESTRO DE BASE DE DATOS (PostgreSQL / Supabase)
-- ----------------------------------------------------------------------------
--  Este archivo crea TODO lo que necesita el proyecto AUREVIA:
--    - 8 tablas con relaciones e índices
--    - Triggers (perfil al registrarse, updated_at, stock automático)
--    - Permisos para los 3 roles (anon, authenticated, service_role)
--    - Row Level Security con políticas por usuario y por rol
--    - Datos de prueba (3 categorías + 12 productos)
--
--  ⚠️  CORRELO UNA SOLA VEZ y queda todo armado.
--      Es idempotente: si lo corrés de nuevo, borra todo y vuelve a crear
--      sin romper nada. (Eso sí: los usuarios registrados en auth.users
--      conservan sus cuentas, pero pierden sus perfiles. Se vuelven a
--      crear apenas inicien sesión.)
--
--  CÓMO USARLO:
--    1. Entrá a tu proyecto Supabase.
--    2. Andá a SQL Editor → + New query.
--    3. Pegá TODO este archivo.
--    4. Hacé clic en Run (o Cmd/Ctrl + Enter).
--    5. Tiene que decir "Success. No rows returned".
-- ============================================================================


-- ============================================================================
--  PASO 0 · LIMPIEZA (borra lo anterior para empezar de cero)
-- ============================================================================
drop table if exists public.reviews        cascade;
drop table if exists public.favoritos      cascade;
drop table if exists public.orden_items    cascade;
drop table if exists public.ordenes        cascade;
drop table if exists public.carrito_items  cascade;
drop table if exists public.productos      cascade;
drop table if exists public.categorias     cascade;
drop table if exists public.perfiles       cascade;

drop function if exists public.es_admin()              cascade;
drop function if exists public.handle_new_user()       cascade;
drop function if exists public.set_updated_at()        cascade;
drop function if exists public.decrementar_stock()     cascade;
drop function if exists public.reponer_stock()         cascade;


-- ============================================================================
--  PASO 1 · TABLAS
-- ============================================================================

-- ── categorias ──────────────────────────────────────────────────────────────
create table public.categorias (
  id          bigint generated always as identity primary key,
  nombre      text        not null,
  slug        text        not null unique,
  descripcion text,
  created_at  timestamptz not null default now()
);
comment on table public.categorias is 'Categorías del catálogo: Velas, Aromatizantes, Sets';

-- ── productos ───────────────────────────────────────────────────────────────
create table public.productos (
  id               bigint generated always as identity primary key,
  nombre           text        not null,
  slug             text        unique,
  descripcion      text,
  precio           integer     not null default 0,
  stock            integer     not null default 0,
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
comment on table public.productos is 'Catálogo de velas, aromatizantes y sets de AUREVIA';

create index idx_productos_categoria on public.productos(categoria_id);
create index idx_productos_activo    on public.productos(activo);
create index idx_productos_destacado on public.productos(destacado);

-- ── perfiles (vinculados a auth.users) ──────────────────────────────────────
create table public.perfiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  nombre     text,
  email      text,
  telefono   text,
  direccion  text,
  rol        text        not null default 'cliente',
  created_at timestamptz not null default now()
);
comment on table public.perfiles is 'Datos del usuario (vinculado por id a auth.users)';

-- ── carrito_items (carrito persistente por usuario) ─────────────────────────
create table public.carrito_items (
  id          bigint generated always as identity primary key,
  usuario_id  uuid    not null references auth.users(id) on delete cascade,
  producto_id bigint  not null references public.productos(id) on delete cascade,
  cantidad    integer not null default 1 check (cantidad > 0),
  created_at  timestamptz not null default now(),
  unique (usuario_id, producto_id)
);
create index idx_carrito_usuario on public.carrito_items(usuario_id);

-- ── ordenes (cabecera de cada compra) ───────────────────────────────────────
create table public.ordenes (
  id              bigint generated always as identity primary key,
  usuario_id      uuid    not null references auth.users(id) on delete cascade,
  total           integer not null default 0,
  estado          text    not null default 'pendiente',
  nombre_envio    text,
  email           text,
  direccion_envio text,
  metodo_pago     text,
  mp_payment_id   text,
  created_at      timestamptz not null default now()
);
create index idx_ordenes_usuario on public.ordenes(usuario_id);

-- ── orden_items (detalle de cada orden) ─────────────────────────────────────
create table public.orden_items (
  id              bigint generated always as identity primary key,
  orden_id        bigint  not null references public.ordenes(id) on delete cascade,
  producto_id     bigint  references public.productos(id) on delete set null,
  nombre_producto text    not null,
  precio_unitario integer not null,
  cantidad        integer not null check (cantidad > 0)
);
create index idx_orden_items_orden on public.orden_items(orden_id);

-- ── favoritos (opcional, suma a la rúbrica) ─────────────────────────────────
create table public.favoritos (
  id          bigint generated always as identity primary key,
  usuario_id  uuid   not null references auth.users(id) on delete cascade,
  producto_id bigint not null references public.productos(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (usuario_id, producto_id)
);

-- ── reviews (opcional, suma a la rúbrica) ───────────────────────────────────
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
--  PASO 2 · FUNCIONES (lógica reusable)
-- ============================================================================

-- es_admin(): devuelve true si el usuario logueado es admin
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

-- handle_new_user(): crea automáticamente un perfil cuando alguien se registra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    new.email
  );
  return new;
end;
$$;

-- set_updated_at(): actualiza la columna updated_at cuando se modifica un producto
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- decrementar_stock(): cuando se crea una línea de orden, baja el stock del producto
create or replace function public.decrementar_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.productos
  set stock = greatest(0, stock - new.cantidad)
  where id = new.producto_id;
  return new;
end;
$$;

-- reponer_stock(): si se borra una línea de orden, devuelve el stock
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
--  PASO 3 · TRIGGERS (conectan las funciones a eventos)
-- ============================================================================

-- Cuando se crea un usuario en auth, generar su perfil
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cuando se modifica un producto, actualizar updated_at
drop trigger if exists trg_productos_updated on public.productos;
create trigger trg_productos_updated
  before update on public.productos
  for each row execute function public.set_updated_at();

-- Cuando se crea una línea de orden, decrementar stock
drop trigger if exists trg_decrementar_stock on public.orden_items;
create trigger trg_decrementar_stock
  after insert on public.orden_items
  for each row execute function public.decrementar_stock();

-- Cuando se borra una línea de orden, reponer stock
drop trigger if exists trg_reponer_stock on public.orden_items;
create trigger trg_reponer_stock
  after delete on public.orden_items
  for each row execute function public.reponer_stock();


-- ============================================================================
--  PASO 4 · PERMISOS PARA LOS 3 ROLES DE SUPABASE
-- ----------------------------------------------------------------------------
--  anon          → visitante sin login
--  authenticated → usuario logueado
--  service_role  → operaciones del servidor (webhook, endpoint de confirmar)
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

grant select on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to service_role;

-- Para tablas que crees en el futuro, los permisos se aplican automáticamente
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant all on tables to service_role;

alter default privileges in schema public grant usage, select on sequences to anon, authenticated;
alter default privileges in schema public grant all on sequences to service_role;


-- ============================================================================
--  PASO 5 · ROW LEVEL SECURITY (RLS)
-- ============================================================================

alter table public.categorias    enable row level security;
alter table public.productos     enable row level security;
alter table public.perfiles      enable row level security;
alter table public.carrito_items enable row level security;
alter table public.ordenes       enable row level security;
alter table public.orden_items   enable row level security;
alter table public.favoritos     enable row level security;
alter table public.reviews       enable row level security;

-- ── CATEGORÍAS ──
create policy "categorias visibles para todos"
  on public.categorias for select using (true);

create policy "categorias gestionadas por admin"
  on public.categorias for all
  using (public.es_admin()) with check (public.es_admin());

-- ── PRODUCTOS ──
create policy "productos activos visibles para todos"
  on public.productos for select
  using (activo = true or public.es_admin());

create policy "productos gestionados por admin"
  on public.productos for all
  using (public.es_admin()) with check (public.es_admin());

-- ── PERFILES ──
create policy "ver mi perfil"
  on public.perfiles for select
  using (auth.uid() = id or public.es_admin());

create policy "editar mi perfil"
  on public.perfiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- ── CARRITO ──
create policy "mi carrito"
  on public.carrito_items for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- ── ÓRDENES ──
create policy "ver mis ordenes"
  on public.ordenes for select
  using (auth.uid() = usuario_id or public.es_admin());

create policy "crear mis ordenes"
  on public.ordenes for insert
  with check (auth.uid() = usuario_id);

-- ── ITEMS DE ORDEN ──
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

-- ── FAVORITOS ──
create policy "mis favoritos"
  on public.favoritos for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- ── REVIEWS ──
create policy "reviews visibles para todos"
  on public.reviews for select using (true);

create policy "gestionar mis reviews"
  on public.reviews for all
  using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);


-- ============================================================================
--  PASO 6 · DATOS DE PRUEBA (SEED)
-- ----------------------------------------------------------------------------
--  3 categorías + 12 productos: 4 velas + 4 aromatizantes + 4 sets
--  Las imágenes ya están en /public del proyecto Next.js.
-- ============================================================================

-- 3 categorías
insert into public.categorias (nombre, slug, descripcion) values
  ('Velas',         'velas',         'Velas aromáticas de cera de soja, hechas a mano.'),
  ('Aromatizantes', 'aromatizantes', 'Brumas textiles para perfumar telas y ambientes.'),
  ('Sets',          'sets',          'Combos de vela + aromatizante en caja premium.');

-- 12 productos
insert into public.productos
  (nombre, slug, descripcion, precio, stock, categoria_id, imagen_url, imagen_hogar_url, aroma, tamanio, destacado, activo)
values
  -- ── VELAS ──
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

  -- ── AROMATIZANTES ──
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

  -- ── SETS ──
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
--  PASO 7 · HACERTE ADMIN (descomentá la línea y poné tu email)
-- ----------------------------------------------------------------------------
--  Después de correr este script, registrate en la web con tu email.
--  Luego volvé acá, DESCOMENTÁ la línea de abajo (sacale los --),
--  reemplazá el email y correla.
-- ============================================================================
-- update public.perfiles set rol = 'admin' where email = 'TU-EMAIL@ejemplo.com';


-- ============================================================================
--  ¡LISTO! · CHEQUEO DE SALUD
--  El SELECT final te muestra que todo quedó OK.
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
