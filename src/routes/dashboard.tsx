/**
 * VetCare - Módulo: Dashboard
 * Clase: DashboardView — panel de control con métricas del día
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../lib/AuthContext.js'
import { AppLayout } from '../components/AppLayout.js'
import {
  Calendar, DollarSign, PawPrint, Activity,
  CheckCircle2, AlertTriangle, RefreshCw, Clock, Heart,
} from 'lucide-react'

export const Route = createFileRoute('/dashboard')({
  component: () => (
    <AuthProvider>
      <DashboardGuard />
    </AuthProvider>
  ),
})

function DashboardGuard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (!loading && !user) navigate({ to: '/login' })
  }, [user, loading])
  if (loading) return <LoadingScreen />
  if (!user) return null
  return <AppLayout><Dashboard /></AppLayout>
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cargando VetCare...</span>
      </div>
    </div>
  )
}

interface DashStats {
  citasHoy: Array<{ id: number; hora: string; motivo: string; estado: string; mascotaNombre: string; mascotaEspecie: string; propietarioNombre: string }>
  pagosPendientesMes: Array<{ id: number; concepto: string; monto: string; propietarioNombre: string }>
  totalPendienteMes: string
  totalCobradoMes: string
  tratamientosActivos: number
  totalMascotas: number
}

const MOTIVO_LABEL: Record<string, string> = {
  consulta_general: 'Consulta General',
  vacunacion: 'Vacunación',
  cirugia: 'Cirugía',
  estetica: 'Estética',
  urgencia: 'Urgencia',
}

const ESPECIE_EMOJI: Record<string, string> = {
  perro: '🐕', gato: '🐈', ave: '🦜', reptil: '🦎', otro: '🐾',
}

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [markingPaid, setMarkingPaid] = useState<number | null>(null)

  async function loadStats() {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/stats')
      if (res.ok) setStats(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadStats() }, [])

  async function marcarPagado(pagoId: number) {
    setMarkingPaid(pagoId)
    await fetch(`/api/pagos/${pagoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: 'pagado' }),
    })
    setMarkingPaid(null)
    loadStats()
  }

  const todayStr = new Date().toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '-0.02em' }}>
          Bienvenido/a, {user?.nombre.split(' ')[0]} 👋
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
          {todayStr}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard icon={<Calendar size={20} />} label="Citas de Hoy" value={loading ? '—' : String(stats?.citasHoy.length ?? 0)} color="#6366f1" />
        <StatCard icon={<PawPrint size={20} />} label="Mascotas Registradas" value={loading ? '—' : String(stats?.totalMascotas ?? 0)} color="#a855f7" />
        <StatCard icon={<Activity size={20} />} label="Tratamientos Activos" value={loading ? '—' : String(stats?.tratamientosActivos ?? 0)} color="#c084fc" />
        <StatCard icon={<DollarSign size={20} />} label="Cobrado este Mes" value={loading ? '—' : `S/ ${parseFloat(stats?.totalCobradoMes ?? '0').toLocaleString('es-PE', { minimumFractionDigits: 2 })}`} color="#10b981" />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,0.7fr)', gap: 20 }}>
        {/* Citas del día */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={16} color="var(--accent)" />
              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>Agenda del Día</span>
            </div>
            <button onClick={loadStats} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
              <RefreshCw size={14} />
            </button>
          </div>
          <div>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
                Cargando citas...
              </div>
            ) : stats?.citasHoy.length === 0 ? (
              <div className="empty-state">
                <Heart size={40} />
                <div>Sin citas programadas para hoy</div>
              </div>
            ) : (
              stats?.citasHoy.map(cita => (
                <div key={cita.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(168,85,247,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontSize: 28, lineHeight: 1 }}>{ESPECIE_EMOJI[cita.mascotaEspecie] ?? '🐾'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>
                      {cita.mascotaNombre}
                      <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 12 }}> — {cita.propietarioNombre}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {MOTIVO_LABEL[cita.motivo] ?? cita.motivo}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--accent-light)', fontSize: 13, fontWeight: 700 }}>
                    <Clock size={12} />{cita.hora}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagos pendientes */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="#f59e0b" />
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15 }}>Cobros Pendientes</span>
          </div>
          <div>
            {loading ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
              </div>
            ) : stats?.pagosPendientesMes.length === 0 ? (
              <div className="empty-state">
                <CheckCircle2 size={36} />
                <div>Sin cobros pendientes</div>
              </div>
            ) : (
              stats?.pagosPendientesMes.slice(0, 8).map(pago => (
                <div key={pago.id} style={{ padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{pago.propietarioNombre}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pago.concepto}</div>
                    </div>
                    <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: 14, whiteSpace: 'nowrap' }}>
                      S/ {parseFloat(pago.monto).toFixed(2)}
                    </span>
                  </div>
                  <button
                    className="btn-success btn-sm"
                    style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => marcarPagado(pago.id)}
                    disabled={markingPaid === pago.id}
                  >
                    <CheckCircle2 size={13} />
                    {markingPaid === pago.id ? 'Procesando...' : 'Marcar Pagado'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}1a`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</div>
    </div>
  )
}
