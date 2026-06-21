import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../lib/AuthContext.js'
import { AppLayout } from '../components/AppLayout.js'
import { Stethoscope, Plus, X, Save, Search, AlertCircle, CheckCircle2, Activity } from 'lucide-react'

export const Route = createFileRoute('/tratamientos')({
  component: () => <AuthProvider><Guard /></AuthProvider>,
})

function Guard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  useEffect(() => { if (!loading && !user) navigate({ to: '/login' }) }, [user, loading])
  if (loading) return <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /></div>
  if (!user) return null
  return <AppLayout><TratamientosPage /></AppLayout>
}

interface Tratamiento {
  id: number; diagnostico: string; descripcion: string|null; medicacion: string|null
  costoTotal: string; cuotasPactadas: number; saldoPendiente: string; activo: boolean
  mascotaId: number; mascotaNombre: string; mascotaEspecie: string; propietarioNombre: string; creadoEn: string
}
interface Mascota { id: number; nombre: string; especie: string; propietarioNombre: string }
const ESPECIE_EMOJI: Record<string,string> = { perro:'🐕', gato:'🐈', ave:'🦜', reptil:'🦎', otro:'🐾' }
const EMPTY = { mascotaId:'', diagnostico:'', descripcion:'', medicacion:'', costoTotal:'', cuotasPactadas:'1' }

