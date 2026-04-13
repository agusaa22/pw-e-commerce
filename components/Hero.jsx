'use client'

import { useEffect, useRef, useCallback } from 'react'
import styles from './Hero.module.css'

export default function Hero() {
  const heroRef = useRef(null)
  const flamesRef = useRef([])
  const animFrameRef = useRef(null)

  /* ── PARALLAX al scrollear ──────────────────────────────────────────────── */
  useEffect(() => {
    function handleScroll() {
      if (!heroRef.current) return
      const scrollY = window.scrollY
      const speed = 0.4
      heroRef.current.style.backgroundPositionY = `calc(top + ${scrollY * speed}px)`
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /* ── LLAMAS que siguen al cursor ────────────────────────────────────────── */
  const createFlame = useCallback((x, y, container) => {
    const flame = document.createElement('div')
    flame.className = styles.flame

    // Variación aleatoria para que cada llama sea única
    const offsetX = (Math.random() - 0.5) * 24
    const offsetY = (Math.random() - 0.5) * 16
    const size = 16 + Math.random() * 20
    const duration = 600 + Math.random() * 500

    flame.style.left = `${x + offsetX}px`
    flame.style.top = `${y + offsetY}px`
    flame.style.width = `${size}px`
    flame.style.height = `${size * 1.5}px`
    flame.style.animationDuration = `${duration}ms`

    container.appendChild(flame)

    setTimeout(() => {
      flame.remove()
    }, duration)
  }, [])

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    let lastTime = 0
    function handleMouseMove(e) {
      const now = Date.now()
      if (now - lastTime < 40) return // limita a ~25 llamas/seg
      lastTime = now

      const rect = hero.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Crear 2-3 llamas por movimiento
      const count = 2 + Math.floor(Math.random() * 2)
      for (let i = 0; i < count; i++) {
        createFlame(x, y, hero)
      }
    }

    hero.addEventListener('mousemove', handleMouseMove)
    return () => hero.removeEventListener('mousemove', handleMouseMove)
  }, [createFlame])

  return (
    <section className={styles.hero} ref={heroRef} aria-label="Presentación de Aurevia">

      <div className={styles.overlay} aria-hidden="true" />

      <div className={`${styles.heroContent} container`}>

        <p className={styles.kicker}>✦ Colección nueva</p>

        <h2 className={styles.title}>
          Velas de luz,<br />aroma y ritual
        </h2>

        <p className={styles.description}>
          Un universo de velas delicadas, diseño sofisticado y calidez contemporánea.
          Cada pieza pensada para transformar tu ambiente.
        </p>

        <div className={styles.buttons}>
          <a href="#destacados" className={styles.btnPrimary}>
            Compra ahora
          </a>
          <a href="#categorias" className={styles.btnSecondary}>
            Descubrí más
          </a>
        </div>

      </div>
    </section>
  )
}
