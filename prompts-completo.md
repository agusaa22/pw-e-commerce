# Historial completo de prompts — Proyecto Aurevia

E-commerce de velas artesanales desarrollado para la materia Programación Web (71.38 - ITBA).
Este archivo documenta, en orden cronológico, todos los prompts enviados a Claude desde el inicio del proyecto hasta su entrega final, incluyendo los problemas que surgieron durante el desarrollo y cómo se resolvieron.

---

## ETAPA 1 — Setup inicial y estructura base

### 1. Inicializar el proyecto
> claude necesito armar un e-commerce para la materia de programación web del ITBA (71.38). La marca se llama Aurevia y vende velas artesanales. Quiero usar Next.js con App Router y JavaScript (no TypeScript). Armá la estructura base del proyecto con Home, productos destacados, y un Header/Footer simples.

### 2. Diseño visual inicial
> quiero una estética elegante, cálida, con tonos tierra y rosados suaves. Inspirado en marcas tipo Diptyque o Jo Malone pero más accesible. Usá una tipografía serif para los títulos y sans-serif para el cuerpo.

### 3. Datos de productos
> armá un archivo `data/products.js` con los productos de la tienda. Cada producto tiene: id, nombre, precio, descripción, imagen, categoría (floral, cremosa, fresh, luxury) y tipo (vela, aromatizante, set).

### 4. Componente de Hero
> hacé un Hero para la Home con una imagen de fondo cálida, un título grande con el nombre de la marca, un subtítulo y un botón que haga scroll a los productos destacados.

---

## ETAPA 2 — Funcionalidades principales

### 5. Funcionalidades principales (del parcial)
> quiero que le hagas los siguientes ajustes a mi pagina web:
> 1. crea un interfaz para cada producto donde se muestra una review del producto.
> 2. crea un carrito de compras para todos los productos
> 3. crea una interfaz donde se entre a el carrito y se pueda ver el checkout y el pago de la compra.

### 6. Arreglar funcionalidad (primera iteración)
> no funciona, arreglalo

> no anda el carrito y no está la review de los productos

### 7. Cambiar menú de navegación
> quiero que en el menu aparezca "velas", "aromatizantes" y "sets"

### 8. Aplicar cambios en Vercel
> necesito que los cambios los hagas ahi, quiero que en el menu aparezca "velas", "aromatizantes" y "sets"

---

## ETAPA 3 — Catálogo navegable

### 9. Crear páginas por tipo de producto
> bien ahora queiro que cuando presiones velas, te abra una pestaña con todas las velas disponibles y sus respectivos precios, eso quiero que lo hagas con las velas, los aromatizantes y los sets, que cuando aprietes te abra una pestaña con los productos

### 10. Productos destacados solo 4 velas
> esta todo perfecto pero quiero que en productos destacados unicamente aparezcan las cuatro velas de antes, y unicamente aparezca el resto de los productos cuando presionas "velas" o "aromatizantes" o "sets"

### 11. Páginas por categoría (Florales, Cremosas, Fresh, Luxury)
> bien ahora quiero que cuando el usuario aprete la categoria florales, que se abra una pestaña para todas las velas florales, el set floral y el aromatizante floral, cuando el usuario aprete cremosas que pase lo mismo pero con todo lo cremoso, cuando el usuario aprete fresh que pase lo misma pero con los productos fresh y por ultimo lo mismo con la categoria luxury

---

## ETAPA 4 — UX y detalles visuales

### 12. Mensaje de confirmación al agregar al carrito
> bien quiero que cuando el usuario aprete para agregar el producto al carro, que ponga un breve mensaje de "su producto se agrego con exito"

### 13. Header sticky
> bien quiero que el header sea estatico, para que cuando el usuario baje siempre tenga la opcion de apretar velas, aromatizantes, y sets

### 14. Logo con degradado rosa animado
> bien quiero que el aurevia sea con degradados en rosas y que sea bien llamativo

