import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../../db/index.js'
import { citas } from '../../../../db/schema.js'
import { eq } from 'drizzle-orm'

export const Route = createFileRoute('/api/citas/$id')({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        try {
          const id = parseInt(params.id)
          const body = await request.json()
          const { fecha, hora, motivo, estado, notas } = body
          const [row] = await db
            .update(citas)
            .set({ fecha, hora, motivo, estado, notas: notas || null })
            .where(eq(citas.id, id))
            .returning()
          return Response.json(row)
        } catch (err) {
          console.error(err)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      },

      DELETE: async ({ params }) => {
        try {
          await db.delete(citas).where(eq(citas.id, parseInt(params.id)))
          return Response.json({ ok: true })
        } catch (err) {
          console.error(err)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      },
    },
  },
})
