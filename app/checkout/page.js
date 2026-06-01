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

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import { crearOrden } from '@/lib/ordenes'
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

  // Necesitamos saber quién está logueado para asociar la orden a su usuario
  const { usuario, perfil, cargando: cargandoAuth } = useAuth()

  /*
    Destructuramos del CartContext lo que necesitamos:
    - items: array de productos en el carrito
    - totalPrecio: suma total calculada en el Context
    - vaciarCarrito: función que pone items en []
  */
  const { items, totalPrecio, vaciarCarrito } = useCart()

  // Protección: si no hay sesión, lo mandamos a login para que se autentique
  useEffect(() => {
    if (!cargandoAuth && !usuario) {
      router.push('/login')
    }
  }, [cargandoAuth, usuario, router])

  // Autocompletar el formulario con los datos del perfil (los que guardó en /cuenta)
  useEffect(() => {
    if (!perfil) return
    setForm((prev) => ({
      ...prev,
      nombre: prev.nombre || perfil.nombre || '',
      email: prev.email || usuario?.email || '',
      direccion: prev.direccion || perfil.direccion || '',
    }))
  }, [perfil, usuario])

  /*
    Estado del formulario: un objeto con los 4 campos de pago.
    POR QUÉ un solo objeto: misma lógica que en ContactForm.
    Un handleChange genérico actualiza cualquier campo.
  */
  /*
    metodoPago: guarda qué método de pago eligió el usuario.
    Arranca vacío ('') y se actualiza cuando el usuario selecciona una opción.
    POR QUÉ un estado separado del form: el método de pago no es un campo
    de texto — es una selección entre opciones. Separarlo hace más claro
    el código y la validación.
  */
  const [metodoPago, setMetodoPago] = useState('')

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    direccion: '',
    tarjeta: '',
    titular: '',
    vencimiento: '',
    cvv: '',
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
    EVENTO: handleChange — para campos comunes (texto / email).
    Para los campos de la tarjeta usamos handlers específicos abajo que
    formatean el contenido a medida que el usuario escribe.
  */
  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: '' }))
  }

  // Formatea el número de tarjeta como "1234 5678 9012 3456" mientras escribís
  function handleTarjeta(e) {
    let solo = e.target.value.replace(/\D/g, '').slice(0, 16)
    let conEspacios = solo.replace(/(\d{4})(?=\d)/g, '$1 ')
    setForm(prev => ({ ...prev, tarjeta: conEspacios }))
    if (errores.tarjeta) setErrores(prev => ({ ...prev, tarjeta: '' }))
  }

  // Formatea el vencimiento como "MM/YY"
  function handleVencimiento(e) {
    let solo = e.target.value.replace(/\D/g, '').slice(0, 4)
    let formato = solo.length > 2 ? solo.slice(0, 2) + '/' + solo.slice(2) : solo
    setForm(prev => ({ ...prev, vencimiento: formato }))
    if (errores.vencimiento) setErrores(prev => ({ ...prev, vencimiento: '' }))
  }

  // CVV: 3 dígitos
  function handleCVV(e) {
    let solo = e.target.value.replace(/\D/g, '').slice(0, 4)
    setForm(prev => ({ ...prev, cvv: solo }))
    if (errores.cvv) setErrores(prev => ({ ...prev, cvv: '' }))
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

    /*
      Validación del método de pago:
      Si no eligió ninguno, mostramos error.
      El campo tarjeta SOLO se valida si eligió 'debito',
      porque efectivo y Mercado Pago no necesitan número de tarjeta.
    */
    if (!metodoPago) {
      nuevosErrores.metodoPago = 'Elegí un método de pago'
    }

    if (metodoPago === 'tarjeta') {
      const tarjetaLimpia = form.tarjeta.replace(/\s/g, '')
      if (!tarjetaLimpia) {
        nuevosErrores.tarjeta = 'Ingresá el número de tarjeta'
      } else if (tarjetaLimpia.length < 16) {
        nuevosErrores.tarjeta = 'Ingresá los 16 dígitos'
      }
      if (!form.titular.trim()) {
        nuevosErrores.titular = 'Ingresá el nombre del titular'
      }
      if (!/^\d{2}\/\d{2}$/.test(form.vencimiento)) {
        nuevosErrores.vencimiento = 'Formato MM/YY'
      } else {
        const [mm] = form.vencimiento.split('/').map(Number)
        if (mm < 1 || mm > 12) nuevosErrores.vencimiento = 'Mes inválido'
      }
      if (!/^\d{3,4}$/.test(form.cvv)) {
        nuevosErrores.cvv = 'CVV inválido'
      }
    }

    return nuevosErrores
  }

  /*
    EVENTO: handleSubmit — se ejecuta al confirmar la compra.
    Ahora crea una ORDEN REAL en Supabase:
      1. Valida el formulario.
      2. Llama a crearOrden() que inserta en las tablas "ordenes" y "orden_items".
      3. Si todo OK, vacía el carrito y muestra la pantalla de éxito.
  */
  async function handleSubmit(e) {
    e.preventDefault()

    // 1. Si no hay usuario, vamos a login (las órdenes necesitan un usuario)
    if (!usuario) {
      router.push('/login')
      return
    }

    // 2. Validar
    const nuevosErrores = validar()
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      return
    }

    // 3. Crear la orden en Supabase (queda en estado "pendiente")
    setProcesando(true)
    const { orden, error } = await crearOrden({
      usuario,
      items,
      total: totalPrecio,
      datosEnvio: {
        nombre: form.nombre,
        email: form.email,
        direccion: form.direccion,
        metodoPago,
      },
    })

    if (error) {
      setProcesando(false)
      setErrores({ general: 'No pudimos procesar tu compra. Intentá de nuevo.' })
      console.error('Error al crear orden:', error)
      return
    }

    // 4. Si eligió MERCADO PAGO → crear preferencia y redirigir a su checkout
    if (metodoPago === 'mercadopago') {
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ordenId: orden.id, items }),
        })
        const data = await res.json()
        if (!res.ok || !data.url) throw new Error(data.error || 'No se pudo iniciar el pago')
        // Redirigimos a Mercado Pago. El webhook actualizará la orden cuando se confirme.
        window.location.href = data.url
        return
      } catch (err) {
        setProcesando(false)
        setErrores({ general: 'No pudimos conectar con Mercado Pago. Intentá de nuevo.' })
        console.error(err)
        return
      }
    }

    // 5. Para tarjeta o efectivo: mostramos confirmación local y vaciamos el carrito
    setProcesando(false)
    setConfirmado(true)
    vaciarCarrito()
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

              {/* ── MÉTODO DE PAGO ──────────────────────────────────── */}
              <h2 className={styles.seccionTitulo}>Método de pago</h2>

              {/*
                3 tarjetas clickeables (tipo "radio") en vez de un dropdown
                gris. Cada una con su ícono y descripción.
              */}
              <div className={styles.metodosGrid} role="radiogroup" aria-label="Método de pago">
                <button
                  type="button"
                  role="radio"
                  aria-checked={metodoPago === 'tarjeta'}
                  className={`${styles.metodoCard} ${metodoPago === 'tarjeta' ? styles.metodoCardActivo : ''}`}
                  onClick={() => { setMetodoPago('tarjeta'); setErrores(p => ({ ...p, metodoPago: '' })) }}
                >
                  <svg className={styles.metodoIcono} viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="2" y="5" width="20" height="14" rx="2.5" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                  <div>
                    <strong>Tarjeta</strong>
                    <small>Crédito o débito</small>
                  </div>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={metodoPago === 'mercadopago'}
                  className={`${styles.metodoCard} ${metodoPago === 'mercadopago' ? styles.metodoCardActivo : ''}`}
                  onClick={() => { setMetodoPago('mercadopago'); setErrores(p => ({ ...p, metodoPago: '' })) }}
                >
                  <svg className={styles.metodoIcono} viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M7 13c2 2 8 2 10 0" />
                  </svg>
                  <div>
                    <strong>Mercado Pago</strong>
                    <small>QR, dinero en cuenta o tarjeta</small>
                  </div>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={metodoPago === 'efectivo'}
                  className={`${styles.metodoCard} ${metodoPago === 'efectivo' ? styles.metodoCardActivo : ''}`}
                  onClick={() => { setMetodoPago('efectivo'); setErrores(p => ({ ...p, metodoPago: '' })) }}
                >
                  <svg className={styles.metodoIcono} viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <div>
                    <strong>Efectivo</strong>
                    <small>Pagás al recibir</small>
                  </div>
                </button>
              </div>
              {errores.metodoPago && (
                <span className={styles.error} aria-live="polite">{errores.metodoPago}</span>
              )}

              {/* ── DETALLE SEGÚN EL MÉTODO ELEGIDO ───────────────────── */}

              {/* TARJETA: form completo + tarjeta visual en tiempo real */}
              {metodoPago === 'tarjeta' && (
                <div className={styles.tarjetaSeccion}>
                  {/* Tarjeta visual (preview) */}
                  <div className={styles.tarjetaVisual} aria-hidden="true">
                    <div className={styles.tarjetaChip}></div>
                    <div className={styles.tarjetaNumero}>
                      {(form.tarjeta || '•••• •••• •••• ••••').padEnd(19, ' ')}
                    </div>
                    <div className={styles.tarjetaFila}>
                      <div>
                        <small>Titular</small>
                        <div className={styles.tarjetaTitular}>
                          {form.titular.toUpperCase() || 'TU NOMBRE'}
                        </div>
                      </div>
                      <div>
                        <small>Vence</small>
                        <div>{form.vencimiento || 'MM/YY'}</div>
                      </div>
                    </div>
                    <div className={styles.tarjetaMarca}>AUREVIA</div>
                  </div>

                  {/* Form de la tarjeta */}
                  <div className={styles.tarjetaForm}>
                    <div className={styles.campo}>
                      <label htmlFor="ch-tarjeta">Número de tarjeta</label>
                      <input
                        id="ch-tarjeta"
                        name="tarjeta"
                        type="text"
                        inputMode="numeric"
                        placeholder="1234 5678 9012 3456"
                        value={form.tarjeta}
                        onChange={handleTarjeta}
                        maxLength={19}
                        aria-invalid={errores.tarjeta ? 'true' : 'false'}
                      />
                      {errores.tarjeta && <span className={styles.error}>{errores.tarjeta}</span>}
                    </div>

                    <div className={styles.campo}>
                      <label htmlFor="ch-titular">Titular</label>
                      <input
                        id="ch-titular"
                        name="titular"
                        type="text"
                        placeholder="Como figura en la tarjeta"
                        value={form.titular}
                        onChange={handleChange}
                        aria-invalid={errores.titular ? 'true' : 'false'}
                      />
                      {errores.titular && <span className={styles.error}>{errores.titular}</span>}
                    </div>

                    <div className={styles.filaCorta}>
                      <div className={styles.campo}>
                        <label htmlFor="ch-venc">Vencimiento</label>
                        <input
                          id="ch-venc"
                          name="vencimiento"
                          type="text"
                          inputMode="numeric"
                          placeholder="MM/YY"
                          value={form.vencimiento}
                          onChange={handleVencimiento}
                          maxLength={5}
                          aria-invalid={errores.vencimiento ? 'true' : 'false'}
                        />
                        {errores.vencimiento && <span className={styles.error}>{errores.vencimiento}</span>}
                      </div>
                      <div className={styles.campo}>
                        <label htmlFor="ch-cvv">CVV</label>
                        <input
                          id="ch-cvv"
                          name="cvv"
                          type="text"
                          inputMode="numeric"
                          placeholder="123"
                          value={form.cvv}
                          onChange={handleCVV}
                          maxLength={4}
                          aria-invalid={errores.cvv ? 'true' : 'false'}
                        />
                        {errores.cvv && <span className={styles.error}>{errores.cvv}</span>}
                      </div>
                    </div>

                    <p className={styles.seguridad}>
                      🔒 Conexión segura. No guardamos los datos de tu tarjeta.
                    </p>
                  </div>
                </div>
              )}

              {/* MERCADO PAGO: info de redirección */}
              {metodoPago === 'mercadopago' && (
                <div className={styles.infoCard}>
                  <strong>Vas a ser redirigido a Mercado Pago</strong>
                  <p>
                    Al confirmar la compra te llevamos al sitio seguro de Mercado Pago para
                    completar el pago con QR, dinero en cuenta o tarjeta. Una vez aprobado,
                    volvés a AUREVIA con la confirmación de tu pedido.
                  </p>
                </div>
              )}

              {/* EFECTIVO: info de cómo se paga al recibir */}
              {metodoPago === 'efectivo' && (
                <div className={styles.infoCard}>
                  <strong>Pagás cuando recibís el pedido</strong>
                  <p>
                    Confirmamos tu compra y coordinamos la entrega por email. Tenés que
                    tener el importe exacto ({formatPrecio(totalPrecio)}) al momento de recibir
                    el pedido.
                  </p>
                </div>
              )}

              {/* Mensaje de error general (si la creación de la orden falló) */}
              {errores.general && (
                <p className={styles.error} role="alert" style={{ marginTop: 12 }}>
                  {errores.general}
                </p>
              )}

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
