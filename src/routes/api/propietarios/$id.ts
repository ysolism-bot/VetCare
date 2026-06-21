import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../../db/index.js'
import { propietarios } from '../../../../db/schema.js'
import { eq } from 'drizzle-orm'

export const Route = createFileRoute('/api/propietarios/$id')({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        try {
          const id = parseInt(params.id)
          const body = await request.json()
          const { nombreCompleto, dni, celular, correo, direccion, observaciones } = body
          const [row] = await db
            .update(propietarios)
            .set({ nombreCompleto, dni, celular: celular || null, correo: correo || null, direccion: direccion || null, observaciones: observaciones || null, actualizadoEn: new Date() })
            .where(eq(propietarios.id, id))
            .returning()
          return Response.json(row)
        } catch (err) {
          console.error(err)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      },

      DELETE: async ({ params }) => {
        try {
          await db.delete(propietarios).where(eq(propietarios.id, parseInt(params.id)))
          return Response.json({ ok: true })
        } catch (err) {
          console.error(err)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      },
    },
  },
})
