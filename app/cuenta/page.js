/*
  PÁGINA: /cuenta — perfil del usuario logueado.
  QUÉ HACE: Muestra los datos del usuario (email, nombre, teléfono, dirección)
           y permite editarlos. También permite cambiar la contraseña.
  PROTECCIÓN: Si no hay sesión, redirige a /login.
*/
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from './cuenta.module.css'

export default function CuentaPage() {
  const router = useRouter()
  const { usuario, perfil, cargando, actualizarPerfil, cambiarPassword } = useAuth()

  // Form de datos personales
  const [nombre, setNombre]       = useState('')
  const [telefono, setTelefono]   = useState('')
  const [direccion, setDireccion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [okPerfil, setOkPerfil]   = useState('')
  const [errorPerfil, setErrorPerfil] = useState('')

  // Form de cambio de contraseña
  const [nuevaPassword, setNuevaPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [guardandoPwd, setGuardandoPwd]       = useState(false)
  const [okPwd, setOkPwd]                     = useState('')
  const [errorPwd, setErrorPwd]               = useState('')

  // Si no hay usuario, redirigimos a /login
  useEffect(() => {
    if (!cargando && !usuario) {
      router.push('/login')
    }
  }, [cargando, usuario, router])

  // Cuando llegan los datos del perfil, los cargamos en el formulario
  useEffect(() => {
    if (perfil) {
      setNombre(perfil.nombre ?? '')
      setTelefono(perfil.telefono ?? '')
      setDireccion(perfil.direccion ?? '')
    }
  }, [perfil])

  async function guardarDatos(e) {
    e.preventDefault()
    setOkPerfil(''); setErrorPerfil('')
    setGuardando(true)
    const { error } = await actualizarPerfil({ nombre, telefono, direccion })
    setGuardando(false)
    if (error) {
      console.error('Error al guardar perfil:', error)
      // Mostramos el mensaje REAL de Supabase así sabemos qué falla.
      setErrorPerfil('No se pudo guardar: ' + (error.message || JSON.stringify(error)))
      return
    }
    setOkPerfil('Datos guardados correctamente. ✓')
    setTimeout(() => setOkPerfil(''), 3000)
  }

  async function guardarPassword(e) {
    e.preventDefault()
    setOkPwd(''); setErrorPwd('')

    if (nuevaPassword.length < 6) {
      setErrorPwd('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (nuevaPassword !== confirmPassword) {
      setErrorPwd('Las contraseñas no coinciden.')
      return
    }

    setGuardandoPwd(true)
    const { error } = await cambiarPassword(nuevaPassword)
    setGuardandoPwd(false)
    if (error) {
      setErrorPwd(error.message)
      return
    }
    setOkPwd('Contraseña actualizada correctamente. ✓')
    setNuevaPassword(''); setConfirmPassword('')
    setTimeout(() => setOkPwd(''), 3000)
  }

  if (cargando || !usuario) {
    return (
      <>
        <Header />
        <main className={styles.pagina}>
          <p style={{ textAlign: 'center', padding: 40 }}>Cargando...</p>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className={styles.pagina}>
        <div className={styles.contenedor}>

          <h1 className={styles.titulo}>Mi cuenta</h1>
          <p className={styles.subtitulo}>
            Acá podés ver y editar tus datos personales y cambiar tu contraseña.
          </p>

          {/* ── DATOS PERSONALES ───────────────────────────────────────── */}
          <section className={styles.tarjeta}>
            <h2 className={styles.seccionTitulo}>Datos personales</h2>

            <form onSubmit={guardarDatos} className={styles.grilla}>
              <label className={styles.campo}>
                <span>Email</span>
                <input
                  type="email"
                  value={usuario.email}
                  readOnly
                  className={styles.inputReadonly}
                />
                <small className={styles.hint}>El email no se puede modificar.</small>
              </label>

              <label className={styles.campo}>
                <span>Nombre</span>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                />
              </label>

              <label className={styles.campo}>
                <span>Teléfono</span>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+54 11 1234 5678"
                />
              </label>

              <label className={`${styles.campo} ${styles.campoAncho}`}>
                <span>Dirección de envío</span>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle, número, piso, localidad"
                />
              </label>

              <div className={styles.acciones}>
                {errorPerfil && <p className={styles.error}>{errorPerfil}</p>}
                {okPerfil && <p className={styles.ok}>{okPerfil}</p>}
                <button type="submit" disabled={guardando} className={styles.boton}>
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </section>

          {/* ── CAMBIAR CONTRASEÑA ─────────────────────────────────────── */}
          <section className={styles.tarjeta}>
            <h2 className={styles.seccionTitulo}>Cambiar contraseña</h2>

            <form onSubmit={guardarPassword} className={styles.grilla}>
              <label className={styles.campo}>
                <span>Nueva contraseña</span>
                <div className={styles.passwordWrap}>
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    className={styles.passwordInput}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(v => !v)}
                    className={styles.togglePassword}
                  >
                    {mostrarPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </label>

              <label className={styles.campo}>
                <span>Confirmar contraseña</span>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repetí la contraseña"
                  minLength={6}
                />
              </label>

              <div className={styles.acciones}>
                {errorPwd && <p className={styles.error}>{errorPwd}</p>}
                {okPwd && <p className={styles.ok}>{okPwd}</p>}
                <button type="submit" disabled={guardandoPwd} className={styles.boton}>
                  {guardandoPwd ? 'Cambiando...' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
