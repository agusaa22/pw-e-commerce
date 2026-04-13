/*
  PÁGINA: Carrito
  QUÉ HACE: Muestra los productos que el usuario agregó al carrito,
           permite modificar cantidades, eliminar ítems e ir al checkout.
  POR QUÉ: "use client" porque usa useCart() para leer y modificar el carrito.
  QUÉ PASARÍA SI SE SACA: El usuario no podría ver ni gestionar su carrito.
*/
'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from './carrito.module.css'

/* ── HELPER: formatea precio en ARS ────────────────────────────────────────── */
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
    items, eliminarItem, actualizarCantidad, totalPrecio.
  */
  const { items, eliminarItem, actualizarCantidad, totalPrecio } = useCart()

  /* ── CARRITO VACÍO ─────────────────────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className={styles.pagina}>
          <div className="container">
            <h1 className={styles.titulo}>Tu carrito</h1>
            <div className={styles.vacio}>
              <span className={styles.vacioIcon} aria-hidden="true">🕯️</span>
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
                .map() genera una fila por cada ítem del carrito.
                key={item.id} — React necesita identificar cada fila
                para actualizarla de forma independiente.
              */}
              {items.map(item => (
                <article key={item.id} className={styles.item}>

                  {/* Imagen del producto */}
                  <Link href={`/productos/${item.id}`}>
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className={styles.itemImagen}
                    />
                  </Link>

                  {/* Info */}
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

                  {/* Control de cantidad */}
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

                  {/* Subtotal del ítem */}
                  <p className={styles.itemSubtotal}>
                    {formatPrecio(item.precio * item.cantidad)}
                  </p>

                  {/* Botón eliminar */}
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

              {/*
                Link a /checkout — navegación client-side.
                POR QUÉ no <button>: es una navegación a otra página,
                semánticamente es un enlace, no una acción.
              */}
              <Link href="/checkout" className={styles.btnCheckout}>
                Ir al checkout →
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
