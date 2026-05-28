/*
  COMPONENTE: AddToCartButton
  QUÉ HACE:
    - Si el producto NO está en el carrito → muestra el botón "Agregar".
    - Si YA está en el carrito → muestra un control de cantidad [−] N [+]
      para sumar o restar unidades sin salir de la tarjeta.
    - Cuando la cantidad baja a 0, el producto se elimina del carrito y
      el control vuelve a ser el botón "Agregar".
  USA: items, agregarItem y actualizarCantidad del CartContext.
*/
'use client'

import { useCart } from '@/context/CartContext'
import styles from './AddToCartButton.module.css'

export default function AddToCartButton({ producto, className }) {
  const { items, agregarItem, actualizarCantidad } = useCart()

  // Buscamos si este producto ya está en el carrito
  const enCarrito = items.find((i) => i.id === producto.id)

  /* ── ESTADO 1: el producto NO está en el carrito ─────────────────────── */
  if (!enCarrito) {
    return (
      <button
        className={className}
        onClick={() => agregarItem(producto)}
        aria-label={`Agregar ${producto.nombre} al carrito`}
      >
        Agregar
      </button>
    )
  }

  /* ── ESTADO 2: el producto YA está → mostramos el control de cantidad ── */
  return (
    <div
      className={styles.control}
      role="group"
      aria-label={`Cantidad de ${producto.nombre} en el carrito`}
    >
      <button
        type="button"
        className={styles.btn}
        onClick={() => actualizarCantidad(producto.id, enCarrito.cantidad - 1)}
        aria-label="Quitar una unidad"
      >
        −
      </button>
      <span className={styles.cantidad} aria-live="polite">
        {enCarrito.cantidad}
      </span>
      <button
        type="button"
        className={styles.btn}
        onClick={() => actualizarCantidad(producto.id, enCarrito.cantidad + 1)}
        aria-label="Agregar una unidad"
      >
        +
      </button>
    </div>
  )
}
