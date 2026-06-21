import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../../db/index.js'
import { sesiones, usuarios } from '../../../../db/schema.js'
import { eq } from 'drizzle-orm'

export const Route = createFileRoute('/api/auth/me')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const cookie = request.headers.get('cookie') || ''
          const match = cookie.match(/vetcare_session=([^;]+)/)
          if (!match) return Response.json({ error: 'No autenticado' }, { status: 401 })

          const sessionId = match[1]
          const [session] = await db.select().from(sesiones).where(eq(sesiones.id, sessionId))

          if (!session || session.expiraEn < new Date()) {
            return Response.json({ error: 'Sesión expirada' }, { status: 401 })
          }

          const [user] = await db
            .select({ id: usuarios.id, nombre: usuarios.nombre, email: usuarios.email, rol: usuarios.rol })
            .from(usuarios)
            .where(eq(usuarios.id, session.usuarioId))

          if (!user) return Response.json({ error: 'Usuario no encontrado' }, { status: 401 })

          return Response.json({ user })
        } catch (err) {
          console.error(err)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      },
    },
  },
})
