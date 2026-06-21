/**
 * VetCare - Módulo: Propietarios y Mascotas
 * Clases involucradas: Propietario, Mascota
 * Patrón: Vista compuesta (PropietarioCard + MascotaForm dentro del mismo módulo)
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { AuthProvider, useAuth } from '../lib/AuthContext.js'
import { AppLayout } from '../components/AppLayout.js'
import {
  PawPrint, UserPlus, Search, Edit2, Trash2, X, Save, Plus,
  Phone, Mail, MapPin, AlertCircle, ChevronDown, Dog,
} from 'lucide-react'

export const Route = createFileRoute('/propietarios')({
  component: () => (
    <AuthProvider>
      <Guard />
    </AuthProvider>
  ),
})

function Guard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  useEffect(() => { if (!loading && !user) navigate({ to: '/login' }) }, [user, loading])
  if (loading) return <Spinner />
  if (!user) return null
  return <AppLayout><PropietariosPage /></AppLayout>
}

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

// ─── Tipos / Interfaces (modelos del dominio en cliente) ──────────────────────

interface Propietario {
  id: number
  nombreCompleto: string
  dni: string
  celular: string | null
  correo: string | null
  direccion: string | null
  observaciones: string | null
  creadoEn: string
}

interface Mascota {
  id: number
  propietarioId: number
  nombre: string
  especie: string
  raza: string | null
  sexo: string | null
  color: string | null
  fechaNacimiento: string | null
  microchip: string | null
  esterilizado: boolean
  alergias: string | null
  creadoEn: string
  propietarioNombre: string
  propietarioCelular: string | null
  propietarioDni: string
}

const EMPTY_PROP = { nombreCompleto: '', dni: '', celular: '', correo: '', direccion: '', observaciones: '' }
const EMPTY_MASC = { propietarioId: '', nombre: '', especie: 'perro', raza: '', sexo: '', color: '', fechaNacimiento: '', microchip: '', esterilizado: false, alergias: '' }

const ESPECIE_OPTS = ['perro', 'gato', 'ave', 'reptil', 'otro']
const ESPECIE_EMOJI: Record<string, string> = { perro: '🐕', gato: '🐈', ave: '🦜', reptil: '🦎', otro: '🐾' }

// ─── Vista principal ──────────────────────────────────────────────────────────

function PropietariosPage() {
  const [tab, setTab] = useState<'mascotas' | 'propietarios'>('mascotas')
  const [mascotas, setMascotas] = useState<Mascota[]>([])
  const [propietarios, setPropietarios] = useState<Propietario[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  // Modals
  const [showPropModal, setShowPropModal] = useState(false)
  const [showMascModal, setShowMascModal] = useState(false)
  const [editPropId, setEditPropId] = useState<number | null>(null)
  const [editMascId, setEditMascId] = useState<number | null>(null)
  const [propForm, setPropForm] = useState({ ...EMPTY_PROP })
  const [mascForm, setMascForm] = useState({ ...EMPTY_MASC })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: number } | null>(null)

  const { user } = useAuth()
  const searchRef = useRef<ReturnType<typeof setTimeout>>()

  async function loadData(query = '') {
    setLoading(true)
    try {
      const [mRes, pRes] = await Promise.all([
        fetch(`/api/mascotas/?q=${encodeURIComponent(query)}`),
        fetch(`/api/propietarios/?q=${encodeURIComponent(query)}`),
      ])
      if (mRes.ok) setMascotas(await mRes.json())
      if (pRes.ok) setPropietarios(await pRes.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  function handleSearch(val: string) {
    setQ(val)
    clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => loadData(val), 300)
  }

  // ── Propietario CRUD ──────────────────────────────────────────────────────

  function openNewProp() {
    setEditPropId(null); setPropForm({ ...EMPTY_PROP }); setErrors({}); setApiError(''); setShowPropModal(true)
  }
  function openEditProp(p: Propietario) {
    setEditPropId(p.id)
    setPropForm({ nombreCompleto: p.nombreCompleto, dni: p.dni, celular: p.celular ?? '', correo: p.correo ?? '', direccion: p.direccion ?? '', observaciones: p.observaciones ?? '' })
    setErrors({}); setApiError(''); setShowPropModal(true)
  }

  function validateProp() {
    const e: Record<string, string> = {}
    if (!propForm.nombreCompleto.trim()) e.nombreCompleto = 'Nombre requerido'
    if (!propForm.dni.trim()) e.dni = 'DNI requerido'
    else if (!/^\d{7,8}$/.test(propForm.dni.trim())) e.dni = 'DNI inválido (7-8 dígitos)'
    return e
  }

  async function submitProp(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateProp()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({}); setApiError(''); setSubmitting(true)
    try {
      const url = editPropId ? `/api/propietarios/${editPropId}` : '/api/propietarios/'
      const method = editPropId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...propForm, celular: propForm.celular || null, correo: propForm.correo || null, direccion: propForm.direccion || null, observaciones: propForm.observaciones || null }) })
      if (!res.ok) { const d = await res.json(); setApiError(d.error || 'Error al guardar'); return }
      setShowPropModal(false); loadData(q)
    } finally { setSubmitting(false) }
  }

  async function deleteProp(id: number) {
    await fetch(`/api/propietarios/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null); loadData(q)
  }

  // ── Mascota CRUD ──────────────────────────────────────────────────────────

  function openNewMasc() {
    setEditMascId(null); setMascForm({ ...EMPTY_MASC }); setErrors({}); setApiError(''); setShowMascModal(true)
  }
  function openEditMasc(m: Mascota) {
    setEditMascId(m.id)
    setMascForm({ propietarioId: String(m.propietarioId), nombre: m.nombre, especie: m.especie, raza: m.raza ?? '', sexo: m.sexo ?? '', color: m.color ?? '', fechaNacimiento: m.fechaNacimiento ?? '', microchip: m.microchip ?? '', esterilizado: m.esterilizado, alergias: m.alergias ?? '' })
    setErrors({}); setApiError(''); setShowMascModal(true)
  }

  function validateMasc() {
    const e: Record<string, string> = {}
    if (!mascForm.propietarioId) e.propietarioId = 'Seleccione propietario'
    if (!mascForm.nombre.trim()) e.nombre = 'Nombre requerido'
    if (!mascForm.especie) e.especie = 'Especie requerida'
    return e
  }

  async function submitMasc(e: React.FormEvent) {
    e.preventDefault()
    const errs = validateMasc()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({}); setApiError(''); setSubmitting(true)
    try {
      const url = editMascId ? `/api/mascotas/${editMascId}` : '/api/mascotas/'
      const method = editMascId ? 'PUT' : 'POST'
      const payload = { ...mascForm, propietarioId: parseInt(mascForm.propietarioId), raza: mascForm.raza || null, sexo: mascForm.sexo || null, color: mascForm.color || null, fechaNacimiento: mascForm.fechaNacimiento || null, microchip: mascForm.microchip || null, alergias: mascForm.alergias || null }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const d = await res.json(); setApiError(d.error || 'Error al guardar'); return }
      setShowMascModal(false); loadData(q)
    } finally { setSubmitting(false) }
  }

  async function deleteMasc(id: number) {
    await fetch(`/api/mascotas/${id}`, { method: 'DELETE' })
    setDeleteConfirm(null); loadData(q)
  }

  const canEdit = user?.rol !== 'recepcionista'

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
            Propietarios y Mascotas
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {mascotas.length} mascota{mascotas.length !== 1 ? 's' : ''} · {propietarios.length} propietario{propietarios.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={openNewProp}>
            <UserPlus size={15} />Nuevo Propietario
          </button>
          <button className="btn-primary" onClick={openNewMasc}>
            <PawPrint size={15} />Registrar Mascota
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button className={`tab-btn${tab === 'mascotas' ? ' active' : ''}`} onClick={() => setTab('mascotas')}>🐾 Mascotas</button>
        <button className={`tab-btn${tab === 'propietarios' ? ' active' : ''}`} onClick={() => setTab('propietarios')}>👤 Propietarios</button>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: 20, maxWidth: 400 }}>
        <Search size={16} className="search-icon" />
        <input className="input-field" placeholder="Buscar por nombre o DNI..." value={q} onChange={e => handleSearch(e.target.value)} />
      </div>

      {/* ── Tabla Mascotas ── */}
      {tab === 'mascotas' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                Cargando mascotas...
              </div>
            ) : mascotas.length === 0 ? (
              <div className="empty-state"><PawPrint size={40} /><div>No hay mascotas registradas</div></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Mascota</th>
                    <th>Especie / Raza</th>
                    <th>Propietario</th>
                    <th>Sexo</th>
                    <th>Esterilizado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {mascotas.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 22 }}>{ESPECIE_EMOJI[m.especie] ?? '🐾'}</span>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{m.nombre}</div>
                            {m.color && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.color}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${m.especie}`}>{m.especie}</span>
                        {m.raza && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{m.raza}</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{m.propietarioNombre}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>DNI: {m.propietarioDni}</div>
                      </td>
                      <td>{m.sexo ?? '—'}</td>
                      <td>
                        <span style={{ fontSize: 13 }}>{m.esterilizado ? '✅ Sí' : '❌ No'}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {canEdit && (
                            <>
                              <button className="btn-secondary btn-sm" onClick={() => openEditMasc(m)} title="Editar">
                                <Edit2 size={13} />
                              </button>
                              <button className="btn-danger btn-sm" onClick={() => setDeleteConfirm({ type: 'masc', id: m.id })} title="Eliminar">
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Tabla Propietarios ── */}
      {tab === 'propietarios' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-container">
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              </div>
            ) : propietarios.length === 0 ? (
              <div className="empty-state"><UserPlus size={40} /><div>No hay propietarios registrados</div></div>
            ) : (
              <table>
                <thead>
                  <tr><th>Propietario</th><th>DNI</th><th>Contacto</th><th>Dirección</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                  {propietarios.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="initials-circle">{p.nombreCompleto.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{p.nombreCompleto}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{p.dni}</td>
                      <td>
                        {p.celular && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}><Phone size={12} />{p.celular}</div>}
                        {p.correo && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-muted)' }}><Mail size={12} />{p.correo}</div>}
                      </td>
                      <td>
                        {p.direccion ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}><MapPin size={12} />{p.direccion}</div>
                        ) : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {canEdit && (
                            <>
                              <button className="btn-secondary btn-sm" onClick={() => openEditProp(p)}><Edit2 size={13} /></button>
                              <button className="btn-danger btn-sm" onClick={() => setDeleteConfirm({ type: 'prop', id: p.id })}><Trash2 size={13} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Propietario ── */}
      {showPropModal && (
        <div className="modal-overlay" onClick={() => setShowPropModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {editPropId ? 'Editar Propietario' : 'Nuevo Propietario'}
              </h2>
              <button onClick={() => setShowPropModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><X size={18} /></button>
            </div>
            <form onSubmit={submitProp}>
              <div className="modal-body">
                {apiError && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#fb7185', fontSize: 14 }}><AlertCircle size={14} />{apiError}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Nombre Completo *</label>
                    <input className={`input-field${errors.nombreCompleto ? ' error' : ''}`} value={propForm.nombreCompleto} onChange={e => setPropForm(p => ({ ...p, nombreCompleto: e.target.value }))} />
                    {errors.nombreCompleto && <span style={{ fontSize: 12, color: '#fb7185' }}>{errors.nombreCompleto}</span>}
                  </div>
                  <div className="form-group">
                    <label>DNI *</label>
                    <input className={`input-field${errors.dni ? ' error' : ''}`} value={propForm.dni} onChange={e => setPropForm(p => ({ ...p, dni: e.target.value }))} maxLength={8} />
                    {errors.dni && <span style={{ fontSize: 12, color: '#fb7185' }}>{errors.dni}</span>}
                  </div>
                  <div className="form-group">
                    <label>Celular</label>
                    <input className="input-field" value={propForm.celular} onChange={e => setPropForm(p => ({ ...p, celular: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Correo</label>
                    <input className="input-field" type="email" value={propForm.correo} onChange={e => setPropForm(p => ({ ...p, correo: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Dirección</label>
                    <input className="input-field" value={propForm.direccion} onChange={e => setPropForm(p => ({ ...p, direccion: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Observaciones</label>
                    <textarea className="input-field" rows={2} value={propForm.observaciones} onChange={e => setPropForm(p => ({ ...p, observaciones: e.target.value }))} style={{ resize: 'vertical' }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowPropModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  <Save size={14} />{submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Mascota ── */}
      {showMascModal && (
        <div className="modal-overlay" onClick={() => setShowMascModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {editMascId ? 'Editar Mascota' : 'Registrar Mascota'}
              </h2>
              <button onClick={() => setShowMascModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><X size={18} /></button>
            </div>
            <form onSubmit={submitMasc}>
              <div className="modal-body">
                {apiError && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#fb7185', fontSize: 14 }}><AlertCircle size={14} />{apiError}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Propietario *</label>
                    <select className={`input-field${errors.propietarioId ? ' error' : ''}`} value={mascForm.propietarioId} onChange={e => setMascForm(m => ({ ...m, propietarioId: e.target.value }))}>
                      <option value="">Seleccionar propietario...</option>
                      {propietarios.map(p => <option key={p.id} value={p.id}>{p.nombreCompleto} — DNI {p.dni}</option>)}
                    </select>
                    {errors.propietarioId && <span style={{ fontSize: 12, color: '#fb7185' }}>{errors.propietarioId}</span>}
                  </div>
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input className={`input-field${errors.nombre ? ' error' : ''}`} value={mascForm.nombre} onChange={e => setMascForm(m => ({ ...m, nombre: e.target.value }))} placeholder="Ej: Luna, Max..." />
                    {errors.nombre && <span style={{ fontSize: 12, color: '#fb7185' }}>{errors.nombre}</span>}
                  </div>
                  <div className="form-group">
                    <label>Especie *</label>
                    <select className="input-field" value={mascForm.especie} onChange={e => setMascForm(m => ({ ...m, especie: e.target.value }))}>
                      {ESPECIE_OPTS.map(e => <option key={e} value={e}>{ESPECIE_EMOJI[e]} {e}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Raza</label>
                    <input className="input-field" value={mascForm.raza} onChange={e => setMascForm(m => ({ ...m, raza: e.target.value }))} placeholder="Ej: Golden Retriever" />
                  </div>
                  <div className="form-group">
                    <label>Sexo</label>
                    <select className="input-field" value={mascForm.sexo} onChange={e => setMascForm(m => ({ ...m, sexo: e.target.value }))}>
                      <option value="">No especificado</option>
                      <option value="macho">Macho</option>
                      <option value="hembra">Hembra</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Color</label>
                    <input className="input-field" value={mascForm.color} onChange={e => setMascForm(m => ({ ...m, color: e.target.value }))} placeholder="Ej: Dorado, Negro..." />
                  </div>
                  <div className="form-group">
                    <label>Fecha de Nacimiento</label>
                    <input type="date" className="input-field" value={mascForm.fechaNacimiento} onChange={e => setMascForm(m => ({ ...m, fechaNacimiento: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Microchip</label>
                    <input className="input-field" value={mascForm.microchip} onChange={e => setMascForm(m => ({ ...m, microchip: e.target.value }))} placeholder="Nro. de microchip" />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, gridColumn: '1/-1' }}>
                    <input type="checkbox" id="esterilizado" checked={mascForm.esterilizado} onChange={e => setMascForm(m => ({ ...m, esterilizado: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                    <label htmlFor="esterilizado" style={{ margin: 0, cursor: 'pointer' }}>Esterilizado/a</label>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <label>Alergias conocidas</label>
                    <textarea className="input-field" rows={2} value={mascForm.alergias} onChange={e => setMascForm(m => ({ ...m, alergias: e.target.value }))} placeholder="Ej: Alergia a penicilina..." style={{ resize: 'vertical' }} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowMascModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  <Save size={14} />{submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm delete ── */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="card" style={{ padding: 28, maxWidth: 380, width: '100%' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 12, fontSize: 16, fontWeight: 700 }}>¿Confirmar eliminación?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn-danger" onClick={() => deleteConfirm.type === 'prop' ? deleteProp(deleteConfirm.id) : deleteMasc(deleteConfirm.id)}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