### 15. Reducir tamaño del header
> necesito que el menu sea mas angosto para que tampoco invada mucho espacio

### 16. Revertir header
> no mejor dejamelo exactamente igual como antes

### 17. Hover con fotos hogar en productos destacados
> bien claude te agregue cuatro fotos que son las cuatro velas que aparecen en menu de destacadas, pero te las puse en formato hogar, con estas fotos quiero que cuando el usuario ponga el cursor sobre la foto, la foto de vela se cambie de la vela a la vela puesta en el hogar

### 18. Reemplazar fotos hogar
> claude reemplaza la de blush cottons y la golden amber por las nuevas fotos de hogar que te agregue, las otras ya las elimine

### 19. Efecto llamas en cursor + parallax en hero
> Un hero con efecto de llama de vela en el cursor. Imaginate esto: cuando el usuario mueve el mouse por el hero de tu página, aparecen pequeñas llamas animadas que lo siguen. Cálido, único, y 100% relacionado con las velas. Nadie más va a tener eso. Combinado con un efecto parallax en el fondo — que significa que el fondo se mueve más lento que el contenido cuando scrolleás, dando sensación de profundidad y elegancia.

### 20. Revertir hero
> no claude perdon quiero que me lo dejes igual que antes

---

## ETAPA 5 — Simplificación para el parcial oral

### 21. Simplificar la app para el parcial oral
> claude quiero que te sostengas de la consiga de primer parcial y que la pagina web, sea lo mas sencilla de explicar posible, ya que necesito ser capaz de entenderla por completo cada funcionamiento, no le quiero agregar tantas cosas, mas bien dejarla simple y poder explicar toda la programacion completa parte por parte

**Resultado:** Se eliminaron: checkout, páginas de catálogo (velas, aromatizantes, sets), CatalogPage, reviews, y se redujo de 20 a 8 productos. Se mantuvieron todos los conceptos del parcial (useState, useEffect, fetch, Context API, rutas dinámicas, HTML semántico, accesibilidad, responsive).

### 22. Simplificar a solo 4 velas
> bien quiero hacer un cambio grande, simplemente quiero las 4 velas que son las destacadas, solamente voy a vender esos productos y que sea bien simple siguiendo con todas las pautas del parcial

**Resultado:** Se eliminaron: categorías (componente + página), y se redujo a solo 4 productos. La app queda con: Home (Hero + 4 productos), detalle de producto (/productos/[id]), carrito (/carrito), y CartContext para estado global.

---

## ETAPA 6 — Cobertura de la rúbrica (E3 + E4)

### 23. Agregar API route y formulario de contacto
> bien ahora teniendo en cuenta la rúbrica de evaluación del TP, necesito cubrir E3 (formularios con fetch + validación) y E4 (catálogo navegable + API básica)

**Resultado:**
1. API route en `/api/productos/route.js` — endpoint GET que devuelve los productos como JSON (cubre E4: API interna).
2. `FeaturedProducts` ahora hace `fetch('/api/productos')` real en vez de un import simulado.
3. Componente `ContactForm` con validación en JavaScript (cubre E3).
4. Versión HTML del formulario en `index.html` con validación nativa de HTML5.

### 24. Agregar checkout con formulario de pago
> bien claude pero me falta esto: crea un carrito de compras para todos los productos, crea una interfaz donde se entre a el carrito y se pueda ver el checkout y el pago de la compra.

**Resultado:** Se agregó página `/checkout` con formulario (nombre, email, dirección, tarjeta), resumen del pedido, simulación de procesamiento, vaciado del carrito al confirmar, y botón "Finalizar compra" en el carrito.

### 25. Actualizar deploy en Vercel
> actualizame el vercel

### 26. Sacar "CARRITO" del menú y agregar métodos de pago
> necesito dos cosas:
> 1) que me saques del menu la opcion "carrito" ya que se vuelve repetitivo
> 2) que en la opcion de metodo pago me agregues, efectivo, mercado pago, y tarjeta de debito

