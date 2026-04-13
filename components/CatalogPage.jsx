'use client'

import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import products from '@/data/products'
import AddToCartButton from '@/components/AddToCartButton'
import styles from './CatalogPage.module.css'

function formatPrecio(precio) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(precio)
}

export default function CatalogPage({ tipo, titulo, subtitulo }) {
  const filtered = products.filter(p => p.tipo === tipo)

  return (
    <>
      <Header />
      <main className={styles.pagina}>
        <div className="container">

          <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
            <Link href="/">Inicio</Link>
            <span aria-hidden="true"> / </span>
            <span>{titulo}</span>
          </nav>

          <div className="section-heading">
            <span className="section-label">{subtitulo}</span>
            <h2>{titulo}</h2>
          </div>

          <div className={styles.grid}>
            {filtered.map(producto => (
              <article key={producto.id} className={styles.card}>
                <Link href={`/productos/${producto.id}`} className={styles.imagenLink}>
                  <img
                    src={producto.imagen}
                    alt={`${producto.nombre} — ${producto.categoria}`}
                    className={styles.imagen}
                  />
                </Link>
                <div className={styles.info}>
                  <span className={styles.tipo}>
                    {producto.categoria} · {producto.peso}
                  </span>
                  <Link href={`/productos/${producto.id}`} className={styles.nombreLink}>
                    <h3>{producto.nombre}</h3>
                  </Link>
                  <p>{producto.descripcion}</p>
                  <div className={styles.footer}>
                    <span className={styles.precio}>{formatPrecio(producto.precio)}</span>
                    <AddToCartButton producto={producto} className={styles.boton} />
                  </div>
                </div>
              </article>
            ))}
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
