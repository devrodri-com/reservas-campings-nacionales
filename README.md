# Campings reservas (demo)

Aplicación web de demostración para gestionar y tomar reservas en campings. El código modela un ecosistema multi-camping con dos modos de inventario y un piloto explícito por unidad física (referencia operativa: **Lago Roca** en los datos de ejemplo).

---

## Descripción breve

- Flujo público para elegir camping, fechas y completar una reserva (con autenticación de invitado vía Firebase Auth cuando hace falta).
- Panel `/admin` como vista operativa principal, con roles, disponibilidad agregada, walk-in y —para campings en modo `unit_based`— inventario por unidad, bloqueos y reasignación; además, `/admin/reservas` funciona como vista de consulta, filtro, detalle y exportación según rol.
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
- Roles contemplados en el sistema: `admin_global`, `admin_camping`, `viewer`, `viewer_global`.
- Panel operativo principal en `/admin`: selector de camping (según rol), KPIs simples, rango de fechas, listado resumido, exportación CSV según rol, detalle de reserva, cancelación, expiración de pendientes, marcado como pagada y walk-in.
- Vista de consulta en `/admin/reservas`: filtros por camping / fechas / estado / origen, detalle y exportación CSV según rol.
- Edición de campings en `/admin/campings`: disponible solo para `admin_global`.
- Gestión de usuarios administrativos en `/admin/usuarios`: disponible solo para `admin_global`.
- Roles `viewer` y `viewer_global`: acceso de solo lectura en UI admin, sin acciones operativas y sin exportación CSV. Además, no ven PII sensible de contacto (por ejemplo teléfono y edad en detalle, y email en listados/detalle donde aplica).
- `admin_camping`: queda acotado a su camping en las vistas operativas.
- Exportación CSV: disponible para roles operativos; el CSV global queda solo para `admin_global`.
- **Walk-in**: creación manual de reserva desde `/admin`, con validaciones equivalentes al flujo público; en `unit_based`, elección de unidad concreta y comprobaciones de disponibilidad.
- Reserva demo y utilidades de desarrollo siguen acopladas a la página admin actual, pero no forman parte del flujo funcional principal.

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
2. Documento en **Firestore** `users/{uid}` con campos coherentes con `UserProfile`:
   - `email`
   - `role`
   - `activo`
   - `campingId` cuando el rol aplica
3. Navegar a `/admin/login`.

### Roles actuales

- `admin_global`: acceso global, operación completa, edición de campings y alta de usuarios administrativos.
- `admin_camping`: operación sobre su camping.
- `viewer`: lectura sobre su camping.
- `viewer_global`: lectura global.

Las acciones disponibles en la UI dependen del rol y del perfil cargado en `users/{uid}`.

---

## Estado actual y notas importantes

- **Inventario híbrido**: el sistema soporta campings en modo `capacity` y campings en modo `unit_based`. No todas las funcionalidades aplican a todos los campings.
- **Mapa interactivo** de unidades sobre un plano: **no está implementado** en la UI de esta demo. Puede haber enlaces o embeds genéricos (`mapsUrl` / `mapsEmbedUrl`), pero no reemplazan un mapa operativo de ocupación.
- **Pagos**: Mercado Pago está **simulado**. Existe flujo mock (`/pago/simulado`) y rutas API auxiliares, pero no hay integración productiva completa ni cobro real en este repositorio tal como está.
- **Marcar pagada desde admin**: existe en UI operativa y actualiza el estado de la reserva, pero no equivale a una conciliación de pago real.
- **Cancelaciones y cambios de unidad**: el sistema calcula ajustes y devoluciones pendientes, pero no procesa dinero automáticamente.
- **Permisos visibles en UI**: `viewer` y `viewer_global` funcionan como roles de lectura en la interfaz administrativa, sin acciones operativas ni exportación CSV, y con ocultamiento de PII sensible en vistas relevantes.
- **Seguridad real**: la autorización final depende también de las reglas de Firestore y de la configuración del proyecto Firebase. Ese comportamiento no queda completamente definido solo por este repositorio.
- **Mejoras futuras razonables**: pricing más rico (temporadas, descuentos), reportes más completos, integración real de pagos, notificaciones y mapa de unidades.

---

## Deploy

Compatible con despliegue en **Vercel** (u otro hosting Node). Configurar las mismas variables de entorno en el panel del proveedor.

---

Documentación alineada al estado del repositorio; si algo no aparece en el código, no está garantizado en runtime.
