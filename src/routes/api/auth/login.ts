/**
 * VetCare - API: POST /api/auth/login
 * Clase: AuthController — maneja la autenticación y creación de sesión
 */

import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../../db/index.js'
import { usuarios, sesiones } from '../../../../db/schema.js'
import { eq } from 'drizzle-orm'
import { AuthService, DEMO_USERS } from '../../../lib/auth.js'

// ─── Método: ensureDefaultUsers (inicializa usuarios demo si la BD está vacía) ─
async function ensureDefaultUsers() {
  const count = await db.select().from(usuarios).limit(1)
  if (count.length === 0) {
    for (const u of DEMO_USERS) {
      const hashed = await AuthService.hashPassword(u.password)
      await db
        .insert(usuarios)
        .values({ nombre: u.nombre, email: u.email, password: hashed, rol: u.rol })
        .onConflictDoNothing()
    }
  }
}

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await ensureDefaultUsers()
          const { email, password } = await request.json()
          if (!email || !password) {
            return Response.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
          }

          const [user] = await db
            .select()
            .from(usuarios)
            .where(eq(usuarios.email, email.toLowerCase()))

          if (!user || !(await AuthService.verifyPassword(password, user.password))) {
            return Response.json({ error: 'Credenciales inválidas' }, { status: 401 })
          }

          const sessionId = AuthService.generateSessionId()
          const expiraEn = new Date(Date.now() + 8 * 60 * 60 * 1000)

          await db.insert(sesiones).values({ id: sessionId, usuarioId: user.id, expiraEn })

          return Response.json(
            { user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol }, sessionId },
            {
              headers: {
                'Set-Cookie': `vetcare_session=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800`,
              },
            },
          )
        } catch (err) {
          console.error(err)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      },
    },
  },
})
