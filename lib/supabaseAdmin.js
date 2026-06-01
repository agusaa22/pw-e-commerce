/*
  CLIENTE ADMIN DE SUPABASE — SOLO PARA EL SERVIDOR
  QUÉ HACE: Crea un cliente con la clave service_role, que omite RLS.
  POR QUÉ: El webhook de Mercado Pago corre del lado del servidor sin sesión
           de usuario. Sin una clave admin no podría actualizar la orden
           (RLS bloquearía la operación).
  ⚠️ NUNCA importes este archivo desde un componente "use client" ni desde
     el navegador. Solo desde route handlers (app/api/*).
*/
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)
