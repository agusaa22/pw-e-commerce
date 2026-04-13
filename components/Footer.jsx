/*
  COMPONENTE: Footer
  QUÉ HACE: Muestra el pie de página con información de la marca,
           navegación secundaria, ayuda y datos de contacto.
  POR QUÉ: El footer es información persistente en todas las páginas.
           Separarlo en un componente evita repetirlo en cada layout de Next.js.
  QUÉ PASARÍA SI SE SACA: Los usuarios no tendrían acceso a contacto,
           ni a los links de política de envíos y pagos.

  TECNOLOGÍA: Server Component. El footer es estático, no necesita estado.
*/

import styles from './Footer.module.css'

export default function Footer() {
  return (
    /*
      <footer> es semántico: le indica a los motores de búsqueda y lectores
      de pantalla que este bloque contiene información de pie de página.
    */
    <footer className={styles.siteFooter} id="footer">
      <div className="container">

        {/*
          Grid de 4 columnas para la información del footer.
          POR QUÉ Grid: necesitamos columnas de distinto peso (la primera
          es más ancha que las otras tres). Con grid-template-columns
          lo controlamos exactamente.
        */}
        <div className={styles.footerGrid}>

          {/* ── COLUMNA 1: MARCA ────────────────────────────────────────── */}
          <div className={styles.marcaCol}>
            <h2 className={styles.footerLogo}>AUREVIA</h2>
            <p>
              Velas artesanales premium. Cada pieza creada a mano con
              cera de soja y fragancias de autor.
            </p>
            <p className={styles.proyecto}>
              Proyecto para Programación Web — ITBA 71.38
            </p>
          </div>

          {/* ── COLUMNA 2: NAVEGACIÓN ──────────────────────────────────── */}
          <div>
            <h3>Tienda</h3>
            <nav aria-label="Navegación del footer">
              <ul className={styles.footerLinks}>
                <li><a href="#categorias">Categorías</a></li>
                <li><a href="#destacados">Destacados</a></li>
                <li><a href="#">Sets de regalo</a></li>
                <li><a href="#">Novedades</a></li>
              </ul>
            </nav>
          </div>

          {/* ── COLUMNA 3: AYUDA ────────────────────────────────────────── */}
          <div>
            <h3>Ayuda</h3>
            <ul className={styles.footerLinks}>
              <li><a href="#">Envíos</a></li>
              <li><a href="#">Medios de pago</a></li>
              <li><a href="#">Cambios y devoluciones</a></li>
              <li><a href="#">Preguntas frecuentes</a></li>
            </ul>
          </div>

          {/* ── COLUMNA 4: CONTACTO ─────────────────────────────────────── */}
          <div>
            <h3>Contacto</h3>
            <ul className={styles.footerLinks}>
              {/*
                href="mailto:" y "tel:" son atributos semánticos de HTML.
                Abren el cliente de correo/teléfono del dispositivo.
                Mejoran la usabilidad en mobile.
              */}
              <li>
                <a href="mailto:hola@aurevia.com">hola@aurevia.com</a>
              </li>
              <li>
                <a href="tel:+541100000000">+54 11 0000-0000</a>
              </li>
              <li>Buenos Aires, Argentina</li>
            </ul>
          </div>

        </div>

        {/* ── PIE DEL FOOTER ────────────────────────────────────────────── */}
        {/*
          <small> es semántico: indica texto de menor importancia
          como copyright y avisos legales.
        */}
        <div className={styles.footerBottom}>
          <small>© 2026 Aurevia. Todos los derechos reservados.</small>
          <small>
            <a href="#">Política de privacidad</a>
            {' · '}
            <a href="#">Términos y condiciones</a>
          </small>
        </div>

      </div>
    </footer>
  )
}
