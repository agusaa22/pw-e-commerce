/*
  API ROUTE: POST /api/checkout/confirmar
  QUÉ HACE: Después de que MP redirige al usuario a /checkout/exito,
           esta ruta:
             1. Actualiza la orden en Supabase con el estado real de MP
                (pagada / cancelada / pendiente) y guarda el mp_payment_id.
             2. Borra los items del carrito del usuario (cierra el ciclo).
  POR QUÉ: Es un fallback rápido del webhook. El webhook sigue siendo la
           fuente de verdad cuando MP llama, pero esta ruta se ejecuta
           apenas el usuario vuelve a la web, sin esperar a MP.
  Es idempotente: si la orden ya está en 'pagada', no rompe nada.
*/
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { ordenId, paymentId, status } = await request.json()

    if (!ordenId) {
      return NextResponse.json({ error: 'Falta ordenId' }, { status: 400 })
    }

    // Mapeamos el estado que devuelve MP al estado de nuestra base
    let estado = 'pendiente'
    if (status === 'approved') estado = 'pagada'
    else if (status === 'rejected' || status === 'cancelled') estado = 'cancelada'
    else if (status === 'in_process' || status === 'pending') estado = 'pendiente'

    const update = { estado }
    if (paymentId) update.mp_payment_id = String(paymentId)

    // Actualizamos la orden y pedimos que nos devuelva el usuario_id
    const { data: orden, error } = await supabaseAdmin
      .from('ordenes')
      .update(update)
      .eq('id', Number(ordenId))
      .select('usuario_id')
      .single()

    if (error) {
      console.error('Error actualizando orden:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Si el pago salió bien, vaciamos el carrito server-side
    if (estado === 'pagada' && orden?.usuario_id) {
      await supabaseAdmin
        .from('carrito_items')
        .delete()
        .eq('usuario_id', orden.usuario_id)
    }

    return NextResponse.json({ ok: true, estado })
  } catch (err) {
    console.error('Error en /api/checkout/confirmar:', err)
    return NextResponse.json({ error: 'error interno' }, { status: 500 })
  }
}
