# VetCare — Sistema de Gestión Veterinaria

Sistema web full-stack para la gestión integral de una clínica veterinaria.
Desarrollado como proyecto de **Ingeniería de Software II — UNDAC 2026**.

## Arquitectura Orientada a Objetos

El sistema modela las entidades del dominio como clases:

| Clase | Descripción |
|-------|-------------|
| `Usuario` | Operadores del sistema (administrador, veterinario, recepcionista) |
| `Sesion` | Ciclo de vida de la autenticación |
| `Propietario` | Dueño de una o más mascotas |
| `Mascota` | Paciente principal de la clínica |
| `Cita` | Reserva de atención en fecha/hora |
| `TratamientoClinico` | Historial médico y plan de pago |
| `NotaEvolucion` | Registro de evolución del tratamiento |
| `Pago` | Transacción económica por servicios |

## Stack Tecnológico

- **Frontend**: React 19 + TanStack Router
- **Meta-framework**: TanStack Start (full-stack)
- **Base de datos**: PostgreSQL via Netlify Database
- **ORM**: Drizzle ORM
- **Estilos**: Tailwind CSS v4 (tema morado/moderno)
- **Hosting**: Netlify

## Módulos

1. **Dashboard** — Panel de control con citas del día y cobros pendientes
2. **Propietarios y Mascotas** — CRUD de propietarios y sus mascotas
3. **Agenda de Citas** — Programación y seguimiento de atenciones
4. **Tratamientos Clínicos** — Historial médico y progreso de pagos
5. **Facturación** — Gestión de cobros (solo administrador)

## Credenciales de Demo

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@vetcare.com | admin123 |
| Veterinario/a | vet@vetcare.com | vet123 |
| Recepcionista | recep@vetcare.com | recep123 |

## Instalación

```bash
npm install
npm run dev
```

Despliega en Netlify con el botón "Deploy to Netlify" o conectando el repositorio.
