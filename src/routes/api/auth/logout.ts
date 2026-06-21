import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../../db/index.js'
import { sesiones } from '../../../../db/schema.js'
import { eq } from 'drizzle-orm'

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const cookie = request.headers.get('cookie') || ''
        const match = cookie.match(/vetcare_session=([^;]+)/)
        if (match) {
          await db.delete(sesiones).where(eq(sesiones.id, match[1]))
        }
        return Response.json(
          { ok: true },
          {
            headers: {
              'Set-Cookie': 'vetcare_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0',
            },
          },
        )
      },
    },
  },
})
