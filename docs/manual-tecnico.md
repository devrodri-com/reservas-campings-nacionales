# Manual técnico del sistema

## 1. Visión general

Este sistema es una aplicación web para gestión de reservas de campings, construida con Next.js y Firebase.

Cubre:

- flujo público de exploración y reserva
- detalle público de campings
- operación administrativa
- disponibilidad por capacidad o por unidad real
- exportación y operación interna

El piloto principal hoy es Lago Roca, que trabaja con inventario por unidades reales.

---

## 2. Stack técnico

## Frontend
- Next.js 16
- React 19
- TypeScript
- App Router

## Backend / servicios
- Firebase Auth
- Cloud Firestore
- Firebase Admin SDK en rutas API puntuales

## Patrón general
La mayor parte de la lógica de lectura/escritura vive en cliente, con helpers y repositorios en `src/lib`.

Las API routes hoy se usan para:
- creación de usuarios administrativos
- pagos simulados

---

## 3. Estructura del proyecto

### `src/app`
Rutas y pantallas principales.

### `src/components`
Componentes visuales reutilizables.

### `src/lib`
Repositorios, helpers de dominio y lógica de disponibilidad.

### `src/types`
Modelos TypeScript del sistema.

---

## 4. Rutas principales

## Público
- `/`
- `/campings`
- `/campings/[id]`
- `/reservar`
- `/consultar`
- `/reserva/confirmada/[id]`

## Admin
- `/admin`
- `/admin/reservas`
- `/admin/campings`
- `/admin/usuarios`
- `/admin/login`

---

## 5. Modelo de datos principal

## 5.1 `campings`
Responsabilidad:
- identidad del camping
- configuración pública
- `inventoryMode`
- política de cancelación
- links y contenido público

Campos relevantes:
- nombre
- área protegida
- ubicación
- descripción
- `inventoryMode`
- `mapsUrl`
- `mapsEmbedUrl`
- `coverImageUrl`
- política de cancelación

---

## 5.2 `reservas`
Colección privada principal.

Responsabilidad:
- documento fuente de verdad
- PII
- estado
- información económica
- trazabilidad operativa

Incluye, entre otros:
- fechas
- personas
- monto total
- estado
- origen
- pago
- cancelación
- refund
- `unitId`
- `unitTypeId`
- `bookingKind`

---

## 5.3 `reservas_public`
Proyección reducida usada para disponibilidad.

Incluye:
- camping
- fechas
- estado
- parcelas
- `unitId`
- `unitTypeId`

No incluye PII.

---

## 5.4 `unitTypes`
Tipos de unidad por camping.

Incluye:
- `code`
- `name`
- `capacityMax`
- `pricingModel`
- `bookingMode`
- `adultPriceArs`
- `childPriceArs`
- `unitPriceArs`
- `basePriceArs`

`bookingMode` soporta:
- `overnight_only`
- `day_use_only`
- `both`

Importante:
ese modelo existe, pero `day_use` todavía no está operativo en el flujo público real.

---

## 5.5 `units`
Unidades físicas concretas.

Incluye:
- `unitTypeId`
- `displayName`
- `number`
- `sector`
- `operationalStatus`
- `priceOverrideArs`
- `mapLabel`
- `mapX`
- `mapY`
- `polygonPoints`

Los campos de mapa quedan preparados para una etapa posterior de selección interactiva sobre plano.

---

## 5.6 `unitBlocks`
Bloqueos manuales por unidad y rango.

---

## 5.7 `users`
Perfiles administrativos con rol y, cuando corresponde, `campingId`.

---

## 6. Roles y permisos

### admin_global
Acceso total.

### admin_camping
Acceso operativo restringido a su camping.

### viewer
Lectura por camping.

### viewer_global
Lectura global.

Limitación actual:
`viewer` y `viewer_global` todavía no están completamente endurecidos respecto a PII y exportaciones.

---

## 7. Flujos principales

## 7.1 Home y catálogo público
La home funciona como preview.
`/campings` es el listado público completo.
`/campings/[id]` es la ficha individual.

Esto separa:
- orientación
- exploración
- detalle
- acción

---

## 7.2 Creación de reserva pública
Ruta principal:
- `/reservar`

Flujo actual:
1. carga campings
2. si el camping es `unit_based`, carga:
   - `unitTypes`
   - `units`
   - `unitBlocks`
   - `reservas_public`
3. valida fechas, disponibilidad y datos del titular
4. crea sesión anónima si hace falta
5. vuelve a verificar disponibilidad
6. crea en batch:
   - `reservas/{id}`
   - `reservas_public/{id}`

La reserva nace como:
- `pendiente_pago`

Hold inicial:
- 15 minutos

