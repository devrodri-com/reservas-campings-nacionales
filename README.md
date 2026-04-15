# Campings reservas (demo)

Aplicación web de demostración para gestionar y tomar reservas en campings. El código modela un ecosistema multi-camping con dos modos de inventario y un piloto explícito por unidad física (referencia operativa: **Lago Roca** en los datos de ejemplo).

---

## Descripción breve

- Flujo público para elegir camping, fechas y completar una reserva (con autenticación de invitado vía Firebase Auth cuando hace falta).
- Panel `/admin` con roles, listados, disponibilidad agregada, walk-in y —para campings en modo `unit_based`— inventario por unidad, bloqueos y reasignación.
- Pagos: flujo **simulado** (sin cobro real); hay rutas API preparatorias hacia Mercado Pago, pero sin integración productiva.

---

## Stack principal

| Área | Tecnología |
|------|------------|
| Framework | **Next.js** (App Router), **React** |
| Autenticación | **Firebase Auth** (usuarios admin; invitados en flujo público según implementación actual) |
| Base de datos | **Cloud Firestore** (colecciones como `campings`, `reservas`, `reservas_public`, `units`, `unitTypes`, `unitBlocks`, `users`, etc.) |
| Servidor | API Routes de Next.js donde aplica (p. ej. marcar pago en flujo de confirmación simulada con **firebase-admin**) |

---

## Funcionalidades implementadas hoy

### Flujo público general

- Listado y ficha de campings (`/`, `/campings/[id]`).
- Formulario de reserva (`/reservar`): selección de camping, rango de fechas, datos del titular y teléfono.
- Validación en envío: fechas no anteriores a hoy y salida posterior al ingreso.
- Modo **capacity**: disponibilidad por número de parcelas y capacidad del camping (sin unidades individuales).
- Modo **unit_based**: selección de unidad concreta cuando el camping está configurado así; comprobación de disponibilidad contra reservas públicas relevantes, bloqueos y estado operativo de la unidad.
- Tras crear la reserva: redirección a página de confirmación; flujo de pago simulado y endpoint servidor para reflejar “pagada” en documentos privado y público donde corresponde.
- Consulta de reserva (`/consultar`): el usuario ingresa el **ID del documento** en `reservas/{id}`; la app lee Firestore y muestra estado y datos básicos si el documento existe y valida el esquema esperado.

### Panel admin (`/admin`)

- Login y acceso condicionado a perfil en Firestore (`users/{uid}`: `role`, `activo`, `campingId` cuando aplica).
- Roles contemplados en UI: `admin_global`, `admin_camping`, `viewer` (lectura restringida en datos sensibles, p. ej. teléfono en detalle de reserva).
- Selector de camping (según rol), KPIs y tabla de disponibilidad por días en el rango configurado.
- Listado de reservas del camping: ver detalle, cancelar, expirar pendientes, marcar como pagada (vía cliente Firestore, sujeto a reglas de seguridad).
- Exportación CSV (por camping y, según rol, alcance global del listado).
- **Walk-in**: creación manual de reserva con mismas validaciones de fechas; en `unit_based`, elección de unidad y comprobaciones de cupo/personas/unidad.
- Reserva demo y utilidades de desarrollo acopladas a la página admin actual.

### Piloto unit-based (Lago Roca)

En la demo, un camping configurado con `inventoryMode: "unit_based"` (p. ej. Lago Roca en los datos cargados en Firestore) activa:

- Carga de **tipos de unidad** y **unidades** asociadas al camping.
- **Estados operativos** por unidad: disponible, bloqueada, mantenimiento.
- **Bloqueos por rango** (`unitBlocks`): creación desde el panel, listado por unidad y eliminación.
- **Inventario por unidad** en admin: resumen disponible / no disponible en el rango de fechas del panel, coherente con reservas activas, bloqueos y estado operativo.
- **Walk-in** asignando una unidad concreta.
- **Reserva pública** con elección de unidad y validación de solapes en el cliente con datos refrescados.
- **Reasignación** de una reserva a otra unidad del mismo tipo, desde el detalle de reserva (solo con `unitId` y camping `unit_based`), dejando la unidad anterior en un estado operativo elegido.

