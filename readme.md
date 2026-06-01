# AUREVIA — Tienda de velas, aromatizantes y sets

E-commerce desarrollado con **Next.js 14 (App Router)** y **Supabase (PostgreSQL)**,
desplegado en **Vercel** con despliegue continuo desde GitHub. Trabajo final de
Programación Web — ITBA 71.38.

## Demo

- Producción: [aurevia.vercel.app](https://aurevia.vercel.app) <!-- reemplazá por tu URL -->
- Repositorio: [github.com/agusaa22/pw-e-commerce](https://github.com/agusaa22/pw-e-commerce)

## Stack

- **Frontend:** Next.js 14 (App Router) + React 18 + CSS Modules
- **Backend / DB:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Hosting:** Vercel (CI/CD desde la rama `main`)

## Funcionalidades

- Catálogo dividido en tres secciones (**Velas**, **Aromatizantes**, **Sets**) leído desde Supabase.
- **Autenticación de usuarios** (registro, login, logout) con Supabase Auth.
- Página **Mi cuenta** (`/cuenta`) para editar nombre, teléfono, dirección y contraseña.
- **Carrito persistente**: los productos del usuario logueado se guardan en la tabla
  `carrito_items`. Los visitantes usan `localStorage`.
- **Checkout funcional** que crea órdenes reales en la base (`ordenes` + `orden_items`).
- **Panel de administración** (`/admin`, solo rol `admin`) con CRUD completo sobre
  productos: crear, editar, activar/desactivar y borrar.
- **Row Level Security** activa en todas las tablas: cada usuario ve solo su carrito y
  sus órdenes; solo un admin puede modificar productos.

## Modelo de datos

8 tablas en PostgreSQL, modeladas con SQL directo en
[`supabase/aurevia_supabase.sql`](supabase/aurevia_supabase.sql):

| Tabla | Para qué sirve |
|-------|----------------|
| `categorias` | Velas, Aromatizantes, Sets |
| `productos` | Catálogo (nombre, precio, stock, imagen, etc.) |
| `perfiles` | Datos del usuario (nombre, teléfono, dirección, rol), vinculado a `auth.users` |
| `carrito_items` | Carrito persistente por usuario |
| `ordenes` | Cabecera de cada compra |
| `orden_items` | Detalle (líneas) de cada orden con snapshot del precio |
| `favoritos` | (Opcional) productos favoritos por usuario |
| `reviews` | (Opcional) reseñas de productos |

### Qué va en Supabase Auth y qué va en `perfiles`

- **Supabase Auth (`auth.users`)** guarda el email y la contraseña encriptada. Lo maneja
  Supabase: no lo tocamos.
- **`perfiles`** guarda los datos propios de la aplicación (nombre, teléfono, dirección,
  rol). Se crea automáticamente al registrarse con un trigger
  (`handle_new_user`).

### Row Level Security

- Cualquiera puede leer productos activos.
- Cada usuario solo puede leer/modificar su propio carrito (`auth.uid() = usuario_id`).
- Cada usuario solo puede ver sus propias órdenes.
- Solo un usuario con `rol = 'admin'` puede crear, editar o borrar productos
  (chequeado con la función `es_admin()` que es `SECURITY DEFINER`).

## Estructura del proyecto

```
app/
  api/productos/route.js   → API que devuelve productos desde Supabase
  admin/                   → Panel de administración con CRUD
  carrito/                 → Página del carrito
  checkout/                → Checkout con creación real de órdenes
  cuenta/                  → Mi cuenta (datos personales + contraseña)
  login/ · registro/       → Autenticación
  productos/[id]/          → Detalle de producto
context/
  AuthContext.jsx          → Estado global de sesión
  CartContext.jsx          → Carrito persistente (Supabase + localStorage)
components/                → Header, Footer, ProductCard, AddToCartButton, UserMenu, ...
lib/
  supabaseClient.js        → Cliente único de Supabase
  ordenes.js               → Helper crearOrden()
supabase/
  aurevia_supabase.sql     → Modelo completo (tablas, índices, triggers, RLS, seed)
```

## Cómo correr localmente

```bash
git clone https://github.com/agusaa22/pw-e-commerce.git
cd pw-e-commerce
npm install
```

Crear un archivo `.env.local` en la raíz:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon
```

Correr el script `supabase/aurevia_supabase.sql` en el SQL Editor de Supabase para
crear el esquema y los datos de prueba.

```bash
npm run dev
```

La app queda disponible en `http://localhost:3000`.

## Variables de entorno en Vercel

Las mismas dos variables (`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
se cargan en Vercel → **Settings → Environment Variables**, marcando los tres entornos
(Production, Preview, Development). Después un redeploy y la app de producción se
conecta a Supabase.

## Defensa rápida (qué hice y por qué)

Modelé la base en Supabase con SQL directo: 8 tablas relacionadas por claves foráneas,
con índices, triggers (creación automática del perfil al registrarse, `updated_at`
automático en productos) y políticas de Row Level Security para que cada usuario vea
solo lo suyo. Conecté Next.js usando el cliente oficial de Supabase, leyendo los
productos del catálogo desde una API route que mapea las columnas de la base a la
forma que esperan los componentes. La autenticación corre por Supabase Auth con un
AuthContext que expone funciones para registrar, iniciar y cerrar sesión y para
actualizar el perfil o cambiar la contraseña. El carrito vive en un CartContext que
persiste en Supabase para usuarios logueados y en localStorage para visitantes. El
checkout, cuando el usuario confirma la compra, crea una orden y sus líneas en las
tablas correspondientes, guardando snapshot del nombre y precio para que la orden
quede inmutable. Sumé un panel de administración con CRUD completo (`/admin`), accesible
solo por usuarios con rol `admin`. Todo el código está modularizado por carpetas y la
app se publica automáticamente en Vercel con cada push a `main`.
