-- ============================================================================
--  AUREVIA · BASE DE DATOS COMPLETA PARA SUPABASE (PostgreSQL)
-- ----------------------------------------------------------------------------
--  CÓMO USAR ESTE ARCHIVO:
--    1. Entrá a tu proyecto en https://supabase.com
--    2. En el menú de la izquierda, hacé clic en "SQL Editor"
--    3. Hacé clic en "New query"
--    4. Copiá y pegá TODO este archivo
--    5. Hacé clic en "Run" (o Ctrl/Cmd + Enter)
--
--  Es SEGURO ejecutarlo varias veces: empieza borrando lo anterior
--  (DROP) y vuelve a crear todo desde cero. Si te equivocás, lo corrés
--  de nuevo y queda limpio.
--
--  QUÉ CREA:
--    - 7 tablas: categorias, productos, perfiles, carrito_items,
--                ordenes, orden_items, favoritos, reviews
--    - Relaciones (foreign keys) entre las tablas
--    - Índices para que las consultas sean rápidas
--    - Triggers (automatismos): crear perfil al registrarse,
--      actualizar la fecha de modificación
--    - Row Level Security (RLS): reglas de seguridad por fila
--    - Datos de prueba (seed): categorías y velas de AUREVIA
-- ============================================================================


-- ============================================================================
--  PASO 0 · LIMPIEZA (borra todo lo anterior para empezar de cero)
-- ----------------------------------------------------------------------------
--  CASCADE = "borrá también todo lo que dependa de esto".
--  El orden importa: primero las tablas que dependen de otras.
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


-- ============================================================================
--  PASO 1 · TABLA "categorias"
-- ----------------------------------------------------------------------------
--  Agrupa los productos: Velas aromáticas, Difusores, Sets, etc.
--  Cada producto pertenece a UNA categoría.
-- ============================================================================
create table public.categorias (
  id          bigint generated always as identity primary key, -- 1, 2, 3... automático
  nombre      text        not null,                              -- "Velas aromáticas"
  slug        text        not null unique,                       -- "velas-aromaticas" (para URLs)
  descripcion text,                                              -- texto opcional
  created_at  timestamptz not null default now()                 -- fecha de creación automática
);

comment on table public.categorias is 'Categorías de productos de AUREVIA';


-- ============================================================================
--  PASO 2 · TABLA "productos"
-- ----------------------------------------------------------------------------
--  El catálogo de velas. Cada fila es un producto.
--  categoria_id se conecta con la tabla categorias (foreign key).
-- ============================================================================
create table public.productos (
  id               bigint generated always as identity primary key,
  nombre           text        not null,
  slug             text        unique,                   -- opcional, para URLs lindas
  descripcion      text,
  precio           integer     not null default 0,       -- en PESOS argentinos enteros (ej: 22500)
  stock            integer     not null default 0,        -- unidades disponibles
  categoria_id     bigint      references public.categorias(id) on delete set null,
  imagen_url       text,                                  -- ej: "/prod-rose-velvet.png"
  imagen_hogar_url text,                                  -- imagen ambientada (opcional)
  aroma            text,                                  -- fragancia (ej: "Rosa y peonía")
  tamanio          text,                                  -- ej: "180 g" o "200 ml"
  destacado        boolean     not null default false,    -- aparece en "destacados"
  activo           boolean     not null default true,     -- si está a la venta
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.productos is 'Catálogo de velas y aromatizantes de AUREVIA';

-- Índices: hacen que filtrar por estos campos sea muy rápido
create index idx_productos_categoria on public.productos(categoria_id);
create index idx_productos_activo    on public.productos(activo);
create index idx_productos_destacado on public.productos(destacado);


-- ============================================================================
--  PASO 3 · TABLA "perfiles"
-- ----------------------------------------------------------------------------
--  Supabase ya tiene una tabla interna "auth.users" donde guarda
--  el email y la contraseña (eso lo maneja Supabase Auth, NO la tocamos).
--
--  "perfiles" guarda los datos EXTRA de cada usuario (nombre, rol, etc.)
--  y se conecta con auth.users por el id.
--
--  rol: 'cliente' (por defecto) o 'admin' (puede gestionar productos).
-- ============================================================================
create table public.perfiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  nombre     text,
  email      text,
  rol        text        not null default 'cliente',  -- 'cliente' | 'admin'
  created_at timestamptz not null default now()
);

