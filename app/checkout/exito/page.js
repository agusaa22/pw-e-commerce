/*
  PÁGINA: /checkout/exito
  QUÉ HACE: Es la página a la que Mercado Pago redirige al cliente después
           del pago. Vacía el carrito y muestra una confirmación visual.
  NOTA: El componente que usa useSearchParams() va envuelto en <Suspense>
        porque Next.js 14 lo exige para poder pre-renderizar la página.
*/
'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from '../checkout.module.css'

function ContenidoExito() {
  const searchParams = useSearchParams()
  const ordenId = searchParams.get('orden')
  const status = searchParams.get('status') || 'approved'
  const { vaciarCarrito } = useCart()
  const [vaciado, setVaciado] = useState(false)

  useEffect(() => {
    if (!vaciado) {
      vaciarCarrito()
      setVaciado(true)
    }
  }, [vaciado, vaciarCarrito])

  const esPendiente = status === 'pending'

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
