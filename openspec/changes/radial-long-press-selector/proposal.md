## Why

Marcar un hábito hoy requiere acertar un toque preciso en la celda de "hoy"
dentro de un anillo delgado, y cuando hay varios hábitos activos el anillo
correcto puede quedar en un radio bajo y angosto. Un gesto continuo desde el
núcleo central — mantener presionado, arrastrar hacia el hábito deseado y
soltar — permite marcar con una sola mano sin apuntar a una celda concreta,
reduciendo fallos de confirmación y el tiempo de interacción.

## What Changes

- Nuevo gesto de **pulsación prolongada sobre el núcleo** (`nautilus-core`)
  que despliega un selector radial efímero con los hábitos disponibles hoy.
- Máquina de estados Reposo → Despliegue → Apuntado → Confirmación/Cancelación
  implementada sobre Pointer Events (mouse, touch y pen unificados).
- Previsualización en el centro del hábito apuntado durante el arrastre.
- Confirmación automática al soltar sobre un sector (marca el hábito como
  completado hoy, reutilizando el mismo flujo de datos que el toggle de
  celda existente); cancelación segura si se suelta dentro de la zona
  muerta central.
- Feedback háptico en tres momentos: apertura (impacto medio), cambio de
  sector apuntado (tick), confirmación (éxito) — reutilizando `haptics` de
  `src/fx/engine.js`, con degradación silenciosa en iOS Safari (sin
  `navigator.vibrate`).
- Vía de acceso alternativa: una pulsación corta/simple sobre el núcleo abre
  un modal estándar de selección de hábito, para quien no pueda sostener el
  gesto de arrastre.
- Esta es una **vía adicional** de marcado: no sustituye ni deshabilita el
  toggle por click en la celda del día existente.
- **Alcance acotado al núcleo (`nautilus-core`/`#day-core`)**: el resto del
  sistema de la ruleta — anillos, celdas, racha, cometa, supernova, ajustes,
  tema — queda exactamente igual. El único elemento con comportamiento nuevo
  es el círculo central donde hoy vive el contador `${done}/${active.length}`
  ("hoy"). Durante el gesto, ese contador se sustituye temporalmente por la
  previsualización del hábito apuntado — tomando prestado el centro con el
  mismo mecanismo que ya usa `showStreakInCore()` para la racha
  (`coreShowingTransient`) — y `refreshDayCore()` lo restituye sin cambios al
  cancelar o confirmar.

## Capabilities

### New Capabilities
- `radial-quick-mark`: gesto de pulsación prolongada + arrastre desde el
  núcleo central para previsualizar y confirmar el marcado de un hábito
  activo del día, con cancelación segura y alternativa accesible por modal.

### Modified Capabilities
(ninguna — no se alteran los requisitos de `daily-completion`; este cambio
añade un disparador nuevo que reutiliza su lógica de marcado sin modificarla)

## Impact

- **`src/render/svg.js`**: el núcleo (`nautilus-core`) gana listeners de
  `pointerdown`/`pointermove`/`pointerup`/`pointercancel`; no se toca la
  construcción del SVG en sí (nada de `innerHTML`, sólo listeners y atributos
  mutables, conforme al sistema de efectos del proyecto).
- **`src/main.js`**: nueva orquestación del selector radial (timer de
  long-press, cálculo de sector, confirmación que invoca el mismo camino de
  marcado que `onCellToggled` usa hoy para no duplicar lógica de racha/día).
- **`src/fx/engine.js`**: se reutiliza `haptics` tal cual; sin nuevas
  dependencias de plataforma.
- **Nuevo módulo** bajo `src/ui/` (o `src/fx/`, a decidir en design.md) para
  el overlay radial efímero (SVG o canvas) y su capa de accesibilidad
  (modal alternativo).
- **iOS/Safari y PWA offline**: el gesto debe funcionar sin `vibrate` (sólo
  se pierde el refuerzo háptico) y sin conexión (toda la lógica es local,
  sin llamadas de red).
- No hay cambios de esquema en `localStorage` — se reutiliza `habit.progress`
  y `saveHabits()` sin modificar su forma.

## No incluido en este cambio

- No se permite desmarcar un hábito mediante el gesto radial (el toggle de
  celda sigue siendo el único camino para desmarcar).
- No se rediseña el toggle de celda existente ni su hit-area.
- No se añade soporte para deshacer una confirmación distinta del
  desmarcado manual ya existente.
- No se resuelve aquí qué ocurre visualmente si los 7 hábitos están activos
  a la vez más allá de repartir sectores uniformes (pulido visual fino queda
  fuera de alcance).
- Si no hay hábitos pendientes hoy (todos completados), el gesto no
  despliega el selector; se deja como posible mejora futura mostrar un
  estado vacío informativo.
