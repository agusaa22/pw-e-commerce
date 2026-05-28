/*
  PÁGINA: /login — formulario para iniciar sesión.
*/
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from './auth.module.css'

export default function LoginPage() {
  const router = useRouter()
  const { iniciarSesion } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    const { error } = await iniciarSesion(email, password)
    setCargando(false)

    if (error) {
      setError('Email o contraseña incorrectos.')
      return
    }
    router.push('/')
  }

  return (
    <>
      <Header />
      <main className={styles.pagina}>
        <div className={styles.tarjeta}>
          <h1 className={styles.titulo}>Iniciar sesión</h1>

          <form onSubmit={handleSubmit} className={styles.form}>
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
                  placeholder="Tu contraseña"
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
              {cargando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className={styles.pie}>
            ¿No tenés cuenta? <Link href="/registro">Registrate</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
