import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../lib/AuthContext.js'
import { AppLayout } from '../components/AppLayout.js'
import { Calendar, Plus, Edit2, Trash2, X, Save, Search, AlertCircle, Clock } from 'lucide-react'

export const Route = createFileRoute('/citas')({
  component: () => <AuthProvider><Guard /></AuthProvider>,
})

function Guard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  useEffect(() => { if (!loading && !user) navigate({ to: '/login' }) }, [user, loading])
  if (loading) return <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /></div>
  if (!user) return null
  return <AppLayout><CitasPage /></AppLayout>
}

interface Cita {
  id: number; fecha: string; hora: string; motivo: string; estado: string; notas: string | null
  mascotaId: number; mascotaNombre: string; mascotaEspecie: string
  propietarioNombre: string; propietarioCelular: string | null
}
interface Mascota { id: number; nombre: string; especie: string; propietarioNombre: string }

const MOTIVO_OPTS = ['consulta_general','vacunacion','cirugia','estetica','urgencia']
const MOTIVO_LABEL: Record<string,string> = { consulta_general:'Consulta General', vacunacion:'Vacunación', cirugia:'Cirugía', estetica:'Estética', urgencia:'Urgencia' }
const ESTADO_OPTS = ['programada','en_atencion','completada','cancelada']
const ESPECIE_EMOJI: Record<string,string> = { perro:'🐕', gato:'🐈', ave:'🦜', reptil:'🦎', otro:'🐾' }
const EMPTY = { mascotaId: '', fecha: '', hora: '09:00', motivo: 'consulta_general', notas: '' }

function CitasPage() {
  const [citas, setCitas] = useState<Cita[]>([])
  const [mascotas, setMascotas] = useState<Mascota[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number|null>(null)
  const [form, setForm] = useState({...EMPTY})
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [delConfirm, setDelConfirm] = useState<number|null>(null)
  const { user } = useAuth()

  async function load() {
    setLoading(true)
    const [cRes, mRes] = await Promise.all([fetch('/api/citas/'), fetch('/api/mascotas/')])
    if (cRes.ok) setCitas(await cRes.json())
    if (mRes.ok) setMascotas(await mRes.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = citas.filter(c =>
    c.mascotaNombre.toLowerCase().includes(q.toLowerCase()) ||
    c.propietarioNombre.toLowerCase().includes(q.toLowerCase())
  )

  function openNew() { setEditId(null); setForm({...EMPTY}); setErrors({}); setApiError(''); setShowModal(true) }
  function openEdit(c: Cita) {
    setEditId(c.id)
    setForm({ mascotaId: String(c.mascotaId), fecha: c.fecha, hora: c.hora, motivo: c.motivo, notas: c.notas ?? '' })
    setErrors({}); setApiError(''); setShowModal(true)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string,string> = {}
    if (!form.mascotaId) errs.mascotaId = 'Seleccione mascota'
    if (!form.fecha) errs.fecha = 'Fecha requerida'
    if (!form.hora) errs.hora = 'Hora requerida'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({}); setApiError(''); setSubmitting(true)
    try {
      const url = editId ? `/api/citas/${editId}` : '/api/citas/'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify({...form, mascotaId: parseInt(form.mascotaId), notas: form.notas || null}) })
      if (!res.ok) { const d = await res.json(); setApiError(d.error || 'Error al guardar'); return }
      setShowModal(false); load()
    } finally { setSubmitting(false) }
  }

  async function cambiarEstado(id: number, estado: string) {
    await fetch(`/api/citas/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ estado }) })
    load()
  }

  async function deleteCita(id: number) {
    await fetch(`/api/citas/${id}`, { method: 'DELETE' })
    setDelConfirm(null); load()
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>Agenda de Citas</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{citas.length} cita{citas.length !== 1 ? 's' : ''} registrada{citas.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={openNew}><Plus size={15} />Nueva Cita</button>
      </div>

      <div className="search-bar" style={{ marginBottom: 20, maxWidth: 400 }}>
        <Search size={16} className="search-icon" />
        <input className="input-field" placeholder="Buscar mascota o propietario..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ width: 28, height: 28, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />Cargando citas...
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><Calendar size={40} /><div>No hay citas registradas</div></div>
          ) : (
            <table>
              <thead><tr><th>Fecha / Hora</th><th>Mascota</th><th>Propietario</th><th>Motivo</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{new Date(c.fecha + 'T12:00:00').toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' })}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent-light)' }}><Clock size={11} />{c.hora}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{ESPECIE_EMOJI[c.mascotaEspecie] ?? '🐾'}</span>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{c.mascotaNombre}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.mascotaEspecie}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>{c.propietarioNombre}</td>
                    <td><span className="badge badge-programada" style={{ fontSize: 11 }}>{MOTIVO_LABEL[c.motivo] ?? c.motivo}</span></td>
                    <td>
                      <select value={c.estado} onChange={e => cambiarEstado(c.id, e.target.value)}
                        className={`badge badge-${c.estado}`}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'inherit', outline: 'none' }}>
                        {ESTADO_OPTS.map(s => <option key={s} value={s} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-secondary btn-sm" onClick={() => openEdit(c)}><Edit2 size={13} /></button>
                        <button className="btn-danger btn-sm" onClick={() => setDelConfirm(c.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{editId ? 'Editar Cita' : 'Nueva Cita'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><X size={18} /></button>
            </div>
            <form onSubmit={submit}>
              <div className="modal-body">
                {apiError && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#fb7185', fontSize: 14 }}><AlertCircle size={14} />{apiError}</div>}
                <div className="form-group">
                  <label>Mascota *</label>
                  <select className={`input-field${errors.mascotaId ? ' error' : ''}`} value={form.mascotaId} onChange={e => setForm(f => ({...f, mascotaId: e.target.value}))}>
                    <option value="">Seleccionar mascota...</option>
                    {mascotas.map((m: any) => <option key={m.id} value={m.id}>{ESPECIE_EMOJI[m.especie] ?? '🐾'} {m.nombre} — {m.propietarioNombre}</option>)}
                  </select>
                  {errors.mascotaId && <span style={{ fontSize: 12, color: '#fb7185' }}>{errors.mascotaId}</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>Fecha *</label>
                    <input type="date" className={`input-field${errors.fecha ? ' error' : ''}`} value={form.fecha} onChange={e => setForm(f => ({...f, fecha: e.target.value}))} />
                    {errors.fecha && <span style={{ fontSize: 12, color: '#fb7185' }}>{errors.fecha}</span>}
                  </div>
                  <div className="form-group">
                    <label>Hora *</label>
                    <input type="time" className="input-field" value={form.hora} onChange={e => setForm(f => ({...f, hora: e.target.value}))} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Motivo</label>
                  <select className="input-field" value={form.motivo} onChange={e => setForm(f => ({...f, motivo: e.target.value}))}>
                    {MOTIVO_OPTS.map(m => <option key={m} value={m}>{MOTIVO_LABEL[m]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Notas adicionales</label>
                  <textarea className="input-field" rows={3} value={form.notas} onChange={e => setForm(f => ({...f, notas: e.target.value}))} placeholder="Observaciones, instrucciones previas..." style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={submitting}><Save size={14} />{submitting ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {delConfirm && (
        <div className="modal-overlay">
          <div className="card" style={{ padding: 28, maxWidth: 360, width: '100%' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 12, fontSize: 16, fontWeight: 700 }}>¿Eliminar cita?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setDelConfirm(null)}>Cancelar</button>
              <button className="btn-danger" onClick={() => deleteCita(delConfirm)}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
