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

export default function AdminPage() {
  const { esAdmin, cargando: cargandoAuth } = useAuth()

  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [form, setForm] = useState(FORM_VACIO)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })

  // Trae productos y categorías de la base
  async function cargarTodo() {
    const { data: prods } = await supabase
      .from('productos').select('*, categorias(nombre)').order('id')
    setProductos(prods || [])

    const { data: cats } = await supabase.from('categorias').select('*').order('nombre')
    setCategorias(cats || [])
  }

  useEffect(() => { cargarTodo() }, [])

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

  // ── PROTECCIÓN ──────────────────────────────────────────────────────────
  if (cargandoAuth) {
    return (
      <>
        <Header />
        <main className={styles.pagina}><p style={{ padding: 40 }}>Cargando...</p></main>
        <Footer />
      </>
    )
  }
  if (!esAdmin) {
    return (
      <>
        <Header />
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
      <Header />
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
            <h2 className={styles.seccionTitulo}>
              Productos en la base ({productos.length})
            </h2>

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

        </div>
      </main>
      <Footer />
    </>
  )
}
