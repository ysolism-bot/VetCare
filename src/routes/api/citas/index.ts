import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../../db/index.js'
import { citas, mascotas, propietarios } from '../../../../db/schema.js'
import { eq, desc } from 'drizzle-orm'

export const Route = createFileRoute('/api/citas/')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const rows = await db
            .select({
              id: citas.id,
              fecha: citas.fecha,
              hora: citas.hora,
              motivo: citas.motivo,
              estado: citas.estado,
              notas: citas.notas,
              creadoEn: citas.creadoEn,
              mascotaId: citas.mascotaId,
              mascotaNombre: mascotas.nombre,
              mascotaEspecie: mascotas.especie,
              propietarioNombre: propietarios.nombreCompleto,
              propietarioCelular: propietarios.celular,
            })
            .from(citas)
            .innerJoin(mascotas, eq(citas.mascotaId, mascotas.id))
            .innerJoin(propietarios, eq(mascotas.propietarioId, propietarios.id))
            .orderBy(citas.fecha, citas.hora)

          return Response.json(rows)
        } catch (err) {
          console.error(err)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const { mascotaId, fecha, hora, motivo, notas } = body
          if (!mascotaId || !fecha || !hora || !motivo) {
            return Response.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
          }
          const [row] = await db
            .insert(citas)
            .values({ mascotaId: parseInt(mascotaId), fecha, hora, motivo, notas: notas || null, estado: 'programada' })
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
