/*
  COMPONENTE: Header
  QUÉ HACE: Muestra la barra de navegación con logo, menú y accesos rápidos.
  POR QUÉ: Server Component — no necesita "use client" porque no usa hooks.
           CartIcon es un Client Component separado que sí usa useCart().
           Esta separación es el patrón correcto de Next.js App Router:
           mantener Server Components cuando es posible y aislar la
           interactividad en Client Components específicos.
*/

import Link from 'next/link'
import CartIcon from './CartIcon'
import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.siteHeader}>
      <div className={styles.headerMain}>
        <div className="container">

          {/* ── LOGO ──────────────────────────────────────────────────────── */}
          <div className={styles.headerBrand}>
            {/*
              Link de Next.js para navegación client-side (sin reload).
              POR QUÉ: Link renderiza solo el componente destino.
                       <a href="/"> recargaría toda la aplicación.
            */}
            <Link href="/" aria-label="Ir al inicio de Aurevia">
              <h1 className={styles.brandName}>AUREVIA</h1>
            </Link>
          </div>

          {/* ── FILA INFERIOR: menú + iconos ──────────────────────────────── */}
          <div className={styles.headerBottom}>

            <nav className={styles.mainNav} aria-label="Navegación principal">
              <ul>
                <li><Link href="/#categorias">CATEGORÍAS</Link></li>
                <li><Link href="/#destacados">DESTACADOS</Link></li>
                <li><Link href="/#footer">CONTACTO</Link></li>
              </ul>
            </nav>

            <div className={styles.headerActions} aria-label="Acciones del usuario">

              {/* USUARIO */}
              <a href="#" className={styles.iconLink} aria-label="Mi cuenta">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
                </svg>
              </a>

              {/* FAVORITOS */}
              <a href="#" className={styles.iconLink} aria-label="Lista de favoritos">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 21C12 21 4 16 4 9.5C4 6.5 6.2 4.5 8.8 4.5C10.5 4.5 11.6 5.3 12 6.2C12.4 5.3 13.5 4.5 15.2 4.5C17.8 4.5 20 6.5 20 9.5C20 16 12 21 12 21Z" />
                </svg>
              </a>

              {/*
                CARRITO — Client Component separado.
                POR QUÉ: CartIcon usa useCart() que requiere "use client".
                         Si hiciéramos todo el Header "use client" perderíamos
                         las ventajas de rendering en el servidor.
              */}
              <CartIcon />

            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
