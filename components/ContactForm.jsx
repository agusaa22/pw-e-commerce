/*
  COMPONENTE: ContactForm
  QUÉ HACE: Formulario de contacto con validación en JavaScript.
           El usuario ingresa nombre, email y mensaje. Al enviar,
           se validan los campos y se muestra un mensaje de éxito.
  POR QUÉ: "use client" porque usa useState para:
           - Controlar los valores de cada campo del formulario
           - Manejar los errores de validación
           - Mostrar el estado de envío (enviando / enviado)
  QUÉ PASARÍA SI SE SACA: No habría forma de contacto en el sitio.

  MÓDULO C — Este componente demuestra:
    - Eventos en JavaScript (onChange, onSubmit)
    - Validación de formularios con JavaScript
    - Manejo del DOM de forma declarativa con React (vs. manipulación directa)
*/
'use client'

import { useState } from 'react'
import styles from './ContactForm.module.css'

export default function ContactForm() {

  /*
    Estado del formulario: un objeto con los 3 campos.
    POR QUÉ un solo objeto y no 3 useState separados:
      - Más organizado: todos los campos están juntos.
      - handleChange es una sola función que actualiza cualquier campo.
      - Más fácil de resetear (volver a poner todo vacío).
  */
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    mensaje: '',
  })

  /*
    Estado de errores: un objeto donde cada key es un campo
    y el valor es el mensaje de error (string vacío = sin error).
  */
  const [errores, setErrores] = useState({})

  /*
    Estados del envío:
    - enviando: true mientras se "procesa" el formulario
    - enviado: true cuando el envío fue exitoso
  */
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado]   = useState(false)

  /*
    EVENTO: handleChange se ejecuta cada vez que el usuario escribe en un campo.
    POR QUÉ: En React, los inputs son "controlados" — su valor viene del estado.
             Cada tecla que el usuario presiona dispara onChange, que actualiza
             el estado, y React re-renderiza el input con el nuevo valor.

    e.target.name → el atributo "name" del input (ej: "email")
    e.target.value → el texto que el usuario escribió

    [name]: value → "computed property name" de ES6.
    Si name = "email", es lo mismo que escribir: { email: value }
    Esto permite usar UNA sola función para todos los campos.
  */
  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    // Limpia el error del campo cuando el usuario empieza a escribir
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }))
    }
  }

  /*
    VALIDACIÓN: revisa cada campo y devuelve un objeto con los errores.
    POR QUÉ una función separada: mantiene handleSubmit más limpio.
    Si no hay errores, devuelve un objeto vacío {}.

    .trim() quita espacios al inicio y final del texto.
    .includes('@') es una validación básica de email.
  */
  function validar() {
    const nuevosErrores = {}

    if (!form.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio'
    }

    if (!form.email.trim()) {
      nuevosErrores.email = 'El email es obligatorio'
    } else if (!form.email.includes('@') || !form.email.includes('.')) {
      nuevosErrores.email = 'Ingresá un email válido (ej: nombre@ejemplo.com)'
    }

    if (!form.mensaje.trim()) {
      nuevosErrores.mensaje = 'El mensaje es obligatorio'
    }

    return nuevosErrores
  }

  /*
    EVENTO: handleSubmit se ejecuta cuando el usuario hace click en "Enviar".
    e.preventDefault() → evita que el formulario recargue la página.
    POR QUÉ: Por defecto, un <form> HTML envía los datos y recarga.
             En una SPA (Single Page Application), no queremos eso.
             Manejamos el envío con JavaScript.
  */
  function handleSubmit(e) {
    e.preventDefault()

    // 1. Validar los campos
    const nuevosErrores = validar()

    // 2. Si hay errores, los mostramos y NO enviamos
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores)
      return // Corta la ejecución acá
    }

    // 3. Si no hay errores, simulamos el envío
    setEnviando(true)

    /*
      setTimeout simula la demora de enviar datos a un servidor.
      En producción sería un fetch POST a una API:
        await fetch('/api/contacto', {
          method: 'POST',
          body: JSON.stringify(form),
        })
    */
    setTimeout(() => {
      setEnviando(false)
      setEnviado(true)
      // Reseteamos el formulario
      setForm({ nombre: '', email: '', mensaje: '' })
    }, 1500)
  }

  /* ── PANTALLA DE ÉXITO ──────────────────────────────────────────────────── */
  if (enviado) {
    return (
      <section className={styles.section} id="contacto" aria-labelledby="contacto-titulo">
        <div className="container">
          <div className={styles.exito} role="alert">
            <h2 id="contacto-titulo">¡Mensaje enviado!</h2>
            <p>Gracias por contactarnos. Te responderemos a la brevedad.</p>
            <button
              className={styles.btnVolver}
              onClick={() => setEnviado(false)}
            >
              Enviar otro mensaje
            </button>
          </div>
        </div>
      </section>
    )
  }

  /* ── FORMULARIO ─────────────────────────────────────────────────────────── */
  return (
    <section className={styles.section} id="contacto" aria-labelledby="contacto-titulo">
      <div className="container">

        <div className="section-heading">
          <span className="section-label">Contacto</span>
          <h2 id="contacto-titulo">¿Tenés alguna consulta?</h2>
          <p>Escribinos y te respondemos a la brevedad.</p>
        </div>

        {/*
          <form> con onSubmit: cuando el usuario hace click en el botón
          de tipo "submit" o presiona Enter, se ejecuta handleSubmit.
          noValidate: desactiva la validación nativa del navegador
          para usar nuestra propia validación con JavaScript.
        */}
        <form onSubmit={handleSubmit} className={styles.form} noValidate>

          {/* ── CAMPO NOMBRE ─────────────────────────────────────────── */}
          {/*
            <label> enlazado con <input> vía htmlFor/id.
            POR QUÉ: Accesibilidad. Al clickear el label, el cursor
            va al input. Los lectores de pantalla leen el label
            cuando el usuario navega al input.
          */}
          <div className={styles.campo}>
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Tu nombre"
              value={form.nombre}
              onChange={handleChange}
              aria-invalid={errores.nombre ? 'true' : 'false'}
              aria-describedby={errores.nombre ? 'error-nombre' : undefined}
            />
            {/*
              Renderizado condicional: solo muestra el error si existe.
              aria-live="polite" anuncia el error al lector de pantalla.
            */}
            {errores.nombre && (
              <span id="error-nombre" className={styles.error} aria-live="polite">
                {errores.nombre}
              </span>
            )}
          </div>

          {/* ── CAMPO EMAIL ──────────────────────────────────────────── */}
          <div className={styles.campo}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleChange}
              aria-invalid={errores.email ? 'true' : 'false'}
              aria-describedby={errores.email ? 'error-email' : undefined}
            />
            {errores.email && (
              <span id="error-email" className={styles.error} aria-live="polite">
                {errores.email}
              </span>
            )}
          </div>

          {/* ── CAMPO MENSAJE ────────────────────────────────────────── */}
          <div className={styles.campo}>
            <label htmlFor="mensaje">Mensaje</label>
            {/*
              <textarea> en lugar de <input> para texto largo.
              rows="4" define la altura visible inicial.
            */}
            <textarea
              id="mensaje"
              name="mensaje"
              rows="4"
              placeholder="¿En qué podemos ayudarte?"
              value={form.mensaje}
              onChange={handleChange}
              aria-invalid={errores.mensaje ? 'true' : 'false'}
              aria-describedby={errores.mensaje ? 'error-mensaje' : undefined}
            />
            {errores.mensaje && (
              <span id="error-mensaje" className={styles.error} aria-live="polite">
                {errores.mensaje}
              </span>
            )}
          </div>

          {/* ── BOTÓN ENVIAR ─────────────────────────────────────────── */}
          {/*
            type="submit" hace que al clickear se dispare el onSubmit del form.
            disabled={enviando} desactiva el botón mientras se procesa,
            evitando envíos duplicados.
          */}
          <button
            type="submit"
            className={styles.btnEnviar}
            disabled={enviando}
          >
            {enviando ? 'Enviando...' : 'Enviar mensaje'}
          </button>

        </form>
      </div>
    </section>
  )
}
