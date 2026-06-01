/*
  API ROUTE: /api/productos
  QUÉ HACE: Devuelve los productos ACTIVOS leyéndolos de Supabase.
  POR QUÉ los headers anti-caché en la respuesta:
    Sin esto Vercel cachea la respuesta a nivel edge/CDN, y aunque el cliente
    pida fresh, Vercel devuelve la versión vieja. Los 3 headers más
    `revalidate = 0` aseguran que la API siempre devuelva el dato actual.
*/
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// Next.js: nunca generes una versión estática de esta ruta
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'

export async function GET() {
  const { data, error } = await supabase
    .from('productos')
    .select(`
      id, nombre, descripcion, precio, stock, aroma, tamanio,
      imagen_url, imagen_hogar_url, destacado, activo,
      categorias ( nombre )
    `)
    .eq('activo', true)
    .order('id')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const productos = data.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    precio: p.precio,
    stock: p.stock,
    aroma: p.aroma,
    peso: p.tamanio,
    categoria: p.categorias?.nombre ?? '',
    imagen: p.imagen_url,
    imagenHogar: p.imagen_hogar_url,
    destacado: p.destacado,
  }))

  // Respuesta con headers que prohíben CUALQUIER tipo de caché
  return NextResponse.json(productos, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
