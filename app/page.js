/*
  QUÉ HACE: Es la página de inicio ("/") de la tienda Aurevia.
  POR QUÉ: En Next.js App Router, el archivo page.js dentro de /app
           define automáticamente la ruta raíz del sitio.
           No necesitamos configurar rutas manualmente: la estructura de carpetas ES la ruta.
  QUÉ PASARÍA SI SE SACA: La ruta "/" no existiría y el sitio mostraría un 404.
*/

/*
  Importamos cada sección como componente independiente.
  POR QUÉ: Separar en componentes permite reutilizar, testear y mantener cada sección
           de forma aislada. Si hay un bug en el Footer no afecta al Hero.
*/
import Header          from '@/components/Header'
import Hero            from '@/components/Hero'
import Categories      from '@/components/Categories'
import FeaturedProducts from '@/components/FeaturedProducts'
import Footer          from '@/components/Footer'

/*
  QUÉ HACE: Componente de página — ensambla todas las secciones en orden.
  POR QUÉ: Es un Server Component por defecto (no tiene "use client").
           Next.js lo renderiza en el servidor, lo que mejora el SEO y la velocidad inicial.
  QUÉ PASARÍA SI SE SACA: La URL "/" no renderizaría ningún contenido.
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
      */}
      <main>
        <Hero />
        <Categories />
        <FeaturedProducts />
      </main>

      {/* El footer también va fuera del <main> porque es información secundaria */}
      <Footer />
    </>
  )
}