comment on table public.perfiles is 'Datos extra de cada usuario, vinculados a auth.users';


-- ============================================================================
--  PASO 4 · TABLA "carrito_items"
-- ----------------------------------------------------------------------------
--  El carrito de cada usuario, guardado en la base (persistente).
--  Cada fila = un producto que un usuario tiene en su carrito.
--  La combinación (usuario_id, producto_id) es ÚNICA: no puede haber
--  dos filas del mismo producto para el mismo usuario; se suma la cantidad.
-- ============================================================================
create table public.carrito_items (
  id          bigint generated always as identity primary key,
  usuario_id  uuid    not null references auth.users(id) on delete cascade,
  producto_id bigint  not null references public.productos(id) on delete cascade,
  cantidad    integer not null default 1 check (cantidad > 0),
  created_at  timestamptz not null default now(),
  unique (usuario_id, producto_id)  -- evita duplicados del mismo producto
);

create index idx_carrito_usuario on public.carrito_items(usuario_id);

comment on table public.carrito_items is 'Carrito persistente: un producto por usuario';


-- ============================================================================
--  PASO 5 · TABLA "ordenes"
-- ----------------------------------------------------------------------------
--  Cada compra confirmada genera UNA orden (la "cabecera" del pedido).
--  Guarda a quién pertenece, el total, el estado y los datos de envío.
--  mp_payment_id sirve para guardar el id de pago de Mercado Pago (sandbox).
-- ============================================================================
create table public.ordenes (
  id              bigint generated always as identity primary key,
  usuario_id      uuid    not null references auth.users(id) on delete cascade,
  total           integer not null default 0,            -- total en pesos
  estado          text    not null default 'pendiente',  -- pendiente|pagada|enviada|cancelada
  nombre_envio    text,
  email           text,
  direccion_envio text,
  metodo_pago     text,                                  -- efectivo|mercadopago|debito
  mp_payment_id   text,                                  -- id de pago de Mercado Pago (opcional)
  created_at      timestamptz not null default now()
);

create index idx_ordenes_usuario on public.ordenes(usuario_id);

comment on table public.ordenes is 'Cabecera de cada compra (a quién, total, estado)';


-- ============================================================================
--  PASO 6 · TABLA "orden_items"
-- ----------------------------------------------------------------------------
--  El detalle de cada orden: qué productos y en qué cantidad.
--  Guardamos nombre y precio "congelados" (snapshot) en el momento de la
--  compra, así si después cambia el precio del producto, la orden vieja
--  conserva el precio que pagó el cliente.
-- ============================================================================
create table public.orden_items (
  id              bigint generated always as identity primary key,
  orden_id        bigint  not null references public.ordenes(id) on delete cascade,
  producto_id     bigint  references public.productos(id) on delete set null,
  nombre_producto text    not null,        -- snapshot del nombre
  precio_unitario integer not null,        -- snapshot del precio
  cantidad        integer not null check (cantidad > 0)
);

create index idx_orden_items_orden on public.orden_items(orden_id);

comment on table public.orden_items is 'Detalle (líneas) de cada orden';