---

## ETAPA 7 — Problemas encontrados durante el desarrollo

Durante el desarrollo surgieron cinco bugs que tuve que identificar y resolver. Cada uno toca un concepto distinto del parcial, y los dejo acá documentados para poder defenderlos en el oral.

---

### Problema 1 — El carrito siempre agregaba 1 sola unidad (ignoraba el selector de cantidad)

**Prompt:**
> claude tengo un bug en la página de detalle del producto: el usuario selecciona cantidad 3 con el selector, aprieta "agregar al carrito", y cuando va al carrito solo aparece 1 unidad. El selector funciona visualmente (el número cambia) pero al agregar siempre suma 1. Revisá el CartContext y ProductDetail.

**Causa:** La función `agregarItem` en el Context no recibía la cantidad como parámetro — siempre usaba `cantidad: 1` hardcodeado.

**ANTES (CartContext.jsx):**
```js
function agregarItem(producto) {
  setItems(prev => {
    const existente = prev.find(i => i.id === producto.id)
    if (existente) {
      return prev.map(i =>
        i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
      )
    }
    return [...prev, { ...producto, cantidad: 1 }]
  })
}
```

**DESPUÉS (CartContext.jsx:44-54):**
```js
function agregarItem(producto, cantidad = 1) {
  setItems(prev => {
    const existente = prev.find(i => i.id === producto.id)
    if (existente) {
      return prev.map(i =>
        i.id === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i
      )
    }
    return [...prev, { ...producto, cantidad }]
  })
}
```

**Qué cambié:** Agregué el parámetro `cantidad = 1` (con default para no romper los botones rápidos de las cards) y lo uso en vez del `1` hardcodeado. Así `ProductDetail.jsx:85` puede pasar `agregarItem(producto, cantidad)` con la cantidad seleccionada.

**Tema del parcial:** Parámetros con valor default en funciones JS.

---

### Problema 2 — Si la API fallaba, el spinner de carga se quedaba girando para siempre

**Prompt:**
> claude desconecté el wifi para probar qué pasa si la API falla y me quedó la home infinitamente en "Cargando productos...". No muestra error, no muestra nada, solo el spinner girando para siempre. Arreglá el manejo de errores en FeaturedProducts.

**Causa:** El fetch no tenía `try/catch/finally`, entonces si fallaba nunca se ejecutaba `setCargando(false)`.

**ANTES (FeaturedProducts.jsx):**
```js
useEffect(() => {
  async function obtenerProductos() {
    const respuesta = await fetch('/api/productos')
    const datos = await respuesta.json()
    setProductos(datos)
    setCargando(false)
  }
  obtenerProductos()
}, [])
```

**DESPUÉS (FeaturedProducts.jsx:64-133):**
```js
useEffect(() => {
  async function obtenerProductos() {
    try {
      const respuesta = await fetch('/api/productos')
      if (!respuesta.ok) {
        throw new Error('Error al obtener los productos')
      }
      const datos = await respuesta.json()
      setProductos(datos)
    } catch (err) {
      setError('No pudimos cargar los productos. Intentá de nuevo.')
      console.error('Error en obtenerProductos:', err)
    } finally {
      setCargando(false)
    }
  }
  obtenerProductos()
}, [])
```

**Qué cambié:** Envolví el fetch en `try/catch/finally`. El `finally` garantiza que `setCargando(false)` se ejecute **siempre** (haya error o no), y el `catch` muestra un mensaje de error al usuario en vez de dejarlo esperando. También agregué `!respuesta.ok` porque `fetch` no lanza error en status 404/500.

**Tema del parcial:** Async/await, try/catch/finally, manejo de errores.

---

### Problema 3 — El producto no se encontraba en la ruta dinámica (siempre mostraba "Producto no encontrado")

