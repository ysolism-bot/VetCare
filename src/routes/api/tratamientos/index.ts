import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../../db/index.js'
import { tratamientosClínicos, mascotas, propietarios, notasEvolucion } from '../../../../db/schema.js'
import { eq, desc } from 'drizzle-orm'

export const Route = createFileRoute('/api/tratamientos/')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const rows = await db
            .select({
              id: tratamientosClínicos.id,
              diagnostico: tratamientosClínicos.diagnostico,
              descripcion: tratamientosClínicos.descripcion,
              medicacion: tratamientosClínicos.medicacion,
              costoTotal: tratamientosClínicos.costoTotal,
              cuotasPactadas: tratamientosClínicos.cuotasPactadas,
              saldoPendiente: tratamientosClínicos.saldoPendiente,
              activo: tratamientosClínicos.activo,
              creadoEn: tratamientosClínicos.creadoEn,
              mascotaId: tratamientosClínicos.mascotaId,
              mascotaNombre: mascotas.nombre,
              mascotaEspecie: mascotas.especie,
              propietarioNombre: propietarios.nombreCompleto,
            })
            .from(tratamientosClínicos)
            .innerJoin(mascotas, eq(tratamientosClínicos.mascotaId, mascotas.id))
            .innerJoin(propietarios, eq(mascotas.propietarioId, propietarios.id))
            .orderBy(desc(tratamientosClínicos.creadoEn))

          return Response.json(rows)
        } catch (err) {
          console.error(err)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const { mascotaId, diagnostico, descripcion, medicacion, costoTotal, cuotasPactadas } = body
          if (!mascotaId || !diagnostico || !costoTotal) {
            return Response.json({ error: 'Mascota, diagnóstico y costo son requeridos' }, { status: 400 })
          }
          const [row] = await db
            .insert(tratamientosClínicos)
            .values({
              mascotaId: parseInt(mascotaId),
              diagnostico,
              descripcion: descripcion || null,
              medicacion: medicacion || null,
              costoTotal: costoTotal.toString(),
              cuotasPactadas: parseInt(cuotasPactadas) || 1,
              saldoPendiente: costoTotal.toString(),
            })
            .returning()
          return Response.json(row, { status: 201 })
        } catch (err) {
          console.error(err)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      },
    },
  },
})
