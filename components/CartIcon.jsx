/*
  COMPONENTE: CartIcon
  QUÉ HACE: Muestra el ícono del carrito en el header con el contador
           de ítems actualizado en tiempo real. Al clickear va a /carrito.
  POR QUÉ: Necesita "use client" porque usa useCart() (Context API).
           El Header es Server Component, por eso el ícono del carrito
           se separa en su propio Client Component.
  QUÉ PASARÍA SI SE SACA: El carrito mostraría siempre 0 y no navegaría.
*/
'use client'

import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import styles from './Header.module.css'

export default function CartIcon() {
  /*
    useCart() lee el estado global del carrito.
    totalItems se recalcula automáticamente cuando agregarItem() es llamado.
  */
  const { totalItems } = useCart()

  return (
    /*
      Link de Next.js hace navegación client-side (sin recargar la página).
      POR QUÉ Link en lugar de <a>: <a> recarga toda la app, Link solo
      renderiza la página destino — más rápido y mejor experiencia de usuario.
    */
    <Link
      href="/carrito"
      className={styles.iconLink}
      aria-label={`Carrito de compras, ${totalItems} ${totalItems === 1 ? 'ítem' : 'ítems'}`}
    >
      <div className={styles.cartWrapper}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 7h10l1 12H6L7 7z" />
          <path d="M9 7V6a3 3 0 0 1 6 0v1" />
        </svg>

        {/*
          Solo muestra el badge si hay ítems en el carrito.
          POR QUÉ renderizado condicional: evita mostrar "0" cuando está vacío.
        */}
        {totalItems > 0 && (
          <span className={styles.cartCount} aria-hidden="true">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </div>
    </Link>
  )
}
