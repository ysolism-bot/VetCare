import { createFileRoute } from '@tanstack/react-router'
import { db } from '../../../../db/index.js'
import { propietarios } from '../../../../db/schema.js'
import { like, or, desc } from 'drizzle-orm'

export const Route = createFileRoute('/api/propietarios/')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url)
          const q = url.searchParams.get('q') || ''
          let rows
          if (q) {
            rows = await db
              .select()
              .from(propietarios)
              .where(or(like(propietarios.nombreCompleto, `%${q}%`), like(propietarios.dni, `%${q}%`)))
              .orderBy(desc(propietarios.creadoEn))
          } else {
            rows = await db.select().from(propietarios).orderBy(desc(propietarios.creadoEn))
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
          const { nombreCompleto, dni, celular, correo, direccion, observaciones } = body
          if (!nombreCompleto || !dni) {
            return Response.json({ error: 'Nombre y DNI son requeridos' }, { status: 400 })
          }
          const [row] = await db
            .insert(propietarios)
            .values({ nombreCompleto, dni, celular: celular || null, correo: correo || null, direccion: direccion || null, observaciones: observaciones || null })
            .returning()
          return Response.json(row, { status: 201 })
        } catch (err: any) {
          if (err.message?.includes('unique')) {
            return Response.json({ error: 'El DNI ya está registrado' }, { status: 409 })
          }
          console.error(err)
          return Response.json({ error: 'Error interno' }, { status: 500 })
        }
      },
    },
  },
})
