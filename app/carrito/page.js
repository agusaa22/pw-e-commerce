/*
  PÁGINA: Carrito (/carrito)
  QUÉ HACE: Muestra los productos que el usuario agregó al carrito,
           permite modificar cantidades y eliminar ítems.
  POR QUÉ: "use client" es OBLIGATORIO porque usa useCart() (Context API).
           useCart() es un hook → solo funciona en Client Components.
  QUÉ PASARÍA SI SE SACA: No habría forma de ver ni gestionar el carrito.

  RUTA: En Next.js App Router, el archivo app/carrito/page.js
        define automáticamente la ruta /carrito.
        No hay que configurar rutas en ningún archivo — la estructura
        de carpetas ES la ruta.
*/
'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from './carrito.module.css'

/*
  HELPER: formatea un número como precio argentino.
  24900 → "$24.900"
  POR QUÉ fuera del componente: no depende de props ni estado,
  así que no necesita estar dentro. Se define una vez y se reutiliza.
*/
function formatPrecio(precio) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(precio)
}

export default function CarritoPage() {
  /*
    Destructuramos del CartContext solo lo que necesitamos en esta página.
    POR QUÉ destructurar: en lugar de escribir cart.items, cart.eliminarItem,
    escribimos directamente items, eliminarItem — más limpio y legible.

    - items: array de productos en el carrito
    - eliminarItem: función que quita un producto por id
    - actualizarCantidad: función que cambia la cantidad de un producto
    - totalPrecio: suma total calculada automáticamente en el Context
  */
  const { items, eliminarItem, actualizarCantidad, totalPrecio } = useCart()

  /* ── CARRITO VACÍO ─────────────────────────────────────────────────────── */
  /*
    Renderizado condicional: si items.length === 0, mostramos un mensaje.
    POR QUÉ: Mejor experiencia de usuario que mostrar una tabla vacía.
    El return temprano evita que el resto del JSX se ejecute.
  */
  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className={styles.pagina}>
          <div className="container">
            <h1 className={styles.titulo}>Tu carrito</h1>
            <div className={styles.vacio}>
              <p>Tu carrito está vacío.</p>
              <Link href="/" className={styles.btnVolver}>
                Explorar productos
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  /* ── CARRITO CON ÍTEMS ─────────────────────────────────────────────────── */
  return (
    <>
      <Header />
      <main className={styles.pagina}>
        <div className="container">

          <h1 className={styles.titulo}>Tu carrito</h1>

          <div className={styles.layout}>

            {/* ── LISTA DE ÍTEMS ──────────────────────────────────────── */}
            <section aria-label="Productos en el carrito">

              {/*
                .map() recorre el array items y genera una <article> por cada uno.
                POR QUÉ .map() y no un for: en JSX no se puede usar for.
                .map() devuelve un nuevo array de elementos React.

                key={item.id}: React necesita una key única para identificar
                cada elemento de la lista. Sin key, React re-renderiza toda
                la lista cuando cambia un solo ítem (ineficiente).
              */}
              {items.map(item => (
                <article key={item.id} className={styles.item}>

                  {/* Imagen del producto — clickeable, lleva al detalle */}
                  <Link href={`/productos/${item.id}`}>
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className={styles.itemImagen}
                    />
                  </Link>

                  {/* Información del producto */}
                  <div className={styles.itemInfo}>
                    <span className={styles.itemCategoria}>
                      {item.categoria} · {item.peso}
                    </span>
                    <Link href={`/productos/${item.id}`} className={styles.itemNombreLink}>
                      <h2 className={styles.itemNombre}>{item.nombre}</h2>
                    </Link>
                    <p className={styles.itemPrecioUnit}>
                      {formatPrecio(item.precio)} c/u
                    </p>
                  </div>

                  {/* ── CONTROL DE CANTIDAD ─────────────────────────────── */}
                  {/*
                    Dos botones que llaman a actualizarCantidad() del Context.
                    Cuando la cantidad cambia, el Context actualiza su estado,
                    lo que re-renderiza este componente Y el CartIcon del Header.
                    Eso es el poder del estado global: un cambio en un lugar
                    se refleja automáticamente en todos los que lo leen.
                  */}
                  <div className={styles.cantidadControl}>
                    <button
                      onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                      aria-label="Reducir cantidad"
                      className={styles.cantidadBtn}
                    >
                      −
                    </button>
                    <span className={styles.cantidadNum} aria-live="polite">
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                      aria-label="Aumentar cantidad"
                      className={styles.cantidadBtn}
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal de este ítem (precio × cantidad) */}
                  <p className={styles.itemSubtotal}>
                    {formatPrecio(item.precio * item.cantidad)}
                  </p>

                  {/* Botón eliminar — llama a eliminarItem(id) del Context */}
                  <button
                    onClick={() => eliminarItem(item.id)}
                    className={styles.btnEliminar}
                    aria-label={`Eliminar ${item.nombre} del carrito`}
                  >
                    ✕
                  </button>

                </article>
              ))}
            </section>

            {/* ── RESUMEN DEL PEDIDO ──────────────────────────────────── */}
            {/*
              <aside> es semántico: indica contenido complementario.
              El resumen no es el contenido principal (la lista), es un extra.
            */}
            <aside className={styles.resumen} aria-label="Resumen del pedido">
              <h2 className={styles.resumenTitulo}>Resumen</h2>

              <div className={styles.resumenLinea}>
                <span>Subtotal</span>
                <span>{formatPrecio(totalPrecio)}</span>
              </div>

              <div className={styles.resumenLinea}>
                <span>Envío</span>
                <span className={styles.envioGratis}>Gratis</span>
              </div>

              <div className={`${styles.resumenLinea} ${styles.resumenTotal}`}>
                <span>Total</span>
                <span>{formatPrecio(totalPrecio)}</span>
              </div>

              {/* Botón que lleva a la página de checkout */}
              <Link href="/checkout" className={styles.btnCheckout}>
                Finalizar compra
              </Link>

              <Link href="/" className={styles.btnSeguir}>
                ← Seguir comprando
              </Link>
            </aside>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