---

## 7.3 Disponibilidad por unidad
En modo `unit_based`, una unidad se considera disponible si:

- está activa
- su `operationalStatus` es `available`
- no tiene bloqueos solapados
- no tiene reservas activas solapadas

Se consideran reservas bloqueantes:
- pagadas
- pendientes no vencidas

---

## 7.4 Disponibilidad por capacidad
En modo `capacity`, la disponibilidad se calcula con `buildAvailabilityForRange()` sobre rango de fechas.

Hoy esta lógica está basada en noches completas.

---

## 7.5 Day use
Estado actual:
- existe en modelo (`bookingMode` y `bookingKind`)
- no está operativo en el flujo público real

Motivo:
la lógica actual trabaja por fechas/noches y no modela todavía franjas horarias ni convivencia correcta entre uso diurno y pernocte.

Por eso, para el MVP:
- el sistema opera efectivamente como pernocte
- `day_use` queda como evolución futura

---

## 7.6 Selección visual de unidades
El sistema ya incorpora base técnica para selección visual:

- `mapLabel`
- `mapX`
- `mapY`
- `polygonPoints`
- componentes de UI para mapa/overlay

Estado actual del MVP:
- el plano del camping puede mostrarse como referencia visual
- el mapa interactivo definitivo queda para una etapa posterior
- la lógica de selección por unidad sigue desacoplada del asset visual para evitar refactors futuros

---

## 7.7 Cambio de unidad
Se opera desde admin.

Condiciones:
- mismo camping
- unidad alternativa disponible
- capacidad suficiente

El sistema:
- recalcula monto
- calcula diferencia
- guarda trazabilidad
- actualiza `reservas_public`

---

## 7.8 Cancelación
Se hace desde admin.

Al cancelar:
- `estado` pasa a `cancelada`
- se guarda trazabilidad
- se actualiza `reservas_public`
- se calcula refund

No ejecuta reembolso real.

---

## 7.9 Política de cancelación
La política usa:
- `originalCheckInDate`

Esto evita manipulación mediante cambios posteriores.

---

## 7.10 Creación de usuarios administrativos
Ruta:
- `POST /api/admin/users/create`

Flujo:
1. crea usuario en Firebase Auth
2. crea `users/{uid}` en Firestore

---

## 8. API routes actuales

### `POST /api/admin/users/create`
Alta real de usuarios administrativos.

### `POST /api/payments/mercadopago/create`
Checkout/preferencia simulada.

### `POST /api/payments/mercadopago/mark-paid`
Marca reserva como pagada y sincroniza `reservas_public`.

---

## 9. Qué está implementado hoy

## Implementado
- home pública mejorada
- `/campings`
- `/campings/[id]`
- reservas públicas
- walk-in
- disponibilidad por unidad
- pricing por persona / por unidad
- cambio de unidad
- cancelación
- política de cancelación configurable
- usuarios administrativos
- exportación CSV
- gestión de campings, tipos y unidades

## Parcialmente implementado
- separación privado/público
- integración Mercado Pago
- expiración de pendientes
- permisos finos de viewer
- soporte de mapa futuro
- day_use en modelo, no en flujo real

## No implementado
- cobro real con Mercado Pago
- webhooks reales
- reembolsos reales
- mapa interactivo final
- emails automáticos
- dashboards analíticos
- temporadas / promociones
- operación pública real de day_use

---

## 10. Limitaciones actuales

### Seguridad
El repo no incluye reglas de Firestore; dependen de configuración externa.

### Pagos
El pago sigue siendo simulado.

### PII
Los roles de lectura todavía no están completamente endurecidos.

### Sincronización privado/público
Aunque mejoró, sigue habiendo varios puntos de escritura cliente.

### Expiración
No hay job backend real de expiración de holds.

### Mapas
La selección interactiva final depende de contar con planos de camping válidos y consistentes.

---

## 11. Decisiones técnicas importantes

- separar `reservas` y `reservas_public`
- soportar `capacity` y `unit_based`
- modelar unidades reales
- dejar base para overlays de mapa
- usar `originalCheckInDate` para cancelación
- crear usuarios admin server-side
- mantener pagos simulados en MVP
- no forzar `day_use` hasta tener lógica correcta de agenda

---

## 12. Estado del sistema

Hoy el sistema está en estado de **MVP funcional avanzado**, orientado a demo y operación controlada.

Está resuelto:
- núcleo de producto
- flujo público principal
- operación administrativa principal
- catálogo y detalle público
- base de evolución para inventario visual

Queda para siguientes etapas:
- pagos reales
- day_use operativo
- mapa interactivo final
- endurecimiento de seguridad
- automatizaciones y reporting
