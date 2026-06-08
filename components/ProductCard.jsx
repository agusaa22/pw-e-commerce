/*
  COMPONENTE: ProductCard
  QUÉ HACE: Tarjeta de producto con imagen, info, precio y botón de carrito.
            El nombre del producto linkea a su página de detalle.
  POR QUÉ: "use client" es necesario porque usa useCart() para agregar al carrito.
  QUÉ PASARÍA SI SE SACA: Las tarjetas no podrían interactuar con el carrito.
*/
'use client'

import Link from 'next/link'
import AddToCartButton from './AddToCartButton'
import styles from './ProductCard.module.css'

export default function ProductCard({ producto }) {

  const precioFormateado = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(producto.precio)

  // Si el stock viene null/undefined lo tratamos como 0 para no romper
  const stock = Number.isFinite(producto.stock) ? producto.stock : 0
  const sinStock = stock <= 0

  return (
    <article className={`${styles.card} ${sinStock ? styles.cardSinStock : ''}`}>

      {/* ── IMAGEN → linkea a la página de detalle ──────────────────────── */}
      <Link href={`/productos/${producto.id}`} className={styles.imagenLink}>
        <img
          src={producto.imagen}
          alt={`${producto.nombre} — ${producto.categoria}`}
          className={styles.imagen}
        />
        {/* Badge "SIN STOCK" sobre la imagen — solo si el stock es 0 */}
        {sinStock && (
          <span className={styles.badgeSinStock} aria-label="Sin stock">
            Sin stock
          </span>
        )}
      </Link>

      {/* ── INFORMACIÓN ─────────────────────────────────────────────────── */}
      <div className={styles.info}>
        <span className={styles.tipo}>{producto.categoria} · {producto.peso}</span>

        {/* El nombre también linkea al detalle */}
        <Link href={`/productos/${producto.id}`} className={styles.nombreLink}>
          <h3>{producto.nombre}</h3>
        </Link>

        <p>{producto.descripcion}</p>

        <div className={styles.footer}>
          <span className={styles.precio}>{precioFormateado}</span>

          {/* AddToCartButton ya respeta el stock: si es 0, se deshabilita solo */}
          <AddToCartButton producto={producto} className={styles.boton} />
        </div>
      </div>
    </article>
  )
}
