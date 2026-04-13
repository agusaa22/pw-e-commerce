/*
  QUÉ HACE: Server Component que define la ruta /productos/[id].
  POR QUÉ: En Next.js App Router, el archivo page.js define la ruta.
           El [id] entre corchetes es un parámetro dinámico: /productos/1,
           /productos/2, etc. Next.js pasa el id en la prop params.
  QUÉ PASARÍA SI SE SACA: La ruta /productos/... no existiría (404).
*/

import ProductDetail from './ProductDetail'

/*
  params.id viene del nombre de la carpeta [id].
  Es un Server Component — pasa el id como prop al Client Component
  que necesita interactividad (carrito, cantidad).
*/
export default function ProductoPage({ params }) {
  return <ProductDetail id={params.id} />
}