-- ============================================================================
--  PASO 7 · TABLAS OPCIONALES (suman puntos en la rúbrica)
-- ----------------------------------------------------------------------------
--  favoritos: productos marcados como favoritos por un usuario.
--  reviews:   reseñas/comentarios de productos.
--  Podés dejarlas aunque todavía no las uses en la web.
-- ============================================================================
create table public.favoritos (
  id          bigint generated always as identity primary key,
  usuario_id  uuid   not null references auth.users(id) on delete cascade,
  producto_id bigint not null references public.productos(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (usuario_id, producto_id)
);

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
--  PASO 8 · FUNCIONES Y TRIGGERS (automatismos)
-- ============================================================================

-- 8.1 · es_admin(): devuelve true si el usuario logueado es admin.
--      SECURITY DEFINER permite leer "perfiles" sin que RLS la bloquee
--      (evita un error de "recursión" en las políticas).
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

-- 8.2 · handle_new_user(): cuando alguien se REGISTRA en Supabase Auth,
--      crea automáticamente su fila en "perfiles".
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

-- Conectamos la función al evento "se creó un usuario nuevo"
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8.3 · set_updated_at(): actualiza la columna updated_at cada vez que
--      se modifica un producto.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_productos_updated on public.productos;
create trigger trg_productos_updated
  before update on public.productos
  for each row execute function public.set_updated_at();


-- ============================================================================
--  PASO 9 · ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
--  RLS = reglas que deciden, FILA POR FILA, quién puede ver o tocar qué.
--  Sin RLS, cualquiera con la "anon key" podría leer/editar todo.
--  Primero la ACTIVAMOS en cada tabla, después creamos las políticas.
-- ============================================================================
alter table public.categorias    enable row level security;
alter table public.productos     enable row level security;
alter table public.perfiles      enable row level security;
alter table public.carrito_items enable row level security;
alter table public.ordenes       enable row level security;
alter table public.orden_items   enable row level security;
alter table public.favoritos     enable row level security;
alter table public.reviews       enable row level security;

-- ── CATEGORÍAS ──────────────────────────────────────────────────────────────
-- Todos (incluso sin login) pueden VER las categorías.
create policy "categorias visibles para todos"
  on public.categorias for select
  using (true);

-- Solo un admin puede crear/editar/borrar categorías.
create policy "categorias gestionadas por admin"
  on public.categorias for all
  using (public.es_admin())
  with check (public.es_admin());

-- ── PRODUCTOS ───────────────────────────────────────────────────────────────
-- Todos pueden VER los productos ACTIVOS (los que están a la venta).
create policy "productos activos visibles para todos"
  on public.productos for select
  using (activo = true or public.es_admin());
-- (el admin ve también los inactivos, para poder reactivarlos)

-- Solo un admin puede crear/editar/borrar productos.
create policy "productos gestionados por admin"
  on public.productos for all
  using (public.es_admin())
  with check (public.es_admin());

-- ── PERFILES ────────────────────────────────────────────────────────────────
-- Cada usuario puede VER su propio perfil.
create policy "ver mi perfil"
  on public.perfiles for select
  using (auth.uid() = id or public.es_admin());

-- Cada usuario puede EDITAR su propio perfil.
create policy "editar mi perfil"
  on public.perfiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── CARRITO ─────────────────────────────────────────────────────────────────
-- Cada usuario solo ve y maneja SU carrito (todas las operaciones).
create policy "mi carrito"
  on public.carrito_items for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- ── ÓRDENES ─────────────────────────────────────────────────────────────────
-- Cada usuario ve solo SUS órdenes (y el admin ve todas).
create policy "ver mis ordenes"
  on public.ordenes for select
  using (auth.uid() = usuario_id or public.es_admin());

-- Cada usuario puede CREAR sus propias órdenes.
create policy "crear mis ordenes"
  on public.ordenes for insert
  with check (auth.uid() = usuario_id);

-- ── ITEMS DE ORDEN ──────────────────────────────────────────────────────────
-- Solo puedo ver/crear items de órdenes que son MÍAS.
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

-- ── FAVORITOS ───────────────────────────────────────────────────────────────
create policy "mis favoritos"
  on public.favoritos for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

-- ── REVIEWS ─────────────────────────────────────────────────────────────────
-- Todos pueden LEER reviews; cada usuario maneja solo las suyas.
create policy "reviews visibles para todos"
  on public.reviews for select
  using (true);

create policy "gestionar mis reviews"
  on public.reviews for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);


-- ============================================================================
--  PASO 10 · DATOS DE PRUEBA (SEED)
-- ----------------------------------------------------------------------------
--  Cargamos las categorías y un catálogo inicial de velas AUREVIA.
--  Las 4 primeras coinciden con las que ya tenés en data/products.js
--  (mismas imágenes en /public). Las demás son ejemplos: cambiá
--  imagen_url por tus propias imágenes cuando las tengas.
-- ============================================================================

-- 10.1 · Categorías
insert into public.categorias (nombre, slug, descripcion) values
  ('Velas aromáticas',     'velas-aromaticas',     'Velas de cera de soja con fragancias premium.'),
  ('Velas decorativas',    'velas-decorativas',    'Velas pensadas para decorar cualquier ambiente.'),
  ('Aromatizantes textiles','aromatizantes-textiles','Brumas para perfumar telas y ambientes.'),
  ('Difusores',            'difusores',            'Difusores de varillas para aroma constante.'),
  ('Sets de regalo',       'sets-de-regalo',       'Combos listos para regalar.'),
  ('Ediciones especiales', 'ediciones-especiales', 'Lanzamientos de temporada y series limitadas.');

