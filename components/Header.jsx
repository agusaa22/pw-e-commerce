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
import UserMenu from './UserMenu'
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
            {/*
              Usamos <Link href="/#seccion"> en vez de <a href="#seccion">
              para que los links funcionen desde CUALQUIER página (no solo
              desde la home). Por ejemplo, si estás en /carrito y hacés
              clic en VELAS, te lleva a la home y scrollea a la sección.
            */}
            <nav className={styles.mainNav} aria-label="Navegación principal">
              <ul>
                <li><Link href="/#velas">VELAS</Link></li>
                <li><Link href="/#aromatizantes">AROMATIZANTES</Link></li>
                <li><Link href="/#sets">SETS</Link></li>
              </ul>
            </nav>

            <div className={styles.headerActions} aria-label="Acciones del usuario">

              {/*
                MENÚ DE USUARIO — Client Component que muestra "Ingresar"
                o el nombre del usuario + "Salir" según haya o no sesión.
              */}
              <UserMenu />

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
