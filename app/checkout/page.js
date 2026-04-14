/*
  PÁGINA: Checkout (/checkout)
  QUÉ HACE: Muestra el resumen del pedido y un formulario de pago.
           El usuario completa sus datos, confirma la compra,
           y el carrito se vacía.
  POR QUÉ: "use client" es OBLIGATORIO porque usa hooks:
           - useCart() (Context API) para leer los items y vaciar el carrito
           - useState para manejar el formulario y los errores
           - useRouter() para redirigir al home después de la compra
  QUÉ PASARÍA SI SE SACA: No habría forma de finalizar la compra.

  RUTA: En Next.js App Router, app/checkout/page.js
        define automáticamente la ruta /checkout.

  MÓDULO C — Este componente demuestra:
    - Eventos en JavaScript (onChange, onSubmit)
    - Validación de formularios con JavaScript
    - Context API (useCart para leer y vaciar el carrito)
    - Renderizado condicional (carrito vacío vs. formulario vs. éxito)
*/
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from './checkout.module.css'

/*
  HELPER: formatea un número como precio argentino.
  24900 → "$24.900"
  Intl.NumberFormat es una API nativa de JavaScript para formatear números
  según la convención de cada país. 'es-AR' = español de Argentina.
*/
function formatPrecio(precio) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(precio)
}

