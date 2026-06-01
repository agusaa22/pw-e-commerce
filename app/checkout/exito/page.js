/*
  PÁGINA: /checkout/exito
  QUÉ HACE: Es la página a la que Mercado Pago redirige al cliente después
           del pago. Apenas carga:
             1. Confirma la orden en el servidor (estado = pagada, mp_payment_id).
             2. Borra el carrito en la base.
             3. Recarga el carrito local desde la base (queda vacío).
  NOTA: El componente que usa useSearchParams() va envuelto en <Suspense>
        porque Next.js 14 lo exige para poder pre-renderizar la página.
*/
'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from '../checkout.module.css'

function ContenidoExito() {
  const searchParams = useSearchParams()

  // Datos que envía Mercado Pago en la URL al redirigir
  const ordenId = searchParams.get('orden')
  const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id')
  const collectionStatus = searchParams.get('collection_status') || searchParams.get('status') || 'approved'

  const { recargarCarrito, vaciarCarrito } = useCart()
  const { cargando: cargandoAuth } = useAuth()
  const [procesado, setProcesado] = useState(false)

  useEffect(() => {
    // Esperamos a que termine de cargar la sesión antes de hacer nada
    if (cargandoAuth || procesado) return

    async function confirmarYLimpiar() {
      // 1) Confirmar la orden en el servidor (actualiza estado + vacía carrito en DB)
      if (ordenId && paymentId) {
        try {
          await fetch('/api/checkout/confirmar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ordenId, paymentId, status: collectionStatus }),
          })
        } catch (err) {
          console.error('Error confirmando orden:', err)
        }
      }

      // 2) Recargar el carrito local desde la DB (que ya está vacía después del paso 1).
      //    Esto evita la race condition con el CartContext que también recarga al montarse.
      try {
        await recargarCarrito()
      } catch {
        await vaciarCarrito() // por si el usuario es invitado (sin DB), lo vaciamos local
      }

      setProcesado(true)
    }

    confirmarYLimpiar()
  }, [cargandoAuth, procesado, ordenId, paymentId, collectionStatus, recargarCarrito, vaciarCarrito])

  const esPendiente = collectionStatus === 'pending' || collectionStatus === 'in_process'

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
