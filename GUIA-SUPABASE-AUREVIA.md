# Guía completa: Supabase + Base de datos para AUREVIA

> Guía paso a paso pensada para vos, que estás empezando. No salteo pasos.
> Te digo **qué hacer, dónde hacer clic, qué código copiar y en qué archivo pegarlo.**
>
> **Tu proyecto hoy (lo que ya tenés):** Next.js 14 (App Router) en JavaScript, con
> los productos hardcodeados en `data/products.js`, un carrito en memoria
> (`context/CartContext.jsx`) y un checkout simulado. Ya está en GitHub y Vercel.
>
> **Lo que vamos a lograr:** que los productos, el carrito y las órdenes vivan en
> una base de datos real (Supabase), con usuarios que se registran e inician sesión,
> seguridad por usuario (RLS) y un panel de administración para cargar productos.

---

## Índice

1. [Explicación simple de qué vamos a hacer](#1-explicación-simple-de-qué-vamos-a-hacer)
2. [Modelo de base de datos recomendado](#2-modelo-de-base-de-datos-recomendado)
3. [SQL completo para Supabase](#3-sql-completo-para-supabase)
4. [Conexión con Next.js](#4-conexión-con-nextjs)
5. [Traer productos desde Supabase](#5-traer-productos-desde-supabase)
6. [Carrito persistente](#6-carrito-persistente)
7. [Login y registro](#7-login-y-registro)
8. [Panel admin básico](#8-panel-admin-básico)
9. [Checklist de verificación](#9-checklist-de-verificación)
10. [Texto para el README / defensa oral](#10-texto-para-el-readme--defensa-oral)
- [Apéndice A: Vercel paso a paso](#apéndice-a-vercel-paso-a-paso)
- [Apéndice B: Checkout sandbox + webhook Mercado Pago](#apéndice-b-checkout-sandbox--webhook-de-mercado-pago)
- [Apéndice C: Errores comunes y cómo resolverlos](#apéndice-c-errores-comunes)

---

## 1. Explicación simple de qué vamos a hacer

Pensá tu tienda como una **heladera con cajones**. Hoy tu web tiene los productos
"pegados con cinta" dentro del código (`data/products.js`): si querés cambiar un
precio, tenés que editar el código y volver a publicar. Eso no es una tienda real.

Una **base de datos** es esa heladera ordenada: cada cosa tiene su cajón (una *tabla*)
y cada cajón guarda fichas (las *filas*). Vamos a usar **Supabase**, que es una
plataforma que te da:

- Una base de datos **PostgreSQL** (la heladera profesional, gratis para empezar).
- **Auth**: el sistema de registro e inicio de sesión (usuarios y contraseñas), ya hecho.
- Una **API automática**: Supabase te deja leer y escribir en las tablas desde tu web
  con unas pocas líneas de JavaScript, sin que tengas que programar un backend entero.

La lógica general de AUREVIA queda así:

- Los **productos** y las **categorías** viven en la base. Tu catálogo los lee de ahí.
- Cuando alguien **se registra**, Supabase guarda su email y contraseña de forma segura,
  y nosotros guardamos su nombre y su rol (cliente o admin) en una tabla aparte (`perfiles`).
- El **carrito** de cada usuario se guarda en la base, así no se pierde al recargar.
- Cuando el usuario **compra**, se crea una **orden** (la cabecera del pedido) y sus
  **items** (qué productos y cuántos). Eso queda guardado para siempre.
- Con **RLS (Row Level Security)** nos aseguramos de que cada persona vea **solo lo suyo**:
  su carrito, sus órdenes. Y que **solo un admin** pueda crear o borrar productos.
- Un **panel admin** te deja a vos cargar, editar y desactivar productos sin tocar código.

En una frase para tu profesor: *"Modelé la base en Supabase/PostgreSQL, escribí el
esquema en SQL directo, activé RLS con políticas por usuario, conecté el catálogo, el
carrito y las órdenes con CRUD real, y agregué autenticación y un panel de administración."*

---

## 2. Modelo de base de datos recomendado

Vamos a crear **8 tablas**. Las 6 primeras son el corazón del e-commerce; las 2 últimas
son opcionales y suman puntos.

| Tabla | Para qué sirve | Se conecta con |
|-------|----------------|----------------|
| `categorias` | Agrupa productos (Velas aromáticas, Difusores, Sets…) | — |
| `productos` | El catálogo de velas | `categorias` |
| `perfiles` | Datos extra del usuario (nombre, rol) | `auth.users` (interna de Supabase) |
| `carrito_items` | El carrito de cada usuario | `auth.users` + `productos` |
| `ordenes` | Cabecera de cada compra (total, estado, envío) | `auth.users` |
| `orden_items` | Detalle de cada orden (qué productos) | `ordenes` + `productos` |
| `favoritos` *(opcional)* | Productos favoritos de un usuario | `auth.users` + `productos` |
| `reviews` *(opcional)* | Reseñas de productos | `auth.users` + `productos` |

### Cómo se relacionan (en criollo)

- Una **categoría** tiene muchos **productos**. Cada producto guarda el `categoria_id`
  de la categoría a la que pertenece (eso es una *foreign key*: una "flecha" que apunta
  a otra tabla).
- Un **usuario** (en `auth.users`, que maneja Supabase) tiene **un perfil**, **un carrito**
  (varios `carrito_items`) y **muchas órdenes**.
- Una **orden** tiene **muchos `orden_items`** (las líneas del pedido: 2 Rose Velvet,
  1 Difusor, etc.).

### Qué columnas tiene cada `producto`

Justo lo que pide tu rúbrica: `id`, `nombre`, `descripcion`, `precio`, `stock`,
`categoria_id` (la categoría), `imagen_url`, `aroma`, `tamanio` (gramos/ml),
`destacado`, `activo`, `created_at` (fecha de creación) y `updated_at` (fecha de
actualización, se actualiza sola).

### Qué va en Supabase Auth y qué va en `perfiles`

Esta es una duda clásica, y es importante para tu defensa oral:

- **Supabase Auth (`auth.users`, tabla interna que NO tocamos):** guarda el **email**,
  la **contraseña encriptada**, y administra el inicio de sesión, los tokens y el
  "olvidé mi contraseña". Todo eso ya está resuelto por Supabase.
- **Tabla `perfiles` (la creamos nosotros):** guarda los datos **de tu aplicación** que
  Auth no conoce: el **nombre** de la persona, el **rol** (`cliente` o `admin`), y lo que
  se te ocurra (teléfono, etc.). Se conecta a `auth.users` por el mismo `id`.

¿Por qué separadas? Porque la tabla de Auth es "intocable" (la maneja Supabase), y vos
necesitás un lugar propio para tus datos. Cuando alguien se registra, un **trigger**
(automatismo) crea su fila en `perfiles` solito.

---

## 3. SQL completo para Supabase

El script completo ya está guardado en tu proyecto, en el archivo:

```
supabase/aurevia_supabase.sql
```

Crea **todo de una sola vez**: las 8 tablas, los índices, las relaciones, los triggers,
las políticas RLS y los datos de prueba (categorías + 10 velas, las 4 tuyas + 6 ejemplos).

### Cómo ejecutarlo (paso a paso con clics)

1. Entrá a **https://supabase.com** y hacé clic en **Sign in** (registrate con GitHub o
   con tu email; es gratis).
2. Hacé clic en **New project**. Ponele un nombre (`aurevia`), elegí una contraseña para
   la base (¡guardala en algún lado!) y la región más cercana (South America - São Paulo).
   Esperá 1-2 minutos a que se cree.
3. En el menú de la izquierda, hacé clic en **SQL Editor** (ícono `</>`).
4. Hacé clic en **+ New query**.
5. Abrí el archivo `supabase/aurevia_supabase.sql` de tu proyecto, **seleccioná todo**
   (Ctrl/Cmd + A), **copiá** (Ctrl/Cmd + C) y **pegá** en el editor de Supabase.
6. Hacé clic en el botón verde **Run** (abajo a la derecha) o apretá Ctrl/Cmd + Enter.
7. Tiene que decir **"Success. No rows returned"** abajo. ✅

### Cómo verificar que funcionó

- En el menú izquierdo, hacé clic en **Table Editor**. Deberías ver las 8 tablas.
- Hacé clic en la tabla **productos**: tienen que aparecer las 10 velas.
- Para una prueba extra, en **SQL Editor** pegá y corré esto:

```sql
select p.nombre, p.precio, p.stock, c.nombre as categoria
from public.productos p
left join public.categorias c on c.id = p.categoria_id
order by p.id;
```

Tiene que devolverte la lista de velas con su categoría. Si la ves, **el modelo y los
datos están andando**. 🎉

> **Nota sobre las políticas RLS (te las explico una por una):**
>
> - *"productos activos visibles para todos"*: cualquiera (con o sin login) puede **ver**
>   los productos que tienen `activo = true`. El admin ve también los desactivados.
> - *"productos gestionados por admin"*: **solo** un usuario con rol `admin` puede
>   crear, editar o borrar productos.
> - *"mi carrito"*: cada usuario solo puede ver y modificar las filas de carrito **donde
>   `usuario_id` es el suyo**. No puede ver el carrito de otra persona.
> - *"ver mis ordenes" / "crear mis ordenes"*: cada usuario ve y crea **solo sus** órdenes.
> - *"ver mi perfil" / "editar mi perfil"*: cada usuario gestiona **solo su** perfil.
>
> La función `es_admin()` revisa en la tabla `perfiles` si tu rol es `admin`. Así, una
> sola condición protege todas las operaciones de administración.

---

## 4. Conexión con Next.js

### 4.1 · Instalar Supabase

Abrí la terminal **dentro de la carpeta de tu proyecto** (en VS Code: menú
`Terminal → New Terminal`) y pegá este comando:

```bash
npm install @supabase/supabase-js
```

Esto descarga la librería oficial de Supabase para JavaScript. Cuando termine, fijate
que en tu `package.json` aparezca `"@supabase/supabase-js"` en `dependencies`. ✅

### 4.2 · Conseguir tus claves de Supabase

1. En tu proyecto de Supabase, hacé clic en **Project Settings** (el engranaje, abajo a
   la izquierda).
2. Hacé clic en **API Keys** (o **Data API** / **API**, según la versión).
3. Vas a ver dos cosas que necesitás copiar:
   - **Project URL** → algo como `https://abcdxyz.supabase.co`
   - **anon public** (la API key pública) → un texto largo que empieza con `eyJ...`

> La clave `anon` es **pública** y está pensada para usarse en el navegador. Lo que
> protege tus datos NO es ocultar esta clave, sino las políticas **RLS** que ya creamos.
> ⚠️ La otra clave, `service_role`, es **secreta** y NO la vamos a usar en el front.

### 4.3 · Crear el archivo `.env.local`

En la **raíz** de tu proyecto (al lado de `package.json`), creá un archivo nuevo llamado
exactamente `.env.local` y pegá esto, reemplazando con TUS valores:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...tu-clave-anon-larga...
```

> - El prefijo `NEXT_PUBLIC_` es obligatorio: le dice a Next.js que esta variable puede
>   usarse en el navegador.
> - **No pongas comillas** alrededor de los valores.
> - Este archivo **NO se sube a GitHub** (ya está protegido, ver el paso siguiente).

### 4.4 · Proteger `.env.local` en Git

Abrí tu archivo `.gitignore` (raíz del proyecto). Hoy tiene:

```
node_modules/
.next/
.DS_Store
```

Agregá esta línea al final para que tus claves no terminen en GitHub:

```
.env*.local
```

### 4.5 · Crear el cliente de Supabase

Creá una carpeta nueva llamada `lib` en la raíz del proyecto, y dentro un archivo
`supabaseClient.js`. Es decir: **`lib/supabaseClient.js`**. Pegá esto:

```js
/*
  CLIENTE DE SUPABASE
  QUÉ HACE: Crea UNA conexión a Supabase que vamos a reutilizar en toda la app.
  POR QUÉ: En lugar de configurar la conexión en cada archivo, la definimos una
           sola vez acá y la importamos donde haga falta con:
             import { supabase } from '@/lib/supabaseClient'
  Las claves se leen desde .env.local (variables de entorno), nunca se escriben
  directo en el código.
*/
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 4.6 · Reiniciar el servidor

⚠️ **Importante:** Next.js solo lee `.env.local` cuando arranca. Si el servidor ya estaba
corriendo, tenés que reiniciarlo:

1. En la terminal donde corre `npm run dev`, apretá **Ctrl + C** para frenarlo.
2. Volvé a arrancarlo con:

```bash
npm run dev
```

### 4.7 · Probar que la conexión funciona

Vamos a hacer una prueba rápida. Creá un archivo temporal **`app/test/page.js`**:

```jsx
import { supabase } from '@/lib/supabaseClient'

export default async function TestPage() {
  const { data, error } = await supabase
    .from('productos')
    .select('nombre, precio')
    .limit(3)

  return (
    <pre style={{ padding: 20 }}>
      {error
        ? 'ERROR: ' + error.message
        : JSON.stringify(data, null, 2)}
    </pre>
  )
}
```

Entrá en el navegador a **http://localhost:3000/test**. Si ves los nombres y precios de
3 velas, **la conexión anda perfecto**. ✅ Si ves un error, revisá el
[Apéndice C](#apéndice-c-errores-comunes).

Cuando confirmes que funciona, **borrá la carpeta `app/test`** (era solo para probar).

---

## 5. Traer productos desde Supabase

Buena noticia: tu `FeaturedProducts.jsx` **ya hace** `fetch('/api/productos')`, y tu
`ProductCard.jsx` ya está listo para mostrar cada producto. Solo tenemos que cambiar
**de dónde** salen los datos: en vez de leer el archivo `data/products.js`, vamos a leer
la base de Supabase.

### 5.1 · Cambiar la API para que lea de Supabase

Abrí **`app/api/productos/route.js`** y reemplazá **todo** su contenido por esto:

```js
/*
  API ROUTE: /api/productos
  QUÉ HACE: Devuelve los productos ACTIVOS leyéndolos de Supabase (ya no del
           archivo data/products.js). El catálogo (FeaturedProducts) hace
           fetch a esta URL y muestra estos datos.
  POR QUÉ mapeamos los nombres: en la base las columnas se llaman imagen_url,
           tamanio, etc. Pero tus componentes (ProductCard, carrito) ya usan
           imagen, peso, categoria. Para no tener que cambiar todos los
           componentes, "traducimos" los nombres acá.
*/
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  // Traemos los productos activos + el nombre de su categoría (join)
  const { data, error } = await supabase
    .from('productos')
    .select(`
      id, nombre, descripcion, precio, stock, aroma, tamanio,
      imagen_url, imagen_hogar_url, destacado, activo,
      categorias ( nombre )
    `)
    .eq('activo', true)
    .order('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Traducimos los nombres de columnas a los que usan tus componentes
  const productos = data.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precio: p.precio,
    stock: p.stock,
    aroma: p.aroma,
    peso: p.tamanio,
    categoria: p.categorias?.nombre ?? '',
    imagen: p.imagen_url,
    imagenHogar: p.imagen_hogar_url,
    destacado: p.destacado,
  }))

  return NextResponse.json(productos)
}
```

> No hace falta tocar `FeaturedProducts.jsx` ni `ProductCard.jsx`: siguen funcionando
> igual, pero ahora los datos vienen de la base. 🎉

### 5.2 · Que la página de detalle lea de Supabase

Tu detalle (`app/productos/[id]/ProductDetail.jsx`) hoy busca el producto en
`data/products.js`. Vamos a que lo busque en Supabase. Reemplazá **el comienzo** del
componente (desde los `import` hasta donde define `producto`) por esta versión.

Abrí **`app/productos/[id]/ProductDetail.jsx`** y dejá los imports así (quitamos
`import products from '@/data/products'` y agregamos `useEffect` y `supabase`):

```jsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from './product.module.css'
```

Y reemplazá la línea donde busca el producto:

```jsx
// ANTES:
// const producto = products.find(p => p.id === parseInt(id))

// DESPUÉS — buscamos el producto en Supabase:
const { agregarItem } = useCart()
const [cantidad, setCantidad] = useState(1)
const [agregado, setAgregado] = useState(false)
const [producto, setProducto] = useState(null)
const [cargando, setCargando] = useState(true)

useEffect(() => {
  async function cargarProducto() {
    const { data } = await supabase
      .from('productos')
      .select('id, nombre, descripcion, precio, stock, aroma, tamanio, imagen_url, imagen_hogar_url, categorias ( nombre )')
      .eq('id', id)
      .single()

    if (data) {
      // Traducimos los nombres como en la API
      setProducto({
        id: data.id,
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: data.precio,
        stock: data.stock,
        aroma: data.aroma,
        peso: data.tamanio,
        categoria: data.categorias?.nombre ?? '',
        imagen: data.imagen_url,
        imagenHogar: data.imagen_hogar_url,
      })
    }
    setCargando(false)
  }
  cargarProducto()
}, [id])

if (cargando) {
  return (
    <>
      <Header />
      <main className={styles.pagina}><div className="container"><p>Cargando...</p></div></main>
      <Footer />
    </>
  )
}
```

> Importante: como ahora hay `useState`, `useEffect` y `useCart` al principio, **borrá**
> las líneas viejas que declaraban `const { agregarItem } = useCart()`,
> `const [cantidad...]` y `const [agregado...]` más abajo (ya están arriba). El resto del
> componente (el JSX con la imagen, el precio, los botones) queda **igual**.

> 💡 **Nota:** `data/products.js` ya no se usa, pero podés dejarlo en el proyecto sin
> problema (o borrarlo). No molesta.

---

## 6. Carrito persistente

Hoy tu carrito vive solo en la memoria del navegador: si recargás la página, se vacía.
Vamos a hacer que se **guarde en la base** cuando el usuario está logueado (así no se
pierde nunca y aparece en cualquier dispositivo), y que use el almacenamiento local del
navegador cuando es un visitante sin cuenta.

> ⚠️ **Orden de los pasos:** el carrito necesita saber **quién está logueado**, así que
> usa `useAuth()` (que creamos en la **sección 7**). Hacé las dos secciones (6 y 7) y al
> final conectamos todo en el `layout.js` (te lo muestro en el paso 7.5). No importa el
> orden en que pegues el código; lo que importa es que al terminar estén los dos.

### 6.1 · Reemplazar el CartContext

Abrí **`context/CartContext.jsx`** y reemplazá **todo** su contenido por esta versión.
Mantiene exactamente las mismas funciones que ya usás (`agregarItem`, `eliminarItem`,
`actualizarCantidad`, `vaciarCarrito`, `totalItems`, `totalPrecio`), así que **no hay que
tocar** la página del carrito, el checkout, ni los botones. Solo cambia que ahora,
además, **guarda en Supabase**.

```jsx
/*
  CONTEXTO: CartContext (versión persistente con Supabase)
  QUÉ HACE: Igual que antes, provee el carrito a toda la app. PERO ahora:
    - Si el usuario está logueado → guarda y lee el carrito desde Supabase
      (tabla carrito_items). No se pierde al recargar.
    - Si es un visitante sin cuenta → lo guarda en localStorage del navegador.
  Las funciones públicas son las mismas, así que el resto de la app no cambia.
*/
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'

const CartContext = createContext(null)
const CLAVE_LOCAL = 'aurevia_carrito' // nombre con el que guardamos en el navegador

export function CartProvider({ children }) {
  const { usuario } = useAuth()       // quién está logueado (null si nadie)
  const [items, setItems] = useState([])

  /* ── CARGAR el carrito cuando cambia el usuario (login/logout) ─────────── */
  useEffect(() => {
    async function cargar() {
      if (usuario) {
        // Logueado: leemos su carrito desde Supabase + datos del producto (join)
        const { data } = await supabase
          .from('carrito_items')
          .select('cantidad, productos ( id, nombre, precio, imagen_url, tamanio, categorias ( nombre ) )')
          .eq('usuario_id', usuario.id)

        const cargados = (data || []).map((fila) => ({
          id: fila.productos.id,
          nombre: fila.productos.nombre,
          precio: fila.productos.precio,
          imagen: fila.productos.imagen_url,
          categoria: fila.productos.categorias?.nombre ?? '',
          peso: fila.productos.tamanio,
          cantidad: fila.cantidad,
        }))
        setItems(cargados)
      } else {
        // Visitante: leemos del navegador
        const guardado = typeof window !== 'undefined' ? localStorage.getItem(CLAVE_LOCAL) : null
        setItems(guardado ? JSON.parse(guardado) : [])
      }
    }
    cargar()
  }, [usuario])

  /* ── GUARDAR en el navegador cuando es visitante ───────────────────────── */
  useEffect(() => {
    if (!usuario && typeof window !== 'undefined') {
      localStorage.setItem(CLAVE_LOCAL, JSON.stringify(items))
    }
  }, [items, usuario])

  /* ── AGREGAR (CREATE/UPDATE en carrito_items) ──────────────────────────── */
  async function agregarItem(producto, cantidad = 1) {
    const existente = items.find((i) => i.id === producto.id)
    const nuevaCantidad = existente ? existente.cantidad + cantidad : cantidad

    setItems((prev) => {
      if (existente) {
        return prev.map((i) => (i.id === producto.id ? { ...i, cantidad: nuevaCantidad } : i))
      }
      return [...prev, {
        id: producto.id, nombre: producto.nombre, precio: producto.precio,
        imagen: producto.imagen, categoria: producto.categoria, peso: producto.peso, cantidad,
      }]
    })

    if (usuario) {
      // upsert = si ya existe esa fila la actualiza, si no la crea
      await supabase.from('carrito_items').upsert(
        { usuario_id: usuario.id, producto_id: producto.id, cantidad: nuevaCantidad },
        { onConflict: 'usuario_id,producto_id' }
      )
    }
  }

  /* ── ELIMINAR (DELETE) ─────────────────────────────────────────────────── */
  async function eliminarItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    if (usuario) {
      await supabase.from('carrito_items').delete()
        .eq('usuario_id', usuario.id).eq('producto_id', id)
    }
  }

  /* ── ACTUALIZAR CANTIDAD (UPDATE) ──────────────────────────────────────── */
  async function actualizarCantidad(id, nuevaCantidad) {
    if (nuevaCantidad < 1) { eliminarItem(id); return }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, cantidad: nuevaCantidad } : i)))
    if (usuario) {
      await supabase.from('carrito_items').update({ cantidad: nuevaCantidad })
        .eq('usuario_id', usuario.id).eq('producto_id', id)
    }
  }

  /* ── VACIAR (se usa al confirmar la compra) ────────────────────────────── */
  async function vaciarCarrito() {
    setItems([])
    if (usuario) {
      await supabase.from('carrito_items').delete().eq('usuario_id', usuario.id)
    }
  }

  const totalItems  = items.reduce((acc, i) => acc + i.cantidad, 0)
  const totalPrecio = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)

  return (
    <CartContext.Provider value={{
      items, agregarItem, eliminarItem, actualizarCantidad,
      vaciarCarrito, totalItems, totalPrecio,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart debe usarse dentro de un CartProvider')
  return context
}
```

### 6.2 · Crear la orden cuando el usuario compra

Esto es lo que convierte una "simulación" en una tienda real: al confirmar el checkout,
guardamos la **orden** y sus **items** en la base.

Creá un archivo nuevo **`lib/ordenes.js`**:

```js
/*
  HELPER: crearOrden
  QUÉ HACE: Guarda en Supabase la orden (cabecera) y sus items (detalle)
           cuando el usuario confirma la compra.
  Devuelve { orden } si salió bien, o { error } si algo falló.
*/
import { supabase } from '@/lib/supabaseClient'

export async function crearOrden({ usuario, items, total, datosEnvio }) {
  // 1) Creamos la cabecera de la orden y pedimos que nos devuelva la fila creada
  const { data: orden, error } = await supabase
    .from('ordenes')
    .insert({
      usuario_id: usuario.id,
      total,
      estado: 'pendiente',
      nombre_envio: datosEnvio.nombre,
      email: datosEnvio.email,
      direccion_envio: datosEnvio.direccion,
      metodo_pago: datosEnvio.metodoPago,
    })
    .select()
    .single()

  if (error) return { error }

  // 2) Creamos una línea por cada producto del carrito (snapshot de nombre y precio)
  const lineas = items.map((i) => ({
    orden_id: orden.id,
    producto_id: i.id,
    nombre_producto: i.nombre,
    precio_unitario: i.precio,
    cantidad: i.cantidad,
  }))

  const { error: errorItems } = await supabase.from('orden_items').insert(lineas)
  if (errorItems) return { error: errorItems }

  return { orden }
}
```

Ahora abrí **`app/checkout/page.js`** y hacé **3 cambios pequeños**:

**Cambio 1** — agregá estos imports arriba (junto a los que ya tiene):

```jsx
import { useAuth } from '@/context/AuthContext'
import { crearOrden } from '@/lib/ordenes'
```

**Cambio 2** — dentro del componente, justo después de `const router = useRouter()`,
agregá:

```jsx
const { usuario } = useAuth()
```

**Cambio 3** — reemplazá la función `handleSubmit` por esta versión (ahora guarda en
Supabase en vez de usar `setTimeout`):

```jsx
async function handleSubmit(e) {
  e.preventDefault()

  // Si no inició sesión, lo mandamos a login (las órdenes necesitan un usuario)
  if (!usuario) {
    router.push('/login')
    return
  }

  // 1. Validar el formulario
  const nuevosErrores = validar()
  if (Object.keys(nuevosErrores).length > 0) {
    setErrores(nuevosErrores)
    return
  }

  // 2. Guardar la orden en Supabase
  setProcesando(true)
  const { error } = await crearOrden({
    usuario,
    items,
    total: totalPrecio,
    datosEnvio: {
      nombre: form.nombre,
      email: form.email,
      direccion: form.direccion,
      metodoPago,
    },
  })
  setProcesando(false)

  if (error) {
    setErrores({ general: 'No pudimos procesar la compra. Intentá de nuevo.' })
    return
  }

  // 3. Éxito: vaciamos el carrito y mostramos la confirmación
  setConfirmado(true)
  vaciarCarrito()
}
```

> **Verificación:** después de comprar logueado, andá a Supabase → **Table Editor** →
> tabla `ordenes`. Tiene que aparecer tu compra. Y en `orden_items`, sus productos. ✅

---

## 7. Login y registro

Supabase Auth hace casi todo el trabajo pesado (guardar contraseñas encriptadas, manejar
las sesiones). Nosotros creamos un "contexto" para saber en toda la app **quién está
logueado**, y dos páginas (registro e inicio de sesión).

### 7.1 · Desactivar la confirmación por email (para el desarrollo)

Por defecto, Supabase manda un email de confirmación al registrarse, y hasta que no
confirmás no podés iniciar sesión. Para una entrega de cursada es más cómodo desactivarlo:

1. En Supabase, andá a **Authentication** (menú izquierdo) → **Sign In / Providers**
   (o **Providers** → **Email**).
2. Buscá la opción **"Confirm email"** y **desactivala** (toggle en off).
3. Guardá con **Save**.

> Así, al registrarte podés iniciar sesión al instante. (Si preferís dejarlo activado,
> vas a tener que confirmar desde el mail antes de poder entrar.)

### 7.2 · Crear el AuthContext

Creá un archivo nuevo **`context/AuthContext.jsx`**:

```jsx
/*
  CONTEXTO: AuthContext
  QUÉ HACE: Sabe en TODA la app quién está logueado y ofrece las funciones
           para registrarse, iniciar y cerrar sesión.
  POR QUÉ: Igual que el carrito, lo ponemos en un Context para que cualquier
           componente (Header, checkout, admin) sepa si hay un usuario y quién es,
           sin pasar props por todos lados.
  Expone:
    - usuario  → datos de auth (o null si nadie inició sesión)
    - perfil   → fila de la tabla perfiles (nombre, rol)
    - esAdmin  → true si el rol del perfil es 'admin'
    - registrar / iniciarSesion / cerrarSesion → funciones
*/
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil]   = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // 1) Al cargar la app, vemos si ya hay una sesión guardada
    supabase.auth.getSession().then(({ data }) => {
      setUsuario(data.session?.user ?? null)
      setCargando(false)
    })

    // 2) Escuchamos cambios (cuando alguien inicia o cierra sesión)
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUsuario(session?.user ?? null)
    })

    // Limpiamos el "escuchador" cuando el componente se desmonta
    return () => sub.subscription.unsubscribe()
  }, [])

  // Cuando hay usuario, traemos su perfil (nombre y rol)
  useEffect(() => {
    async function cargarPerfil() {
      if (!usuario) { setPerfil(null); return }
      const { data } = await supabase
        .from('perfiles').select('*').eq('id', usuario.id).single()
      setPerfil(data)
    }
    cargarPerfil()
  }, [usuario])

  async function registrar(email, password, nombre) {
    // El "nombre" viaja en options.data y lo usa el trigger para crear el perfil
    return await supabase.auth.signUp({
      email, password, options: { data: { nombre } },
    })
  }

  async function iniciarSesion(email, password) {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  const esAdmin = perfil?.rol === 'admin'

  return (
    <AuthContext.Provider value={{
      usuario, perfil, esAdmin, cargando,
      registrar, iniciarSesion, cerrarSesion,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider')
  return context
}
```

### 7.3 · Página de registro

Creá **`app/registro/page.js`**:

```jsx
/*
  PÁGINA: /registro — formulario para crear una cuenta nueva.
*/
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function RegistroPage() {
  const router = useRouter()
  const { registrar } = useAuth()

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setCargando(true)
    const { error } = await registrar(email, password, nombre)
    setCargando(false)

    if (error) {
      setError(error.message)
      return
    }
    // Registrado: lo mandamos al inicio
    router.push('/')
  }

  return (
    <>
      <Header />
      <main className="container" style={{ maxWidth: 420, margin: '60px auto' }}>
        <h1>Crear cuenta</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required
              style={{ width: '100%', padding: 10 }} />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ width: '100%', padding: 10 }} />
          </label>
          <label>
            Contraseña
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              style={{ width: '100%', padding: 10 }} />
          </label>

          {error && <p style={{ color: 'crimson' }}>{error}</p>}

          <button type="submit" disabled={cargando} style={{ padding: 12 }}>
            {cargando ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>
        <p style={{ marginTop: 16 }}>
          ¿Ya tenés cuenta? <Link href="/login">Iniciá sesión</Link>
        </p>
      </main>
      <Footer />
    </>
  )
}
```

### 7.4 · Página de inicio de sesión

Creá **`app/login/page.js`**:

```jsx
/*
  PÁGINA: /login — formulario para iniciar sesión.
*/
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function LoginPage() {
  const router = useRouter()
  const { iniciarSesion } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    const { error } = await iniciarSesion(email, password)
    setCargando(false)

    if (error) {
      setError('Email o contraseña incorrectos.')
      return
    }
    router.push('/')
  }

  return (
    <>
      <Header />
      <main className="container" style={{ maxWidth: 420, margin: '60px auto' }}>
        <h1>Iniciar sesión</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ width: '100%', padding: 10 }} />
          </label>
          <label>
            Contraseña
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              style={{ width: '100%', padding: 10 }} />
          </label>

          {error && <p style={{ color: 'crimson' }}>{error}</p>}

          <button type="submit" disabled={cargando} style={{ padding: 12 }}>
            {cargando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p style={{ marginTop: 16 }}>
          ¿No tenés cuenta? <Link href="/registro">Registrate</Link>
        </p>
      </main>
      <Footer />
    </>
  )
}
```

### 7.5 · Conectar todo en el layout

Abrí **`app/layout.js`** y envolvé la app con `AuthProvider` **por fuera** del
`CartProvider` (el carrito necesita saber quién está logueado, así que Auth va afuera).

Cambiá el `import` y el `<body>`:

```jsx
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'

// ... metadata igual ...

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

### 7.6 · Mostrar el estado de sesión en el Header

Tu `Header.jsx` tiene un ícono de usuario que hoy no hace nada
(`<a href="#" ...>Mi cuenta</a>`). Vamos a reemplazarlo por un mini-menú que muestra
"Ingresar" o el nombre + "Salir".

Creá **`components/UserMenu.jsx`**:

```jsx
/*
  COMPONENTE: UserMenu — muestra "Ingresar" si no hay sesión, o el nombre y un
  botón "Salir" si la hay. Si el usuario es admin, muestra un link al panel.
*/
'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function UserMenu() {
  const { usuario, perfil, esAdmin, cerrarSesion } = useAuth()

  if (!usuario) {
    return <Link href="/login" aria-label="Iniciar sesión">Ingresar</Link>
  }

  return (
    <span style={{ display: 'inline-flex', gap: 12, alignItems: 'center' }}>
      <span>Hola, {perfil?.nombre || 'cuenta'}</span>
      {esAdmin && <Link href="/admin">Admin</Link>}
      <button onClick={cerrarSesion} style={{ cursor: 'pointer' }}>Salir</button>
    </span>
  )
}
```

Ahora abrí **`components/Header.jsx`** y, arriba con los demás imports, agregá:

```jsx
import UserMenu from './UserMenu'
```

Y reemplazá el bloque del ícono de usuario (el `<a href="#" className={styles.iconLink}
aria-label="Mi cuenta"> ... </a>` con el SVG) por:

```jsx
<UserMenu />
```

### 7.7 · Hacerte admin (para usar el panel)

1. Registrate en tu web con tu email (queda como `cliente`).
2. En Supabase → **SQL Editor**, corré esto reemplazando con tu email:

```sql
update public.perfiles
set rol = 'admin'
where email = 'TU-EMAIL@ejemplo.com';
```

3. Cerrá sesión y volvé a entrar en la web. Ahora `esAdmin` es `true` y vas a ver el
   link **Admin** en el header. ✅

> **Cómo cada usuario ve solo lo suyo:** no depende del front, depende de las políticas
> RLS. Como cada pedido a Supabase viaja con el token del usuario logueado, PostgreSQL
> aplica `auth.uid() = usuario_id` y devuelve únicamente sus filas. Aunque alguien
> "hackeara" el front, la base no le entregaría datos ajenos.

---

## 8. Panel admin básico

El panel te deja **crear, editar, activar/desactivar y borrar** productos sin tocar
código — esto es el **CRUD completo** que pide la rúbrica. Solo lo puede usar un usuario
con rol `admin` (lo controla RLS en la base **y** lo chequeamos en el front).

Creá un archivo nuevo **`app/admin/page.js`** y pegá esto completo:

```jsx
/*
  PÁGINA: /admin — panel mínimo de administración de productos.
  QUÉ HACE: Lista todos los productos y permite crear, editar, activar/desactivar
           y borrar (CRUD completo) directamente sobre Supabase.
  SEGURIDAD: solo entra un admin. Si no lo sos, se muestra un aviso.
            Además, RLS en la base bloquea cualquier escritura que no sea de admin.
*/
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Estado inicial del formulario (vacío = vamos a crear un producto nuevo)
const FORM_VACIO = {
  id: null, nombre: '', descripcion: '', precio: '', stock: '',
  categoria_id: '', aroma: '', tamanio: '', imagen_url: '', destacado: false, activo: true,
}

export default function AdminPage() {
  const { esAdmin, cargando: cargandoAuth } = useAuth()

  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [form, setForm] = useState(FORM_VACIO)
  const [mensaje, setMensaje] = useState('')

  // Traemos productos y categorías al cargar
  async function cargarTodo() {
    const { data: prods } = await supabase
      .from('productos').select('*, categorias(nombre)').order('id')
    setProductos(prods || [])

    const { data: cats } = await supabase.from('categorias').select('*').order('nombre')
    setCategorias(cats || [])
  }

  useEffect(() => { cargarTodo() }, [])

  // Maneja los cambios de cualquier campo del formulario
  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  // CREATE o UPDATE según haya o no un id cargado
  async function guardar(e) {
    e.preventDefault()
    setMensaje('')

    const datos = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: parseInt(form.precio) || 0,
      stock: parseInt(form.stock) || 0,
      categoria_id: form.categoria_id ? parseInt(form.categoria_id) : null,
      aroma: form.aroma,
      tamanio: form.tamanio,
      imagen_url: form.imagen_url,
      destacado: form.destacado,
      activo: form.activo,
    }

    let error
    if (form.id) {
      // UPDATE: ya existe → lo editamos
      ;({ error } = await supabase.from('productos').update(datos).eq('id', form.id))
    } else {
      // CREATE: es nuevo → lo insertamos
      ;({ error } = await supabase.from('productos').insert(datos))
    }

    if (error) { setMensaje('Error: ' + error.message); return }
    setMensaje(form.id ? 'Producto actualizado ✅' : 'Producto creado ✅')
    setForm(FORM_VACIO)   // limpiamos el formulario
    cargarTodo()          // recargamos la lista
  }

  // Carga un producto en el formulario para editarlo
  function editar(p) {
    setForm({
      id: p.id, nombre: p.nombre, descripcion: p.descripcion ?? '',
      precio: p.precio, stock: p.stock, categoria_id: p.categoria_id ?? '',
      aroma: p.aroma ?? '', tamanio: p.tamanio ?? '', imagen_url: p.imagen_url ?? '',
      destacado: p.destacado, activo: p.activo,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // DELETE: borra el producto de la base
  async function borrar(id) {
    if (!confirm('¿Seguro que querés borrar este producto?')) return
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (error) { setMensaje('Error: ' + error.message); return }
    setMensaje('Producto borrado ✅')
    cargarTodo()
  }

  // Activar / desactivar (un "borrado suave": no lo elimina, lo saca del catálogo)
  async function alternarActivo(p) {
    await supabase.from('productos').update({ activo: !p.activo }).eq('id', p.id)
    cargarTodo()
  }

  // ── PROTECCIÓN ───────────────────────────────────────────────────────────
  if (cargandoAuth) return <p style={{ padding: 40 }}>Cargando...</p>
  if (!esAdmin) {
    return (
      <>
        <Header />
        <main className="container" style={{ padding: 40 }}>
          <h1>Acceso restringido</h1>
          <p>Esta sección es solo para administradores.</p>
        </main>
        <Footer />
      </>
    )
  }

  // ── PANEL ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Header />
      <main className="container" style={{ padding: '40px 0', maxWidth: 1000, margin: '0 auto' }}>
        <h1>Panel de administración</h1>

        {mensaje && <p style={{ fontWeight: 'bold' }}>{mensaje}</p>}

        {/* ── FORMULARIO CREAR / EDITAR ── */}
        <form onSubmit={guardar} style={{ display: 'grid', gap: 10, maxWidth: 520, marginBottom: 40 }}>
          <h2>{form.id ? 'Editar producto' : 'Nuevo producto'}</h2>

          <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
          <textarea name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} />
          <input name="precio" type="number" placeholder="Precio (ej: 22500)" value={form.precio} onChange={handleChange} required />
          <input name="stock" type="number" placeholder="Stock" value={form.stock} onChange={handleChange} />

          <select name="categoria_id" value={form.categoria_id} onChange={handleChange}>
            <option value="">— Sin categoría —</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>

          <input name="aroma" placeholder="Aroma / fragancia" value={form.aroma} onChange={handleChange} />
          <input name="tamanio" placeholder="Tamaño (ej: 180 g)" value={form.tamanio} onChange={handleChange} />
          <input name="imagen_url" placeholder="URL de imagen (ej: /prod-rose-velvet.png)" value={form.imagen_url} onChange={handleChange} />

          <label><input type="checkbox" name="destacado" checked={form.destacado} onChange={handleChange} /> Destacado</label>
          <label><input type="checkbox" name="activo" checked={form.activo} onChange={handleChange} /> Activo</label>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit">{form.id ? 'Guardar cambios' : 'Crear producto'}</button>
            {form.id && <button type="button" onClick={() => setForm(FORM_VACIO)}>Cancelar</button>}
          </div>
        </form>

        {/* ── LISTA DE PRODUCTOS ── */}
        <h2>Productos ({productos.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ccc' }}>
              <th>Nombre</th><th>Precio</th><th>Stock</th><th>Categoría</th><th>Activo</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{p.nombre}</td>
                <td>${p.precio}</td>
                <td>{p.stock}</td>
                <td>{p.categorias?.nombre ?? '—'}</td>
                <td>{p.activo ? 'Sí' : 'No'}</td>
                <td style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => editar(p)}>Editar</button>
                  <button onClick={() => alternarActivo(p)}>{p.activo ? 'Desactivar' : 'Activar'}</button>
                  <button onClick={() => borrar(p.id)}>Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
      <Footer />
    </>
  )
}
```

> **Cómo probar el CRUD completo (esto es lo que mira el profe):**
>
> - **CREATE:** llená el formulario y "Crear producto". Aparece en la lista y en el catálogo.
> - **READ:** la lista y el catálogo (`/`) muestran los productos de la base.
> - **UPDATE:** clic en "Editar", cambiá el precio, "Guardar cambios". Se actualiza.
> - **DELETE:** "Borrar" lo elimina; "Desactivar" lo saca del catálogo sin borrarlo.
>
> Si entrás a `/admin` **sin** ser admin, ves "Acceso restringido". Y si alguien intentara
> escribir sin permiso, RLS lo bloquea en la base. Doble candado. 🔒

---

## 9. Checklist de verificación

Revisá esto **antes de entregar**. Marcá cada uno cuando lo confirmes:

**Base de datos (Supabase)**
- [ ] Corrí `supabase/aurevia_supabase.sql` y dice "Success".
- [ ] En **Table Editor** veo las 8 tablas con datos.
- [ ] En la tabla `productos` veo las 10 velas con su categoría.
- [ ] En **Authentication → Policies**, cada tabla tiene RLS activado (candado verde).

**Conexión**
- [ ] `npm install @supabase/supabase-js` se instaló (aparece en `package.json`).
- [ ] Existe `lib/supabaseClient.js`.
- [ ] Existe `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] `.env*.local` está en `.gitignore`.
- [ ] La página de prueba `/test` mostró productos (después la borré).

**Catálogo (READ)**
- [ ] En `http://localhost:3000` veo los productos que están en la base.
- [ ] Si en el panel admin desactivo un producto, **desaparece** del catálogo.
- [ ] La página de detalle `/productos/1` muestra el producto correcto.

**Autenticación**
- [ ] Puedo registrarme en `/registro` y aparece una fila en la tabla `perfiles`.
- [ ] Puedo iniciar sesión en `/login` y el Header muestra mi nombre y "Salir".
- [ ] Me puse `rol = 'admin'` y veo el link **Admin** en el Header.

**Carrito (persistencia + INSERT/UPDATE)**
- [ ] Logueada, agrego productos y aparecen filas en `carrito_items`.
- [ ] Recargo la página y el carrito **sigue** con mis productos.
- [ ] Cambiar la cantidad actualiza la fila en la base.

**Órdenes (CREATE)**
- [ ] Completo el checkout logueada y se crea una fila en `ordenes`.
- [ ] En `orden_items` aparecen los productos de esa compra.
- [ ] Después de comprar, el carrito queda vacío (también en `carrito_items`).

**Panel admin (CRUD)**
- [ ] Puedo **crear** un producto nuevo.
- [ ] Puedo **editar** un producto.
- [ ] Puedo **activar/desactivar** y **borrar** un producto.

**RLS / seguridad**
- [ ] Sin iniciar sesión NO puedo ver carritos ni órdenes (las consultas vuelven vacías).
- [ ] Un usuario común que entra a `/admin` ve "Acceso restringido".

**Producción (Vercel)**
- [ ] Cargué las 2 variables de entorno en Vercel (ver Apéndice A).
- [ ] Hice redeploy y la web en producción muestra los productos de Supabase.

---

## 10. Texto para el README / defensa oral

Pegá esto en tu `readme.md` (hoy está casi vacío). Está escrito en primera persona para
que también te sirva para defender el trabajo:

```markdown
# AUREVIA — Tienda de velas (Programación Web)

E-commerce de velas aromáticas, decorativas, aromatizantes, difusores y sets,
desarrollado con **Next.js 14 (App Router)** y **Supabase (PostgreSQL)**, desplegado
en **Vercel** con despliegue continuo desde GitHub.

## Qué hice con Supabase

- **Modelé la base de datos** en PostgreSQL usando **SQL directo** (archivo
  `supabase/aurevia_supabase.sql`): 8 tablas relacionadas — `categorias`, `productos`,
  `perfiles`, `carrito_items`, `ordenes`, `orden_items` y, como extra, `favoritos` y
  `reviews`. Incluí claves foráneas, índices, triggers y datos de prueba (seed).
- **Autenticación con Supabase Auth**: registro e inicio de sesión por email y
  contraseña. Los datos de acceso viven en `auth.users` (que maneja Supabase) y los
  datos propios (nombre, rol) en mi tabla `perfiles`, que se crea sola al registrarse
  mediante un *trigger*.
- **Row Level Security (RLS)** en todas las tablas: cualquiera ve los productos activos,
  pero cada usuario ve **solo su** carrito y **solo sus** órdenes, y **solo un admin**
  puede crear, editar o borrar productos.
- **CRUD completo** sobre productos desde un **panel de administración** (`/admin`):
  crear, leer, actualizar, activar/desactivar y borrar.
- **Persistencia real**: el catálogo se lee de la base; el carrito se guarda en
  `carrito_items` (no se pierde al recargar); y cada compra genera una orden con su
  detalle en `ordenes` / `orden_items`.

## Estructura técnica

- `lib/supabaseClient.js`: cliente único de Supabase (usa variables de entorno).
- `context/AuthContext.jsx`: estado global de sesión (usuario, perfil, rol).
- `context/CartContext.jsx`: carrito persistente (Supabase si hay sesión, localStorage si no).
- `app/api/productos/route.js`: API que devuelve los productos desde la base.
- `app/admin/page.js`: panel de administración con CRUD.

## Variables de entorno

NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY (cargadas en `.env.local`
para local y en Vercel para producción).
```

### Mini-guion para la defensa oral (30 segundos)

> "AUREVIA es una tienda de velas hecha en Next.js con base de datos en Supabase. Modelé
> ocho tablas en PostgreSQL con SQL directo y las relacioné con claves foráneas. Usé
> Supabase Auth para el registro y login, separando los datos de acceso (en `auth.users`)
> de los datos de la app (en mi tabla `perfiles`). Activé Row Level Security para que cada
> usuario vea solo su carrito y sus órdenes, y para que solo un admin pueda gestionar
> productos. El catálogo, el carrito y las órdenes son persistentes, y armé un panel admin
> con CRUD completo. Todo está desplegado en Vercel con despliegue continuo desde GitHub."

---

## Apéndice A: Vercel paso a paso

### A.1 · Cargar las variables de entorno

Tu `.env.local` **no se sube a GitHub** (¡y está bien!), así que Vercel no las conoce
todavía. Hay que cargarlas a mano:

1. Entrá a **https://vercel.com** y abrí tu proyecto AUREVIA.
2. Andá a **Settings** (arriba) → **Environment Variables** (menú izquierdo).
3. Agregá la primera variable:
   - **Key:** `NEXT_PUBLIC_SUPABASE_URL`
   - **Value:** tu URL de Supabase (`https://...supabase.co`)
   - Dejá marcados los 3 entornos (Production, Preview, Development).
   - Clic en **Save**.
4. Agregá la segunda igual:
   - **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value:** tu clave anon (`eyJ...`)
   - **Save**.

### A.2 · Hacer redeploy

Las variables nuevas solo se aplican en un deploy nuevo:

1. En Vercel, andá a la pestaña **Deployments**.
2. En el último deploy, clic en el menú de los **tres puntitos** `⋯` → **Redeploy** →
   confirmá **Redeploy**.

> **Alternativa (despliegue continuo):** cada vez que hagas `git push` a la rama `main`,
> Vercel publica solo. O sea, subir tus cambios de código a GitHub ya dispara un deploy.
> Para que tome las variables nuevas, igual conviene el redeploy manual la primera vez.

### A.3 · Verificar que Supabase anda en producción

1. Abrí tu web publicada (la URL `*.vercel.app`).
2. Tienen que aparecer los productos del catálogo (vienen de Supabase).
3. Probá registrarte e iniciar sesión en producción.
4. Si algo no carga, abrí la consola del navegador (F12 → pestaña *Console*) y mirá si hay
   un error de variables (ver Apéndice C).

---

## Apéndice B: Checkout sandbox + webhook de Mercado Pago

Tu materia pide "checkout en sandbox y webhooks de Mercado Pago". Ya tenés el flujo de
checkout que **crea la orden en Supabase** (sección 6.2). Para sumar el pago en modo
prueba (sandbox), la idea general es:

1. **Crear una cuenta de prueba** en https://www.mercadopago.com.ar/developers, crear una
   aplicación y copiar el **Access Token de prueba** (sandbox). Guardalo en `.env.local`
   como `MP_ACCESS_TOKEN=...` (sin `NEXT_PUBLIC_`, porque es secreto y se usa solo en el
   servidor).
2. **Crear una preferencia de pago** desde una API route del servidor. Creá
   `app/api/checkout/route.js`:

```js
import { NextResponse } from 'next/server'

export async function POST(request) {
  const { items, ordenId } = await request.json()

  const preferencia = {
    items: items.map((i) => ({
      title: i.nombre,
      quantity: i.cantidad,
      unit_price: i.precio,
      currency_id: 'ARS',
    })),
    external_reference: String(ordenId), // para identificar la orden en el webhook
    back_urls: { success: '/checkout?status=ok' },
  }

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(preferencia),
  })

  const data = await res.json()
  // init_point (o sandbox_init_point) es el link al checkout de Mercado Pago
  return NextResponse.json({ url: data.init_point })
}
```

3. **Recibir el webhook** que Mercado Pago llama cuando cambia el estado del pago.
   Creá `app/api/webhooks/mercadopago/route.js`:

```js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// En el servidor podemos usar la clave service_role (NO la expongas en el front)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const body = await request.json()

  // Mercado Pago avisa el id del pago; acá consultarías el pago y, si está
  // aprobado, marcás la orden como pagada usando external_reference (ordenId).
  if (body.type === 'payment') {
    const ordenId = body.data?.external_reference
    if (ordenId) {
      await supabaseAdmin.from('ordenes')
        .update({ estado: 'pagada', mp_payment_id: String(body.data.id) })
        .eq('id', ordenId)
    }
  }

  return NextResponse.json({ recibido: true })
}
```

> Para el webhook necesitás dos variables más en `.env.local` y en Vercel:
> `MP_ACCESS_TOKEN` y `SUPABASE_SERVICE_ROLE_KEY` (esta última la sacás de Supabase →
> Project Settings → API → `service_role`; **es secreta**). En el panel de Mercado Pago
> configurás la URL del webhook apuntando a
> `https://TU-WEB.vercel.app/api/webhooks/mercadopago`.
>
> Este apéndice es la **guía conceptual** del pago; el núcleo que pide la rúbrica de
> Supabase (modelo, CRUD, persistencia, RLS, auth, carrito, órdenes, panel) ya está
> cubierto en las secciones 1 a 8. Sumá Mercado Pago si tu tiempo lo permite.

---

## Apéndice C: Errores comunes

**"Invalid API key" o la web no carga productos**
La URL o la clave anon están mal o falta reiniciar. Revisá `.env.local` (sin comillas,
sin espacios), guardá, y reiniciá con Ctrl+C y `npm run dev`. En Vercel, revisá que
cargaste las variables y que hiciste redeploy.

**`supabaseUrl is required` al arrancar**
Next.js no encontró las variables. El archivo debe llamarse exactamente `.env.local`,
estar en la raíz (al lado de `package.json`) y las variables deben empezar con
`NEXT_PUBLIC_`. Reiniciá el servidor.

**Me registro pero no puedo iniciar sesión**
Está activada la confirmación por email. Desactivá "Confirm email" (sección 7.1) o
confirmá desde el mail que te llegó.

**El catálogo aparece vacío pero no hay error**
Probablemente RLS está bloqueando. Verificá que corriste TODO el SQL (incluye las
políticas) y que los productos tienen `activo = true`.

**`new row violates row-level security policy` al crear un producto**
No sos admin. Seguí el paso 7.7 para ponerte `rol = 'admin'`, cerrá sesión y volvé a
entrar.

**El carrito no se guarda al recargar**
Verificá que iniciaste sesión (el carrito persiste en la base solo con usuario logueado)
y que el `layout.js` tiene `AuthProvider` **por fuera** de `CartProvider` (paso 7.5).

**El admin no me aparece en el Header**
Después de cambiar el rol a admin en SQL, tenés que **cerrar sesión y volver a entrar**
para que se recargue el perfil.

