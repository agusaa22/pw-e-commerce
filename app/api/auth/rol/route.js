/*
  API ROUTE: GET /api/auth/rol?user_id=XXXX
  QUÉ HACE: Devuelve el rol del usuario indicado por user_id (cliente | admin).
  POR QUÉ: La rúbrica del Desafío Semana 12 pide tener una API de rol.
           El front la puede llamar para chequear el rol de un usuario
           sin tener que leer perfiles directamente desde el cliente.
  USA: supabaseAdmin (service_role) para poder leer perfiles saltándose RLS.

  EJEMPLO de respuesta:
    { "user_id": "abc123", "rol": "admin", "nombre": "Agus", "email": "..." }
*/
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Falta el parámetro user_id' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('perfiles')
      .select('rol, nombre, email')
      .eq('id', userId)
      .single()

    if (error) {
      // Si no se encuentra el perfil, devolvemos "cliente" como default
      return NextResponse.json({
        user_id: userId,
        rol: 'cliente',
        encontrado: false,
      })
    }

    return NextResponse.json({
      user_id: userId,
      rol: data?.rol || 'cliente',
      nombre: data?.nombre || '',
      email: data?.email || '',
      encontrado: true,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (err) {
    console.error('Error en /api/auth/rol:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
