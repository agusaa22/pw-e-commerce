/*
  PÁGINA: Home ("/")
  QUÉ HACE: Es la página de inicio de la tienda Aurevia.
  POR QUÉ: En Next.js App Router, el archivo page.js dentro de /app
           define automáticamente la ruta raíz del sitio ("/").
           No necesitamos configurar rutas manualmente:
           la estructura de carpetas ES la ruta.
  QUÉ PASARÍA SI SE SACA: La ruta "/" no existiría y el sitio mostraría un 404.

  TIPO: Server Component (por defecto en Next.js App Router).
        No tiene "use client" → se renderiza en el servidor.
        El HTML llega ya armado al navegador, lo que mejora SEO y velocidad.
*/

/*
  Importamos cada sección como componente independiente.
  POR QUÉ: Separar en componentes permite:
    1. Reutilizar cada sección en otras páginas si hiciera falta.
    2. Trabajar en cada sección de forma aislada (un bug en Footer no afecta al Hero).
    3. Código más organizado y legible.

  MÓDULO C — import/export: cada componente se exporta con "export default"
  en su archivo y se importa acá con "import ... from ...".
  Esto es el sistema de módulos ES6 de JavaScript.
*/
import Header          from '@/components/Header'
import Hero            from '@/components/Hero'
import FeaturedProducts from '@/components/FeaturedProducts'
import ContactForm     from '@/components/ContactForm'
import Footer          from '@/components/Footer'

/*
  QUÉ HACE: Componente de página — ensambla todas las secciones en orden.
  POR QUÉ: Esta función retorna JSX (HTML dentro de JavaScript).
           React toma este JSX y lo convierte en HTML real en el navegador.

  ESTRUCTURA:
    <Header />           → Navegación global (Server Component)
    <main>               → Contenido principal (etiqueta semántica HTML5)
      <Hero />           → Presentación de la marca (Server Component)
      <FeaturedProducts /> → Productos con fetch a la API (Client Component)
      <ContactForm />    → Formulario con validación (Client Component)
    </main>
    <Footer />           → Pie de página (Server Component)

  <>...</> es un Fragment: agrupa elementos sin agregar un div extra al DOM.
*/
export default function HomePage() {
  return (
    <>
      {/* El header va fuera del <main> porque es navegación global */}
      <Header />

      {/*
        <main> es una etiqueta semántica de HTML5.
        POR QUÉ: Le dice a los lectores de pantalla y a Google dónde está
        el contenido principal, mejorando accesibilidad y SEO.
        Solo debe haber UN <main> por página.
      */}
      <main>
        <Hero />
        <FeaturedProducts />
        <ContactForm />
      </main>

      {/* El footer va fuera del <main> porque es información secundaria */}
      <Footer />
    </>
  )
}
