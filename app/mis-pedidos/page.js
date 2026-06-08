/*
  PÁGINA: /mis-pedidos — historial de compras del usuario logueado.
  QUÉ HACE: Muestra todas las órdenes del usuario con su fecha, estado,
           método de pago, total y el detalle de productos comprados.
  PROTECCIÓN: Si no hay sesión, redirige a /login.
  SEGURIDAD: La RLS de Supabase (política "ver mis ordenes") se encarga de
           que el usuario solo vea sus propias órdenes; aunque alguien
           manipulara el código, la base no le entregaría datos ajenos.
*/
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from './pedidos.module.css'

function formatPrecio(p) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(p)
}

function formatFecha(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

function nombreMetodo(metodo) {
  const m = { tarjeta: 'Tarjeta', mercadopago: 'Mercado Pago', efectivo: 'Efectivo' }
  return m[metodo] || metodo || '—'
}

function estiloEstado(estado) {
  switch (estado) {
    case 'pagada':    return styles.badgePagada
    case 'pendiente': return styles.badgePendiente
    case 'cancelada': return styles.badgeCancelada
    case 'enviada':   return styles.badgeEnviada
    default:          return styles.badge
  }
}

export default function MisPedidosPage() {
  const router = useRouter()
  const { usuario, cargando: cargandoAuth } = useAuth()
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)

  // Protección: si no hay sesión, lo mandamos a login
  useEffect(() => {
    if (!cargandoAuth && !usuario) router.push('/login')
  }, [cargandoAuth, usuario, router])

  // Cargar pedidos del usuario logueado
  useEffect(() => {
    async function cargar() {
      if (!usuario) return
      const { data, error } = await supabase
        .from('ordenes')
        .select(`
          id, total, estado, metodo_pago, created_at,
          referencia_pago, pagado_en,
          nombre_envio, email, direccion_envio,
          orden_items ( id, nombre_producto, precio_unitario, cantidad )
        `)
        .eq('usuario_id', usuario.id)
        .order('created_at', { ascending: false })

      if (error) console.error('Error al traer pedidos:', error)
      setPedidos(data || [])
      setCargando(false)
    }
    cargar()
  }, [usuario])

  if (cargandoAuth || !usuario) {
    return (
      <>
        <Header />
        <main className={styles.pagina}>
          <p style={{ textAlign: 'center', padding: 40 }}>Cargando...</p>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className={styles.pagina}>
        <div className={styles.contenedor}>

          <h1 className={styles.titulo}>Mis pedidos</h1>
          <p className={styles.subtitulo}>
            Acá podés ver el historial completo de tus compras y el estado actual de cada una.
          </p>

          {cargando && (
            <p style={{ textAlign: 'center', padding: 40 }}>Cargando tus pedidos...</p>
          )}

          {!cargando && pedidos.length === 0 && (
            <div className={styles.vacio}>
              <p>Todavía no hiciste ningún pedido.</p>
              <Link href="/" className={styles.btnVolver}>Explorar productos</Link>
            </div>
          )}

          {!cargando && pedidos.length > 0 && (
            <div className={styles.listaPedidos}>
              {pedidos.map((p) => (
                <article key={p.id} className={styles.pedido}>

                  {/* Cabecera del pedido */}
                  <header className={styles.pedidoHeader}>
                    <div>
                      <div className={styles.pedidoNumero}>Pedido #{p.id}</div>
                      <div className={styles.pedidoFecha}>{formatFecha(p.created_at)}</div>
                    </div>
                    <span className={`${styles.badge} ${estiloEstado(p.estado)}`}>
                      {p.estado}
                    </span>
                  </header>

                  {/* Listado de productos del pedido */}
                  <ul className={styles.items}>
                    {p.orden_items.map((it) => (
                      <li key={it.id} className={styles.item}>
                        <span className={styles.itemNombre}>
                          {it.nombre_producto}
                          <span className={styles.itemCantidad}> × {it.cantidad}</span>
                        </span>
                        <span className={styles.itemPrecio}>
                          {formatPrecio(it.precio_unitario * it.cantidad)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Pie del pedido: método de pago + total */}
                  <footer className={styles.pedidoFooter}>
                    <div className={styles.metodo}>
                      <span className={styles.tagMetodo}>{nombreMetodo(p.metodo_pago)}</span>
                      {p.referencia_pago && (
                        <small className={styles.mpId}>Ref. pago: {p.referencia_pago}</small>
                      )}
                      {p.pagado_en && (
                        <small className={styles.mpId}>Pagado: {formatFecha(p.pagado_en)}</small>
                      )}
                    </div>
                    <div className={styles.total}>
                      <span className={styles.totalLabel}>Total</span>
                      <strong className={styles.totalValor}>{formatPrecio(p.total)}</strong>
                    </div>
                  </footer>

                </article>
              ))}
            </div>
          )}

          <div className={styles.acciones}>
            <Link href="/" className={styles.btnSeguir}>← Seguir comprando</Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
