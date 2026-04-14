/*
  COMPONENTE: Header
  QUÉ HACE: Muestra la barra de navegación con logo, link a productos y carrito.
  POR QUÉ: Es un Server Component — no tiene "use client" porque NO usa hooks.
           Los Server Components se renderizan en el servidor, lo que mejora
           la velocidad de carga y el SEO (el HTML llega ya armado al navegador).

  EXCEPCIÓN: CartIcon es un Client Component separado que SÍ usa useCart().
           Esta separación es el patrón correcto de Next.js App Router:
           mantener Server Components cuando es posible y aislar la
           interactividad en Client Components pequeños.

  QUÉ PASARÍA SI SE SACA: No habría navegación ni forma de ir al carrito.
*/

import Link from 'next/link'
import CartIcon from './CartIcon'
import styles from './Header.module.css'

export default function Header() {
  return (
    /*
      <header> es una etiqueta semántica de HTML5.
      POR QUÉ: Le dice a los lectores de pantalla y buscadores que
      este bloque es la cabecera de la página (navegación global).
    */
    <header className={styles.siteHeader}>
      <div className={styles.headerMain}>
        <div className="container">

          {/* ── LOGO ──────────────────────────────────────────────────────── */}
          <div className={styles.headerBrand}>
            {/*
              Link de Next.js para navegación client-side (sin reload).
              POR QUÉ Link y no <a>:
                - <a href="/"> recarga TODA la aplicación desde cero.
                - Link solo renderiza el componente de la página destino.
                Resultado: navegación instantánea y mejor experiencia.
            */}
            <Link href="/" aria-label="Ir al inicio de Aurevia">
              <h1 className={styles.brandName}>AUREVIA</h1>
            </Link>
          </div>

          {/* ── NAVEGACIÓN + ICONOS ───────────────────────────────────────── */}
          <div className={styles.headerBottom}>

            {/*
              <nav> es semántico: le dice a los lectores de pantalla que
              esto es navegación. aria-label lo diferencia de otros nav
              que pueda haber en la página (como el del footer).
            */}
            <nav className={styles.mainNav} aria-label="Navegación principal">
              <ul>
                {/*
                  href="#destacados" es un ancla: scrollea hasta el
                  elemento con id="destacados" sin recargar la página.
                */}
                <li><a href="#destacados">VELAS</a></li>
                <li><Link href="/carrito">CARRITO</Link></li>
              </ul>
            </nav>

            <div className={styles.headerActions} aria-label="Acciones del usuario">

              {/* ÍCONO USUARIO — decorativo */}
              {/*
                aria-label describe la acción para lectores de pantalla.
                aria-hidden="true" en el SVG porque el aria-label del <a>
                ya lo describe — evita que el lector lea el SVG como texto.
              */}
              <a href="#" className={styles.iconLink} aria-label="Mi cuenta">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
                </svg>
              </a>

              {/*
                CARRITO — Client Component separado.
                POR QUÉ separado: CartIcon usa useCart() que requiere "use client".
                Si hiciéramos todo el Header "use client", perderíamos
                las ventajas del renderizado en servidor para todo el header.
                Separar el ícono del carrito es el patrón recomendado en Next.js.
              */}
              <CartIcon />

            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
