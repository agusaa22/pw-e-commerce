/*
  API ROUTE: POST /api/checkout
  QUÉ HACE: Crea una "preferencia de pago" en Mercado Pago (sandbox) para
           la orden que el usuario está cerrando, y devuelve la URL a la
           que hay que redirigirlo.
  FLUJO:
    1. El front llama a esta ruta con { ordenId, items, total }
    2. Esta ruta arma el body de MP y le pega a su API.
    3. MP devuelve la URL del checkout (init_point).
    4. El front redirige al usuario a esa URL.
    5. Cuando el pago se confirma, MP llama al webhook que actualiza la orden.
*/
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const { ordenId, items } = await request.json()

    if (!ordenId || !items?.length) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    // URL base de la app (para back_urls y webhook)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const esHttps = appUrl.startsWith('https://')

    // Armamos la preferencia con lo mínimo común
    const preferencia = {
      items: items.map((i) => ({
        title: i.nombre,
        quantity: i.cantidad,
        unit_price: i.precio,
        currency_id: 'ARS',
      })),
      external_reference: String(ordenId),
    }

    if (esHttps) {
      // En producción (Vercel, HTTPS público): integración completa con MP
      preferencia.back_urls = {
        success: `${appUrl}/checkout/exito?orden=${ordenId}`,
        failure: `${appUrl}/checkout?status=failure`,
        pending: `${appUrl}/checkout/exito?orden=${ordenId}&status=pending`,
      }
      preferencia.auto_return = 'approved'
      preferencia.notification_url = `${appUrl}/api/webhooks/mercadopago`
    }
    // En localhost no mandamos back_urls ni auto_return ni notification_url:
    // MP los rechaza con http://localhost. Probás el pago de punta a punta
    // en la web de MP y al terminar te quedás ahí (no hay redirect automático).

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferencia),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Error de Mercado Pago:', data)
      return NextResponse.json({ error: data.message || 'Error al crear la preferencia' }, { status: 500 })
    }

    // init_point para producción, sandbox_init_point para sandbox.
    // Con un Access Token de TEST, MP devuelve un init_point de sandbox.
    return NextResponse.json({
      url: data.init_point || data.sandbox_init_point,
      preferenceId: data.id,
    })
  } catch (err) {
    console.error('Error en /api/checkout:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
