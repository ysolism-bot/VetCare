/**
 * VetCare - Módulo de Autenticación
 * Clase: AuthService
 * Responsabilidades: hash de contraseñas, verificación y generación de tokens de sesión
 */

// ─── Clase: AuthService ────────────────────────────────────────────────────────
export class AuthService {
  private static readonly SALT = 'vetcare_secure_salt_2026'

  static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(password + this.SALT)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const computed = await this.hashPassword(password)
    return computed === hash
  }

  static generateSessionId(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('')
  }
}

// ─── Usuarios de demostración ──────────────────────────────────────────────────
export const DEMO_USERS = [
  {
    email: 'admin@vetcare.com',
    password: 'admin123',
    nombre: 'Dr. Luis Paredes',
    rol: 'administrador',
  },
  {
    email: 'vet@vetcare.com',
    password: 'vet123',
    nombre: 'Dra. Sofía Ríos',
    rol: 'veterinario',
  },
  {
    email: 'recep@vetcare.com',
    password: 'recep123',
    nombre: 'Carmen Torres',
    rol: 'recepcionista',
  },
]

// Compatibilidad con llamadas legacy
export async function hashPassword(password: string) {
  return AuthService.hashPassword(password)
}

export function generateSessionId() {
  return AuthService.generateSessionId()
}
