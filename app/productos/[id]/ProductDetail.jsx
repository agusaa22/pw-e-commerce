/*
  COMPONENTE: ProductDetail
  QUÉ HACE: Página de detalle del producto con imagen grande, info,
           selector de cantidad, botón de carrito y sección de reseñas.
  POR QUÉ: "use client" porque usa useState (cantidad) y useCart (carrito).
  QUÉ PASARÍA SI SE SACA: No habría página de detalle para ningún producto.
*/
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import products from '@/data/products'
import reviews from '@/data/reviews'
import styles from './product.module.css'

/* ── HELPER: renderiza estrellas ★ ────────────────────────────────────────── */
function Estrellas({ cantidad, max = 5 }) {
  return (
    <span className={styles.estrellas} aria-label={`${cantidad} de ${max} estrellas`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < cantidad ? styles.estrella : styles.estrellaVacia}>
          ★
        </span>
      ))}
    </span>
  )
}

/* ── HELPER: avatar con iniciales ──────────────────────────────────────────── */
function Avatar({ nombre }) {
  const iniciales = nombre
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return <div className={styles.avatar} aria-hidden="true">{iniciales}</div>
}

/* ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────── */
export default function ProductDetail({ id }) {

  const { agregarItem } = useCart()

  /*
    useState(1): la cantidad empieza en 1.
    POR QUÉ useState: cuando el usuario cambia la cantidad con + o -,
    React re-renderiza solo el selector, no toda la página.
  */
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado]  = useState(false)

  /* Busca el producto en el array por id (params viene como string, parseInt lo convierte) */
  const producto = products.find(p => p.id === parseInt(id))
  const resenas  = reviews[parseInt(id)] || []

  /* Si el id no existe, muestra mensaje de error */
  if (!producto) {
    return (
      <div className={styles.noEncontrado}>
        <p>Producto no encontrado.</p>
        <Link href="/">← Volver al inicio</Link>
      </div>
    )
  }

  const precioFormateado = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(producto.precio)

  const promedioEstrellas = resenas.length
    ? Math.round(resenas.reduce((acc, r) => acc + r.estrellas, 0) / resenas.length)
    : 0

  /* Agrega al carrito con la cantidad seleccionada */
  function handleAgregar() {
    agregarItem(producto, cantidad)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  return (
    <>
      <Header />
      <main className={styles.pagina}>
        <div className="container">

          {/* ── BREADCRUMB ──────────────────────────────────────────────── */}
          <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
            <Link href="/">Inicio</Link>
            <span aria-hidden="true"> / </span>
            <span>{producto.nombre}</span>
          </nav>

          {/* ── SECCIÓN PRINCIPAL: imagen + info ────────────────────────── */}
          <div className={styles.productoGrid}>

            {/* Imagen grande */}
            <div className={styles.imagenWrapper}>
              <img
                src={producto.imagen}
                alt={`Vela artesanal ${producto.nombre}`}
                className={styles.imagen}
              />
            </div>

            {/* Info del producto */}
            <div className={styles.info}>

              <span className={styles.categoria}>
                {producto.categoria} · {producto.peso}
              </span>

              <h1 className={styles.nombre}>{producto.nombre}</h1>

              {/* Rating resumido */}
              <div className={styles.ratingResumen}>
                <Estrellas cantidad={promedioEstrellas} />
                <span className={styles.totalResenas}>
                  ({resenas.length} reseñas)
                </span>
              </div>

              <p className={styles.descripcion}>{producto.descripcion}</p>

              <p className={styles.precio}>{precioFormateado}</p>

              {/* ── SELECTOR DE CANTIDAD ─────────────────────────────── */}
              {/*
                POR QUÉ useState para cantidad: cada click en + o -
                actualiza el estado y React re-renderiza el número
                sin recargar la página.
              */}
              <div className={styles.cantidadWrapper}>
                <span className={styles.cantidadLabel}>Cantidad</span>
                <div className={styles.cantidadControl}>
                  <button
                    onClick={() => setCantidad(c => Math.max(1, c - 1))}
                    aria-label="Reducir cantidad"
                    className={styles.cantidadBtn}
                  >
                    −
                  </button>
                  <span className={styles.cantidadNum} aria-live="polite">
                    {cantidad}
                  </span>
                  <button
                    onClick={() => setCantidad(c => c + 1)}
                    aria-label="Aumentar cantidad"
                    className={styles.cantidadBtn}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* ── BOTÓN AGREGAR ────────────────────────────────────── */}
              <button
                className={`${styles.botonAgregar} ${agregado ? styles.botonAgregado : ''}`}
                onClick={handleAgregar}
                aria-live="polite"
              >
                {agregado ? '✓ Agregado al carrito' : 'Agregar al carrito'}
              </button>

              <Link href="/carrito" className={styles.irCarrito}>
                Ver carrito →
              </Link>

              {/* Info extra */}
              <ul className={styles.detalles}>
                <li>✦ Cera de soja 100% natural</li>
                <li>✦ Elaborada artesanalmente</li>
                <li>✦ Envío en 48–72 hs hábiles</li>
              </ul>

            </div>
          </div>

          {/* ── SECCIÓN DE RESEÑAS ──────────────────────────────────────── */}
          <section className={styles.resenasSeccion} aria-labelledby="resenas-titulo">
            <div className={styles.resenasHeader}>
              <h2 id="resenas-titulo">Reseñas de clientes</h2>
              <div className={styles.ratingGlobal}>
                <Estrellas cantidad={promedioEstrellas} />
                <span>{promedioEstrellas}.0 de 5 · {resenas.length} reseñas</span>
              </div>
            </div>

            {/*
              .map() genera una card por cada reseña del array.
              key={resena.id} es obligatorio para que React identifique
              cada elemento de la lista de forma única.
            */}
            <div className={styles.resenasGrid}>
              {resenas.map(resena => (
                <article key={resena.id} className={styles.resenaCard}>
                  <div className={styles.resenaHeader}>
                    <Avatar nombre={resena.nombre} />
                    <div>
                      <p className={styles.resenaNombre}>{resena.nombre}</p>
                      <Estrellas cantidad={resena.estrellas} />
                    </div>
                    <time className={styles.resenaFecha}>{resena.fecha}</time>
                  </div>
                  <p className={styles.resenaTexto}>{resena.texto}</p>
                </article>
              ))}
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
