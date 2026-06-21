/**
 * VetCare - Contexto de Autenticación
 * Patrón: Context + Hook (equivalente OOP al patrón Singleton de servicio de sesión)
 */

import React, { createContext, useContext, useEffect, useState } from 'react'

// ─── Interfaz: Usuario (define la forma del objeto Usuario en el cliente) ───────
interface Usuario {
  id: number
  nombre: string
  email: string
  rol: string
}

interface AuthContextType {
  user: Usuario | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  refetch: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({}),
  logout: async () => {},
  refetch: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchMe() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMe() }, [])

  async function login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) return { error: data.error || 'Error al iniciar sesión' }
    setUser(data.user)
    return {}
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
