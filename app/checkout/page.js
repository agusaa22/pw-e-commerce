/*
  PÁGINA: Checkout
  QUÉ HACE: Muestra el formulario de datos personales, dirección de envío
           y pago simulado. Al enviar, muestra una pantalla de éxito.
  POR QUÉ: "use client" porque usa useState para el formulario y useCart
           para mostrar el resumen del pedido y vaciarlo al confirmar.
  QUÉ PASARÍA SI SE SACA: No habría forma de completar la compra.
*/
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from './checkout.module.css'

/* ── HELPER: formatea precio en ARS ────────────────────────────────────────── */
function formatPrecio(precio) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(precio)
}

export default function CheckoutPage() {
  const { items, totalPrecio, vaciarCarrito } = useCart()

  /*
    useState para controlar si la compra fue confirmada.
    Cuando confirmado es true, se muestra la pantalla de éxito.
  */
  const [confirmado, setConfirmado] = useState(false)
  const [cargando, setCargando]     = useState(false)

  /*
    Estado del formulario: un objeto con todos los campos.
    POR QUÉ un solo objeto: evita tener 8+ useState separados.
    Cada campo del formulario actualiza su propiedad correspondiente.
  */
  const [form, setForm] = useState({
    nombre:    '',
    apellido:  '',
    email:     '',
    telefono:  '',
    direccion: '',
    ciudad:    '',
    provincia: '',
    cp:        '',
    cardNum:   '',
    cardNombre:'',
    cardVenc:  '',
    cardCvv:   '',
  })

  /* Actualiza solo el campo que cambió sin pisar los demás */
  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  /* Simula el procesamiento del pago (no hay backend real aún) */
  function handleSubmit(e) {
    e.preventDefault()
    setCargando(true)
    /*
      setTimeout simula la demora de una API de pago real.
      En producción esto sería un fetch a MercadoPago o Stripe.
    */
    setTimeout(() => {
      setCargando(false)
      setConfirmado(true)
      vaciarCarrito()
    }, 1800)
  }

  /* ── PANTALLA DE ÉXITO ──────────────────────────────────────────────────── */
  if (confirmado) {
    return (
      <>
        <Header />
        <main className={styles.pagina}>
          <div className={`container ${styles.exitoWrapper}`}>
            <div className={styles.exitoCard}>
              <span className={styles.exitoIcon} aria-hidden="true">✦</span>
              <h1 className={styles.exitoTitulo}>¡Pedido confirmado!</h1>
              <p className={styles.exitoTexto}>
                Gracias por tu compra. Te enviaremos un correo con los detalles
                de tu pedido y el seguimiento del envío.
              </p>
              <Link href="/" className={styles.btnVolver}>
                Seguir comprando
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  /* ── CARRITO VACÍO ──────────────────────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className={styles.pagina}>
          <div className="container">
            <div className={styles.vacio}>
              <p>Tu carrito está vacío.</p>
              <Link href="/" className={styles.btnVolver}>
                Explorar productos
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  /* ── FORMULARIO DE CHECKOUT ─────────────────────────────────────────────── */
  return (
    <>
      <Header />
      <main className={styles.pagina}>
        <div className="container">

          <h1 className={styles.titulo}>Checkout</h1>

          <div className={styles.layout}>

            {/* ── FORMULARIO ──────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className={styles.form} noValidate>

              {/* ── DATOS PERSONALES ──────────────────────────────────────── */}
              <fieldset className={styles.seccion}>
                <legend className={styles.seccionTitulo}>
                  <span className={styles.seccionNum}>1</span>
                  Datos personales
                </legend>

                <div className={styles.fila2}>
                  <div className={styles.campo}>
                    <label htmlFor="nombre">Nombre</label>
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      required
                      placeholder="María"
                      value={form.nombre}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.campo}>
                    <label htmlFor="apellido">Apellido</label>
                    <input
                      id="apellido"
                      name="apellido"
                      type="text"
                      required
                      placeholder="García"
                      value={form.apellido}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className={styles.fila2}>
                  <div className={styles.campo}>
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="maria@ejemplo.com"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.campo}>
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      placeholder="+54 11 1234-5678"
                      value={form.telefono}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </fieldset>

              {/* ── DIRECCIÓN DE ENVÍO ────────────────────────────────────── */}
              <fieldset className={styles.seccion}>
                <legend className={styles.seccionTitulo}>
                  <span className={styles.seccionNum}>2</span>
                  Dirección de envío
                </legend>

                <div className={styles.campo}>
                  <label htmlFor="direccion">Dirección</label>
                  <input
                    id="direccion"
                    name="direccion"
                    type="text"
                    required
                    placeholder="Av. Corrientes 1234, Piso 3"
                    value={form.direccion}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.fila3}>
                  <div className={styles.campo}>
                    <label htmlFor="ciudad">Ciudad</label>
                    <input
                      id="ciudad"
                      name="ciudad"
                      type="text"
                      required
                      placeholder="Buenos Aires"
                      value={form.ciudad}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.campo}>
                    <label htmlFor="provincia">Provincia</label>
                    <input
                      id="provincia"
                      name="provincia"
                      type="text"
                      required
                      placeholder="CABA"
                      value={form.provincia}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.campo}>
                    <label htmlFor="cp">Código postal</label>
                    <input
                      id="cp"
                      name="cp"
                      type="text"
                      required
                      placeholder="1043"
                      value={form.cp}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </fieldset>

              {/* ── PAGO ─────────────────────────────────────────────────── */}
              <fieldset className={styles.seccion}>
                <legend className={styles.seccionTitulo}>
                  <span className={styles.seccionNum}>3</span>
                  Datos de pago
                </legend>

                <p className={styles.pagoNota}>
                  🔒 Pago seguro simulado — no se procesará ningún cobro real.
                </p>

                <div className={styles.campo}>
                  <label htmlFor="cardNum">Número de tarjeta</label>
                  <input
                    id="cardNum"
                    name="cardNum"
                    type="text"
                    required
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    value={form.cardNum}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.campo}>
                  <label htmlFor="cardNombre">Nombre en la tarjeta</label>
                  <input
                    id="cardNombre"
                    name="cardNombre"
                    type="text"
                    required
                    placeholder="MARÍA GARCÍA"
                    value={form.cardNombre}
                    onChange={handleChange}
                  />
                </div>

                <div className={styles.fila2}>
                  <div className={styles.campo}>
                    <label htmlFor="cardVenc">Vencimiento</label>
                    <input
                      id="cardVenc"
                      name="cardVenc"
                      type="text"
                      required
                      placeholder="MM/AA"
                      maxLength={5}
                      value={form.cardVenc}
                      onChange={handleChange}
                    />
                  </div>
                  <div className={styles.campo}>
                    <label htmlFor="cardCvv">CVV</label>
                    <input
                      id="cardCvv"
                      name="cardCvv"
                      type="text"
                      required
                      placeholder="123"
                      maxLength={4}
                      value={form.cardCvv}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </fieldset>

              {/* ── BOTÓN CONFIRMAR ───────────────────────────────────────── */}
              <button
                type="submit"
                className={styles.btnConfirmar}
                disabled={cargando}
                aria-live="polite"
              >
                {cargando ? 'Procesando...' : `Confirmar compra · ${formatPrecio(totalPrecio)}`}
              </button>

            </form>

            {/* ── RESUMEN DEL PEDIDO ───────────────────────────────────────── */}
            <aside className={styles.resumen} aria-label="Resumen del pedido">
              <h2 className={styles.resumenTitulo}>Tu pedido</h2>

              {/*
                .map() muestra cada producto del carrito con su cantidad y subtotal.
                key={item.id} identifica de forma única cada fila.
              */}
              <ul className={styles.resumenItems}>
                {items.map(item => (
                  <li key={item.id} className={styles.resumenItem}>
                    <div className={styles.resumenItemInfo}>
                      <img
                        src={item.imagen}
                        alt={item.nombre}
                        className={styles.resumenItemImg}
                      />
                      <div>
                        <p className={styles.resumenItemNombre}>{item.nombre}</p>
                        <p className={styles.resumenItemCant}>× {item.cantidad}</p>
                      </div>
                    </div>
                    <p className={styles.resumenItemPrecio}>
                      {formatPrecio(item.precio * item.cantidad)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className={styles.resumenLinea}>
                <span>Subtotal</span>
                <span>{formatPrecio(totalPrecio)}</span>
              </div>
              <div className={styles.resumenLinea}>
                <span>Envío</span>
                <span className={styles.envioGratis}>Gratis</span>
              </div>
              <div className={`${styles.resumenLinea} ${styles.resumenTotal}`}>
                <span>Total</span>
                <span>{formatPrecio(totalPrecio)}</span>
              </div>

              <Link href="/carrito" className={styles.btnEditarCarrito}>
                ← Editar carrito
              </Link>
            </aside>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
