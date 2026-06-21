import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../../db/index.js'
import { mascotas, citas, pagos, tratamientosClínicos, propietarios } from '../../../../db/schema.js'
import { eq, and, gte, lte, sum, count } from 'drizzle-orm'

export const Route = createFileRoute('/api/dashboard/stats')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const today = new Date().toISOString().split('T')[0]
          const startOfMonth = today.slice(0, 8) + '01'
          const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
            .toISOString().split('T')[0]

          const citasHoy = await db
            .select({
              id: citas.id,
              hora: citas.hora,
              motivo: citas.motivo,
              estado: citas.estado,
              mascotaNombre: mascotas.nombre,
              mascotaEspecie: mascotas.especie,
              propietarioNombre: propietarios.nombreCompleto,
            })
            .from(citas)
            .innerJoin(mascotas, eq(citas.mascotaId, mascotas.id))
            .innerJoin(propietarios, eq(mascotas.propietarioId, propietarios.id))
            .where(and(eq(citas.fecha, today), eq(citas.estado, 'programada')))

          const pagosPendientes = await db
            .select({
              id: pagos.id,
              concepto: pagos.concepto,
              monto: pagos.monto,
              propietarioNombre: propietarios.nombreCompleto,
            })
            .from(pagos)
            .innerJoin(propietarios, eq(pagos.propietarioId, propietarios.id))
            .where(
              and(
                eq(pagos.estado, 'pendiente'),
                gte(pagos.creadoEn, new Date(startOfMonth)),
                lte(pagos.creadoEn, new Date(endOfMonth + 'T23:59:59')),
              ),
            )

          const tratamientosActivos = await db
            .select({ count: count() })
            .from(tratamientosClínicos)
            .where(eq(tratamientosClínicos.activo, true))

          const totalMascotas = await db.select({ count: count() }).from(mascotas)

          const totalCobrado = await db
            .select({ total: sum(pagos.monto) })
            .from(pagos)
            .where(
              and(
                eq(pagos.estado, 'pagado'),
                gte(pagos.creadoEn, new Date(startOfMonth)),
                lte(pagos.creadoEn, new Date(endOfMonth + 'T23:59:59')),
              ),
            )

          const totalPendiente = pagosPendientes.reduce(
            (acc, p) => acc + parseFloat(p.monto as string), 0,
          )

          return Response.json({
            citasHoy,
            pagosPendientesMes: pagosPendientes,
            totalPendienteMes: totalPendiente.toFixed(2),
            totalCobradoMes: parseFloat(totalCobrado[0]?.total ?? '0').toFixed(2),
            tratamientosActivos: tratamientosActivos[0]?.count ?? 0,
            totalMascotas: totalMascotas[0]?.count ?? 0,
          })
        } catch (err) {
          console.error(err)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      },
    },
  },
})
