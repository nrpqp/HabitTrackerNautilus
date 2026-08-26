## Why

Los hábitos actuales son visualmente intercambiables — solo varían en color. El reto de 21 días no tiene narrativa visual progresiva: completar el día 1 se ve igual que completar el día 20. Este cambio introduce un sistema de elementos (fuego, agua, planta, rayo, hielo, tierra, aire) que da identidad única a cada hábito y convierte los 21 días en una progresión cromática y animada que crece con el esfuerzo acumulado.

## What Changes

- Se agrega el campo `element` al modelo de dato de hábito, auto-asignado por slot (índice) al crear y editable por el usuario desde el sheet de edición.
- Cada elemento define una paleta de dos extremos (tono suave en el día 1 → tono saturado e intenso en el día 21). Cada celda interpolada en `t = dayIndex / 20` tiene un color único, creando un degradado visual a lo largo del anillo.
- Se introducen tres fases de animación por celda completada según el día:
  - **Fase 1 (días 1–7)**: solo color interpolado, sin animación activa.
  - **Fase 2 (días 8–14)**: glow pulsante lento (respira).
  - **Fase 3 (días 15–21)**: animación activa del elemento con mayor intensidad y glow.
- Al hacer click en una celda (marcar o visitar una ya marcada) se dispara siempre un burst de 6 partículas específicas del elemento sobre un overlay independiente del SVG (`#effect-overlay`), garantizando feedback inmediato sin interferir con el re-render del SVG.
- Al completar el día 7, 14 o 21 se muestra una celebración de milestone: burst ampliado desde el centro del ring + toast de pantalla con mensaje específico por hito.
- El sheet de edición de hábito incorpora un selector de elemento (7 iconos) que reemplaza el color del hábito en vez de sumarse: el color del anillo pasa a derivarse del elemento elegido.

## Capabilities

### New Capabilities

- `elemental-animations`: Sistema completo de identidad elemental por hábito, progresión cromática de 21 días, animaciones por fase (CSS sobre SVG) y feedback de partículas por click mediante overlay de canvas independiente del SVG.

### Modified Capabilities

- `habit-edit-sheet`: El panel de edición gana un selector de elemento (7 iconos) que reemplaza la fila de swatches de color fijo; el color del anillo pasa a derivarse del elemento activo.

## Impact

- `src/constants.js` — nuevas constantes: definición de los 7 elementos (nombre, ícono, paleta HSL de inicio/fin, tipo de partícula, gravedad, velocidad).
- `src/store.js` — el modelo de hábito gana el campo `element: string`; la función `loadHabits` necesita migración para asignar elemento por defecto a hábitos existentes.
- `src/render/svg.js` — `renderSVG` consume el campo `element` para calcular el color interpolado por celda y aplicar clases CSS de fase (`phase-1`, `phase-2`, `phase-3`); el HTML del SVG ya no usa el color fijo del hábito sino el color calculado por `t`.
- `style.css` — keyframes nuevos: `breathe` (fase 2), `surge` (fase 3), `cell-pop` (click feedback), `today-pulse`; respeta `prefers-reduced-motion`.
- `main.js` — lógica del overlay `#effect-overlay` (canvas sobre el SVG), spawner de partículas, detección de milestones al marcar una celda, toast de celebración.
- `index.html` — `#effect-overlay` (canvas `position: absolute` sobre `#svg-container`); toast `#milestone-toast`.
- `src/render/legend.js` — no afectado directamente; el sheet llama a `renderSVGOnly` tras cambiar el elemento.
- Sin nuevas dependencias de runtime.

## No incluido en este cambio

- Sonidos o vibración háptica.
- Animaciones en la leyenda/legend (solo el SVG radial).
- Elección libre de color hex independiente del elemento.
- Estadísticas o pantalla de logros separada.
- Compatibilidad con más de 7 elementos o hábitos.
