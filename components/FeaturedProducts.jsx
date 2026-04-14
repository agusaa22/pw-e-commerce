/*
  COMPONENTE: FeaturedProducts
  QUÉ HACE: Hace un fetch REAL a nuestra API (/api/productos) para obtener
           la lista de productos y los renderiza usando ProductCard.
  POR QUÉ: Es el componente donde demostramos JavaScript moderno:
           - fetch() para pedir datos a una API (como haríamos con cualquier backend)
           - async/await para manejar código asíncrono de forma legible
           - useState para guardar el estado (productos, cargando, error)
           - useEffect para ejecutar el fetch cuando el componente aparece en pantalla
  QUÉ PASARÍA SI SE SACA: No habría ningún producto visible en la home.

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
             Si usáramos "let productos = []" sin useState, React no sabría que
             los datos cambiaron y la pantalla NO se actualizaría.

    productos    → el array de productos (empieza vacío [])
    setProductos → la función para actualizar ese array
    cargando     → booleano que indica si estamos esperando los datos
    setCargando  → función para actualizar cargando
    error        → mensaje de error si algo falla (empieza en null = sin error)
  */
  const [productos, setProductos] = useState([])
  const [cargando, setCargando]   = useState(true)
  const [error, setError]         = useState(null)

  /*
    QUÉ HACE: useEffect ejecuta código con "efectos secundarios".
    POR QUÉ: El fetch de datos es un "efecto secundario" (interacción
             con el mundo exterior). React separa la lógica de render
             (JSX puro) de los efectos (fetch, timers, subscripciones).

    El array [] al final (dependency array) significa que este efecto
    corre UNA SOLA VEZ, cuando el componente se monta en la pantalla.
    Si no pusiera [], correría en cada render → loop infinito de fetches.

    QUÉ PASARÍA SI SE SACA EL useEffect: El fetch nunca se ejecutaría
    y productos siempre quedaría como []. La sección estaría vacía.
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
          FETCH REAL a nuestra API de Next.js.

          QUÉ HACE fetch(): envía una petición HTTP GET a /api/productos.
          Nuestra route.js en app/api/productos/ recibe esa petición
          y devuelve los productos en formato JSON.

          POR QUÉ async/await: fetch() es ASÍNCRONO — tarda un tiempo
          en ir al servidor y volver con la respuesta.
          - "await" pausa la ejecución HASTA que la respuesta llegue.
          - Sin await, "respuesta" sería una Promise (objeto pendiente),
            NO los datos reales. El código seguiría sin esperar.

          El flujo es:
            1. fetch() envía GET a /api/productos
            2. await espera la respuesta del servidor
            3. respuesta.json() convierte el texto JSON a un objeto JavaScript
            4. await espera esa conversión (también es async)
            5. setProductos() guarda los datos en el estado de React

          Sin async/await, el mismo código sería con .then():
            fetch('/api/productos')
              .then(respuesta => respuesta.json())
              .then(datos => setProductos(datos))
              .catch(err => setError(err.message))
          async/await es más legible.
        */
        const respuesta = await fetch('/api/productos')

        /*
          Verificamos que la respuesta fue exitosa (status 200-299).
          POR QUÉ: fetch() NO lanza error en status 404 o 500.
                   Solo falla si hay un error de red (servidor caído, sin internet).
                   Por eso chequeamos .ok manualmente.
        */
        if (!respuesta.ok) {
          throw new Error('Error al obtener los productos')
        }

        /*
          .json() convierte el body de la respuesta (texto JSON)
          a un objeto/array de JavaScript que podemos usar.
          También es async, por eso lleva await.
        */
        const datos = await respuesta.json()

        // Guardamos los productos en el estado → React re-renderiza con los datos
        setProductos(datos)

      } catch (err) {
        /*
          QUÉ HACE: Captura errores de red o de la API.
          POR QUÉ: Sin try/catch, un error en el fetch crashearía el componente
                   sin mostrar ningún mensaje al usuario.
          catch recibe el error como parámetro (err).
        */
        setError('No pudimos cargar los productos. Intentá de nuevo.')
        console.error('Error en obtenerProductos:', err)
      } finally {
        /*
          finally corre SIEMPRE, haya error o no.
          POR QUÉ: Garantiza que el spinner de carga desaparezca.
                   Sin finally, si hay un error, cargando quedaría en true
                   y el spinner nunca se iría.
        */
        setCargando(false)
      }
    }

    // Llamamos a la función async que acabamos de definir
    obtenerProductos()

  }, []) // ← dependency array vacío: solo corre al montar el componente

  /* ── ESTADOS DE RENDER ──────────────────────────────────────────────────── */
  /*
    Renderizado condicional: según el estado, mostramos diferentes cosas.
    Esto es clave en React: el componente se re-renderiza automáticamente
    cuando el estado cambia (cargando: true → false).
  */

  // ESTADO 1: Todavía cargando los datos
  if (cargando) {
    return (
      <section className={styles.section} id="destacados">
        <div className="container">
          {/*
            aria-live="polite" anuncia el cambio a los lectores de pantalla
            cuando el contenido se actualiza (de "Cargando" a los productos).
          */}
          <div className={styles.estado} aria-live="polite">
            <div className={styles.spinner} aria-hidden="true" />
            <p>Cargando productos...</p>
          </div>
        </div>
      </section>
    )
  }

  // ESTADO 2: Hubo un error en el fetch
  if (error) {
    return (
      <section className={styles.section} id="destacados">
        <div className="container">
          {/* role="alert" hace que el lector de pantalla lo anuncie inmediatamente */}
          <div className={styles.estado} role="alert">
            <p className={styles.errorMsg}>{error}</p>
          </div>
        </div>
      </section>
    )
  }

  /* ── ESTADO 3: Datos cargados correctamente — RENDER PRINCIPAL ──────── */
  return (
    <section className={styles.section} id="destacados">
      <div className="container">

        {/* Encabezado de la sección */}
        <div className="section-heading">
          <span className="section-label">Nuestras velas</span>
          <h2 id="destacados-titulo">Colección Aurevia</h2>
          <p>
            Cada vela está elaborada a mano con cera de soja natural
            y fragancias premium importadas.
          </p>
        </div>

        {/*
          QUÉ HACE: .map() recorre el array de productos y genera
                    un componente ProductCard por cada uno.
          POR QUÉ: .map() es la forma idiomática de React para renderizar listas.
                   No se puede usar for en JSX — .map() devuelve un nuevo array
                   de elementos React que se insertan en el DOM.

          PROP key: React la usa internamente para identificar cada elemento
                    de la lista. Sin key, React no sabe cuál cambió y
                    re-renderiza TODA la lista (ineficiente).
                    La key debe ser única (usamos producto.id).

          PROP producto: le pasamos cada objeto del array al componente hijo.
                        ProductCard recibe { producto } como prop y lo usa
                        para mostrar nombre, precio, imagen, etc.
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
