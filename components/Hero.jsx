/*
  COMPONENTE: Hero
  QUÉ HACE: Muestra la sección principal de presentación de la marca:
           imagen de fondo, título, bajada y botones de acción.
  POR QUÉ: El hero es lo primero que ve el usuario. Su función es comunicar
           la propuesta de valor de Aurevia y llevar al usuario a explorar.
  QUÉ PASARÍA SI SE SACA: El sitio arrancaría directo en las categorías,
           sin presentar la marca. La tasa de conversión bajaría.

  TECNOLOGÍA: Server Component. No necesita estado ni eventos de browser.
*/

import styles from './Hero.module.css'

export default function Hero() {
  return (
    /*
      <section> es semántico: identifica un bloque temático independiente.
      No usamos <div> porque la sección tiene significado propio dentro de la página.
    */
    <section className={styles.hero} aria-label="Presentación de Aurevia">

      {/* Overlay oscuro para mejorar la legibilidad del texto sobre la imagen */}
      <div className={styles.overlay} aria-hidden="true" />

      <div className={`${styles.heroContent} container`}>

        {/* Badge de colección */}
        <p className={styles.kicker}>✦ Colección nueva</p>

        {/*
          <h2> porque el <h1> ya está en el Header (el nombre de la marca).
          Jerarquía correcta: h1 → h2 → h3. Romperla confunde a lectores de pantalla.
        */}
        <h2 className={styles.title}>
          Velas de luz,<br />aroma y ritual
        </h2>

        <p className={styles.description}>
          Un universo de velas delicadas, diseño sofisticado y calidez contemporánea.
          Cada pieza pensada para transformar tu ambiente.
        </p>

        {/*
          display: flex en los botones permite que en mobile se apilen en columna
          y en desktop queden en fila. Ver Hero.module.css.
        */}
        <div className={styles.buttons}>
          <a href="#destacados" className={styles.btnPrimary}>
            Compra ahora
          </a>
          <a href="#categorias" className={styles.btnSecondary}>
            Descubrí más
          </a>
        </div>

      </div>
    </section>
  )
}