function TratamientosPage() {
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([])
  const [mascotas, setMascotas] = useState<Mascota[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({...EMPTY})
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [tabActivo, setTabActivo] = useState<'activos'|'todos'>('activos')

  async function load() {
    setLoading(true)
    const [tRes, mRes] = await Promise.all([fetch('/api/tratamientos/'), fetch('/api/mascotas/')])
    if (tRes.ok) setTratamientos(await tRes.json())
    if (mRes.ok) setMascotas(await mRes.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = tratamientos
    .filter(t => tabActivo === 'activos' ? t.activo : true)
    .filter(t => t.mascotaNombre.toLowerCase().includes(q.toLowerCase()) || t.propietarioNombre.toLowerCase().includes(q.toLowerCase()) || t.diagnostico.toLowerCase().includes(q.toLowerCase()))

  function openNew() { setForm({...EMPTY}); setErrors({}); setApiError(''); setShowModal(true) }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string,string> = {}
    if (!form.mascotaId) errs.mascotaId = 'Seleccione mascota'
    if (!form.diagnostico.trim()) errs.diagnostico = 'Diagnóstico requerido'
    if (!form.costoTotal || isNaN(parseFloat(form.costoTotal))) errs.costoTotal = 'Costo inválido'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({}); setApiError(''); setSubmitting(true)
    try {
      const res = await fetch('/api/tratamientos/', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...form, mascotaId: parseInt(form.mascotaId), costoTotal: parseFloat(form.costoTotal), cuotasPactadas: parseInt(form.cuotasPactadas) || 1, descripcion: form.descripcion || null, medicacion: form.medicacion || null}) })
      if (!res.ok) { const d = await res.json(); setApiError(d.error || 'Error al guardar'); return }
      setShowModal(false); load()
    } finally { setSubmitting(false) }
  }

  async function cerrarTratamiento(id: number) {
    await fetch(`/api/tratamientos/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ activo: false }) })
    load()
  }

  const pct = (t: Tratamiento) => {
    const total = parseFloat(t.costoTotal)
    const saldo = parseFloat(t.saldoPendiente)
    if (total === 0) return 100
    return Math.round(((total - saldo) / total) * 100)
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', marginBottom:4, letterSpacing:'-0.02em' }}>Tratamientos Clínicos</h1>
          <p style={{ fontSize:14, color:'var(--text-muted)' }}>{tratamientos.filter(t=>t.activo).length} activo{tratamientos.filter(t=>t.activo).length!==1?'s':''}</p>
        </div>
        <button className="btn-primary" onClick={openNew}><Plus size={15} />Nuevo Tratamiento</button>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        <button className={`tab-btn${tabActivo==='activos'?' active':''}`} onClick={() => setTabActivo('activos')}>⚡ Activos</button>
        <button className={`tab-btn${tabActivo==='todos'?' active':''}`} onClick={() => setTabActivo('todos')}>📋 Todos</button>
      </div>

      <div className="search-bar" style={{ marginBottom:20, maxWidth:400 }}>
        <Search size={16} className="search-icon" />
        <input className="input-field" placeholder="Buscar por mascota, propietario o diagnóstico..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ padding:48, textAlign:'center', color:'var(--text-muted)' }}>
          <div style={{ width:28, height:28, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />Cargando...
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><Stethoscope size={40} /><div>No hay tratamientos registrados</div></div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:16 }}>
          {filtered.map(t => (
            <div key={t.id} className="card" style={{ padding:20 }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:28 }}>{ESPECIE_EMOJI[t.mascotaEspecie]??'🐾'}</span>
                  <div>
                    <div style={{ fontWeight:700, color:'var(--text-primary)', fontSize:15 }}>{t.mascotaNombre}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)' }}>{t.propietarioNombre}</div>
                  </div>
                </div>
                <span className={`badge ${t.activo ? 'badge-en_atencion' : 'badge-completada'}`}>{t.activo ? 'Activo' : 'Cerrado'}</span>
              </div>
              <div style={{ marginBottom:12 }}>
                <div style={{ fontWeight:600, color:'var(--text-primary)', fontSize:14, marginBottom:4 }}>{t.diagnostico}</div>
                {t.descripcion && <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:4 }}>{t.descripcion}</div>}
                {t.medicacion && <div style={{ fontSize:12, color:'var(--text-muted)', fontStyle:'italic' }}>💊 {t.medicacion}</div>}
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                  <span style={{ color:'var(--text-muted)' }}>Progreso de pago</span>
                  <span style={{ fontWeight:700, color:'var(--accent-light)' }}>{pct(t)}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width:`${pct(t)}%` }} /></div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginTop:6, color:'var(--text-muted)' }}>
                  <span>Total: S/ {parseFloat(t.costoTotal).toFixed(2)}</span>
                  <span style={{ color:'#f59e0b' }}>Saldo: S/ {parseFloat(t.saldoPendiente).toFixed(2)}</span>
                </div>
              </div>
              {t.activo && (
                <button className="btn-secondary btn-sm" style={{ width:'100%', justifyContent:'center', display:'flex', alignItems:'center', gap:6 }} onClick={() => cerrarTratamiento(t.id)}>
                  <CheckCircle2 size={13} />Marcar como Cerrado
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize:17, fontWeight:700, color:'var(--text-primary)', margin:0 }}>Nuevo Tratamiento</h2>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}><X size={18} /></button>
            </div>
            <form onSubmit={submit}>
              <div className="modal-body">
                {apiError && <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.3)', borderRadius:10, padding:'10px 14px', marginBottom:16, color:'#fb7185', fontSize:14 }}><AlertCircle size={14} />{apiError}</div>}
                <div className="form-group">
                  <label>Mascota *</label>
                  <select className={`input-field${errors.mascotaId?' error':''}`} value={form.mascotaId} onChange={e => setForm(f => ({...f, mascotaId:e.target.value}))}>
                    <option value="">Seleccionar mascota...</option>
                    {mascotas.map((m:any) => <option key={m.id} value={m.id}>{ESPECIE_EMOJI[m.especie]??'🐾'} {m.nombre} — {m.propietarioNombre}</option>)}
                  </select>
                  {errors.mascotaId && <span style={{ fontSize:12, color:'#fb7185' }}>{errors.mascotaId}</span>}
                </div>
                <div className="form-group">
                  <label>Diagnóstico *</label>
                  <input className={`input-field${errors.diagnostico?' error':''}`} value={form.diagnostico} onChange={e => setForm(f => ({...f, diagnostico:e.target.value}))} placeholder="Ej: Infección bacteriana, fractura..." />
                  {errors.diagnostico && <span style={{ fontSize:12, color:'#fb7185' }}>{errors.diagnostico}</span>}
                </div>
                <div className="form-group">
                  <label>Descripción del tratamiento</label>
                  <textarea className="input-field" rows={3} value={form.descripcion} onChange={e => setForm(f => ({...f, descripcion:e.target.value}))} placeholder="Procedimientos, indicaciones..." style={{ resize:'vertical' }} />
                </div>
                <div className="form-group">
                  <label>Medicación indicada</label>
                  <input className="input-field" value={form.medicacion} onChange={e => setForm(f => ({...f, medicacion:e.target.value}))} placeholder="Ej: Amoxicilina 250mg..." />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div className="form-group">
                    <label>Costo Total (S/) *</label>
                    <input type="number" min="0" step="0.01" className={`input-field${errors.costoTotal?' error':''}`} value={form.costoTotal} onChange={e => setForm(f => ({...f, costoTotal:e.target.value}))} />
                    {errors.costoTotal && <span style={{ fontSize:12, color:'#fb7185' }}>{errors.costoTotal}</span>}
                  </div>
                  <div className="form-group">
                    <label>Cuotas Pactadas</label>
                    <input type="number" min="1" className="input-field" value={form.cuotasPactadas} onChange={e => setForm(f => ({...f, cuotasPactadas:e.target.value}))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={submitting}><Save size={14} />{submitting?'Guardando...':'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
