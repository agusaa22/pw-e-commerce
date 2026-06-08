/*
  COMPONENTE: UserMenu
  QUÉ HACE:
    - Si NO hay sesión → muestra el ícono de persona y al hacer clic va a /login.
    - Si HAY sesión → muestra el ícono + el nombre del usuario y un botón "Salir".
    - Si es admin → muestra además un link al panel /admin.
*/
'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import styles from './UserMenu.module.css'

/* SVG del ícono de persona, igual al que tenías antes en el Header */
function IconoUsuario() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icono}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  )
}

export default function UserMenu() {
  const { usuario, perfil, esAdmin, cerrarSesion } = useAuth()

  /* ── SIN SESIÓN: solo el ícono, lleva a /login ─────────────────────────── */
  if (!usuario) {
    return (
      <Link href="/login" className={styles.iconLink} aria-label="Iniciar sesión">
        <IconoUsuario />
      </Link>
    )
  }

  /* ── CON SESIÓN: ícono + nombre + (admin si corresponde) + Salir ─────────
     Para el admin ocultamos "Pedidos" del header: la gestión de TODAS las
     órdenes ya está en /admin, y /mis-pedidos solo mostraría las compras
     personales del admin (que normalmente no compra nada con esta cuenta). */
  return (
    <div className={styles.menu}>
      <Link href="/cuenta" className={styles.iconLink} aria-label="Mi cuenta">
        <IconoUsuario />
      </Link>
      <span className={styles.saludo}>Hola, {perfil?.nombre || 'cuenta'}</span>
      {!esAdmin && (
        <Link href="/mis-pedidos" className={styles.linkPedidos}>Pedidos</Link>
      )}
      {esAdmin && (
        <Link href="/admin" className={styles.adminLink}>Admin</Link>
      )}
      <button onClick={cerrarSesion} className={styles.salir}>Salir</button>
    </div>
  )
}
