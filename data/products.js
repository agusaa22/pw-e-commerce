/*
  QUÉ HACE: Define el array de productos de la tienda Aurevia.
  POR QUÉ: En producción estos datos vendrían de una API externa (ej: Supabase),
           pero para el parcial los simulamos con un archivo local.
           Esto nos permite mostrar async/await y fetch sin necesitar un servidor real.
  QUÉ PASARÍA SI SE SACA: El componente FeaturedProducts no tendría datos
           para mostrar y quedaría la pantalla vacía.
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
  },
  {
    id: 2,
    nombre: "Crème Lumière",
    categoria: "Cremosa",
    peso: "220 g",
    descripcion: "Vainilla tostada, haba tonka y una salida cálida y envolvente.",
    precio: 24900,
    imagen: "/prod-creme-lumiere.png",
  },
  {
    id: 3,
    nombre: "Blush Cotton",
    categoria: "Fresh",
    peso: "200 g",
    descripcion: "Lino limpio, pera blanca y notas frescas para todos los días.",
    precio: 21800,
    imagen: "/prod-blush-cotton.png",
  },
  {
    id: 4,
    nombre: "Golden Amber",
    categoria: "Luxury",
    peso: "300 g",
    descripcion: "Ámbar suave, madera cálida y una estela elegante de noche.",
    precio: 27300,
    imagen: "/prod-golden-amber.png",
  },
]

export default products
