/*
  PÁGINA: /checkout/exito
  QUÉ HACE: Es la página a la que Mercado Pago redirige al cliente después
           del pago. Apenas carga:
             1. Confirma la orden en el servidor (estado = pagada, mp_payment_id).
             2. Borra el carrito en la base.
             3. Recarga el carrito local desde la base (queda vacío).
           Usa useRef para que el efecto NO se dispare más de una vez,
           evitando una race condition con CartProvider.
*/
'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from '../checkout.module.css'

function ContenidoExito() {
  const searchParams = useSearchParams()
  const ordenId = searchParams.get('orden')
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id')
  const collectionStatus = searchParams.get('collection_status') || searchParams.get('status') || 'approved'

  const { recargarCarrito } = useCart()
  const { cargando: cargandoAuth } = useAuth()

  // useRef: evita que el efecto corra dos veces aunque el componente se re-renderice
  const yaProceso = useRef(false)
  const [textoDebug, setTextoDebug] = useState('')

  useEffect(() => {
    // Esperamos a que termine de cargar la sesión y a no haberlo hecho antes
    if (cargandoAuth) return
    if (yaProceso.current) return
    yaProceso.current = true

    async function confirmarYLimpiar() {
      // 1) Confirmar la orden en el servidor (actualiza estado + vacía carrito en DB)
      let resultadoConfirmacion = 'sin orden en URL'
      if (ordenId) {
        try {
          const res = await fetch('/api/checkout/confirmar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ordenId, paymentId, status: collectionStatus }),
          })
          const data = await res.json()
          resultadoConfirmacion = res.ok
            ? `OK estado=${data.estado}`
            : `Error ${res.status}: ${data.error || 'desconocido'}`
        } catch (err) {
          resultadoConfirmacion = `Excepción: ${err.message}`
        }
      }

      // 2) Recargar el carrito local desde la DB. Lo hacemos DOS veces con
      //    un pequeño delay para vencer cualquier carga en paralelo del
      //    CartProvider que pueda volver a leer la DB con items viejos.
      try { await recargarCarrito() } catch {}
      await new Promise((r) => setTimeout(r, 400))
      try { await recargarCarrito() } catch {}

      // Guardamos el resultado para mostrar en pantalla si la URL trae ?debug=1
      setTextoDebug(resultadoConfirmacion)
    }

    confirmarYLimpiar()
    // Solo depende de cargandoAuth: cuando termina de cargar, dispara una vez
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargandoAuth])

  const esPendiente = collectionStatus === 'pending' || collectionStatus === 'in_process'
  const mostrarDebug = searchParams.get('debug') === '1'

  return (
    <div className={styles.exito} role="alert">
      <h1>{esPendiente ? '¡Pago en proceso!' : '¡Compra confirmada!'}</h1>
      <p>
        {esPendiente
          ? 'Tu pago está siendo procesado. Te avisamos por email cuando se confirme.'
          : 'Gracias por tu compra. Te enviamos un email con los detalles de tu pedido.'}
      </p>
      {ordenId && (
        <p style={{ marginTop: 10, opacity: 0.8 }}>
          Número de orden: <strong>#{ordenId}</strong>
        </p>
      )}
      {mostrarDebug && (
        <p style={{ marginTop: 14, fontFamily: 'monospace', fontSize: 12, color: '#888' }}>
          debug: {textoDebug || 'esperando...'}
        </p>
      )}
      <Link href="/" className={styles.btnVolver}>
        Volver al inicio
      </Link>
    </div>
  )
}

export default function CheckoutExitoPage() {
  return (
    <>
      <Header />
      <main className={styles.pagina}>
        <div className="container">
          <Suspense fallback={<p style={{ padding: 40 }}>Cargando confirmación...</p>}>
            <ContenidoExito />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  )
}
