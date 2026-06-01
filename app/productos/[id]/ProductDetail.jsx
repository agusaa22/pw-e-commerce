/*
  COMPONENTE: ProductDetail
  QUÉ HACE: Muestra la página de detalle de un producto individual.
           Trae el producto desde Supabase usando el id de la URL.
  POR QUÉ "use client": usa hooks (useState, useEffect, useCart) que solo
           funcionan en el navegador.
  RUTA: /productos/[id] → Next.js pasa el id desde la URL como prop.
*/
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from './product.module.css'

export default function ProductDetail({ id }) {
  const { agregarItem } = useCart()
  const [producto, setProducto] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)

  // Traemos el producto desde Supabase + el nombre de su categoría (join)
  useEffect(() => {
    async function cargar() {
      const { data } = await supabase
        .from('productos')
        .select('id, nombre, descripcion, precio, stock, aroma, tamanio, imagen_url, imagen_hogar_url, categorias ( nombre )')
        .eq('id', id)
        .eq('activo', true)
        .single()

      if (data) {
        // Traducimos los nombres a los que usan tus componentes
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
    cargar()
  }, [id])

  function handleAgregar() {
    agregarItem(producto, cantidad)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  // ── ESTADO CARGANDO ──────────────────────────────────────────────────
  if (cargando) {
    return (
      <>
        <Header />
        <main className={styles.pagina}>
          <div className="container"><p>Cargando...</p></div>
        </main>
        <Footer />
      </>
    )
  }

  // ── ESTADO PRODUCTO NO ENCONTRADO ────────────────────────────────────
  if (!producto) {
    return (
      <>
        <Header />
        <main className={styles.pagina}>
          <div className="container">
            <div className={styles.noEncontrado}>
              <p>Producto no encontrado.</p>
              <Link href="/">← Volver al inicio</Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // ── PRODUCTO CARGADO ─────────────────────────────────────────────────
  const precioFormateado = new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(producto.precio)

  return (
    <>
      <Header />
      <main className={styles.pagina}>
        <div className="container">

          <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
            <Link href="/">Inicio</Link>
            <span aria-hidden="true"> / </span>
            <span>{producto.nombre}</span>
          </nav>

          <div className={styles.productoGrid}>

            <div className={styles.imagenWrapper}>
              <img
                src={producto.imagen}
                alt={`${producto.nombre} — ${producto.categoria}`}
                className={styles.imagen}
              />
            </div>

            <div className={styles.info}>
              <span className={styles.categoria}>
                {producto.categoria} · {producto.peso}
              </span>

              <h1 className={styles.nombre}>{producto.nombre}</h1>
              <p className={styles.descripcion}>{producto.descripcion}</p>
              <p className={styles.precio}>{precioFormateado}</p>

              {/* Selector de cantidad */}
              <div className={styles.cantidadWrapper}>
                <span className={styles.cantidadLabel}>Cantidad</span>
                <div className={styles.cantidadControl}>
                  <button
                    onClick={() => setCantidad(c => Math.max(1, c - 1))}
                    aria-label="Reducir cantidad"
                    className={styles.cantidadBtn}
                  >−</button>
                  <span className={styles.cantidadNum} aria-live="polite">{cantidad}</span>
                  <button
                    onClick={() => setCantidad(c => c + 1)}
                    aria-label="Aumentar cantidad"
                    className={styles.cantidadBtn}
                  >+</button>
                </div>
              </div>

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

              <ul className={styles.detalles}>
                <li>Cera de soja 100% natural</li>
                <li>Elaboración artesanal</li>
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