Lo **no** cubierto como mapa interactivo de parcelas en UI: los campos opcionales de unidad (`mapX`, `mapY`, etc.) existen en el modelo de datos; la experiencia de mapa clickeable **no está activa** en esta demo (ver notas al final).

---

## Modo híbrido de inventario

El campo `inventoryMode` en el documento del camping (tipo `Camping` en código) define el comportamiento:

| Valor | Comportamiento |
|-------|----------------|
| `capacity` (por defecto si no se define) | La disponibilidad se calcula con capacidad total de parcelas y reservas que bloquean cupo. No hay entidades `units` en el flujo de reserva pública. |
| `unit_based` | El stock se razona por **unidades** (parcelas/cabins concretas): tipos, unidades, bloqueos por fechas y reservas ligadas a `unitId` / `unitTypeId`. |

Un mismo despliegue puede mezclar campings en un modo u otro según los documentos en Firestore.

---

## Qué incluye hoy el piloto Lago Roca (unit_based)

Resumen alineado con el código actual:

- Tipos de unidad (`unitTypes`) y unidades (`units`) por camping.
- Estados operativos por unidad y reflejo en disponibilidad por rango.
- Bloqueos por rango con fechas; validación de fechas (inicio no anterior a hoy, fin posterior al inicio) en creación.
- Walk-in y reserva pública eligiendo unidad, con comprobación de solapes y bloqueos.
- Reasignación entre unidades del mismo `unitTypeId` desde el detalle de reserva en admin.

Cualquier otro comportamiento (precios por tipo refinados, reglas de temporada, emails, webhooks reales de MP) **no forma parte** de esta demo salvo lo que esté explícitamente en el repositorio.

---

## Variables de entorno

Crear `.env.local` en la raíz del proyecto.

**Cliente Firebase (públicas, prefijo `NEXT_PUBLIC_`):**

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

**Servidor (firebase-admin):**

```bash
# JSON del service account en una sola línea (escapado según corresponda).
# Necesario para rutas que usan admin SDK, p. ej. POST /api/payments/mercadopago/mark-paid
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...",...}
```

Las reglas de Firestore y los perfiles en `users/` determinan qué puede hacer cada rol desde el cliente; el comportamiento real depende de esa configuración en tu proyecto Firebase.

---

## Cómo correr el proyecto en local

Requisitos: **Node.js 18+** (recomendado acorde a `package.json` / entorno Next actual).

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

Build de producción:

```bash
npm run build
npm start
```

---

## Acceso al panel admin

1. Usuario en **Firebase Authentication**.
2. Documento en **Firestore** `users/{uid}` con campos coherentes con `UserProfile` (email, `role`, `activo`, y `campingId` si el rol es `admin_camping`).
3. Navegar a `/admin/login`.

---

## Estado actual y notas importantes

- **Mapa interactivo** de unidades sobre un plano: **no está implementado** en la UI de esta demo; queda en pausa hasta contar con mapas base adecuados. Puede haber enlaces/embed a mapas genéricos en ficha de camping (`mapsUrl` / `mapsEmbedUrl`), pero no sustituyen un mapa de ocupación interactivo.
- **Pagos**: Mercado Pago está **simulado** (preferencia mock y pantalla `/pago/simulado`). No hay cobro ni webhook productivo en este repo tal cual.
- **Marcar pagada desde admin** se hace con el SDK de cliente de Firestore; no es el mismo camino que el endpoint `mark-paid` usado en el flujo post–pago simulado desde la pantalla de confirmación. La seguridad depende de las reglas de Firestore.
- **Mejoras futuras razonables** (no exhaustivo): pricing más rico (temporadas, descuentos), UX de calendario (p. ej. límites mínimos en componentes de rango), sincronización amplia de `reservas_public` en operaciones admin avanzadas, mapa de unidades, integración real de MP y notificaciones.

---

## Deploy

Compatible con despliegue en **Vercel** (u otro hosting Node). Configurar las mismas variables de entorno en el panel del proveedor.

---

Documentación alineada al estado del repositorio; si algo no aparece en el código, no está garantizado en runtime.
