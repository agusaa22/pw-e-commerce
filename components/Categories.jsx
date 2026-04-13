/*
  COMPONENTE: Categories
  QUÉ HACE: Muestra las 4 categorías de productos en un grid: Florales,
           Cremosas, Fresh y Luxury.
  POR QUÉ: Separar categorías en un componente propio permite reutilizarlo
           en otras páginas (ej: un sidebar de filtros) sin repetir código.
  QUÉ PASARÍA SI SE SACA: El usuario no podría explorar por tipo de aroma
           y la navegación del catálogo sería más difícil.

  TECNOLOGÍA: Server Component. Los datos de categorías son estáticos,
  no necesitamos estado ni fetch dinámico.
*/

import styles from './Categories.module.css'

/*
  QUÉ HACE: Array de categorías definido dentro del componente.
  POR QUÉ: Son datos estáticos que no cambian. Si fueran dinámicos,
           vendrían de una API y usaríamos useEffect o data fetching de Next.js.
  CONEXIÓN CON EL PARCIAL: Acá se ve cómo .map() reemplaza repetir
           el mismo HTML 4 veces a mano.
*/
const categorias = [
  {
    id: 'florales',
    nombre: 'Florales',
    descripcion: 'Rosa, peonía, jazmín y perfumes suaves para espacios delicados.',
    imagen: '/cat-florales.png',
  },
  {
    id: 'cremosas',
    nombre: 'Cremosas',
    descripcion: 'Vainilla, coco y acordes envolventes para un clima cálido.',
    imagen: '/cat-cremosas.png',
  },
  {
    id: 'fresh',
    nombre: 'Fresh',
    descripcion: 'Cítricos, lino limpio y notas verdes para una sensación luminosa.',
    imagen: '/cat-fresh.png',
  },
  {
    id: 'luxury',
    nombre: 'Luxury',
    descripcion: 'Ámbar, sándalo y fragancias intensas con acabado premium.',
    imagen: '/cat-luxury.png',
  },
]

export default function Categories() {
  return (
    <section
      className={styles.section}
      id="categorias"
      aria-labelledby="categorias-titulo"
    >
      <div className="container">

        {/* ── ENCABEZADO ───────────────────────────────────────────────── */}
        <div className="section-heading">
          <span className="section-label">Categorías</span>
          {/*
            id="categorias-titulo" enlazado con aria-labelledby en el <section>.
            Esto le dice al lector de pantalla cómo se llama esta sección.
          */}
          <h2 id="categorias-titulo">Elegí tu estilo de aroma</h2>
          <p>Cada fragancia pensada para un momento, un ambiente y una emoción.</p>
        </div>

        {/* ── GRID DE CATEGORÍAS ───────────────────────────────────────── */}
        {/*
          QUÉ HACE: .map() recorre el array y genera una <article> por categoría.
          POR QUÉ: Es más mantenible que escribir el HTML 4 veces. Si se agrega
                   una categoría nueva, solo se modifica el array categorias[].
          QUÉ PASARÍA SI SE SACA EL MAP: Habría que duplicar el JSX manualmente.
        */}
        <div className={styles.grid}>
          {categorias.map((cat) => (
            /*
              key={cat.id}: React necesita una key única para identificar
              cada elemento de una lista y actualizar solo el que cambió.
              Sin key, React re-renderiza toda la lista (ineficiente).
            */
            <article key={cat.id} className={styles.card}>
              {/*
                <img> con alt descriptivo en lugar del div con gradiente.
                POR QUÉ: Una imagen real comunica mejor la estética de la categoría
                         que un gradiente CSS. El alt es obligatorio para accesibilidad.
              */}
              <img
                src={cat.imagen}
                alt={`Categoría ${cat.nombre} — velas Aurevia`}
                className={styles.visual}
              />

              <div className={styles.cardBody}>
                <h3>{cat.nombre}</h3>
                <p>{cat.descripcion}</p>
                {/*
                  href="#" temporal: en la versión final apuntaría a
                  /categorias/florales, /categorias/cremosas, etc.
                  con rutas de Next.js como /app/categorias/[slug]/page.js
                */}
                <a href="#" aria-label={`Ver categoría ${cat.nombre}`}>
                  Ver categoría →
                </a>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  )
}
