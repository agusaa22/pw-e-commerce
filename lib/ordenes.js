/*
  HELPER: crearOrden
  QUÉ HACE: Guarda en Supabase la orden (cabecera) y sus items (detalle)
           cuando el usuario confirma la compra.
  POR QUÉ guarda snapshot del nombre y precio en orden_items:
    Así, si en el futuro cambia el precio del producto en el catálogo,
    las órdenes viejas conservan el precio que el cliente pagó.
  Devuelve { orden } si salió bien, o { error } si algo falló.
*/
import { supabase } from '@/lib/supabaseClient'

export async function crearOrden({ usuario, items, total, datosEnvio }) {
  // El estado inicial depende del método de pago:
  //  - tarjeta / efectivo → "pagada" (la compra queda confirmada en el momento)
  //  - mercadopago        → "pendiente" (hasta que MP confirme vía webhook o redirect)
  const estadoInicial =
    datosEnvio.metodoPago === 'mercadopago' ? 'pendiente' : 'pagada'

  // 1) Creamos la cabecera de la orden y pedimos que nos devuelva la fila creada
  const { data: orden, error } = await supabase
    .from('ordenes')
    .insert({
      usuario_id: usuario.id,
      total,
      estado: estadoInicial,
      nombre_envio: datosEnvio.nombre,
      email: datosEnvio.email,
      direccion_envio: datosEnvio.direccion,
      metodo_pago: datosEnvio.metodoPago,
    })
    .select()
    .single()

  if (error) return { error }

  // 2) Creamos una línea por cada producto del carrito (snapshot)
  const lineas = items.map((i) => ({
    orden_id: orden.id,
    producto_id: i.id,
    nombre_producto: i.nombre,
    precio_unitario: i.precio,
    cantidad: i.cantidad,
  }))

  const { error: errorItems } = await supabase.from('orden_items').insert(lineas)
  if (errorItems) return { error: errorItems }

  return { orden }
}
