# Manual funcional

## 1. Qué es este sistema

Este sistema permite gestionar reservas de campings y áreas recreativas.

Incluye:

- navegación pública para explorar campings
- detalle por camping
- flujo público de reserva
- consulta de reservas
- panel administrativo
- gestión de inventario por cupo o por unidades reales
- exportación de información

Importante: no todos los campings funcionan igual.

El sistema soporta dos modelos de inventario:

### Modo 1: por cupo o capacidad
El camping trabaja con disponibilidad general.

Ejemplos:
- cantidad de parcelas disponibles
- cantidad de lugares disponibles

En este modo, la persona no elige una unidad puntual.

### Modo 2: por unidades reales
El camping trabaja con unidades concretas.

Ejemplos:
- Parcela 1
- Cabaña Colibrí
- Camarote A

En este modo, la persona puede elegir una unidad específica.

---

## 2. Navegación pública

Hoy la navegación pública principal es:

- `/` → landing / presentación
- `/campings` → listado completo de campings habilitados
- `/campings/[id]` → detalle de un camping
- `/reservar` → flujo de reserva
- `/consultar` → consulta de una reserva existente

La lógica actual es:

- la home presenta y orienta
- `/campings` permite explorar el catálogo
- `/campings/[id]` muestra la ficha del camping
- `/reservar` se usa para concretar la reserva

---

## 3. Cómo funciona para una persona usuaria

## Paso 1: explorar campings
La persona puede:

- ver una vista previa en la home
- ingresar al listado completo en `/campings`
- abrir el detalle de un camping

## Paso 2: ver detalle del camping
En la ficha del camping puede ver:

- imagen principal
- ubicación
- información general
- referencia visual del camping
- acceso a la reserva

Importante:
el mapa/plano interno del camping hoy se muestra como referencia visual.
La versión interactiva para elegir unidades sobre el mapa queda prevista para una etapa posterior.

## Paso 3: reservar
En `/reservar`, la persona completa:

- camping
- fechas
- grupo
- unidad, si corresponde
- datos del titular

### Si el camping trabaja por cupo
El sistema valida si hay lugar disponible para la cantidad solicitada.

### Si el camping trabaja por unidades reales
El sistema muestra las unidades disponibles y permite seleccionar una concreta.

Por ejemplo:
- Parcela 12
- Cabaña Zorro
- Camarote A

## Paso 4: confirmar
Al confirmar, el sistema genera la reserva y muestra:

- código de reserva
- fechas
- personas
- unidad elegida, si corresponde
- total

Hoy el pago sigue siendo simulado dentro del MVP.

---

## 4. Consulta de reserva

La consulta pública se hace desde:

- `/consultar`

La persona ingresa el código de reserva y puede ver:

- estado
- fechas
- personas
- total

---

## 5. Panel administrativo

El acceso administrativo se realiza desde:

- `/admin`

Es el panel operativo principal.

Desde ahí se puede:

- trabajar con reservas
- operar disponibilidad
- gestionar campings
- administrar tipos de unidad y unidades
- crear usuarios administrativos
- exportar información

---

## 6. Roles

### admin_global
Puede:

- ver todos los campings
- operar reservas
- editar campings
- administrar tipos de unidad y unidades
- crear usuarios administrativos
- exportar información global

### admin_camping
Puede:

- operar reservas de su camping
- hacer reservas manuales
- cambiar unidades
- cancelar reservas
- marcar reservas como pagadas

### viewer
Acceso de lectura sobre su camping.

### viewer_global
Acceso global de lectura.

---

## 7. Operación diaria en `/admin`

Desde el panel principal se puede:

- elegir camping
- ver reservas por rango
- ver métricas simples
- exportar CSV
- abrir detalle de una reserva
- cancelar reservas
- marcar reservas como pagadas
- crear reservas manuales
- trabajar con unidades y bloqueos

---

## 8. Reserva manual / Walk-in

Desde `/admin` se puede crear una reserva manual.

Sirve para:

- reservas tomadas por teléfono
- reservas hechas en recepción
- ingresos directos

Se completan:

- fechas
- personas
- datos del titular
- unidad, si el camping trabaja por unidades
- cantidad de parcelas, si trabaja por cupo

---

## 9. Gestión de campings

La pantalla:

- `/admin/campings`

permite trabajar sobre la configuración del camping.

### Datos del camping
Se pueden editar:

- nombre
- ubicación
- descripción
- links públicos
- imagen
- datos visibles para el público

### Tipos de unidad
En campings con inventario por unidades se pueden definir tipos como:

- Parcela
- Cabaña 2 personas
- Cabaña 4 personas
- Camarote

Cada tipo puede definir:

- nombre
- código
- capacidad
- precio
- forma de cobro
- modo de reserva

### Unidades
También se pueden cargar unidades concretas.

Ejemplos:
- Parcela 1 a 48
- Cabaña Colibrí
- Cabaña Zorro
- Camarote A

---

## 10. Inventario y bloqueos

En campings configurados por unidades reales, el sistema permite trabajar con disponibilidad real.

Una unidad puede estar:

- disponible
- ocupada
- bloqueada
- en mantenimiento

También se pueden crear bloqueos manuales por fecha para:

- mantenimiento
- cierre temporal
- decisión operativa

---

## 11. Pagos, cancelaciones y cambios

### Pago
Hoy el pago es simulado.

### Cancelación
Una reserva puede cancelarse desde admin.

El sistema puede calcular devolución según la política del camping, pero no procesa dinero real automáticamente.

### Cambio de unidad
En campings por unidades reales, una reserva puede moverse de una unidad a otra.

El sistema:
- actualiza unidad asignada
- recalcula monto si corresponde
- registra la diferencia

---

## 12. Qué no incluye hoy

Para evitar confusiones, hoy el sistema no incluye todavía:

- cobro real con Mercado Pago
- devolución automática de dinero
- emails automáticos
- reportes avanzados
- analytics
- mapa interactivo operativo para elegir unidades
- operación real de estadía diurna en el flujo público

---

## 13. Notas importantes del MVP

El MVP actual está preparado para demo y operación controlada.

En particular:

- el mapa interno del camping hoy es de referencia visual, no interactivo
- el modelo ya contempla evolución futura hacia selección sobre plano
- el modo `day_use` existe como concepto de negocio, pero no está activo todavía en el flujo público
- Lago Roca se usa como caso piloto de inventario por unidades

---

## 14. Resumen final

Hoy el sistema permite:

- explorar campings
- ver detalles públicos
- reservar
- consultar reservas
- operar desde admin
- hacer reservas manuales
- trabajar por cupo o por unidades
- cancelar
- cambiar unidades
- marcar reservas como pagadas
- exportar información

Es un sistema pensado para la operación diaria, con foco en una demo sólida y una base preparada para evolucionar.
