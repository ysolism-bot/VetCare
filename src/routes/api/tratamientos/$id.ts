import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../../db/index.js'
import { tratamientosClínicos, notasEvolucion } from '../../../../db/schema.js'
import { eq, desc } from 'drizzle-orm'

export const Route = createFileRoute('/api/tratamientos/$id')({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        try {
          const id = parseInt(params.id)
          const body = await request.json()
          const { activo, saldoPendiente, diagnostico, descripcion, medicacion } = body
          const [row] = await db
            .update(tratamientosClínicos)
            .set({
              ...(activo !== undefined ? { activo } : {}),
              ...(saldoPendiente !== undefined ? { saldoPendiente: saldoPendiente.toString() } : {}),
              ...(diagnostico !== undefined ? { diagnostico } : {}),
              ...(descripcion !== undefined ? { descripcion } : {}),
              ...(medicacion !== undefined ? { medicacion } : {}),
              actualizadoEn: new Date(),
            })
            .where(eq(tratamientosClínicos.id, id))
            .returning()
          return Response.json(row)
        } catch (err) {
          console.error(err)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      },
    },
  },
})
