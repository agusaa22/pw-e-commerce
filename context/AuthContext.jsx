/*
  CONTEXTO: AuthContext
  QUÉ HACE: Sabe en TODA la app quién está logueado y ofrece las funciones
           para registrarse, iniciar y cerrar sesión.
  POR QUÉ: Igual que el carrito, lo ponemos en un Context para que cualquier
           componente (Header, checkout, admin) sepa si hay un usuario y quién es,
           sin pasar props por todos lados.
  Expone:
    - usuario  → datos de auth (o null si nadie inició sesión)
    - perfil   → fila de la tabla perfiles (nombre, rol)
    - esAdmin  → true si el rol del perfil es 'admin'
    - registrar / iniciarSesion / cerrarSesion → funciones
*/
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil]   = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let montado = true

    // 1) Al cargar la app, vemos si ya hay una sesión guardada en localStorage.
    //    Esta es la fuente de verdad inicial — no la pisamos con un null transitorio
    //    de onAuthStateChange.
    supabase.auth.getSession().then(({ data }) => {
      if (!montado) return
      setUsuario(data.session?.user ?? null)
      setCargando(false)
    })

    // 2) Escuchamos cambios FUTUROS (login, logout, refresh del token).
    //    Ignoramos el INITIAL_SESSION porque ya lo cubrió getSession arriba.
    //    Si lo dejáramos pasar, podría disparar un setUsuario(null) transitorio
    //    cuando todavía no se hidrató la sesión, y eso bootea al usuario a /login.
    const { data: sub } = supabase.auth.onAuthStateChange((evento, session) => {
      if (!montado) return
      if (evento === 'INITIAL_SESSION') return
      if (evento === 'TOKEN_REFRESHED' && !session) return // safety: no nulleamos por refresh
      setUsuario(session?.user ?? null)
    })

    // Limpiamos el "escuchador" cuando el componente se desmonta
    return () => {
      montado = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Cuando hay usuario, traemos su perfil (nombre y rol)
  useEffect(() => {
    async function cargarPerfil() {
      if (!usuario) { setPerfil(null); return }
      const { data } = await supabase
        .from('perfiles').select('*').eq('id', usuario.id).single()
      setPerfil(data)
    }
    cargarPerfil()
  }, [usuario])

  async function registrar(email, password, nombre) {
    // El "nombre" viaja en options.data y lo usa el trigger para crear el perfil
    return await supabase.auth.signUp({
      email, password, options: { data: { nombre } },
    })
  }

  async function iniciarSesion(email, password) {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  // Actualiza los datos del perfil (nombre, teléfono, dirección) en la base
  // y refresca el estado local para que el header y demás se actualicen al toque.
  async function actualizarPerfil(datos) {
    if (!usuario) return { error: new Error('No hay sesión activa.') }
    const { data, error } = await supabase
      .from('perfiles')
      .update(datos)
      .eq('id', usuario.id)
      .select()
      .single()
    if (data) setPerfil(data)
    return { data, error }
  }

  // Cambia la contraseña del usuario logueado
  async function cambiarPassword(nuevaPassword) {
    return await supabase.auth.updateUser({ password: nuevaPassword })
  }

  const esAdmin = perfil?.rol === 'admin'

  return (
    <AuthContext.Provider value={{
      usuario, perfil, esAdmin, cargando,
      registrar, iniciarSesion, cerrarSesion,
      actualizarPerfil, cambiarPassword,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider')
  return context
}
