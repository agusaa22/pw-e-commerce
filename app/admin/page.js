/*
  PÁGINA: /admin — panel mínimo de administración de productos.
  QUÉ HACE: Lista todos los productos y permite CRUD completo
           (Crear, Leer, Actualizar/Editar, Activar/Desactivar y Borrar)
           directamente sobre Supabase.
  SEGURIDAD: solo entra un admin. Si no lo sos, se muestra "Acceso restringido".
            Además, RLS en la base bloquea cualquier escritura que no sea de admin
            (doble candado).
*/
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import styles from './admin.module.css'

// Estado inicial del formulario (vacío = vamos a crear un producto nuevo)
const FORM_VACIO = {
  id: null, nombre: '', descripcion: '', precio: '', stock: '',
  categoria_id: '', aroma: '', tamanio: '', imagen_url: '',
  destacado: false, activo: true,
}

function formatPrecio(precio) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(precio)
}

// Estado inicial de creación de orden manual
const ORDEN_VACIA = {
  email_cliente: '',
  productos: [], // [{ producto_id, cantidad }]
  metodo_pago: 'efectivo',
  nombre_envio: '',
  direccion_envio: '',
}

// Estado inicial de edición de orden
const EDITAR_ORDEN_VACIA = {
  id: null,
  estado: 'pendiente',
  nombre_envio: '',
  email: '',
  direccion_envio: '',
  metodo_pago: '',
}

const ESTADOS_ORDEN = ['pendiente', 'pagada', 'cancelada', 'enviada']

