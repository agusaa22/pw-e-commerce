/*
  API ROUTE: /api/productos
  QUÉ HACE: Devuelve los productos ACTIVOS leyéndolos de Supabase.
  POR QUÉ mapeamos los nombres: en la base las columnas se llaman
           imagen_url, tamanio, etc. Pero tus componentes usan
           imagen, peso, categoria. Traducimos los nombres acá
           para no tener que tocar ProductCard.

  El catálogo está controlado 100% desde el panel admin: lo que veas
  acá es lo que tenés con activo=true en la tabla productos. Para
  ocultar algo, desde /admin tocá "Desactivar". Para mostrarlo de
  vuelta, "Activar".
*/
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

// Esta línea le dice a Next.js: "nunca caches esta API, traé datos frescos siempre"
export const dynamic = 'force-dynamic'

export async function GET() {
  // Traemos los productos activos + el nombre de su categoría (join)
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

  // Traducimos los nombres de columnas a los que usan tus componentes
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

  return NextResponse.json(productos)
}
