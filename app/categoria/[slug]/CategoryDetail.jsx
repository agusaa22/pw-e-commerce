'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import products from '@/data/products'
import styles from './categoria.module.css'

const categorias = {
  florales: { nombre: 'Florales', filtro: 'Floral', descripcion: 'Rosa, peonía, jazmín y perfumes suaves para espacios delicados.' },
  cremosas: { nombre: 'Cremosas', filtro: 'Cremosa', descripcion: 'Vainilla, coco y acordes envolventes para un clima cálido.' },
  fresh:    { nombre: 'Fresh',    filtro: 'Fresh',   descripcion: 'Cítricos, lino limpio y notas verdes para una sensación luminosa.' },
  luxury:   { nombre: 'Luxury',   filtro: 'Luxury',  descripcion: 'Ámbar, sándalo y fragancias intensas con acabado premium.' },
}

function formatPrecio(precio) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(precio)
}

function tipoLabel(tipo) {
  if (tipo === 'vela') return 'Vela'
  if (tipo === 'aromatizante') return 'Aromatizante'
  if (tipo === 'set') return 'Set'
  return tipo
}

export default function CategoryDetail({ slug }) {
  const { agregarItem } = useCart()
  const cat = categorias[slug]

  if (!cat) {
    return (
      <>
        <Header />
        <main className={styles.pagina}>
          <div className="container">
            <p>Categoría no encontrada.</p>
            <Link href="/">← Volver al inicio</Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const filtered = products.filter(p => p.categoria === cat.filtro)

  return (
    <>
      <Header />
      <main className={styles.pagina}>
        <div className="container">

          <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
            <Link href="/">Inicio</Link>
            <span aria-hidden="true"> / </span>
            <span>{cat.nombre}</span>
          </nav>

          <div className="section-heading">
            <span className="section-label">Categoría</span>
            <h2>{cat.nombre}</h2>
            <p>{cat.descripcion}</p>
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
                    {tipoLabel(producto.tipo)} · {producto.peso}
                  </span>
                  <Link href={`/productos/${producto.id}`} className={styles.nombreLink}>
                    <h3>{producto.nombre}</h3>
                  </Link>
                  <p>{producto.descripcion}</p>
                  <div className={styles.footer}>
                    <span className={styles.precio}>{formatPrecio(producto.precio)}</span>
                    <button
                      className={styles.boton}
                      onClick={() => agregarItem(producto)}
                      aria-label={`Agregar ${producto.nombre} al carrito`}
                    >
                      Agregar
                    </button>
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
