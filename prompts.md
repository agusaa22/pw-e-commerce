# Prompts enviados a Claude - Proyecto Aurevia

## 1. Funcionalidades principales
> quiero que le hagas los siguientes ajustes a mi pagina web:
> 1. crea un interfaz para cada producto donde se muestra una review del producto.
> 2. crea un carrito de compras para todos los productos
> 3. crea una interfaz donde se entre a el carrito y se pueda ver el checkout y el pago de la compra.

## 2. Arreglar funcionalidad
> no funciona, arreglalo

> no anda el carrito y no está la review de los productos

## 3. Cambiar menú de navegación
> quiero que en el menu aparezca "velas", "aromatizantes" y "sets"

## 4. Aplicar cambios en Vercel
> necesito que los cambios los hagas ahi, quiero que en el menu aparezca "velas", "aromatizantes" y "sets"

## 5. Crear páginas por tipo de producto
> bien ahora queiro que cuando presiones velas, te abra una pestaña con todas las velas disponibles y sus respectivos precios, eso quiero que lo hagas con las velas, los aromatizantes y los sets, que cuando aprietes te abra una pestaña con los productos

## 6. Productos destacados solo 4 velas
> esta todo perfecto pero quiero que en productos destacados unicamente aparezcan las cuatro velas de antes, y unicamente aparezca el resto de los productos cuando presionas "velas" o "aromatizantes" o "sets"

## 7. Páginas por categoría (Florales, Cremosas, Fresh, Luxury)
> bien ahora quiero que cuando el usuario aprete la categoria florales, que se abra una pestaña para todas las velas florales, el set floral y el aromatizante floral, cuando el usuario aprete cremosas que pase lo mismo pero con todo lo cremoso, cuando el usuario aprete fresh que pase lo misma pero con los productos fresh y por ultimo lo mismo con la categoria luxury

## 8. Mensaje de confirmación al agregar al carrito
> bien quiero que cuando el usuario aprete para agregar el producto al carro, que ponga un breve mensaje de "su producto se agrego con exito"

## 9. Header sticky
> bien quiero que el header sea estatico, para que cuando el usuario baje siempre tenga la opcion de apretar velas, aromatizantes, y sets

## 10. Logo con degradado rosa animado
> bien quiero que el aurevia sea con degradados en rosas y que sea bien llamativo

## 11. Reducir tamaño del header
> necesito que el menu sea mas angosto para que tampoco invada mucho espacio

## 12. Revertir header
> no mejor dejamelo exactamente igual como antes

## 13. Hover con fotos hogar en productos destacados
> bien claude te agregue cuatro fotos que son las cuatro velas que aparecen en menu de destacadas, pero te las puse en formato hogar, con estas fotos quiero que cuando el usuario ponga el cursor sobre la foto, la foto de vela se cambie de la vela a la vela puesta en el hogar

## 14. Reemplazar fotos hogar
> claude reemplaza la de blush cottons y la golden amber por las nuevas fotos de hogar que te agregue, las otras ya las elimine

## 15. Efecto llamas en cursor + parallax en hero
> Un hero con efecto de llama de vela en el cursor. Imaginate esto: cuando el usuario mueve el mouse por el hero de tu página, aparecen pequeñas llamas animadas que lo siguen. Cálido, único, y 100% relacionado con las velas. Nadie más va a tener eso. Combinado con un efecto parallax en el fondo — que significa que el fondo se mueve más lento que el contenido cuando scrolleás, dando sensación de profundidad y elegancia.

## 16. Revertir hero
> no claude perdon quiero que me lo dejes igual que antes

## 17. Simplificar la app para el parcial oral
> claude quiero que te sostengas de la consiga de primer parcial y que la pagina web, sea lo mas sencilla de explicar posible, ya que necesito ser capaz de entenderla por completo cada funcionamiento, no le quiero agregar tantas cosas, mas bien dejarla simple y poder explicar toda la programacion completa parte por parte

**Resultado:** Se eliminaron: checkout, páginas de catálogo (velas, aromatizantes, sets), CatalogPage, reviews, y se redujo de 20 a 8 productos. Se mantuvieron todos los conceptos del parcial (useState, useEffect, fetch, Context API, rutas dinámicas, HTML semántico, accesibilidad, responsive).

## 18. Simplificar a solo 4 velas
> bien quiero hacer un cambio grande, simplemente quiero las 4 velas que son las destacadas, solamente voy a vender esos productos y que sea bien simple siguiendo con todas las pautas del parcial

**Resultado:** Se eliminaron: categorías (componente + página), y se redujo a solo 4 productos. Se eliminaron rutas de categoría. La app queda con: Home (Hero + 4 productos), detalle de producto (/productos/[id]), carrito (/carrito), y CartContext para estado global. Estructura mínima que cubre todos los módulos del parcial.

## 19. Agregar API route y formulario de contacto (E3 y E4)
> bien ahora teniendo en cuenta la rúbrica de evaluación del TP, necesito cubrir E3 (formularios con fetch + validación) y E4 (catálogo navegable + API básica)

**Resultado:** Se agregaron:
1. API route en `/api/productos/route.js` — endpoint GET que devuelve los productos como JSON (cubre E4: API interna).
2. `FeaturedProducts` ahora hace `fetch('/api/productos')` real en vez de un import simulado (cubre E3+E4: fetch integrado).
3. Componente `ContactForm` con validación en JavaScript: nombre, email y mensaje con errores en tiempo real (cubre E3: formulario dinámico con validación).
4. Versión HTML del formulario en `index.html` con validación nativa de HTML5 (required, type="email").

## 20. Agregar checkout con formulario de pago
> bien claude pero me falta esto: crea un carrito de compras para todos los productos, crea una interfaz donde se entre a el carrito y se pueda ver el checkout y el pago de la compra.

**Resultado:** El carrito ya existía en `/carrito`. Se agregó:
1. Página de checkout en `/checkout` con formulario de pago (nombre, email, dirección, tarjeta) con validación JavaScript.
2. Resumen del pedido con imagen, cantidad y precio de cada producto.
3. Simulación de procesamiento de pago y confirmación de compra.
4. Al confirmar, se vacía el carrito con `vaciarCarrito()` del Context.
5. Botón "Finalizar compra" en el carrito que lleva a `/checkout`.

## 21. Actualizar deploy en Vercel
> actualizame el vercel

**Resultado:** Se hizo commit y push a GitHub. Vercel detecta el push y despliega automáticamente.
