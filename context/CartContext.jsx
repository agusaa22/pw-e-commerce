/*
  CONTEXTO: CartContext (persistente con Supabase)
  QUÉ HACE: Provee el estado global del carrito a toda la app.
    - Si el usuario está LOGUEADO → guarda y lee desde la tabla
      carrito_items de Supabase. No se pierde al recargar ni entre dispositivos.
    - Si el usuario es INVITADO → guarda en localStorage del navegador.
  Las funciones públicas son las mismas que antes, así que el resto de la app
  (CartIcon, ProductCard, AddToCartButton, página del carrito y checkout)
  no necesita ningún cambio.
*/
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'

const CartContext = createContext(null)
const CLAVE_LOCAL = 'aurevia_carrito' // nombre con el que guardamos en el navegador

export function CartProvider({ children }) {
  const { usuario } = useAuth()       // quién está logueado (null si nadie)
  const [items, setItems] = useState([])

  /* ── Función reutilizable para cargar/recargar el carrito ──────────────── */
  async function cargarCarrito() {
    if (usuario) {
      // PASO 1: Si había carrito en localStorage (invitado), lo fusionamos
      // con el de Supabase antes de leer. Así no se pierde lo que el visitante
      // agregó antes de loguearse.
      if (typeof window !== 'undefined') {
        const guardado = localStorage.getItem(CLAVE_LOCAL)
        const carritoInvitado = guardado ? JSON.parse(guardado) : []
        if (carritoInvitado.length > 0) {
          // Leemos lo que ya tenía en la DB para sumar cantidades
          const { data: actuales } = await supabase
            .from('carrito_items')
            .select('producto_id, cantidad')
            .eq('usuario_id', usuario.id)
          const mapaActual = new Map((actuales || []).map((f) => [f.producto_id, f.cantidad]))

          // Para cada producto del carrito invitado, sumamos a lo que ya tenía
          const filas = carritoInvitado.map((i) => ({
            usuario_id: usuario.id,
            producto_id: i.id,
            cantidad: (mapaActual.get(i.id) || 0) + i.cantidad,
          }))

          // Upsert sube todas las filas: si existen, las actualiza; si no, las crea
          await supabase
            .from('carrito_items')
            .upsert(filas, { onConflict: 'usuario_id,producto_id' })

          // Limpiamos el carrito de invitado del navegador
          localStorage.removeItem(CLAVE_LOCAL)
        }
      }

      // PASO 2: Leemos el carrito fusionado desde Supabase con los datos del producto
      const { data } = await supabase
        .from('carrito_items')
        .select('cantidad, productos ( id, nombre, precio, imagen_url, tamanio, categorias ( nombre ) )')
        .eq('usuario_id', usuario.id)

      const cargados = (data || [])
        .filter((fila) => fila.productos)
        .map((fila) => ({
          id: fila.productos.id,
          nombre: fila.productos.nombre,
          precio: fila.productos.precio,
          imagen: fila.productos.imagen_url,
          categoria: fila.productos.categorias?.nombre ?? '',
          peso: fila.productos.tamanio,
          cantidad: fila.cantidad,
        }))
      setItems(cargados)
    } else {
      const guardado = typeof window !== 'undefined' ? localStorage.getItem(CLAVE_LOCAL) : null
      setItems(guardado ? JSON.parse(guardado) : [])
    }
  }

  /* ── CARGAR el carrito cuando cambia el usuario (login/logout) ─────────── */
  useEffect(() => {
    cargarCarrito()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario])

  /* ── GUARDAR en el navegador cuando es invitado ────────────────────────── */
  useEffect(() => {
    if (!usuario && typeof window !== 'undefined') {
      localStorage.setItem(CLAVE_LOCAL, JSON.stringify(items))
    }
  }, [items, usuario])

  /* ── AGREGAR (CREATE/UPDATE en carrito_items) ──────────────────────────── */
  async function agregarItem(producto, cantidad = 1) {
    const existente = items.find((i) => i.id === producto.id)
    const nuevaCantidad = existente ? existente.cantidad + cantidad : cantidad

    setItems((prev) => {
      if (existente) {
        return prev.map((i) =>
          i.id === producto.id ? { ...i, cantidad: nuevaCantidad } : i
        )
      }
      return [...prev, {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
        categoria: producto.categoria,
        peso: producto.peso,
        cantidad,
      }]
    })

    if (usuario) {
      // upsert: si ya existe esa fila la actualiza, si no la crea
      await supabase.from('carrito_items').upsert(
        { usuario_id: usuario.id, producto_id: producto.id, cantidad: nuevaCantidad },
        { onConflict: 'usuario_id,producto_id' }
      )
    }
  }

  /* ── ELIMINAR (DELETE) ─────────────────────────────────────────────────── */
  async function eliminarItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    if (usuario) {
      await supabase.from('carrito_items').delete()
        .eq('usuario_id', usuario.id)
        .eq('producto_id', id)
    }
  }

  /* ── ACTUALIZAR CANTIDAD (UPDATE) ──────────────────────────────────────── */
  async function actualizarCantidad(id, nuevaCantidad) {
    if (nuevaCantidad < 1) { eliminarItem(id); return }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, cantidad: nuevaCantidad } : i)))
    if (usuario) {
      await supabase.from('carrito_items')
        .update({ cantidad: nuevaCantidad })
        .eq('usuario_id', usuario.id)
        .eq('producto_id', id)
    }
  }

  /* ── VACIAR (se usa al confirmar la compra) ────────────────────────────── */
  async function vaciarCarrito() {
    setItems([])
    if (usuario) {
      await supabase.from('carrito_items').delete().eq('usuario_id', usuario.id)
    }
  }

  // Valores derivados (se recalculan solos cuando cambian los items)
  const totalItems  = items.reduce((acc, i) => acc + i.cantidad, 0)
  const totalPrecio = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)

  return (
    <CartContext.Provider value={{
      items, agregarItem, eliminarItem, actualizarCantidad,
      vaciarCarrito, totalItems, totalPrecio,
      recargarCarrito: cargarCarrito,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart debe usarse dentro de un CartProvider')
  return context
}
