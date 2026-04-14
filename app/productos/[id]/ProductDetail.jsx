/*
  COMPONENTE: ProductDetail
  QUÉ HACE: Muestra la página de detalle de un producto individual con
           imagen grande, información, selector de cantidad y botón de carrito.
  POR QUÉ: "use client" es OBLIGATORIO porque usa:
           - useState → para manejar la cantidad seleccionada y el feedback visual
           - useCart() → para agregar productos al carrito (Context API)
           Ambos son hooks de React que solo funcionan en el navegador.
  QUÉ PASARÍA SI SE SACA: No habría página de detalle para ningún producto.
           Al hacer click en una ProductCard, el usuario vería un 404.

  RUTA: /productos/[id] → Next.js pasa el id desde la URL como prop.
        Ejemplo: /productos/3 → id = "3"
*/
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import products from '@/data/products'
import styles from './product.module.css'

export default function ProductDetail({ id }) {

  /*
    useCart() accede al estado global del carrito (definido en CartContext).
    Destructuramos solo agregarItem porque es lo único que necesitamos acá.
    POR QUÉ: Cuando llamamos a agregarItem(), el CartContext actualiza
             su estado, lo que re-renderiza automáticamente el CartIcon
             en el Header con el nuevo contador.
  */
  const { agregarItem } = useCart()

  /*
    useState(1): la cantidad empieza en 1.
    POR QUÉ useState y no una variable normal:
      - let cantidad = 1 → React NO detecta cambios, la pantalla no se actualiza.
      - useState(1) → React SÍ detecta el cambio y re-renderiza el componente.

    useState(false): controla el feedback visual "✓ Agregado".
  */
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)

  /*
    Busca el producto en el array por id.
    parseInt(id) convierte el string "3" a número 3,
    porque params de Next.js siempre llegan como string.
  */
  const producto = products.find(p => p.id === parseInt(id))

  /* Si el id no existe en el array, muestra un mensaje de error */
  if (!producto) {
    return (
      <div className={styles.noEncontrado}>
        <p>Producto no encontrado.</p>
        <Link href="/">← Volver al inicio</Link>
      </div>
    )
  }

  /*
    Intl.NumberFormat formatea el precio con formato argentino.
    22500 → "$22.500"
    POR QUÉ: Mejor legibilidad para el usuario. Es una API nativa
             de JavaScript (no necesita librerías externas).
  */
  const precioFormateado = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(producto.precio)

  /*
    EVENTO: función que se ejecuta cuando el usuario hace click en "Agregar".
    POR QUÉ es una función y no código directo en el onClick:
      - Necesitamos ejecutar varias acciones: agregar al carrito,
        mostrar feedback, y ocultarlo después de 2 segundos.
    setTimeout: ejecuta una función después de X milisegundos.
                Es asincronía básica (no bloquea el hilo principal).
  */
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
          {/*
            Navegación secundaria que muestra la ruta: Inicio / Nombre.
            aria-label="Ruta de navegación" → accesibilidad para lectores de pantalla.
          */}
          <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
            <Link href="/">Inicio</Link>
            <span aria-hidden="true"> / </span>
            <span>{producto.nombre}</span>
          </nav>

          {/* ── SECCIÓN PRINCIPAL: imagen + info ────────────────────────── */}
          {/*
            CSS Grid divide esta sección en 2 columnas:
            imagen a la izquierda, información a la derecha.
            En mobile (responsive) se apilan en una sola columna.
          */}
          <div className={styles.productoGrid}>

            {/* Imagen grande del producto */}
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

              {/*
                <h1> porque es el título principal de esta página.
                Cada página tiene un solo h1.
              */}
              <h1 className={styles.nombre}>{producto.nombre}</h1>

              <p className={styles.descripcion}>{producto.descripcion}</p>

              <p className={styles.precio}>{precioFormateado}</p>

              {/* ── SELECTOR DE CANTIDAD ─────────────────────────────── */}
              {/*
                Dos botones (− y +) que modifican el estado "cantidad".
                Cada click llama a setCantidad, React re-renderiza el número.
                Math.max(1, c - 1) evita que la cantidad baje de 1.
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

              {/* ── BOTÓN AGREGAR AL CARRITO ─────────────────────────── */}
              {/*
                onClick={handleAgregar} → evento de JavaScript.
                Cuando el usuario hace click, se ejecuta handleAgregar().
                aria-live="polite" → el lector de pantalla anuncia el cambio
                de texto ("Agregar" → "✓ Agregado") sin interrumpir al usuario.
              */}
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

              {/* Info extra sobre el producto */}
              <ul className={styles.detalles}>
                <li>Cera de soja 100% natural</li>
                <li>Elaborada artesanalmente</li>
                <li>Envío en 48–72 hs hábiles</li>
              </ul>

            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
