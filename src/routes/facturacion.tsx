import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../lib/AuthContext.js'
import { AppLayout } from '../components/AppLayout.js'
import { Receipt, Plus, X, Save, CheckCircle2, AlertCircle, Search } from 'lucide-react'

export const Route = createFileRoute('/facturacion')({
  component: () => <AuthProvider><Guard /></AuthProvider>,
})

function Guard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (!loading && !user) navigate({ to: '/login' })
    if (!loading && user && user.rol !== 'administrador') navigate({ to: '/dashboard' })
  }, [user, loading])
  if (loading) return <div style={{ minHeight:'100vh', background:'var(--bg-primary)', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} /></div>
  if (!user) return null
  return <AppLayout><FacturacionPage /></AppLayout>
}

interface Pago {
  id: number; concepto: string; monto: string; estado: string; tipoServicio: string|null
  fechaPago: string|null; creadoEn: string; propietarioId: number; propietarioNombre: string
}
interface Propietario { id: number; nombreCompleto: string; dni: string }

const TIPO_OPTS = ['consulta','vacuna','cirugia','estetica','tratamiento','otro']
const EMPTY = { propietarioId:'', concepto:'', monto:'', tipoServicio:'consulta' }

function FacturacionPage() {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [propietarios, setPropietarios] = useState<Propietario[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<'pendientes'|'pagados'|'todos'>('pendientes')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({...EMPTY})
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [markingId, setMarkingId] = useState<number|null>(null)

  async function load() {
    setLoading(true)
    const [pRes, prRes] = await Promise.all([fetch('/api/pagos/'), fetch('/api/propietarios/')])
    if (pRes.ok) setPagos(await pRes.json())
    if (prRes.ok) setPropietarios(await prRes.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = pagos
    .filter(p => tab === 'todos' ? true : tab === 'pendientes' ? p.estado === 'pendiente' : p.estado === 'pagado')
    .filter(p => p.propietarioNombre.toLowerCase().includes(q.toLowerCase()) || p.concepto.toLowerCase().includes(q.toLowerCase()))

  const totalPendiente = pagos.filter(p => p.estado === 'pendiente').reduce((s, p) => s + parseFloat(p.monto), 0)
  const totalCobrado = pagos.filter(p => p.estado === 'pagado').reduce((s, p) => s + parseFloat(p.monto), 0)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string,string> = {}
    if (!form.propietarioId) errs.propietarioId = 'Seleccione propietario'
    if (!form.concepto.trim()) errs.concepto = 'Concepto requerido'
    if (!form.monto || isNaN(parseFloat(form.monto))) errs.monto = 'Monto inválido'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({}); setApiError(''); setSubmitting(true)
    try {
      const res = await fetch('/api/pagos/', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...form, propietarioId: parseInt(form.propietarioId), monto: parseFloat(form.monto)}) })
      if (!res.ok) { const d = await res.json(); setApiError(d.error || 'Error'); return }
      setShowModal(false); load()
    } finally { setSubmitting(false) }
  }

  async function marcarPagado(id: number) {
    setMarkingId(id)
    await fetch(`/api/pagos/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ estado:'pagado' }) })
    setMarkingId(null); load()
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'var(--text-primary)', marginBottom:4, letterSpacing:'-0.02em' }}>Facturación</h1>
          <p style={{ fontSize:14, color:'var(--text-muted)' }}>Gestión de cobros y pagos</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm({...EMPTY}); setErrors({}); setApiError(''); setShowModal(true) }}><Plus size={15} />Registrar Cobro</button>
      </div>

      {/* Resumen */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:16, marginBottom:24 }}>
        <div className="stat-card">
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:8 }}>Total Pendiente</div>
          <div style={{ fontSize:24, fontWeight:800, color:'#f59e0b', letterSpacing:'-0.02em' }}>S/ {totalPendiente.toLocaleString('es-PE',{minimumFractionDigits:2})}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:8 }}>Total Cobrado</div>
          <div style={{ fontSize:24, fontWeight:800, color:'#10b981', letterSpacing:'-0.02em' }}>S/ {totalCobrado.toLocaleString('es-PE',{minimumFractionDigits:2})}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:8 }}>Total Registros</div>
          <div style={{ fontSize:24, fontWeight:800, color:'var(--accent-light)', letterSpacing:'-0.02em' }}>{pagos.length}</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        <button className={`tab-btn${tab==='pendientes'?' active':''}`} onClick={() => setTab('pendientes')}>⏳ Pendientes ({pagos.filter(p=>p.estado==='pendiente').length})</button>
        <button className={`tab-btn${tab==='pagados'?' active':''}`} onClick={() => setTab('pagados')}>✅ Pagados</button>
        <button className={`tab-btn${tab==='todos'?' active':''}`} onClick={() => setTab('todos')}>📋 Todos</button>
      </div>

      <div className="search-bar" style={{ marginBottom:20, maxWidth:400 }}>
        <Search size={16} className="search-icon" />
        <input className="input-field" placeholder="Buscar por propietario o concepto..." value={q} onChange={e => setQ(e.target.value)} />
      </div>

      <div className="card" style={{ overflow:'hidden' }}>
        <div className="table-container">
          {loading ? (
            <div style={{ padding:48, textAlign:'center', color:'var(--text-muted)' }}><div style={{ width:28, height:28, border:'2px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }} />Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><Receipt size={40} /><div>No hay registros</div></div>
          ) : (
            <table>
              <thead><tr><th>Propietario</th><th>Concepto</th><th>Tipo</th><th>Monto</th><th>Estado</th><th>Fecha</th><th>Acción</th></tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight:600, color:'var(--text-primary)', fontSize:13 }}>{p.propietarioNombre}</td>
                    <td style={{ fontSize:13 }}>{p.concepto}</td>
                    <td>{p.tipoServicio ? <span className="badge badge-programada" style={{ fontSize:11 }}>{p.tipoServicio}</span> : '—'}</td>
                    <td style={{ fontWeight:700, color: p.estado==='pagado'?'#10b981':'#f59e0b', fontSize:14 }}>S/ {parseFloat(p.monto).toFixed(2)}</td>
                    <td><span className={`badge badge-${p.estado}`}>{p.estado}</span></td>
                    <td style={{ fontSize:12, color:'var(--text-muted)' }}>{p.fechaPago ? new Date(p.fechaPago+'T12:00:00').toLocaleDateString('es-PE') : new Date(p.creadoEn).toLocaleDateString('es-PE')}</td>
                    <td>
                      {p.estado === 'pendiente' && (
                        <button className="btn-success btn-sm" style={{ display:'flex', alignItems:'center', gap:5 }} onClick={() => marcarPagado(p.id)} disabled={markingId===p.id}>
                          <CheckCircle2 size={13} />{markingId===p.id?'...':'Cobrado'}
                        </button>
                      )}
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
              <h2 style={{ fontSize:17, fontWeight:700, color:'var(--text-primary)', margin:0 }}>Registrar Cobro</h2>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}><X size={18} /></button>
            </div>
            <form onSubmit={submit}>
              <div className="modal-body">
                {apiError && <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(244,63,94,0.1)', border:'1px solid rgba(244,63,94,0.3)', borderRadius:10, padding:'10px 14px', marginBottom:16, color:'#fb7185', fontSize:14 }}><AlertCircle size={14} />{apiError}</div>}
                <div className="form-group">
                  <label>Propietario *</label>
                  <select className={`input-field${errors.propietarioId?' error':''}`} value={form.propietarioId} onChange={e => setForm(f => ({...f, propietarioId:e.target.value}))}>
                    <option value="">Seleccionar propietario...</option>
                    {propietarios.map(p => <option key={p.id} value={p.id}>{p.nombreCompleto} — {p.dni}</option>)}
                  </select>
                  {errors.propietarioId && <span style={{ fontSize:12, color:'#fb7185' }}>{errors.propietarioId}</span>}
                </div>
                <div className="form-group">
                  <label>Concepto *</label>
                  <input className={`input-field${errors.concepto?' error':''}`} value={form.concepto} onChange={e => setForm(f => ({...f, concepto:e.target.value}))} placeholder="Ej: Consulta general, Vacuna antirrábica..." />
                  {errors.concepto && <span style={{ fontSize:12, color:'#fb7185' }}>{errors.concepto}</span>}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div className="form-group">
                    <label>Monto (S/) *</label>
                    <input type="number" min="0" step="0.01" className={`input-field${errors.monto?' error':''}`} value={form.monto} onChange={e => setForm(f => ({...f, monto:e.target.value}))} />
                    {errors.monto && <span style={{ fontSize:12, color:'#fb7185' }}>{errors.monto}</span>}
                  </div>
                  <div className="form-group">
                    <label>Tipo de Servicio</label>
                    <select className="input-field" value={form.tipoServicio} onChange={e => setForm(f => ({...f, tipoServicio:e.target.value}))}>
                      {TIPO_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={submitting}><Save size={14} />{submitting?'Guardando...':'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
