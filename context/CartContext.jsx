/*
  CONTEXTO: CartContext
  QUÉ HACE: Provee el estado global del carrito a toda la aplicación.
  POR QUÉ: Context API de React permite compartir datos entre componentes
           sin pasar props manualmente por cada nivel (prop drilling).
           Sin Context, habría que pasar items={items} agregarItem={agregarItem}
           desde el layout hasta el botón de cada producto — imposible de mantener.
  QUÉ PASARÍA SI SE SACA: Cada componente tendría su propio carrito desconectado.
           El contador del header no sabría qué agregaste en la página de producto.
*/
'use client'

import { createContext, useContext, useState } from 'react'

/*
  createContext crea el "buzón compartido".
  Los componentes que llamen a useCart() acceden a este buzón.
*/
const CartContext = createContext(null)

/* ─── PROVIDER ──────────────────────────────────────────────────────────────
  QUÉ HACE: Envuelve la app y provee el estado del carrito a todos los hijos.
  POR QUÉ: Al ponerlo en layout.js, cualquier componente en cualquier ruta
           puede leer y modificar el carrito con useCart().
*/
export function CartProvider({ children }) {

  /*
    items: array de productos en el carrito.
    Estructura de cada item: { id, nombre, precio, imagen, categoria, peso, cantidad }
    useState([]) — arranca vacío
  */
  const [items, setItems] = useState([])

  /* ── AGREGAR ITEM ─────────────────────────────────────────────────────────
    Si el producto ya existe en el carrito, incrementa la cantidad.
    Si no existe, lo agrega con cantidad: 1.
  */
  /*
    agregarItem acepta un segundo parámetro opcional "cantidad" (default 1).
    Si el producto ya existe en el carrito, suma esa cantidad al total existente.
    Si no existe, lo agrega con la cantidad indicada.
  */
  function agregarItem(producto, cantidad = 1) {
    setItems(prev => {
      const existente = prev.find(i => i.id === producto.id)
      if (existente) {
        return prev.map(i =>
          i.id === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i
        )
      }
      return [...prev, { ...producto, cantidad }]
    })
  }

  /* ── ELIMINAR ITEM ────────────────────────────────────────────────────────
    Filtra el array quitando el producto con ese id.
  */
  function eliminarItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  /* ── ACTUALIZAR CANTIDAD ──────────────────────────────────────────────────
    Si la nueva cantidad llega a 0, elimina el producto directamente.
  */
  function actualizarCantidad(id, nuevaCantidad) {
    if (nuevaCantidad < 1) {
      eliminarItem(id)
      return
    }
    setItems(prev =>
      prev.map(i => i.id === id ? { ...i, cantidad: nuevaCantidad } : i)
    )
  }

  /* ── VACIAR CARRITO ───────────────────────────────────────────────────────
    Se usa después de confirmar la compra en el checkout.
  */
  function vaciarCarrito() {
    setItems([])
  }

  /*
    Valores derivados calculados a partir de items[].
    POR QUÉ: No los guardamos en otro useState para no tener estados
             desincronizados. Se recalculan automáticamente cada vez que
             items cambia (React re-renderiza el Provider).
  */
  const totalItems  = items.reduce((acc, i) => acc + i.cantidad, 0)
  const totalPrecio = items.reduce((acc, i) => acc + i.precio * i.cantidad, 0)

  return (
    <CartContext.Provider value={{
      items,
      agregarItem,
      eliminarItem,
      actualizarCantidad,
      vaciarCarrito,
      totalItems,
      totalPrecio,
    }}>
      {children}
    </CartContext.Provider>
  )
}

/* ─── HOOK PERSONALIZADO ────────────────────────────────────────────────────
  QUÉ HACE: Encapsula useContext(CartContext) para un uso más limpio.
  POR QUÉ: Los componentes usan useCart() en lugar de importar CartContext.
           También lanza un error claro si alguien lo usa fuera del Provider.
  USO: const { items, agregarItem, totalItems } = useCart()
*/
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe usarse dentro de un CartProvider')
  }
  return context
}
