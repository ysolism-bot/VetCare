/**
 * VetCare - Página de Login
 * Clase: LoginPage — gestiona el formulario de autenticación y redirección
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../lib/AuthContext.js'
import { PawPrint, Eye, EyeOff, AlertCircle, Heart } from 'lucide-react'

export const Route = createFileRoute('/login')({
  component: () => (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  ),
})

function LoginPage() {
  const navigate = useNavigate()
  const { login, user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) navigate({ to: '/dashboard' })
  }, [user, loading])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Por favor ingrese email y contraseña')
      return
    }
    setSubmitting(true)
    const result = await login(email, password)
    setSubmitting(false)
    if (result.error) {
      setError(result.error)
    } else {
      navigate({ to: '/dashboard' })
    }
  }

  const DEMO_CREDS = [
    { rol: 'Administrador', email: 'admin@vetcare.com', pass: 'admin123' },
    { rol: 'Veterinario/a', email: 'vet@vetcare.com', pass: 'vet123' },
    { rol: 'Recepcionista', email: 'recep@vetcare.com', pass: 'recep123' },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decoración de fondo */}
      <div
        style={{
          position: 'absolute',
          top: -250,
          right: -200,
          width: 700,
          height: 700,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -200,
          left: -200,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{ width: '100%', maxWidth: 420, animation: 'fadeIn 0.4s ease-out' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #a855f7 0%, #6d28d9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 0 48px rgba(168,85,247,0.35)',
            }}
          >
            <PawPrint size={30} color="#fff" />
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: 6,
              letterSpacing: '-0.03em',
            }}
          >
            VetCare
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Sistema de Gestión Veterinaria
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 24,
            }}
          >
            Iniciar Sesión
          </h2>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(244,63,94,0.1)',
                border: '1px solid rgba(244,63,94,0.3)',
                borderRadius: 10,
                padding: '10px 14px',
                marginBottom: 20,
                color: '#fb7185',
                fontSize: 14,
              }}
            >
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input
                type="email"
                className="input-field"
                placeholder="correo@vetcare.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label>Contraseña</label>
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 44 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(6px)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: 2,
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={submitting}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  Verificando...
                </span>
              ) : (
                'Ingresar al Sistema'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div
            style={{
              marginTop: 24,
              padding: '14px',
              background: 'var(--bg-secondary)',
              borderRadius: 10,
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                fontWeight: 700,
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Accesos de demostración
            </div>
            {DEMO_CREDS.map((cred) => (
              <button
                key={cred.rol}
                type="button"
                onClick={() => {
                  setEmail(cred.email)
                  setPassword(cred.pass)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  transition: 'background 0.15s',
                  marginBottom: 2,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--bg-card)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
              >
                <span style={{ fontWeight: 600 }}>{cred.rol}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                  {cred.email}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            textAlign: 'center',
            marginTop: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <Heart size={11} color="var(--accent)" fill="var(--accent)" />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            VetCare © 2026 — UNDAC
          </span>
        </div>
      </div>
    </div>
  )
}
