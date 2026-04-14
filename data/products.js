/*
  QUÉ HACE: Exporta el array de los 4 productos de la tienda Aurevia.
  POR QUÉ: Centralizar los datos en un solo archivo permite que cualquier
           componente los importe sin duplicar información.
           En producción, estos datos vendrían de una API o base de datos
           usando fetch(). Acá los hardcodeamos porque no tenemos backend.
  QUÉ PASARÍA SI SE SACA: Ningún componente tendría datos de productos
           y la tienda aparecería vacía.

  MÓDULO C — export default: este archivo usa módulos ES6.
  "export default" permite que otros archivos hagan:
    import products from '@/data/products'
  Sin "export", el array quedaría encapsulado y nadie podría usarlo.
*/

const products = [
  {
    id: 1,
    nombre: "Rose Velvet",
    categoria: "Floral",
    peso: "180 g",
    descripcion: "Rosa empolvada, peonía blanca y un fondo suave de almizcle.",
    precio: 22500,
    imagen: "/prod-rose-velvet.png",
    imagenHogar: "/prod-rose-velvet-hogar.png",
  },
  {
    id: 2,
    nombre: "Crème Lumière",
    categoria: "Cremosa",
    peso: "220 g",
    descripcion: "Vainilla tostada, haba tonka y una salida cálida y envolvente.",
    precio: 24900,
    imagen: "/prod-creme-lumiere.png",
    imagenHogar: "/prod-creme-lumiere-hogar.png",
  },
  {
    id: 3,
    nombre: "Blush Cotton",
    categoria: "Fresh",
    peso: "200 g",
    descripcion: "Lino limpio, pera blanca y notas frescas para todos los días.",
    precio: 21800,
    imagen: "/prod-blush-cotton.png",
    imagenHogar: "/prod-blush-cotton-hogar.png",
  },
  {
    id: 4,
    nombre: "Golden Amber",
    categoria: "Luxury",
    peso: "300 g",
    descripcion: "Ámbar suave, madera cálida y una estela elegante de noche.",
    precio: 27300,
    imagen: "/prod-golden-amber.png",
    imagenHogar: "/prod-golden-amber-hogar.png",
  },
]

export default products
