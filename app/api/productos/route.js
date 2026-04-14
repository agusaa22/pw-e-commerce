/*
  API ROUTE: /api/productos
  QUÉ HACE: Devuelve la lista de productos en formato JSON cuando alguien
           hace un GET a /api/productos.
  POR QUÉ: En Next.js App Router, un archivo route.js dentro de /app/api/
           define un endpoint de API (como un mini backend).
           Esto permite que el frontend haga fetch('/api/productos')
           y reciba los datos como si fuera una API real.

  QUÉ PASARÍA SI SE SACA: FeaturedProducts no podría obtener los productos
           con fetch() y la sección quedaría vacía.

  MÓDULO C — Este archivo demuestra:
    - Cómo funciona una API: recibe un request HTTP y devuelve un response JSON.
    - Separación frontend/backend: el componente React no accede directamente
      a los datos, los pide a través de una URL (como haría con cualquier API externa).

  MÓDULO D — Route Handlers de Next.js:
    - En Next.js, "export async function GET()" define qué pasa cuando
      alguien hace una petición GET a esta URL.
    - NextResponse.json() convierte un objeto JavaScript en respuesta JSON
      con el header Content-Type correcto.
*/

import { NextResponse } from 'next/server'
import products from '@/data/products'

/*
  QUÉ HACE: Función que maneja peticiones GET a /api/productos.
  POR QUÉ async: las funciones de API en Next.js son async por convención,
           ya que en producción podrían consultar una base de datos (operación async).
  RETORNA: NextResponse.json() — convierte el array de productos a JSON
           y lo envía con status 200 (éxito) automáticamente.

  En producción, acá se haría algo como:
    const { data } = await supabase.from('productos').select('*')
    return NextResponse.json(data)
*/
export async function GET() {
  return NextResponse.json(products)
}