-- 10.2 · Productos
--  Usamos una subconsulta para tomar el id de la categoría por su slug,
--  así no dependemos de números fijos.
insert into public.productos
  (nombre, slug, descripcion, precio, stock, categoria_id, imagen_url, imagen_hogar_url, aroma, tamanio, destacado, activo)
values
  ('Rose Velvet',  'rose-velvet',
   'Rosa empolvada, peonía blanca y un fondo suave de almizcle.',
   22500, 25, (select id from public.categorias where slug='velas-aromaticas'),
   '/prod-rose-velvet.png', '/prod-rose-velvet-hogar.png',
   'Rosa y peonía', '180 g', true, true),

  ('Crème Lumière', 'creme-lumiere',
   'Vainilla tostada, haba tonka y una salida cálida y envolvente.',
   24900, 30, (select id from public.categorias where slug='velas-aromaticas'),
   '/prod-creme-lumiere.png', '/prod-creme-lumiere-hogar.png',
   'Vainilla y haba tonka', '220 g', true, true),

  ('Blush Cotton', 'blush-cotton',
   'Lino limpio, pera blanca y notas frescas para todos los días.',
   21800, 40, (select id from public.categorias where slug='velas-aromaticas'),
   '/prod-blush-cotton.png', '/prod-blush-cotton-hogar.png',
   'Lino y pera blanca', '200 g', true, true),

  ('Golden Amber', 'golden-amber',
   'Ámbar suave, madera cálida y una estela elegante de noche.',
   27300, 18, (select id from public.categorias where slug='ediciones-especiales'),
   '/prod-golden-amber.png', '/prod-golden-amber-hogar.png',
   'Ámbar y madera', '300 g', true, true),

  ('Lavanda Provenza', 'lavanda-provenza',
   'Lavanda francesa relajante con un fondo herbal limpio.',
   20900, 35, (select id from public.categorias where slug='velas-decorativas'),
   '/prod-rose-velvet.png', null,
   'Lavanda', '180 g', false, true),

  ('Cítrico Mediterráneo', 'citrico-mediterraneo',
   'Bergamota, limón y naranja para energizar el ambiente.',
   19900, 50, (select id from public.categorias where slug='velas-aromaticas'),
   '/prod-blush-cotton.png', null,
   'Cítricos', '160 g', false, true),

  ('Bruma Textil Fleur', 'bruma-textil-fleur',
   'Aromatizante textil floral para sábanas, cortinas y placares.',
   14500, 60, (select id from public.categorias where slug='aromatizantes-textiles'),
   '/prod-creme-lumiere.png', null,
   'Floral fresco', '250 ml', false, true),

  ('Difusor Madera & Ámbar', 'difusor-madera-ambar',
   'Difusor de varillas con aroma constante hasta 3 meses.',
   31900, 20, (select id from public.categorias where slug='difusores'),
   '/prod-golden-amber.png', null,
   'Madera y ámbar', '200 ml', true, true),

  ('Set Aurevia Esencial', 'set-aurevia-esencial',
   'Set de regalo: 2 velas aromáticas + bruma textil en caja premium.',
   54900, 15, (select id from public.categorias where slug='sets-de-regalo'),
   '/prod-rose-velvet-hogar.png', null,
   'Surtido', 'Caja x3', true, true),

  ('Vela Edición Invierno', 'vela-edicion-invierno',
   'Edición limitada: canela, clavo de olor y naranja especiada.',
   28900, 12, (select id from public.categorias where slug='ediciones-especiales'),
   '/prod-golden-amber-hogar.png', null,
   'Especias invernales', '250 g', false, true);


-- ============================================================================
--  ¡LISTO!  Verificá en el menú "Table Editor" que aparezcan las tablas
--  con datos. Probá esta consulta en el SQL Editor para confirmar:
--
--    select p.nombre, p.precio, p.stock, c.nombre as categoria
--    from public.productos p
--    left join public.categorias c on c.id = p.categoria_id
--    order by p.id;
-- ============================================================================