export default function AdminPage() {
  const { esAdmin, cargando: cargandoAuth } = useAuth()

  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [form, setForm] = useState(FORM_VACIO)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })

  // Órdenes
  const [ordenes, setOrdenes] = useState([])
  const [editandoOrden, setEditandoOrden] = useState(EDITAR_ORDEN_VACIA)
  const [creandoOrden, setCreandoOrden] = useState(false)
  const [nuevaOrden, setNuevaOrden] = useState(ORDEN_VACIA)
  const [mensajeOrden, setMensajeOrden] = useState({ tipo: '', texto: '' })

  // Trae productos y categorías de la base
  async function cargarTodo() {
    const { data: prods } = await supabase
      .from('productos').select('*, categorias(nombre)').order('id')
    setProductos(prods || [])

    const { data: cats } = await supabase.from('categorias').select('*').order('nombre')
    setCategorias(cats || [])

    // Cargamos todas las órdenes (admin las puede ver todas por RLS)
    const { data: ords } = await supabase
      .from('ordenes')
      .select(`
        id, total, estado, metodo_pago, created_at, pagado_en, referencia_pago,
        nombre_envio, email, direccion_envio, usuario_id,
        orden_items ( id, nombre_producto, precio_unitario, cantidad )
      `)
      .order('created_at', { ascending: false })
    setOrdenes(ords || [])
  }

  useEffect(() => {
    cargarTodo()
    // Refrescar cuando volvés a la pestaña (ej: después de una compra
    // desde otra ventana). Así el stock se actualiza al instante.
    function onVisible() {
      if (document.visibilityState === 'visible') cargarTodo()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', cargarTodo)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', cargarTodo)
    }
  }, [])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  // Limpia un número: saca puntos, comas y espacios para evitar el bug típico
  // de "22.800" → 22 (cuando JS interpreta el punto como decimal).
  // Acepta: 22800, 22.800, 22,800, 22 800 → todos devuelven 22800.
  function parsearEntero(valor) {
    if (valor === '' || valor === null || valor === undefined) return 0
    const limpio = String(valor).replace(/[^\d-]/g, '')
    const n = parseInt(limpio, 10)
    return Number.isFinite(n) ? n : 0
  }

  // CREATE o UPDATE según haya o no un id cargado
  async function guardar(e) {
    e.preventDefault()
    setMensaje({ tipo: '', texto: '' })

    const datos = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: parsearEntero(form.precio),
      stock: parsearEntero(form.stock),
      categoria_id: form.categoria_id ? parsearEntero(form.categoria_id) : null,
      aroma: form.aroma,
      tamanio: form.tamanio,
      imagen_url: form.imagen_url,
      destacado: form.destacado,
      activo: form.activo,
    }

    let error
    if (form.id) {
      ;({ error } = await supabase.from('productos').update(datos).eq('id', form.id))
    } else {
      ;({ error } = await supabase.from('productos').insert(datos))
    }

    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error: ' + error.message })
      return
    }
    setMensaje({
      tipo: 'ok',
      texto: form.id ? 'Producto actualizado ✓' : 'Producto creado ✓',
    })
    setForm(FORM_VACIO)
    cargarTodo()
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000)
  }

  // Carga un producto en el formulario para editarlo
  function editar(p) {
    setForm({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      precio: p.precio,
      stock: p.stock,
      categoria_id: p.categoria_id ?? '',
      aroma: p.aroma ?? '',
      tamanio: p.tamanio ?? '',
      imagen_url: p.imagen_url ?? '',
      destacado: p.destacado,
      activo: p.activo,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // DELETE
  async function borrar(id) {
    if (!confirm('¿Seguro que querés borrar este producto? No se puede deshacer.')) return
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (error) {
      setMensaje({ tipo: 'error', texto: 'Error al borrar: ' + error.message })
      return
    }
    setMensaje({ tipo: 'ok', texto: 'Producto borrado ✓' })
    cargarTodo()
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000)
  }

  // Activar / desactivar (borrado suave) — ahora chequea el error
  async function alternarActivo(p) {
    const { error } = await supabase
      .from('productos')
      .update({ activo: !p.activo })
      .eq('id', p.id)
    if (error) {
      setMensaje({ tipo: 'error', texto: 'No se pudo cambiar el estado: ' + error.message })
      return
    }
    setMensaje({
      tipo: 'ok',
      texto: `Producto ${!p.activo ? 'activado' : 'desactivado'} ✓`,
    })
    cargarTodo()
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000)
  }

  // ──────────────────────────────────────────────────────────────────────────
  //  GESTIÓN DE ÓRDENES
  // ──────────────────────────────────────────────────────────────────────────

  // Carga una orden en el form de edición y baja hasta él
  function editarOrden(o) {
    setEditandoOrden({
      id: o.id,
      estado: o.estado,
      nombre_envio: o.nombre_envio ?? '',
      email: o.email ?? '',
      direccion_envio: o.direccion_envio ?? '',
      metodo_pago: o.metodo_pago ?? '',
    })
    // Esperamos a que React renderice el form para hacer scroll suave hacia él
    setTimeout(() => {
      const el = document.getElementById('form-editar-orden')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  // Guarda los cambios de una orden editada
  async function guardarOrden(e) {
    e.preventDefault()
    setMensajeOrden({ tipo: '', texto: '' })

    const datos = {
      estado: editandoOrden.estado,
      nombre_envio: editandoOrden.nombre_envio,
      email: editandoOrden.email,
      direccion_envio: editandoOrden.direccion_envio,
      metodo_pago: editandoOrden.metodo_pago,
      // Si cambia a "pagada" y no tenía fecha de pago, la seteamos ahora
      ...(editandoOrden.estado === 'pagada' ? { pagado_en: new Date().toISOString() } : {}),
    }

    const { data, error } = await supabase
      .from('ordenes').update(datos).eq('id', editandoOrden.id).select()
    if (error) {
      setMensajeOrden({ tipo: 'error', texto: 'No se pudo actualizar: ' + error.message })
      return
    }
    if (!data || data.length === 0) {
      setMensajeOrden({
        tipo: 'error',
        texto: 'No se pudo actualizar (posiblemente falta la política RLS de admin). Corré el patch SQL.',
      })
      return
    }
    setMensajeOrden({ tipo: 'ok', texto: `Orden #${editandoOrden.id} actualizada ✓` })
    setEditandoOrden(EDITAR_ORDEN_VACIA)
    cargarTodo()
    setTimeout(() => setMensajeOrden({ tipo: '', texto: '' }), 3000)
  }

  // Borrar una orden. Al borrar:
  //  - Las orden_items se borran por cascade (FK on delete cascade).
  //  - El trigger trg_reponer_stock devuelve el stock al producto. ✓
  //  Usamos .select() para que Supabase devuelva las filas borradas y poder
  //  detectar cuando RLS bloquea silenciosamente la operación.
  async function borrarOrden(id) {
    if (!confirm(`¿Seguro que querés borrar la orden #${id}? El stock vuelve al producto.`)) return
    const { data, error } = await supabase.from('ordenes').delete().eq('id', id).select()
    if (error) {
      setMensajeOrden({ tipo: 'error', texto: 'No se pudo borrar: ' + error.message })
      return
    }
    if (!data || data.length === 0) {
      setMensajeOrden({
        tipo: 'error',
        texto: 'No se pudo borrar (posiblemente falta la política RLS de admin). Corré el patch SQL.',
      })
      return
    }
    setMensajeOrden({ tipo: 'ok', texto: `Orden #${id} borrada ✓ (stock devuelto)` })
    cargarTodo()
    setTimeout(() => setMensajeOrden({ tipo: '', texto: '' }), 3000)
  }

  // Agrega un producto a la orden que se está creando
  function agregarProductoANueva() {
    setNuevaOrden((prev) => ({
      ...prev,
      productos: [...prev.productos, { producto_id: '', cantidad: 1 }],
    }))
  }

  // Modifica un producto del array en posición i
  function modificarProductoNueva(i, campo, valor) {
    setNuevaOrden((prev) => {
      const nuevos = [...prev.productos]
      nuevos[i] = { ...nuevos[i], [campo]: valor }
      return { ...prev, productos: nuevos }
    })
  }

  // Quita un producto del array de la orden nueva
  function quitarProductoNueva(i) {
    setNuevaOrden((prev) => {
      const nuevos = prev.productos.filter((_, idx) => idx !== i)
      return { ...prev, productos: nuevos }
    })
  }

  // Crear una orden manualmente desde el admin (para ventas presenciales, etc.)
  async function crearOrdenManual(e) {
    e.preventDefault()
    setMensajeOrden({ tipo: '', texto: '' })

    // Validaciones del lado del cliente (mensaje claro + scroll para verlo)
    const mostrarError = (texto) => {
      setMensajeOrden({ tipo: 'error', texto })
      // Scrolleamos al formulario para que el mensaje sea visible
      setTimeout(() => {
        const el = document.getElementById('form-crear-orden')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }

    if (!nuevaOrden.email_cliente.trim()) {
      mostrarError('Ingresá el email del cliente.')
      return
    }
    if (nuevaOrden.productos.length === 0) {
      mostrarError('Agregá al menos un producto haciendo clic en "+ Agregar producto".')
      return
    }
    // Chequeamos que TODAS las líneas tengan producto elegido (no "— Seleccionar —")
    const lineaIncompleta = nuevaOrden.productos.findIndex(
      (it) => !it.producto_id || String(it.producto_id).trim() === ''
    )
    if (lineaIncompleta !== -1) {
      mostrarError(`Elegí un producto en la línea #${lineaIncompleta + 1} del listado.`)
      return
    }

    try {
      // 1) Buscar el usuario por email en perfiles
      const { data: perfil, error: errPerfil } = await supabase
        .from('perfiles')
        .select('id, nombre, email, direccion')
        .eq('email', nuevaOrden.email_cliente.trim())
        .maybeSingle()

      if (errPerfil) {
        mostrarError('Error consultando el perfil: ' + errPerfil.message)
        return
      }
      if (!perfil) {
        mostrarError(`No existe un usuario registrado con el email "${nuevaOrden.email_cliente.trim()}". Pedile al cliente que se registre primero en la web.`)
        return
      }

      // 2) Armar el array de items con info completa (nombre + precio)
      const itemsConDatos = []
      let totalCalculado = 0
      for (const item of nuevaOrden.productos) {
        const prod = productos.find((p) => p.id === parseInt(item.producto_id))
        if (!prod) {
          mostrarError('Producto inválido en la lista. Volvé a elegirlo del dropdown.')
          return
        }
        const cantidad = parseInt(item.cantidad) || 1
        if (cantidad < 1) {
          mostrarError(`La cantidad del producto "${prod.nombre}" debe ser al menos 1.`)
          return
        }
        itemsConDatos.push({
          id: prod.id,
          nombre: prod.nombre,
          precio: prod.precio,
          cantidad,
        })
        totalCalculado += prod.precio * cantidad
      }

      // 3) Llamar al stored procedure crear_orden_completa (con rollback automático)
      const { data, error } = await supabase.rpc('crear_orden_completa', {
        p_usuario_id: perfil.id,
        p_items: itemsConDatos,
        p_total: totalCalculado,
        p_nombre_envio: nuevaOrden.nombre_envio || perfil.nombre || '',
        p_email: perfil.email,
        p_direccion_envio: nuevaOrden.direccion_envio || perfil.direccion || '',
        p_metodo_pago: nuevaOrden.metodo_pago,
      })

      if (error) {
        mostrarError('Error al crear la orden: ' + error.message)
        return
      }
      if (!data || data.ok === false) {
        mostrarError(data?.error || 'No se pudo crear la orden.')
        return
      }

      setMensajeOrden({ tipo: 'ok', texto: `Orden #${data.orden_id} creada (${data.estado}) ✓` })
      setNuevaOrden(ORDEN_VACIA)
      setCreandoOrden(false)
      cargarTodo()
      // Scrolleamos arriba para que vea el aviso de éxito junto a la tabla
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50)
      setTimeout(() => setMensajeOrden({ tipo: '', texto: '' }), 5000)
    } catch (err) {
      // Cualquier cosa inesperada (ej: error de red) la mostramos también
      mostrarError('Error inesperado: ' + (err?.message || String(err)))
      console.error('crearOrdenManual error:', err)
    }
  }

  // ── PROTECCIÓN ──────────────────────────────────────────────────────────
  if (cargandoAuth) {
    return (
      <>
        <Header modoAdmin={true} />
        <main className={styles.pagina}><p style={{ padding: 40 }}>Cargando...</p></main>
        <Footer />
      </>
    )
  }
  if (!esAdmin) {
    return (
      <>
        <Header modoAdmin={true} />
        <main className={styles.pagina}>
          <div className={styles.bloqueado}>
            <h1>Acceso restringido</h1>
            <p>Esta sección es solo para administradores.</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // ── PANEL ───────────────────────────────────────────────────────────────
  return (
    <>
      <Header modoAdmin={true} />
      <main className={styles.pagina}>
        <div className={styles.contenedor}>

          <h1 className={styles.titulo}>Panel de administración</h1>
          <p className={styles.subtitulo}>Gestioná el catálogo de AUREVIA: creá, editá y borrá productos.</p>

          {mensaje.texto && (
            <div className={`${styles.aviso} ${styles[mensaje.tipo]}`} role="status">
              {mensaje.texto}
            </div>
          )}

          {/* ── FORMULARIO CREAR / EDITAR ───────────────────────────── */}
          <section className={styles.tarjeta}>
            <h2 className={styles.seccionTitulo}>
              {form.id ? `Editar producto #${form.id}` : 'Nuevo producto'}
            </h2>

            <form onSubmit={guardar} className={styles.grilla}>
              <label className={`${styles.campo} ${styles.campoAncho}`}>
                <span>Nombre *</span>
                <input
                  name="nombre" type="text" required
                  value={form.nombre} onChange={handleChange}
                  placeholder="Ej: Rose Velvet"
                />
              </label>

              <label className={`${styles.campo} ${styles.campoAncho}`}>
                <span>Descripción</span>
                <textarea
                  name="descripcion" rows={3}
                  value={form.descripcion} onChange={handleChange}
                  placeholder="Notas, fragancia, características..."
                />
              </label>

              <label className={styles.campo}>
                <span>Precio (ARS) *</span>
                <input
                  name="precio" type="text" inputMode="numeric" required
                  value={form.precio} onChange={handleChange}
                  placeholder="22500 o 22.500"
                />
                <small className={styles.hint}>Podés escribirlo como 22500 o 22.500</small>
              </label>

              <label className={styles.campo}>
                <span>Stock</span>
                <input
                  name="stock" type="text" inputMode="numeric"
                  value={form.stock} onChange={handleChange}
                  placeholder="10"
                />
              </label>

              <label className={styles.campo}>
                <span>Categoría</span>
                <select name="categoria_id" value={form.categoria_id} onChange={handleChange}>
                  <option value="">— Sin categoría —</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </label>

              <label className={styles.campo}>
                <span>Tamaño</span>
                <input
                  name="tamanio" type="text"
                  value={form.tamanio} onChange={handleChange}
                  placeholder="180 g / 250 ml"
                />
              </label>

              <label className={`${styles.campo} ${styles.campoAncho}`}>
                <span>Aroma / fragancia</span>
                <input
                  name="aroma" type="text"
                  value={form.aroma} onChange={handleChange}
                  placeholder="Rosa, vainilla, ámbar..."
                />
              </label>

              <label className={`${styles.campo} ${styles.campoAncho}`}>
                <span>URL de imagen</span>
                <input
                  name="imagen_url" type="text"
                  value={form.imagen_url} onChange={handleChange}
                  placeholder="/prod-rose-velvet.png"
                />
                <small className={styles.hint}>
                  Tip: tus imágenes están en la carpeta <code>public/</code>. Poné la ruta empezando con <code>/</code>.
                </small>
              </label>

              <div className={styles.checkbox}>
                <label>
                  <input
                    type="checkbox" name="destacado"
                    checked={form.destacado} onChange={handleChange}
                  />
                  <span>Destacado</span>
                </label>
                <label>
                  <input
                    type="checkbox" name="activo"
                    checked={form.activo} onChange={handleChange}
                  />
                  <span>Activo (visible en la web)</span>
                </label>
              </div>

              <div className={styles.acciones}>
                {form.id && (
                  <button type="button" onClick={() => setForm(FORM_VACIO)} className={styles.botonCancelar}>
                    Cancelar
                  </button>
                )}
                <button type="submit" className={styles.botonGuardar}>
                  {form.id ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </section>

          {/* ── LISTA DE PRODUCTOS ─────────────────────────────────────── */}
          <section className={styles.tarjeta}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 className={styles.seccionTitulo} style={{ margin: 0 }}>
                Productos en la base ({productos.length})
              </h2>
              <button
                type="button"
                onClick={cargarTodo}
                className={styles.botonCancelar}
                title="Recargar productos desde la base"
              >
                🔄 Refrescar
              </button>
            </div>

            <div className={styles.tablaWrap}>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Categoría</th>
                    <th>Activo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => (
                    <tr key={p.id} className={!p.activo ? styles.filaInactiva : ''}>
                      <td>{p.id}</td>
                      <td>{p.nombre}</td>
                      <td>{formatPrecio(p.precio)}</td>
                      <td>{p.stock}</td>
                      <td>{p.categorias?.nombre ?? '—'}</td>
                      <td>{p.activo ? '✓' : '✕'}</td>
                      <td className={styles.celdaAcciones}>
                        <button onClick={() => editar(p)} className={styles.btnEditar}>Editar</button>
                        <button onClick={() => alternarActivo(p)} className={styles.btnAlternar}>
                          {p.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button onClick={() => borrar(p.id)} className={styles.btnBorrar}>Borrar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────────── */}
          {/*  ÓRDENES                                                        */}
          {/* ──────────────────────────────────────────────────────────────── */}

          {mensajeOrden.texto && (
            <div className={`${styles.aviso} ${styles[mensajeOrden.tipo]}`} role="status">
              {mensajeOrden.texto}
            </div>
          )}

          {/* Lista de TODAS las órdenes */}
          <section className={styles.tarjeta}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 className={styles.seccionTitulo} style={{ margin: 0 }}>
                Órdenes ({ordenes.length})
              </h2>
              {!creandoOrden && !editandoOrden.id && (
                <button
                  type="button"
                  onClick={() => setCreandoOrden(true)}
                  className={styles.botonGuardar}
                >
                  + Crear orden manual
                </button>
              )}
            </div>

            <div className={styles.tablaWrap}>
              <table className={styles.tabla}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Método</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.map((o) => (
                    <tr key={o.id}>
                      <td>#{o.id}</td>
                      <td>{new Date(o.created_at).toLocaleDateString('es-AR')}</td>
                      <td>
                        <div style={{ fontSize: 13 }}>{o.email || '—'}</div>
                        {o.nombre_envio && <small style={{ color: '#888' }}>{o.nombre_envio}</small>}
                      </td>
                      <td>{o.metodo_pago || '—'}</td>
                      <td>{formatPrecio(o.total)}</td>
                      <td>
                        <span className={`${styles.badge} ${styles['badge_' + o.estado]}`}>
                          {o.estado}
                        </span>
                      </td>
                      <td className={styles.celdaAcciones}>
                        <button onClick={() => editarOrden(o)} className={styles.btnEditar}>Editar</button>
                        <button onClick={() => borrarOrden(o.id)} className={styles.btnBorrar}>Borrar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ordenes.length === 0 && (
                <p style={{ textAlign: 'center', padding: 30, color: '#888' }}>
                  Todavía no hay órdenes registradas.
                </p>
              )}
            </div>
          </section>

          {/* Formulario de EDICIÓN de orden (se muestra solo si hay una orden cargada) */}
          {editandoOrden.id && (
            <section id="form-editar-orden" className={styles.tarjeta}>
              <h2 className={styles.seccionTitulo}>Editar orden #{editandoOrden.id}</h2>

              <form onSubmit={guardarOrden} className={styles.grilla}>
                <label className={styles.campo}>
                  <span>Estado</span>
                  <select
                    value={editandoOrden.estado}
                    onChange={(e) => setEditandoOrden(p => ({ ...p, estado: e.target.value }))}
                  >
                    {ESTADOS_ORDEN.map((est) => (
                      <option key={est} value={est}>{est}</option>
                    ))}
                  </select>
                </label>

                <label className={styles.campo}>
                  <span>Método de pago</span>
                  <select
                    value={editandoOrden.metodo_pago}
                    onChange={(e) => setEditandoOrden(p => ({ ...p, metodo_pago: e.target.value }))}
                  >
                    <option value="">— Seleccionar —</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="mercadopago">Mercado Pago</option>
                  </select>
                </label>

                <label className={styles.campo}>
                  <span>Nombre del envío</span>
                  <input
                    type="text"
                    value={editandoOrden.nombre_envio}
                    onChange={(e) => setEditandoOrden(p => ({ ...p, nombre_envio: e.target.value }))}
                  />
                </label>

                <label className={styles.campo}>
                  <span>Email</span>
                  <input
                    type="email"
                    value={editandoOrden.email}
                    onChange={(e) => setEditandoOrden(p => ({ ...p, email: e.target.value }))}
                  />
                </label>

                <label className={`${styles.campo} ${styles.campoAncho}`}>
                  <span>Dirección de envío</span>
                  <input
                    type="text"
                    value={editandoOrden.direccion_envio}
                    onChange={(e) => setEditandoOrden(p => ({ ...p, direccion_envio: e.target.value }))}
                  />
                </label>

                <div className={styles.acciones}>
                  <button
                    type="button"
                    onClick={() => setEditandoOrden(EDITAR_ORDEN_VACIA)}
                    className={styles.botonCancelar}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={styles.botonGuardar}>
                    Guardar cambios
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Formulario de CREACIÓN de orden manual */}
          {creandoOrden && (
            <section id="form-crear-orden" className={styles.tarjeta}>
              <h2 className={styles.seccionTitulo}>Nueva orden manual</h2>

              {/* Aviso DENTRO del form para que se vea sí o sí al darle "Crear orden" */}
              {mensajeOrden.texto && (
                <div className={`${styles.aviso} ${styles[mensajeOrden.tipo]}`} role="status">
                  {mensajeOrden.texto}
                </div>
              )}

              <form onSubmit={crearOrdenManual} className={styles.grilla}>
                <label className={`${styles.campo} ${styles.campoAncho}`}>
                  <span>Email del cliente *</span>
                  <input
                    type="email"
                    value={nuevaOrden.email_cliente}
                    onChange={(e) => setNuevaOrden(p => ({ ...p, email_cliente: e.target.value }))}
                    placeholder="cliente@ejemplo.com"
                    required
                  />
                  <small className={styles.hint}>
                    Tiene que ser un email de un usuario ya registrado en la web.
                  </small>
                </label>

                <label className={styles.campo}>
                  <span>Método de pago</span>
                  <select
                    value={nuevaOrden.metodo_pago}
                    onChange={(e) => setNuevaOrden(p => ({ ...p, metodo_pago: e.target.value }))}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="mercadopago">Mercado Pago</option>
                  </select>
                </label>

                <label className={styles.campo}>
                  <span>Nombre del envío (opcional)</span>
                  <input
                    type="text"
                    value={nuevaOrden.nombre_envio}
                    onChange={(e) => setNuevaOrden(p => ({ ...p, nombre_envio: e.target.value }))}
                    placeholder="Si no se completa, se usa el del cliente"
                  />
                </label>

                <label className={`${styles.campo} ${styles.campoAncho}`}>
                  <span>Dirección de envío (opcional)</span>
                  <input
                    type="text"
                    value={nuevaOrden.direccion_envio}
                    onChange={(e) => setNuevaOrden(p => ({ ...p, direccion_envio: e.target.value }))}
                    placeholder="Si no se completa, se usa la del cliente"
                  />
                </label>

                {/* Lista de productos a agregar */}
                <div className={styles.campoAncho}>
                  <span style={{ fontWeight: 500, color: '#333', fontSize: 14 }}>Productos *</span>
                  {nuevaOrden.productos.length === 0 && (
                    <p style={{ color: '#888', fontSize: 13, margin: '8px 0' }}>
                      Todavía no agregaste productos. Hacé clic en "+ Agregar producto".
                    </p>
                  )}
                  {nuevaOrden.productos.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                      <select
                        value={item.producto_id}
                        onChange={(e) => modificarProductoNueva(i, 'producto_id', e.target.value)}
                        style={{ flex: 2, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 10 }}
                        required
                      >
                        <option value="">— Seleccionar producto —</option>
                        {productos.filter(p => p.activo).map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.nombre} ({formatPrecio(prod.precio)}) · stock: {prod.stock}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={item.cantidad}
                        onChange={(e) => modificarProductoNueva(i, 'cantidad', e.target.value)}
                        placeholder="Cant."
                        style={{ width: 80, padding: '10px 14px', border: '1px solid #ddd', borderRadius: 10 }}
                      />
                      <button
                        type="button"
                        onClick={() => quitarProductoNueva(i)}
                        className={styles.btnBorrar}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={agregarProductoANueva}
                    className={styles.botonCancelar}
                    style={{ marginTop: 12 }}
                  >
                    + Agregar producto
                  </button>
                </div>

                <div className={styles.acciones}>
                  <button
                    type="button"
                    onClick={() => { setCreandoOrden(false); setNuevaOrden(ORDEN_VACIA) }}
                    className={styles.botonCancelar}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={styles.botonGuardar}>
                    Crear orden
                  </button>
                </div>
              </form>
            </section>
          )}


        </div>
      </main>
      <Footer />
    </>
  )
}
