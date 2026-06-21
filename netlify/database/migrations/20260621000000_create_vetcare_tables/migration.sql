-- VetCare - Migración Inicial
-- Clínica Veterinaria: Creación de tablas del dominio

CREATE TABLE IF NOT EXISTS "usuarios" (
  "id" SERIAL PRIMARY KEY,
  "nombre" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "rol" TEXT NOT NULL DEFAULT 'recepcionista',
  "activo" BOOLEAN NOT NULL DEFAULT TRUE,
  "creado_en" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "sesiones" (
  "id" TEXT PRIMARY KEY,
  "usuario_id" INTEGER NOT NULL REFERENCES "usuarios"("id"),
  "expira_en" TIMESTAMP NOT NULL,
  "creado_en" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "propietarios" (
  "id" SERIAL PRIMARY KEY,
  "nombre_completo" TEXT NOT NULL,
  "dni" TEXT NOT NULL UNIQUE,
  "celular" TEXT,
  "correo" TEXT,
  "direccion" TEXT,
  "observaciones" TEXT,
  "creado_en" TIMESTAMP DEFAULT NOW(),
  "actualizado_en" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "mascotas" (
  "id" SERIAL PRIMARY KEY,
  "propietario_id" INTEGER NOT NULL REFERENCES "propietarios"("id") ON DELETE CASCADE,
  "nombre" TEXT NOT NULL,
  "especie" TEXT NOT NULL,
  "raza" TEXT,
  "sexo" TEXT,
  "color" TEXT,
  "fecha_nacimiento" DATE,
  "microchip" TEXT,
  "esterilizado" BOOLEAN NOT NULL DEFAULT FALSE,
  "alergias" TEXT,
  "creado_en" TIMESTAMP DEFAULT NOW(),
  "actualizado_en" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "citas" (
  "id" SERIAL PRIMARY KEY,
  "mascota_id" INTEGER NOT NULL REFERENCES "mascotas"("id") ON DELETE CASCADE,
  "fecha" DATE NOT NULL,
  "hora" TEXT NOT NULL,
  "motivo" TEXT NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'programada',
  "notas" TEXT,
  "creado_en" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "tratamientos_clinicos" (
  "id" SERIAL PRIMARY KEY,
  "mascota_id" INTEGER NOT NULL REFERENCES "mascotas"("id") ON DELETE CASCADE,
  "diagnostico" TEXT NOT NULL,
  "descripcion" TEXT,
  "medicacion" TEXT,
  "costo_total" NUMERIC(10, 2) NOT NULL,
  "cuotas_pactadas" INTEGER NOT NULL DEFAULT 1,
  "saldo_pendiente" NUMERIC(10, 2) NOT NULL,
  "activo" BOOLEAN NOT NULL DEFAULT TRUE,
  "creado_en" TIMESTAMP DEFAULT NOW(),
  "actualizado_en" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "notas_evolucion" (
  "id" SERIAL PRIMARY KEY,
  "tratamiento_id" INTEGER NOT NULL REFERENCES "tratamientos_clinicos"("id") ON DELETE CASCADE,
  "nota" TEXT NOT NULL,
  "medicacion_aplicada" TEXT,
  "monto_pagado" NUMERIC(10, 2),
  "creado_en" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "pagos" (
  "id" SERIAL PRIMARY KEY,
  "propietario_id" INTEGER NOT NULL REFERENCES "propietarios"("id") ON DELETE CASCADE,
  "concepto" TEXT NOT NULL,
  "monto" NUMERIC(10, 2) NOT NULL,
  "estado" TEXT NOT NULL DEFAULT 'pendiente',
  "tipo_servicio" TEXT,
  "fecha_pago" DATE,
  "creado_en" TIMESTAMP DEFAULT NOW()
);
