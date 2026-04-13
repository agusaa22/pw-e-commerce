/*
  COMPONENTE: FeaturedProducts
  QUÉ HACE: Obtiene la lista de productos (con un fetch simulado asíncrono)
           y los renderiza usando el componente ProductCard.
  POR QUÉ: Es el componente donde demostramos JavaScript moderno:
           - async/await para manejar código asíncrono de forma legible
           - useState para guardar el estado (productos, cargando)
           - useEffect para ejecutar el fetch cuando el componente aparece en pantalla
  QUÉ PASARÍA SI SE SACA: La sección "Destacados" no existiría y no habría
           ningún producto visible en la home.

  ⚠️  "use client" es OBLIGATORIO acá porque:
      - useState y useEffect son hooks de React
      - En Next.js App Router, los componentes son Server Components por defecto
      - Los Server Components no pueden usar hooks porque corren en el servidor,
        donde no hay interactividad ni ciclo de vida de React
      - "use client" le dice a Next.js que este componente debe ejecutarse en el browser
*/
'use client'

import { useState, useEffect } from 'react'
import ProductCard from './ProductCard'
import styles from './FeaturedProducts.module.css'

export default function FeaturedProducts() {

  /*
    QUÉ HACE: useState declara variables de estado reactivo.
    POR QUÉ: Cuando el estado cambia, React re-renderiza el componente automáticamente.
             Si usáramos let productos = [] sin useState, React no sabría que
             los datos cambiaron y no actualizaría la pantalla.

    productos    → el array de productos (empieza vacío)
    setProductos → la función para actualizar ese array
    cargando     → booleano que indica si estamos esperando los datos
    setCargando  → función para actualizar cargando
  */
  const [productos, setProductos]   = useState([])
  const [cargando, setCargando]     = useState(true)
  const [error, setError]           = useState(null)

  /*
    QUÉ HACE: useEffect ejecuta código con efectos secundarios.
    POR QUÉ: El fetch de datos es un "efecto secundario" (interacción
             con el mundo exterior). React separa la lógica de render
             (JSX puro) de los efectos (fetch, timers, subscripciones).
    El array [] al final (dependency array) significa que este efecto
    corre UNA SOLA VEZ, cuando el componente se monta en la pantalla.
    Si no pusiera [], correría en cada render → loop infinito.
    QUÉ PASARÍA SI SE SACA EL useEffect: El fetch nunca se ejecutaría
    y productos siempre quedaría como [].
  */
  useEffect(() => {

    /*
      QUÉ HACE: Función interna async para usar await dentro del useEffect.
      POR QUÉ: useEffect NO puede ser async directamente (devolvería una Promise,
               y useEffect espera que no se devuelva nada o una función de cleanup).
               La solución estándar es declarar la función async adentro y llamarla.
    */
    async function obtenerProductos() {
      try {
        /*
          FETCH SIMULADO: usamos un import dinámico + delay para imitar
          lo que haría un fetch() real a una API.

          En producción sería algo como:
            const respuesta = await fetch('https://mi-api.supabase.co/rest/v1/productos')
            const datos = await respuesta.json()

          POR QUÉ async/await: es más legible que encadenar .then().catch().
          Sin async/await el mismo código sería:
            fetch(url)
              .then(res => res.json())
              .then(datos => setProductos(datos))
              .catch(err => setError(err.message))
        */

        // Simulamos la latencia de red (400ms)
        await new Promise((resolve) => setTimeout(resolve, 400))

        // Importamos los datos del archivo local (simula el JSON de una API)
        const { default: datos } = await import('../data/products.js')

        setProductos(datos)

      } catch (err) {
        /*
          QUÉ HACE: Captura errores de red o de parseo de JSON.
          POR QUÉ: Sin try/catch, un error en el fetch crashearía el componente
                   sin mostrar ningún mensaje al usuario.
        */
        setError('No pudimos cargar los productos. Intentá de nuevo.')
        console.error('Error en obtenerProductos:', err)
      } finally {
        /*
          finally corre siempre, haya error o no.
          POR QUÉ: Garantiza que el spinner de carga desaparezca aunque
                   haya un error. Sin finally, si hay un error, cargando
                   quedaría en true y el spinner nunca se iría.
        */
        setCargando(false)
      }
    }

    obtenerProductos()

  }, []) // ← dependency array vacío: solo corre al montar el componente

  /* ── ESTADOS DE RENDER ──────────────────────────────────────────────────── */

  if (cargando) {
    return (
      <section className={styles.section} id="destacados">
        <div className="container">
          {/*
            aria-live="polite" anuncia el cambio a los lectores de pantalla
            cuando el contenido del div se actualiza (de "Cargando" a los productos).
          */}
          <div className={styles.estado} aria-live="polite">
            <div className={styles.spinner} aria-hidden="true" />
            <p>Cargando productos...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.section} id="destacados">
        <div className="container">
          <div className={styles.estado} role="alert">
            <p className={styles.errorMsg}>{error}</p>
          </div>
        </div>
      </section>
    )
  }

  /* ── RENDER PRINCIPAL ───────────────────────────────────────────────────── */
  return (
    <section className={styles.section} id="destacados">
      <div className="container">

        {/* Encabezado de la sección */}
        <div className="section-heading">
          <span className="section-label">Destacados</span>
          <h2 id="destacados-titulo">Productos destacados</h2>
          <p>
            Cada vela está elaborada a mano con cera de soja natural
            y fragancias premium importadas.
          </p>
        </div>

        {/*
          QUÉ HACE: Mapea el array de productos a componentes ProductCard.
          POR QUÉ: .map() es la forma idiomática de React para renderizar listas.
                   Cada ProductCard recibe su producto como prop.
          PROP key: React la usa internamente para identificar elementos de la lista.
                    No se puede acceder a key desde el componente hijo.
        */}
        <div className={styles.grid}>
          {productos.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>

      </div>
    </section>
  )
}