**Prompt:**
> claude otro bug: al hacer click en una ProductCard, la URL va bien a /productos/3 pero siempre aparece "Producto no encontrado", aunque el producto con id 3 existe en products.js. Revisá ProductDetail.

**Causa:** `params.id` llega como **string** (`"3"`) desde la URL, pero en `products.js` los IDs son **números** (`3`). La comparación `===` entre string y número da `false`.

**ANTES (ProductDetail.jsx):**
```js
const producto = products.find(p => p.id === id)
// id = "3" (string), p.id = 3 (number)
// "3" === 3 → false → siempre undefined
```

**DESPUÉS (ProductDetail.jsx:52):**
```js
const producto = products.find(p => p.id === parseInt(id))
// parseInt("3") = 3 (number)
// 3 === 3 → true → encuentra el producto
```

**Qué cambié:** Agregué `parseInt(id)` para convertir el string de la URL a número antes de comparar. En Next.js, los params de rutas dinámicas (`[id]`) siempre llegan como strings, así que hay que hacer la conversión manualmente.

**Tema del parcial:** Tipos de datos en JS (string vs number, operador `===` estricto).

---

### Problema 4 — El formulario de checkout no validaba el método de pago y pedía tarjeta siempre

**Prompt:**
> claude en el checkout tengo dos problemas: (1) podés confirmar la compra sin elegir método de pago, (2) el campo de número de tarjeta aparece siempre, incluso si el usuario va a pagar en efectivo o con mercado pago. Hacé la validación condicional y que el campo tarjeta solo se muestre si eligió débito.

**Causa:** El método de pago estaba metido dentro del objeto `form` como un campo más, sin validación propia ni renderizado condicional del campo tarjeta.

**ANTES (checkout/page.js):**
```js
const [form, setForm] = useState({
  nombre: '',
  email: '',
  direccion: '',
  metodoPago: '',
  tarjeta: '',
})

// Validación: siempre pedía tarjeta
function validar() {
  const nuevosErrores = {}
  // ... otros campos ...
  if (!form.tarjeta.trim()) {
    nuevosErrores.tarjeta = 'El número de tarjeta es obligatorio'
  }
  return nuevosErrores
}

// Render: el campo tarjeta siempre visible
<input name="tarjeta" value={form.tarjeta} onChange={handleChange} />
```

**DESPUÉS (checkout/page.js:73 y 142-148 y 373-393):**
```js
// Estado separado para método de pago
const [metodoPago, setMetodoPago] = useState('')

// Validación condicional
function validar() {
  const nuevosErrores = {}
  // ... otros campos ...
  if (!metodoPago) {
    nuevosErrores.metodoPago = 'Elegí un método de pago'
  }
  if (metodoPago === 'debito') {
    if (!form.tarjeta.trim()) {
      nuevosErrores.tarjeta = 'El número de tarjeta es obligatorio'
    } else if (form.tarjeta.replace(/\s/g, '').length < 16) {
      nuevosErrores.tarjeta = 'Ingresá los 16 dígitos de la tarjeta'
    }
  }
  return nuevosErrores
}

// Render condicional: solo muestra tarjeta si eligió débito
{metodoPago === 'debito' && (
  <input name="tarjeta" value={form.tarjeta} onChange={handleChange} />
)}
```

**Qué cambié:** Separé `metodoPago` en su propio `useState` (es una selección, no un campo de texto). La validación de tarjeta ahora solo se ejecuta si `metodoPago === 'debito'`, y el campo se renderiza condicionalmente con `&&`. Así quien paga en efectivo no ve ni valida la tarjeta.

**Tema del parcial:** Renderizado condicional y validación dinámica.

---

### Problema 5 — El contador del carrito en el Header no se actualizaba (error de Server vs Client Component)

**Prompt:**
> claude último bug: cuando agrego un producto al carrito, el ícono del carrito en el Header siempre muestra 0. Si recargo la página tampoco se actualiza. Me parece que tiene que ver con que el Header es Server Component. Arreglalo.