export default function CheckoutPage() {
  /*
    useRouter() de Next.js nos da acceso a la navegación programática.
    POR QUÉ: Después de confirmar la compra, redirigimos al home
    sin que el usuario tenga que hacer click en un link.
  */
  const router = useRouter()

  /*
    Destructuramos del CartContext lo que necesitamos:
    - items: array de productos en el carrito
    - totalPrecio: suma total calculada en el Context
    - vaciarCarrito: función que pone items en []
  */
  const { items, totalPrecio, vaciarCarrito } = useCart()

  /*
    Estado del formulario: un objeto con los 4 campos de pago.
    POR QUÉ un solo objeto: misma lógica que en ContactForm.
    Un handleChange genérico actualiza cualquier campo.
  */
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    direccion: '',
    tarjeta: '',
  })

  /*
    Estado de errores: objeto donde cada key es un campo
    y el valor es el mensaje de error.
  */
  const [errores, setErrores] = useState({})

  /*
    Estados del proceso de compra:
    - procesando: true mientras se "procesa" el pago
    - confirmado: true cuando la compra fue exitosa
  */
  const [procesando, setProcesando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)

  /*
    EVENTO: handleChange — igual que en ContactForm.
    Se ejecuta cada vez que el usuario escribe en un campo.
    [name]: value es "computed property name" de ES6.
  */
  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    // Limpia el error del campo cuando el usuario escribe
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }))
    }
  }

  /*
    VALIDACIÓN: revisa cada campo y devuelve un objeto con los errores.
    .trim() quita espacios al inicio y final.
  */
  function validar() {
    const nuevosErrores = {}

    if (!form.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio'
    }

    if (!form.email.trim()) {
      nuevosErrores.email = 'El email es obligatorio'
    } else if (!form.email.includes('@') || !form.email.includes('.')) {
      nuevosErrores.email = 'Ingresá un email válido'
    }

    if (!form.direccion.trim()) {
      nuevosErrores.direccion = 'La dirección es obligatoria'
    }

    if (!form.tarjeta.trim()) {
      nuevosErrores.tarjeta = 'El número de tarjeta es obligatorio'
    } else if (form.tarjeta.replace(/\s/g, '').length < 16) {
      nuevosErrores.tarjeta = 'Ingresá los 16 dígitos de la tarjeta'
    }

    return nuevosErrores
  }

  /*
    EVENTO: handleSubmit — se ejecuta al confirmar la compra.
    e.preventDefault() evita que el formulario recargue la página.
    Valida los campos, simula el procesamiento del pago,
    vacía el carrito y muestra la confirmación.
  */
  function handleSubmit(e) {
    e.preventDefault()

    // 1. Validar
    const nuevosErrores = validar()

    // 2. Si hay errores, mostrarlos y NO procesar
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      return
    }

    // 3. Simular procesamiento del pago
    setProcesando(true)

    /*
      setTimeout simula la demora de procesar un pago real.
      En producción sería un fetch POST a una API de pagos.
    */
    setTimeout(() => {
      setProcesando(false)
      setConfirmado(true)
      vaciarCarrito() // Limpia el carrito usando el Context
    }, 2000)
  }

  /* ── COMPRA CONFIRMADA ───────────────────────────────────────────────────── */
  /*
    Renderizado condicional: si la compra fue confirmada,
    mostramos un mensaje de éxito en lugar del formulario.
  */
  if (confirmado) {
    return (
      <>
        <Header />
        <main className={styles.pagina}>
          <div className="container">
            <div className={styles.exito} role="alert">
              <h1>¡Compra confirmada!</h1>
              <p>Gracias por tu compra. Te enviamos un email con los detalles del pedido.</p>
              <button
                className={styles.btnVolver}
                onClick={() => router.push('/')}
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  /* ── CARRITO VACÍO ───────────────────────────────────────────────────────── */
  /*
    Si el usuario llega a /checkout sin productos en el carrito,
    mostramos un mensaje y un link para volver al catálogo.
  */
  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className={styles.pagina}>
          <div className="container">
            <h1 className={styles.titulo}>Checkout</h1>
            <div className={styles.vacio}>
              <p>Tu carrito está vacío. Agregá productos antes de comprar.</p>
              <Link href="/" className={styles.btnVolver}>
                Ver productos
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  /* ── FORMULARIO DE CHECKOUT ──────────────────────────────────────────────── */
  return (
    <>
      <Header />
      <main className={styles.pagina}>
        <div className="container">

          <h1 className={styles.titulo}>Checkout</h1>

          <div className={styles.layout}>

            {/* ── FORMULARIO DE PAGO ──────────────────────────────────── */}
            {/*
              <form> con onSubmit: al hacer click en "Confirmar compra"
              o presionar Enter, se ejecuta handleSubmit.
              noValidate: desactiva la validación nativa del navegador
              para usar nuestra propia validación con JavaScript.
            */}
            <form onSubmit={handleSubmit} className={styles.formulario} noValidate>
              <h2 className={styles.seccionTitulo}>Datos de envío</h2>

              {/* ── CAMPO NOMBRE ─────────────────────────────────────── */}
              <div className={styles.campo}>
                <label htmlFor="ch-nombre">Nombre completo</label>
                <input
                  id="ch-nombre"
                  name="nombre"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={form.nombre}
                  onChange={handleChange}
                  aria-invalid={errores.nombre ? 'true' : 'false'}
                  aria-describedby={errores.nombre ? 'error-ch-nombre' : undefined}
                />
                {errores.nombre && (
                  <span id="error-ch-nombre" className={styles.error} aria-live="polite">
                    {errores.nombre}
                  </span>
                )}
              </div>

              {/* ── CAMPO EMAIL ──────────────────────────────────────── */}
              <div className={styles.campo}>
                <label htmlFor="ch-email">Email</label>
                <input
                  id="ch-email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={handleChange}
                  aria-invalid={errores.email ? 'true' : 'false'}
                  aria-describedby={errores.email ? 'error-ch-email' : undefined}
                />
                {errores.email && (
                  <span id="error-ch-email" className={styles.error} aria-live="polite">
                    {errores.email}
                  </span>
                )}
              </div>

              {/* ── CAMPO DIRECCIÓN ──────────────────────────────────── */}
              <div className={styles.campo}>
                <label htmlFor="ch-direccion">Dirección de envío</label>
                <input
                  id="ch-direccion"
                  name="direccion"
                  type="text"
                  placeholder="Calle, número, piso"
                  value={form.direccion}
                  onChange={handleChange}
                  aria-invalid={errores.direccion ? 'true' : 'false'}
                  aria-describedby={errores.direccion ? 'error-ch-direccion' : undefined}
                />
                {errores.direccion && (
                  <span id="error-ch-direccion" className={styles.error} aria-live="polite">
                    {errores.direccion}
                  </span>
                )}
              </div>

              {/* ── SEPARADOR DE SECCIÓN ─────────────────────────────── */}
              <h2 className={styles.seccionTitulo}>Datos de pago</h2>

              {/* ── CAMPO TARJETA ────────────────────────────────────── */}
              <div className={styles.campo}>
                <label htmlFor="ch-tarjeta">Número de tarjeta</label>
                <input
                  id="ch-tarjeta"
                  name="tarjeta"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={form.tarjeta}
                  onChange={handleChange}
                  maxLength={19}
                  aria-invalid={errores.tarjeta ? 'true' : 'false'}
                  aria-describedby={errores.tarjeta ? 'error-ch-tarjeta' : undefined}
                />
                {errores.tarjeta && (
                  <span id="error-ch-tarjeta" className={styles.error} aria-live="polite">
                    {errores.tarjeta}
                  </span>
                )}
              </div>

              {/* ── BOTÓN CONFIRMAR ──────────────────────────────────── */}
              {/*
                disabled={procesando} evita clicks duplicados mientras
                se procesa el pago. El texto cambia dinámicamente.
              */}
              <button
                type="submit"
                className={styles.btnConfirmar}
                disabled={procesando}
              >
                {procesando ? 'Procesando pago...' : 'Confirmar compra'}
              </button>
            </form>

            {/* ── RESUMEN DEL PEDIDO ──────────────────────────────────── */}
            {/*
              <aside> es semántico: indica contenido complementario.
              Muestra los productos y el total antes de confirmar.
            */}
            <aside className={styles.resumen} aria-label="Resumen del pedido">
              <h2 className={styles.resumenTitulo}>Tu pedido</h2>

              {/*
                .map() recorre los items del carrito.
                key={item.id} identifica cada elemento para React.
              */}
              {items.map(item => (
                <div key={item.id} className={styles.resumenItem}>
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    className={styles.resumenImagen}
                  />
                  <div className={styles.resumenItemInfo}>
                    <span className={styles.resumenItemNombre}>{item.nombre}</span>
                    <span className={styles.resumenItemCant}>Cant: {item.cantidad}</span>
                  </div>
                  <span className={styles.resumenItemPrecio}>
                    {formatPrecio(item.precio * item.cantidad)}
                  </span>
                </div>
              ))}

              <div className={styles.resumenTotal}>
                <span>Total</span>
                <span>{formatPrecio(totalPrecio)}</span>
              </div>

              <Link href="/carrito" className={styles.linkCarrito}>
                ← Volver al carrito
              </Link>
            </aside>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
