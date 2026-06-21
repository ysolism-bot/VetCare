/**
 * VetCare - Esquema de Base de Datos
 * Arquitectura Orientada a Objetos:
 * - Cada tabla representa una entidad del dominio (clase)
 * - Las relaciones entre tablas modelan asociaciones entre objetos
 * - Los campos reflejan atributos de cada clase
 */

import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  date,
} from 'drizzle-orm/pg-core'

// ─── Clase: Usuario ────────────────────────────────────────────────────────────
// Representa a las personas que operan el sistema (veterinario, recepcionista, admin)
export const usuarios = pgTable('usuarios', {
  id: serial().primaryKey(),
  nombre: text().notNull(),
  email: text().notNull().unique(),
  password: text().notNull(),
  rol: text().notNull().default('recepcionista'), // administrador | veterinario | recepcionista
  activo: boolean().notNull().default(true),
  creadoEn: timestamp('creado_en').defaultNow(),
})

// ─── Clase: Sesion ─────────────────────────────────────────────────────────────
// Controla la autenticación y el ciclo de vida de la sesión del usuario
export const sesiones = pgTable('sesiones', {
  id: text().primaryKey(),
  usuarioId: integer('usuario_id')
    .notNull()
    .references(() => usuarios.id),
  expiraEn: timestamp('expira_en').notNull(),
  creadoEn: timestamp('creado_en').defaultNow(),
})

// ─── Clase: Propietario ────────────────────────────────────────────────────────
// Dueño de una o más mascotas. Punto de contacto principal de la clínica
export const propietarios = pgTable('propietarios', {
  id: serial().primaryKey(),
  nombreCompleto: text('nombre_completo').notNull(),
  dni: text().notNull().unique(),
  celular: text(),
  correo: text(),
  direccion: text(),
  observaciones: text(),
  creadoEn: timestamp('creado_en').defaultNow(),
  actualizadoEn: timestamp('actualizado_en').defaultNow(),
})

// ─── Clase: Mascota ────────────────────────────────────────────────────────────
// Paciente principal de la clínica. Asociada a un Propietario (composición)
export const mascotas = pgTable('mascotas', {
  id: serial().primaryKey(),
  propietarioId: integer('propietario_id')
    .notNull()
    .references(() => propietarios.id, { onDelete: 'cascade' }),
  nombre: text().notNull(),
  especie: text().notNull(), // perro | gato | ave | reptil | otro
  raza: text(),
  sexo: text(), // macho | hembra
  color: text(),
  fechaNacimiento: date('fecha_nacimiento'),
  microchip: text(),
  esterilizado: boolean().notNull().default(false),
  alergias: text(),
  creadoEn: timestamp('creado_en').defaultNow(),
  actualizadoEn: timestamp('actualizado_en').defaultNow(),
})

// ─── Clase: Cita ───────────────────────────────────────────────────────────────
// Reserva de atención entre una Mascota y un Veterinario en una fecha/hora
export const citas = pgTable('citas', {
  id: serial().primaryKey(),
  mascotaId: integer('mascota_id')
    .notNull()
    .references(() => mascotas.id, { onDelete: 'cascade' }),
  fecha: date().notNull(),
  hora: text().notNull(),
  motivo: text().notNull(), // consulta_general | vacunacion | cirugia | estetica | urgencia
  estado: text().notNull().default('programada'), // programada | en_atencion | completada | cancelada
  notas: text(),
  creadoEn: timestamp('creado_en').defaultNow(),
})

// ─── Clase: TratamientoClinico ─────────────────────────────────────────────────
// Historial médico de una Mascota: diagnóstico, tratamiento y seguimiento
export const tratamientosClínicos = pgTable('tratamientos_clinicos', {
  id: serial().primaryKey(),
  mascotaId: integer('mascota_id')
    .notNull()
    .references(() => mascotas.id, { onDelete: 'cascade' }),
  diagnostico: text('diagnostico').notNull(),
  descripcion: text(),
  medicacion: text(),
  costoTotal: numeric('costo_total', { precision: 10, scale: 2 }).notNull(),
  cuotasPactadas: integer('cuotas_pactadas').notNull().default(1),
  saldoPendiente: numeric('saldo_pendiente', { precision: 10, scale: 2 }).notNull(),
  activo: boolean().notNull().default(true),
  creadoEn: timestamp('creado_en').defaultNow(),
  actualizadoEn: timestamp('actualizado_en').defaultNow(),
})

// ─── Clase: NotaEvolucion ──────────────────────────────────────────────────────
// Registro de evolución de un TratamientoClinico a lo largo del tiempo
export const notasEvolucion = pgTable('notas_evolucion', {
  id: serial().primaryKey(),
  tratamientoId: integer('tratamiento_id')
    .notNull()
    .references(() => tratamientosClínicos.id, { onDelete: 'cascade' }),
  nota: text().notNull(),
  medicacionAplicada: text('medicacion_aplicada'),
  montoPagado: numeric('monto_pagado', { precision: 10, scale: 2 }),
  creadoEn: timestamp('creado_en').defaultNow(),
})

// ─── Clase: Pago ───────────────────────────────────────────────────────────────
// Transacción económica asociada a un Propietario por servicios prestados
export const pagos = pgTable('pagos', {
  id: serial().primaryKey(),
  propietarioId: integer('propietario_id')
    .notNull()
    .references(() => propietarios.id, { onDelete: 'cascade' }),
  concepto: text().notNull(),
  monto: numeric({ precision: 10, scale: 2 }).notNull(),
  estado: text().notNull().default('pendiente'), // pendiente | pagado
  tipoServicio: text('tipo_servicio'), // consulta | vacuna | cirugia | estetica | tratamiento
  fechaPago: date('fecha_pago'),
  creadoEn: timestamp('creado_en').defaultNow(),
})
