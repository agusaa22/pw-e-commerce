'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'
import styles from './AddToCartButton.module.css'

export default function AddToCartButton({ producto, className }) {
  const { agregarItem } = useCart()
  const [agregado, setAgregado] = useState(false)

  function handleClick() {
    agregarItem(producto)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  return (
    <button
      className={`${className} ${agregado ? styles.agregado : ''}`}
      onClick={handleClick}
      aria-label={agregado ? 'Producto agregado' : `Agregar ${producto.nombre} al carrito`}
      aria-live="polite"
    >
      {agregado ? '✓ Agregado' : 'Agregar'}
    </button>
  )
}
