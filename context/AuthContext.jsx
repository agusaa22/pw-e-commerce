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
    // 1) Al cargar la app, vemos si ya hay una sesión guardada
    supabase.auth.getSession().then(({ data }) => {
      setUsuario(data.session?.user ?? null)
      setCargando(false)
    })

    // 2) Escuchamos cambios (cuando alguien inicia o cierra sesión)
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUsuario(session?.user ?? null)
    })

    // Limpiamos el "escuchador" cuando el componente se desmonta
    return () => sub.subscription.unsubscribe()
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
