/*
  API ROUTE: POST /api/webhooks/mercadopago
  QUÉ HACE: Recibe la notificación de Mercado Pago cuando cambia el estado
           de un pago, consulta el detalle del pago a la API de MP, y
           actualiza el estado de la orden en Supabase (referencia_pago,
           pagado_en, estado del ENUM estado_orden).
  POR QUÉ: Permite que la orden quede marcada como "pagada" automáticamente
           cuando el cliente termina de pagar, sin que tengamos que confiar
           en el navegador del cliente.
*/
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url)
    const tipoQS = searchParams.get('type') || searchParams.get('topic')
    const idQS   = searchParams.get('data.id') || searchParams.get('id')

    let tipo = tipoQS
    let paymentId = idQS

    try {
      const body = await request.json()
      tipo      = tipo || body.type || body.action?.split('.')[0]
      paymentId = paymentId || body.data?.id || body.resource
    } catch {
      // El body puede venir vacío en algunos pings de prueba
    }

    if (tipo !== 'payment' || !paymentId) {
      return NextResponse.json({ recibido: true })
    }

    // Consultamos el pago a la API de MP
    const resPago = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    })

    if (!resPago.ok) {
      console.error('No se pudo consultar el pago en MP:', paymentId)
      return NextResponse.json({ error: 'pago no encontrado' }, { status: 200 })
    }

    const pago = await resPago.json()
    const ordenId = pago.external_reference
    const estadoMp = pago.status

    if (!ordenId) {
      return NextResponse.json({ recibido: true })
    }

    // Mapeamos al ENUM estado_orden
    let estado = 'pendiente'
    if (estadoMp === 'approved') estado = 'pagada'
    else if (estadoMp === 'rejected') estado = 'cancelada'
    else if (estadoMp === 'in_process' || estadoMp === 'pending') estado = 'pendiente'

    const update = {
      estado,
      referencia_pago: String(paymentId),
    }
    if (estado === 'pagada') {
      update.pagado_en = new Date().toISOString()
    }

    const { error } = await supabaseAdmin
      .from('ordenes')
      .update(update)
      .eq('id', Number(ordenId))

    if (error) console.error('Error al actualizar orden:', error)

    return NextResponse.json({ recibido: true })
  } catch (err) {
    console.error('Error en webhook MP:', err)
    return NextResponse.json({ error: 'error interno' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
