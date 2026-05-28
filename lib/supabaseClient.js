/*
  CLIENTE DE SUPABASE
  QUÉ HACE: Crea UNA conexión a Supabase que reutilizamos en toda la app.
  Las claves se leen desde .env.local (variables de entorno).
*/
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)