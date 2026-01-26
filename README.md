# Plataforma de Reservas - Campings de Parques Nacionales

Sistema centralizado de reservas para campings de Parques Nacionales de Argentina. Permite a los visitantes reservar online y a cada camping gestionar su operación de forma independiente, manteniendo control y supervisión centralizada.

---

## 🎯 Objetivo del proyecto

- Centralizar las reservas de múltiples campings bajo una única plataforma.
- Mantener la autonomía operativa de cada camping.
- Acreditar los pagos directamente en la cuenta de Mercado Pago de cada camping.
- Brindar control, transparencia y reportes a Parques Nacionales.

---

## 🧩 Funcionalidades principales

### Público
- Reserva online sin registro obligatorio.
- Hold temporal de **15 minutos** para completar el pago.
- Pago online (flujo simulado, preparado para Mercado Pago real).
- Consulta de reserva por código.

### Administración
- Panel administrativo protegido por roles:
  - **admin_global**: supervisión total y reportes globales.
  - **admin_camping**: gestión exclusiva de su camping.
  - **viewer**: acceso de solo lectura (auditoría / comisiones).
- Control de disponibilidad en tiempo real.
- Registro de reservas presenciales (walk‑in).
- Cancelaciones y expiración de reservas.
- Exportación CSV por camping y **CSV global**.

---

## 💳 Pagos

- Modelo de pago **100% online**.
- Cada camping utiliza su **propia cuenta de Mercado Pago**.
- Arquitectura preparada para:
  - 17 cuentas de Mercado Pago distintas.
  - Backend seguro (tokens nunca expuestos al frontend).
  - Webhooks centralizados.

> Actualmente el flujo de pago es **simulado** (mock). La integración real con Mercado Pago se realiza en fase productiva.

---

## 🔐 Seguridad y arquitectura

- Frontend: Next.js (App Router), responsive y mobile‑first.
- Backend: API Routes de Next.js para operaciones críticas.
- Base de datos: Firebase / Firestore con reglas por rol.
- Estados de reserva:
  - `pendiente_pago`
  - `pagada`
  - `fallida`
  - `cancelada`
- El frontend **nunca** marca una reserva como pagada; solo el backend lo hace.

---

## 🛠️ Desarrollo local

### Requisitos
- Node.js 18+
- Cuenta de Firebase

### Instalación

```bash
npm install
npm run dev
```

Abrir: http://localhost:3000

---

## 👤 Acceso al panel admin

1. Crear usuarios en **Firebase Console → Authentication**.
2. Crear el perfil correspondiente en **Firestore → `users/{uid}`** con:

```json
{
  "email": "usuario@ejemplo.com",
  "role": "admin_global | admin_camping | viewer",
  "activo": true,
  "campingId": "opcional-para-admin_camping"
}
```

3. Acceder a:
```
/admin/login
```

---

## 📦 Roadmap

- Integración real con Mercado Pago (17 cuentas).
- Webhooks de pago y conciliación automática.
- Emails de confirmación.
- Reglas por temporada.
- Aplicación móvil (iOS / Android).

---

## 🚀 Deploy

El proyecto está preparado para desplegarse en **Vercel**.

Configurar variables de entorno de Firebase en el panel de Vercel antes de hacer deploy.

---

## 📄 Estado del proyecto

- MVP funcional completo.
- Preparado para licitación y validación institucional.
- Arquitectura lista para producción.

---

© Plataforma de Reservas - Parques Nacionales