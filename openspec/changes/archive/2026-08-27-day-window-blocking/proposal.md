## Why

Actualmente cualquier día pasado del reto es editable, lo que permite marcar hábitos retroactivamente con cualquier antigüedad. Esto rompe la honestidad del reto: el objetivo es registrar el hábito en el momento, no reconstruir el pasado a conveniencia.

## What Changes

- La función `cellState` pasa de 3 estados (`today`, `unlocked`, `locked`) a 4 (`today`, `yesterday`, `old`, `locked`).
- Solo los días `today` y `yesterday` son clickeables. El estado `old` (días anteriores a ayer) queda bloqueado.
- Los días en estado `old` que ya estaban marcados se muestran como completados pero no son editables (congelados).
- Los días en estado `old` no marcados se muestran como perdidos/bloqueados.
- Los días futuros (`locked`) mantienen el comportamiento actual.
- La ventana de edición es fija: hoy + ayer. No es configurable por el usuario.

## Capabilities

### New Capabilities

- `day-window`: Reglas de acceso temporal a celdas del anillo — qué días son editables y cuáles están congelados.

### Modified Capabilities

_(ninguna — los requisitos existentes de navegación y marcado de días no cambian, solo se restringe cuándo aplican)_

## Impact

- `src/store.js`: `cellState()` añade estados `'yesterday'` y `'old'`
- `src/render/svg.js`: lógica de clases CSS, colores y event listeners adaptada a los 4 estados
- `src/utils/date.js`: posible adición de `yesterdayISO()` como utilidad
- Sin cambio en estructura de datos de `localStorage` — la migración es transparente
- iOS/Safari y PWA offline: sin impacto, toda la lógica es local y síncrona

## No incluido en este cambio

- Ventana de edición configurable por el usuario
- Posibilidad de desmarcar días `old` ya marcados
- Notificaciones o recordatorios
