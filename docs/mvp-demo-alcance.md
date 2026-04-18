# Alcance del MVP de demo

## 1. Objetivo de esta versión

Esta versión está pensada para presentar:

- el flujo público de exploración y reserva
- la lógica por campings
- la diferencia entre inventario por cupo y por unidades
- la operación administrativa principal
- una base técnica sólida para evolución

No es una versión final productiva.

---

## 2. Qué está listo para mostrar

### Público

- landing institucional
- listado completo de campings en `/campings`
- detalle público por camping
- flujo de reserva en `/reservar`
- consulta de reserva en `/consultar`

### Admin

- panel principal
- reservas
- campings
- tipos de unidad
- unidades
- reservas manuales
- cambio de unidad
- cancelación
- exportación

---

## 3. Qué decisiones del MVP son deliberadas

### Mapa del camping

El plano del camping hoy se usa como referencia visual.

No se implementó todavía como mapa interactivo final porque:

- el material base entregado no tiene calidad suficiente
- se necesita una versión gráfica consistente y confiable
- se decidió priorizar una base técnica correcta antes que una interacción visual mala

La arquitectura ya queda preparada para activar selección interactiva sobre plano cuando exista material adecuado.

### Day use

El concepto de estadía diurna existe en el modelo, pero no está activo todavía en el flujo público.

Se decidió no implementarlo en esta etapa porque requiere lógica horaria real y convivencia correcta con pernocte.

### Pagos

El pago sigue siendo simulado.

Se decidió mantenerlo así para no forzar una integración incompleta en la demo.

---

## 4. Qué está modelado para evolucionar

El sistema ya deja base para:

- mapa interactivo por camping
- unidades con coordenadas y overlay
- day_use real en una etapa posterior
- endurecimiento de permisos
- pagos reales
- automatizaciones

---

## 5. Qué puede presentarse como siguiente etapa

### Fase siguiente sugerida

- mapa interactivo final
- day_use operativo
- pagos reales
- endurecimiento de seguridad
- mejoras de reporting

---

## 6. Mensaje recomendado para presentar

El MVP actual no intenta resolver todo.
Resuelve bien el núcleo del producto, la operación principal y la navegación pública.

Además, deja preparada la base técnica para sumar después:

- mapa interactivo
- reglas de estadía diurna
- integración de pagos
- mejoras visuales y operativas
