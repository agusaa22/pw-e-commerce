/*
  QUÉ HACE: Datos simulados de reseñas por producto.
  POR QUÉ: En producción vendrían de una API o base de datos.
           Para el parcial los hardcodeamos para poder mostrar
           la funcionalidad sin necesitar un backend.
  QUÉ PASARÍA SI SE SACA: La sección de reseñas quedaría vacía.
*/

const reviews = {
  // Reseñas para Rose Velvet (id: 1)
  1: [
    {
      id: 1,
      nombre: 'Valentina M.',
      estrellas: 5,
      texto: 'Una vela increíble. El aroma a rosa es delicado y llena toda la habitación sin ser invasivo. La tengo en mi cuarto y no la cambiaría por nada.',
      fecha: '12 mar 2026',
    },
    {
      id: 2,
      nombre: 'Lucía F.',
      estrellas: 5,
      texto: 'La compré como regalo de cumpleaños y quedaron re encantados. La presentación es súper elegante, parece de tienda de lujo.',
      fecha: '28 feb 2026',
    },
    {
      id: 3,
      nombre: 'Martina R.',
      estrellas: 4,
      texto: 'El aroma es divino, muy suave y femenino. Tarda un poco en impregnarse pero una vez que lo hace es perfecto.',
      fecha: '15 ene 2026',
    },
  ],

  // Reseñas para Crème Lumière (id: 2)
  2: [
    {
      id: 1,
      nombre: 'Sofía A.',
      estrellas: 5,
      texto: 'La mejor vela que compré en mi vida. La vainilla es súper cálida y envolvente, ideal para encender en invierno con una taza de té.',
      fecha: '8 mar 2026',
    },
    {
      id: 2,
      nombre: 'Camila T.',
      estrellas: 5,
      texto: 'Me la regalé a mí misma y no me arrepiento para nada. El olor es increíble y la calidad de la cera de soja se nota.',
      fecha: '21 feb 2026',
    },
    {
      id: 3,
      nombre: 'Ana B.',
      estrellas: 4,
      texto: 'La calidad es muy buena. La vela dura mucho tiempo y el aroma persiste incluso apagada. Muy recomendable.',
      fecha: '3 feb 2026',
    },
  ],

  // Reseñas para Blush Cotton (id: 3)
  3: [
    {
      id: 1,
      nombre: 'María J.',
      estrellas: 5,
      texto: 'Súper fresca y limpia. Ideal para el día a día, no cansa ni marea. La tengo en el living y combina con todo.',
      fecha: '5 mar 2026',
    },
    {
      id: 2,
      nombre: 'Julia P.',
      estrellas: 5,
      texto: 'La tengo en el baño y es un sueño. El aroma a lino limpio es muy elegante y no es pesado para un espacio chico.',
      fecha: '17 feb 2026',
    },
    {
      id: 3,
      nombre: 'Clara M.',
      estrellas: 4,
      texto: 'Me encantó para usar en primavera. Es super sutil, perfecta para quienes no les gustan los aromas muy fuertes.',
      fecha: '28 ene 2026',
    },
  ],

  // Reseñas para Golden Amber (id: 4)
  4: [
    {
      id: 1,
      nombre: 'Florencia K.',
      estrellas: 5,
      texto: 'Es LA vela premium. El ámbar es tan profundo y cálido, perfecta para la noche. Se convirtió en mi ritual de cada día.',
      fecha: '10 mar 2026',
    },
    {
      id: 2,
      nombre: 'Renata V.',
      estrellas: 5,
      texto: 'La usé para una cena especial y fue perfecta. La presentación también es impresionante, muy de lujo.',
      fecha: '25 feb 2026',
    },
    {
      id: 3,
      nombre: 'Daniela G.',
      estrellas: 5,
      texto: 'La traje de regalo y fue un éxito total. Vale cada peso, la calidad se nota desde que abrís la caja.',
      fecha: '12 ene 2026',
    },
  ],
}

export default reviews
