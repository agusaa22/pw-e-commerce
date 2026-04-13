/*
  QUÉ HACE: Define el layout raíz que envuelve TODAS las páginas de la app.
  POR QUÉ: En Next.js App Router, layout.js permite compartir estructura (html, body, metadata)
           entre rutas sin re-renderizarla. Es el "molde" de toda la aplicación.
  QUÉ PASARÍA SI SE SACA: Next.js no podría generar el documento HTML base
           y ninguna página funcionaría.
*/

import './globals.css'
import { CartProvider } from '@/context/CartContext'

/*
  QUÉ HACE: El objeto metadata define las etiquetas <title> y <meta description> del HTML.
  POR QUÉ: Next.js las inyecta automáticamente en el <head>. Importante para SEO.
  QUÉ PASARÍA SI SE SACA: La pestaña del navegador no tendría título y Google no podría
           indexar bien la página.
*/
export const metadata = {
  title: 'Aurevia | Velas Artesanales',
  description:
    'Tienda de velas artesanales premium. Florales, cremosas, fresh y luxury.',
}

/*
  QUÉ HACE: Componente RootLayout — envuelve toda la app con <html> y <body>.
  POR QUÉ: Next.js requiere este componente para construir el documento HTML.
           El prop {children} representa la página activa (en este caso, HomePage).
  QUÉ PASARÍA SI SE SACA: La app no arrancaría. Next.js necesita sí o sí un layout raíz.
*/
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      {/*
        lang="es" es accesibilidad: le dice a los lectores de pantalla
        que el contenido está en español, mejorando la experiencia para
        usuarios con discapacidad visual.
      */}
      {/*
        CartProvider envuelve toda la app.
        POR QUÉ: Así cualquier componente en cualquier ruta
        puede acceder al carrito con useCart() sin recibir props.
      */}
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
