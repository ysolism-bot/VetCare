/**
 * VetCare - API: /api/mascotas/
 * Controlador: MascotaController
 * Gestiona el CRUD de Propietarios y Mascotas (entidades relacionadas)
 */

import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../../db/index.js'
import { propietarios, mascotas } from '../../../../db/schema.js'
import { like, or, desc, eq } from 'drizzle-orm'

export const Route = createFileRoute('/api/mascotas/')({
  server: {
    handlers: {
      // ── GET: listar mascotas con datos del propietario ──────────────────────
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const q = url.searchParams.get('q') || ''

          let rows = await db
            .select({
              id: mascotas.id,
              nombre: mascotas.nombre,
              especie: mascotas.especie,
              raza: mascotas.raza,
              sexo: mascotas.sexo,
              color: mascotas.color,
              fechaNacimiento: mascotas.fechaNacimiento,
              microchip: mascotas.microchip,
              esterilizado: mascotas.esterilizado,
              alergias: mascotas.alergias,
              creadoEn: mascotas.creadoEn,
              propietarioId: mascotas.propietarioId,
              propietarioNombre: propietarios.nombreCompleto,
              propietarioCelular: propietarios.celular,
              propietarioDni: propietarios.dni,
            })
            .from(mascotas)
            .innerJoin(propietarios, eq(mascotas.propietarioId, propietarios.id))
            .orderBy(desc(mascotas.creadoEn))

          if (q) {
            rows = rows.filter(
              (r) =>
                r.nombre.toLowerCase().includes(q.toLowerCase()) ||
                r.propietarioNombre.toLowerCase().includes(q.toLowerCase()) ||
                r.propietarioDni.includes(q),
            )
          }

          return Response.json(rows)
        } catch (err) {
          console.error(err)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      },

      // ── POST: registrar nueva mascota ───────────────────────────────────────
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const {
            propietarioId, nombre, especie, raza, sexo, color,
            fechaNacimiento, microchip, esterilizado, alergias,
          } = body

          if (!propietarioId || !nombre || !especie) {
            return Response.json({ error: 'Propietario, nombre y especie son requeridos' }, { status: 400 })
          }

          const [row] = await db
            .insert(mascotas)
            .values({
              propietarioId: parseInt(propietarioId),
              nombre,
              especie,
              raza: raza || null,
              sexo: sexo || null,
              color: color || null,
              fechaNacimiento: fechaNacimiento || null,
              microchip: microchip || null,
              esterilizado: !!esterilizado,
              alergias: alergias || null,
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
