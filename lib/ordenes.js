/*
  HELPER: crearOrden
  QUÉ HACE: Crea una orden completa llamando al STORED PROCEDURE
           crear_orden_completa de PostgreSQL, que se encarga de:
             1. Validar stock de TODOS los productos antes de hacer nada.
             2. Crear la cabecera de la orden con el estado correcto según
                el método de pago (tarjeta/efectivo → pagada, MP → pendiente).
             3. Crear las líneas de la orden (orden_items).
             4. Si CUALQUIER paso falla, hacer ROLLBACK automático
                (las funciones plpgsql son atómicas).
  POR QUÉ: La rúbrica del Desafío Semana 12 pide transacciones con rollback
           automático. Hacerlo en la base es más seguro que orquestar dos
           INSERT desde el front (sin atomicidad).
  DEVUELVE: { orden } con id y estado si salió bien, o { error } si falló.
*/
import { supabase } from '@/lib/supabaseClient'

export async function crearOrden({ usuario, items, total, datosEnvio }) {
  // Armamos el array de items como espera el stored procedure (jsonb)
  const itemsParaSP = items.map((i) => ({
    id: i.id,
    nombre: i.nombre,
    precio: i.precio,
    cantidad: i.cantidad,
  }))

  // Llamamos al stored procedure vía RPC
  const { data, error } = await supabase.rpc('crear_orden_completa', {
    p_usuario_id: usuario.id,
    p_items: itemsParaSP,
    p_total: total,
    p_nombre_envio: datosEnvio.nombre,
    p_email: datosEnvio.email,
    p_direccion_envio: datosEnvio.direccion,
    p_metodo_pago: datosEnvio.metodoPago,
  })

  // Error de red o de RPC (la función no se pudo ejecutar)
  if (error) {
    return { error: { message: error.message || 'No se pudo crear la orden' } }
  }

  // El stored procedure capturó una excepción internamente (ej: stock insuficiente)
  // y devolvió un JSON con { ok: false, error: "..." }
  if (!data || data.ok === false) {
    return { error: { message: data?.error || 'No se pudo crear la orden' } }
  }

  // OK: devolvemos la orden creada
  return {
    orden: {
      id: data.orden_id,
      estado: data.estado,
    },
  }
}
