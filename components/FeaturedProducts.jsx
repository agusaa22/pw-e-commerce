/*
  COMPONENTE: FeaturedProducts
  QUÉ HACE: Trae los productos desde nuestra API (/api/productos) y los muestra
           divididos en 3 secciones: Velas, Aromatizantes, Sets.
  POR QUÉ: agrupar por categoría queda mucho más profesional que un grid único.
           Usamos los mismos productos que vienen de Supabase y los filtramos
           en el front por el campo "categoria".
*/
'use client'

import { useState, useEffect } from 'react'
import ProductCard from './ProductCard'
import styles from './FeaturedProducts.module.css'

// Orden y títulos de las 3 secciones que vamos a mostrar
const SECCIONES = [
  { id: 'velas',         titulo: 'Velas',         bajada: 'Velas artesanales de cera de soja con fragancias premium.' },
  { id: 'aromatizantes', titulo: 'Aromatizantes', bajada: 'Brumas textiles para perfumar sábanas, cortinas y ambientes.' },
  { id: 'sets',          titulo: 'Sets',          bajada: 'Combos de vela + aromatizante en caja premium, listos para regalar.' },
]

export default function FeaturedProducts() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando]   = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    async function obtenerProductos() {
      try {
        // Triple candado contra el caché del navegador:
        //  - cache: 'no-store' → no usa la respuesta cacheada.
        //  - headers no-cache → pide explícitamente una respuesta fresca.
        //  - ?t=timestamp → cada pedido tiene una URL única, así nada puede coincidir.
        const respuesta = await fetch('/api/productos?t=' + Date.now(), {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        })
        if (!respuesta.ok) throw new Error('Error al obtener los productos')
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

  /*
    Cuando los productos terminan de cargar, si la URL trae un hash
    (ej: /#velas), scrolleamos a esa sección. Resuelve el caso de
    cuando venís desde /carrito o /checkout: la home tarda un toque
    en pintar las secciones y sin esto el navegador no las encuentra.
  */
  useEffect(() => {
    if (cargando) return
    if (typeof window === 'undefined') return
    const hash = window.location.hash.slice(1)
    if (!hash) return
    const el = document.getElementById(hash)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [cargando])

  if (cargando) {
    return (
      <section className={styles.section} id="destacados">
        <div className="container">
          <div className={styles.estado} aria-live="polite">
            <div className={styles.spinner} aria-hidden="true" />
            <p>Cargando productos...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.section} id="destacados">
        <div className="container">
          <div className={styles.estado} role="alert">
            <p className={styles.errorMsg}>{error}</p>
          </div>
        </div>
      </section>
    )
  }

  /*
    Renderizamos UNA <section> por cada categoría definida arriba.
    Filtramos los productos cuya "categoria" coincide con el título.
    Si una categoría no tiene productos, no se muestra esa sección.
  */
  return (
    <>
      {SECCIONES.map(({ id, titulo, bajada }) => {
        const productosCat = productos.filter((p) => p.categoria === titulo)
        if (productosCat.length === 0) return null

        return (
          <section key={id} className={styles.section} id={id}>
            <div className="container">

              <div className="section-heading">
                <span className="section-label">Nuestra colección</span>
                <h2 id={`${id}-titulo`}>{titulo}</h2>
                <p>{bajada}</p>
              </div>

              <div className={styles.grid}>
                {productosCat.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} />
                ))}
              </div>

            </div>
          </section>
        )
      })}
    </>
  )
}