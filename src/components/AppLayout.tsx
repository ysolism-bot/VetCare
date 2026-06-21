/**
 * VetCare - Componente: AppLayout
 * Responsabilidad: estructura visual compartida del sistema (sidebar + topbar + contenido)
 */

import React, { useState } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useAuth } from '../lib/AuthContext.js'
import {
  LayoutDashboard,
  PawPrint,
  Calendar,
  Stethoscope,
  Receipt,
  LogOut,
  Menu,
  X,
  Heart,
} from 'lucide-react'

// ─── Configuración de navegación (roles permitidos por módulo) ─────────────────
const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Panel de Control',
    icon: LayoutDashboard,
    roles: ['administrador', 'veterinario', 'recepcionista'],
  },
  {
    to: '/propietarios',
    label: 'Propietarios y Mascotas',
    icon: PawPrint,
    roles: ['administrador', 'veterinario', 'recepcionista'],
  },
  {
    to: '/citas',
    label: 'Agenda de Citas',
    icon: Calendar,
    roles: ['administrador', 'veterinario', 'recepcionista'],
  },
  {
    to: '/tratamientos',
    label: 'Tratamientos',
    icon: Stethoscope,
    roles: ['administrador', 'veterinario'],
  },
  {
    to: '/facturacion',
    label: 'Facturación',
    icon: Receipt,
    roles: ['administrador'],
  },
]

const ROL_LABEL: Record<string, string> = {
  administrador: 'Administrador',
  veterinario: 'Veterinario/a',
  recepcionista: 'Recepcionista',
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const routerState = useRouterState()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const currentPath = routerState.location.pathname

  async function handleLogout() {
    await logout()
    navigate({ to: '/login' })
  }

  const visibleNav = NAV_ITEMS.filter((item) =>
    user ? item.roles.includes(user.rol) : false,
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 29,
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <nav className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div
          style={{
            padding: '20px 20px 16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 16px rgba(168,85,247,0.4)',
              }}
            >
              <PawPrint size={18} color="#fff" />
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                }}
              >
                VetCare
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Clínica Veterinaria
              </div>
            </div>
          </div>
        </div>

        {/* Navegación */}
        <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          <div
            style={{
              padding: '0 8px 8px 16px',
              fontSize: 10,
              color: 'var(--text-muted)',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Módulos
          </div>
          {visibleNav.map((item) => {
            const active = currentPath.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`sidebar-nav-item${active ? ' active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Usuario + logout */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div className="avatar-circle">
              {getInitials(user?.nombre ?? 'VT')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.nombre}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {ROL_LABEL[user?.rol ?? ''] ?? user?.rol}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(244,63,94,0.2)',
              background: 'transparent',
              color: '#f43f5e',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'rgba(244,63,94,0.08)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'transparent')
            }
          >
            <LogOut size={14} />
            Cerrar Sesión
          </button>

          <div
            style={{
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid var(--border)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                marginBottom: 2,
              }}
            >
              <Heart size={10} color="var(--accent)" fill="var(--accent)" />
              <p
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                VetCare © 2026 — UNDAC
              </p>
            </div>
            <p
              style={{
                fontSize: 9,
                color: 'var(--text-muted)',
                opacity: 0.6,
                margin: 0,
              }}
            >
              Ingeniería de Software II
            </p>
          </div>
        </div>
      </nav>

      {/* ── Contenido principal ──────────────────────────────────────────────── */}
      <div className="main-content" style={{ flex: 1 }}>
        {/* Topbar */}
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: 'none',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: 4,
              }}
              className="mobile-menu-btn"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {visibleNav.find((n) => currentPath.startsWith(n.to))?.label ??
                'VetCare System'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {ROL_LABEL[user?.rol ?? ''] ?? ''}
            </div>
            <div className="avatar-circle" style={{ fontSize: 11 }}>
              {getInitials(user?.nombre ?? 'VT')}
            </div>
          </div>
        </div>

        {/* Contenido de la página */}
        <div className="page-content">{children}</div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </div>
  )
}
