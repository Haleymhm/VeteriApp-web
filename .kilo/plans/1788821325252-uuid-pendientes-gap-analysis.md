# Plan de Cierre: Estandarización UUID — Pendientes detectados

Análisis de brecha entre `docs/plan_estandarizacion_total_uuid.md` y el estado actual del repositorio (2026-09-24).

## Estado actual

### Ya aplicado (verificado en código)

- **`prisma/schema.prisma`**: los 18 modelos usan `String @id @default(uuid())`. Sin `Int` autoincrementales restantes.
- **Autenticación/JWT**: `jwt.ts` (`userId: string`), `auth-helper.ts` (`userId: string`, sin `parseInt`), `proxy.ts` (usa `session.userId` directo, sin `.toString()`).
- **Validaciones Zod**: `validations.ts` usa `z.string().uuid(...)` en `petId`, `vetId`, `ownerId`, `categoryId` y existe `UuidParamSchema` (línea 127).
- **Servicios**: `dashboard-metrics.ts` usa `vetId: string | null` y `topVets: { vetId: string }`.
- **Rutas API**: ningún `parseInt(id)` en endpoints `[id]`; los únicos `parseInt` restantes son legitimos (paginación `page`/`limit` en clients/pets/audit-logs, y parseo de color hex en `get-branding.ts`).
- **Frontend principal**: `Calendar.tsx`, `clientes/page.tsx`, `mascotas/page.tsx`, portal — sin `parseInt` de IDs.

## Pendientes por aplicar

### 1. Migración de base de datos (BLOQUEANTE)

El último directorio en `prisma/migrations/` es `20260703000000_add_clinic_settings` (Jul 2026), anterior al cambio de esquema a UUID. **No existe migración que convierta Int → UUID en la base real.**

- **Opción elegida (confirmada por el usuario)** — **Reset + seed**: `npx prisma migrate reset` (o crear migración `standardize_to_uuid` con `prisma migrate dev`) seguido de `pnpm prisma db seed`. Se descarta la preservación de datos.
- **Efecto colateral conocido**: sesiones JWT activas quedan invalidadas (re-login obligatorio).

### 2. Restos de tipos `id: number` en frontend (TypeScript incorrecto, runtime funciona)

Interfaces locales siguen declarando IDs numéricos aunque la API ya devuelve strings UUID:

- `src/app/(admin)/(others-pages)/usuarios/page.tsx` (línea 6)
- `src/app/(admin)/(others-pages)/audit-logs/page.tsx` (línea 27)
- `src/app/portal/mis-mascotas/page.tsx` (líneas 10, 22)
- `src/app/portal/agendar-citas/page.tsx` (línea 68 — `upcomingHolidays: id: number`)
- `src/components/user-profile/UserInfoCard.tsx` (línea 11)
- `src/components/configuracion/HolidaysEditor.tsx` (línea 8)
- `src/components/tables/BasicTableOne.tsx` (línea 14)
- `src/components/portal/PetPassportCard.tsx` (línea 9)

Acción: cambiar `id: number` → `id: string` en cada una.

### 3. Plantillas de email con `id: number`

- `src/lib/email/templates/appointment-created.tsx`
- `src/lib/email/templates/appointment-confirmed.tsx`
- `src/lib/email/templates/appointment-cancelled.tsx`
- `src/lib/email/templates/appointment-completed.tsx`

Además del tipo, `email/index.ts` compone asuntos `cita solicitada #${data.id}` — con UUID el asunto sería ilegible. Decidir: recortar (`data.id.slice(0, 8)`), o quitar el `#id` del asunto y mostrarlo en el cuerpo del email. **Recomendado**: `slice(0, 8).toUpperCase()` como referencia corta legible en asunto y cuerpo.

### 4. Mocks de tests con IDs numéricos

- `src/test/__mocks__/jose.ts` línea 25: `userId: 1` → usar UUID de prueba (ej. `'a0000000-0000-0000-0000-000000000001'`).
- `src/test/unit/services/dashboard-metrics.test.ts` línea 177: `{ id: 1 }` etc. → UUIDs string.
- (`api-response.test.ts` usa `{ id: 1 }` como payload genérico — aceptable, no representa una entidad; no requiere cambio.)

### 5. Limpieza menor en `dashboard-metrics.ts`

Línea 287: `const id = g.vetId as string;` — cast residual de la migración; al ser `vetId` ya `string | null` el cast es innecesario tras el `.filter`. Eliminar o reemplazar por un type-guard.

### 6. Verificación (tras aplicar 1–5)

1. `npx prisma validate && npx prisma generate`
2. `npx tsc --noEmit` — debe salir limpio (los cambios de tipo en §2–4 pueden exponer errores adicionales; corregirlos)
3. `pnpm test` — los 8 suites deben pasar
4. Flujo manual: login admin → crear cliente → crear mascota → agendar cita → consultar rutas `[id]` con UUID (200 OK)

## Riesgos

- **Migración de datos (§1)**: se confirmó Reset + seed; los datos actuales en Neon se descartarán y se regenerarán con `prisma/seed.ts`.
- **Tests/UI reales vs mocks**: los componentes con `id: number` funcionan en runtime porque JS no valida tipos, pero comparaciones como `pet.id === parseInt(...)` fallarían silenciosamente — al cambiar tipos, revisar comparaciones cercanas.
- **`email/index.ts`**: el contenido del asunto afecta comunicaciones con clientes reales; verificar visualmente un email antes de producción.

## Preguntas abiertas

1. ~~¿Reset + seed o migración preservando datos?~~ **Resuelto**: Reset + seed (confirmado por el usuario 2026-09-24).
2. **Asunto de emails**: ¿referencia corta de 8 caracteres, o eliminar el ID del asunto? Recomendado: referencia corta (`data.id.slice(0, 8).toUpperCase()`).
