/*
  COMPONENTE: ProductCard
  QUÉ HACE: Tarjeta de producto con imagen, info, precio y botón de carrito.
            El nombre del producto linkea a su página de detalle.
  POR QUÉ: "use client" es necesario porque usa useCart() para agregar al carrito.
  QUÉ PASARÍA SI SE SACA: Las tarjetas no podrían interactuar con el carrito.
*/
'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import styles from './ProductCard.module.css'

export default function ProductCard({ producto }) {

  const { agregarItem } = useCart()

  const precioFormateado = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(producto.precio)

  return (
    <article className={styles.card}>

      {/* ── IMAGEN → linkea a la página de detalle ──────────────────────── */}
      <Link href={`/productos/${producto.id}`} className={styles.imagenLink}>
        <img
          src={producto.imagen}
          alt={`Vela artesanal ${producto.nombre} — ${producto.categoria}`}
          className={styles.imagen}
        />
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

          {/*
            onClick llama a agregarItem del CartContext.
            POR QUÉ: agregarItem actualiza el estado global, lo que
                     re-renderiza CartIcon automáticamente con el nuevo contador.
          */}
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
  )
}
