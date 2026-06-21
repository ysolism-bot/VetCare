import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../../db/index.js'
import { pagos, propietarios } from '../../../../db/schema.js'
import { eq, desc, sum, count } from 'drizzle-orm'

export const Route = createFileRoute('/api/pagos/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const tipo = url.searchParams.get('tipo')

          const rows = await db
            .select({
              id: pagos.id,
              concepto: pagos.concepto,
              monto: pagos.monto,
              estado: pagos.estado,
              tipoServicio: pagos.tipoServicio,
              fechaPago: pagos.fechaPago,
              creadoEn: pagos.creadoEn,
              propietarioId: pagos.propietarioId,
              propietarioNombre: propietarios.nombreCompleto,
            })
            .from(pagos)
            .innerJoin(propietarios, eq(pagos.propietarioId, propietarios.id))
            .orderBy(desc(pagos.creadoEn))

          if (tipo === 'reporte') {
            const frecuentes = await db
              .select({ concepto: pagos.concepto, conteo: count(), total: sum(pagos.monto) })
              .from(pagos)
              .groupBy(pagos.concepto)
              .orderBy(desc(count()))
              .limit(10)
            return Response.json({ rows, frecuentes })
          }

          return Response.json(rows)
        } catch (err) {
          console.error(err)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const { propietarioId, concepto, monto, tipoServicio } = body
          if (!propietarioId || !concepto || !monto) {
            return Response.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
          }
          const [row] = await db
            .insert(pagos)
            .values({ propietarioId: parseInt(propietarioId), concepto, monto: monto.toString(), tipoServicio: tipoServicio || null, estado: 'pendiente' })
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
