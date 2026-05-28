/*
  PÁGINA: /registro — formulario para crear una cuenta nueva.
*/
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from '../login/auth.module.css'

export default function RegistroPage() {
  const router = useRouter()
  const { registrar } = useAuth()

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [exito, setExito] = useState(false)   // muestra la pantalla de éxito

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setCargando(true)
    const { error } = await registrar(email, password, nombre)
    setCargando(false)

    if (error) {
      setError(error.message)
      return
    }

    // Registrado con éxito: mostramos el mensaje y redirigimos en 1,8 s
    setExito(true)
    setTimeout(() => router.push('/'), 1800)
  }

  return (
    <>
      <Header />
      <main className={styles.pagina}>
        <div className={styles.tarjeta}>

          {/* ── PANTALLA DE ÉXITO ──────────────────────────────────────── */}
          {exito ? (
            <div className={styles.exito} role="status" aria-live="polite">
              <div className={styles.checkCirculo}>✓</div>
              <h1 className={styles.tituloExito}>¡Cuenta creada!</h1>
              <p className={styles.subExito}>
                Hola {nombre || 'cuenta'}, te estamos llevando al inicio…
              </p>
            </div>
          ) : (
          <>
          <h1 className={styles.titulo}>Crear cuenta</h1>

          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.campo}>
              <span>Nombre</span>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Tu nombre"
              />
            </label>

            <label className={styles.campo}>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
              />
            </label>

            <label className={styles.campo}>
              <span>Contraseña</span>
              <div className={styles.passwordWrap}>
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  className={styles.passwordInput}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setMostrarPassword(v => !v)}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" disabled={cargando} className={styles.boton}>
              {cargando ? 'Creando cuenta...' : 'Registrarme'}
            </button>
          </form>

          <p className={styles.pie}>
            ¿Ya tenés cuenta? <Link href="/login">Iniciá sesión</Link>
          </p>
          </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