**Causa:** El Header era un Server Component y llamaba a `useCart()` directamente. Los hooks de React **no funcionan** en Server Components porque se ejecutan en el servidor, donde no hay estado ni interactividad.

**ANTES:**
```jsx
// Header.jsx — SIN "use client" (Server Component por defecto)
import { useCart } from '@/context/CartContext'

export default function Header() {
  const { totalItems } = useCart() // ❌ ERROR: hooks no funcionan en Server Components
  return (
    <header>
      <nav>
        {/* ... links ... */}
        <span>{totalItems}</span> {/* Siempre 0 o error */}
      </nav>
    </header>
  )
}
```

**DESPUÉS — Separé en dos componentes: Header (Server) + CartIcon (Client):**

`CartIcon.jsx` (nuevo, Client Component):
```jsx
'use client'
import { useCart } from '@/context/CartContext'

export default function CartIcon() {
  const { totalItems } = useCart() // ✅ Funciona: es Client Component
  return <span>{totalItems}</span>
}
```

`Header.jsx` (sigue siendo Server Component):
```jsx
// SIN "use client" — Server Component
import CartIcon from './CartIcon'

export default function Header() {
  return (
    <header>
      <nav>
        {/* ... links ... */}
        <CartIcon /> {/* Importa el Client Component */}
      </nav>
    </header>
  )
}
```

**Qué cambié:** Extraje la parte que necesita `useCart()` a un componente separado `CartIcon` con `'use client'`. El Header sigue siendo Server Component (no necesita interactividad), pero importa `CartIcon` que sí corre en el cliente. Este patrón de Next.js se llama **"composición de Server y Client Components"** — el Server Component puede contener Client Components como hijos.

**Tema del parcial:** Server vs Client Components en Next.js.

---

## ETAPA 8 — Limpieza y entrega final

### 27. Limpiar archivos que no se usan
> elimina todo lo que no sirva, deja todo perfectamente claro

**Resultado:** Se eliminaron archivos sobrantes: páginas de catálogo (aromatizantes, sets, velas), componentes CatalogPage y Categories, y `data/reviews.js`. El proyecto quedó limpio con solo los archivos necesarios.

### 28. Documentar prompts para el oral
> claude armame un archivo con todos los prompts que te fui haciendo desde que empezamos el proyecto hasta ahora, incluyendo los 5 bugs que tuvimos, así lo llevo al parcial oral como respaldo

---

## Resumen de temas cubiertos (para el oral)

| # | Problema | Tema principal |
|---|----------|----------------|
| 1 | Carrito agregaba solo 1 unidad | Parámetros con valor default en funciones JS |
| 2 | Spinner infinito al fallar la API | Async/await, try/catch/finally, manejo de errores |
| 3 | Producto no encontrado en ruta dinámica | Tipos de datos en JS (string vs number, `===`) |
| 4 | Checkout sin validar método de pago | Renderizado condicional y validación dinámica |
| 5 | Contador del carrito no se actualizaba | Server vs Client Components en Next.js |

## Conceptos del parcial cubiertos por la app

- **useState / useEffect**: estado local y efectos en componentes.
- **Context API**: estado global del carrito (`CartContext`).
- **fetch + async/await**: consumo de la API interna `/api/productos`.
- **Rutas dinámicas**: `/productos/[id]` con `useParams`.
- **API Routes**: endpoint GET en `/api/productos/route.js`.
- **Formularios con validación JS**: `ContactForm` y `Checkout`.
- **Formulario con validación HTML5 nativa**: `index.html` (required, type="email").
- **Server vs Client Components**: separación Header/CartIcon.
- **HTML semántico y accesibilidad**: uso de `<header>`, `<main>`, `<nav>`, `<section>`, labels asociados.
- **Responsive design**: CSS con media queries.
