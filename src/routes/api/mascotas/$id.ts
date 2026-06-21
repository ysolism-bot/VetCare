import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../../db/index.js'
import { mascotas } from '../../../../db/schema.js'
import { eq } from 'drizzle-orm'

export const Route = createFileRoute('/api/mascotas/$id')({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        try {
          const id = parseInt(params.id)
          const body = await request.json()
          const { nombre, especie, raza, sexo, color, fechaNacimiento, microchip, esterilizado, alergias } = body

          const [row] = await db
            .update(mascotas)
            .set({
              nombre, especie,
              raza: raza || null,
              sexo: sexo || null,
              color: color || null,
              fechaNacimiento: fechaNacimiento || null,
              microchip: microchip || null,
              esterilizado: !!esterilizado,
              alergias: alergias || null,
              actualizadoEn: new Date(),
            })
            .where(eq(mascotas.id, id))
            .returning()

          return Response.json(row)
        } catch (err) {
          console.error(err)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      },

      DELETE: async ({ params }) => {
        try {
          await db.delete(mascotas).where(eq(mascotas.id, parseInt(params.id)))
          return Response.json({ ok: true })
        } catch (err) {
          console.error(err)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      },
    },
  },
})
