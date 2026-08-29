## Context

El núcleo central (`nautilus-core` en el SVG, `#day-core` en el DOM) no
tiene listeners de puntero propios hoy: sólo lo mutan `refreshDayCore()` y
`showStreakInCore()` en `main.js`, y el medidor de carga en
`src/fx/effects.js`. `refreshDayCore()` es el estado de reposo del centro:
muestra `${done}/${active.length}` ("hoy"). `showStreakInCore()` ya
establece el precedente exacto que este cambio debe seguir: "toma
prestado" el centro con la bandera `coreShowingTransient`, y al expirar su
timer (1900ms) llama de nuevo a `refreshDayCore()` para devolverlo sin que
el contador de hoy quede desincronizado. El marcado de hábitos vive por
completo en `attachListeners()` de `svg.js`: un click delegado sobre
`path[data-habit-id]` muta `habit.progress[dayIndex]`, llama `saveHabits()`
y dispara `onCellClick`, que en `main.js` (`onCellToggled`) decide racha,
cometa, carga del núcleo y supernova de cierre de día.

**Alcance**: este cambio toca únicamente el núcleo central. Los anillos,
las celdas, sus listeners (`attachListeners()`), la animación de racha, el
cometa, la supernova de cierre de día y el resto de la UI (ajustes, tema,
hoja de edición) no se modifican en absoluto — se reutilizan tal cual desde
el punto de confirmación del gesto.

Ver proposal.md — Why / What Changes para la motivación y specs/radial-quick-mark/spec.md
para el contrato de comportamiento.

## Goals / Non-Goals

**Goals:**
- Implementar la máquina de estados del gesto (Reposo → Despliegue →
  Apuntado → Confirmación/Cancelación) sin acoplarse a lógica de racha o
  cierre de día: la confirmación debe invocar el mismo camino de datos que
  ya usa el click de celda, no una copia paralela.
- Overlay radial efímero que no interfiera con el ciclo de vida del SVG
  base (nunca `innerHTML` sobre `svg-container`; ver regla del sistema de
  efectos en CLAUDE.md).
- Mantener el gesto utilizable con el canvas de efectos activo a cualquier
  nivel (1–5) sin degradar su rendimiento.
- Ceñir todo el código nuevo al núcleo: cero cambios de comportamiento en
  anillos, celdas, racha, cometa, supernova o cualquier otra parte de la
  ruleta ya existente.

**Non-Goals:**
- No se diseña aquí el pulido visual final de los sectores (iconografía,
  transiciones) más allá de que sean legibles y usen los colores/iconos de
  `ELEMENTS`.
- No se resuelve soporte multi-touch simultáneo (dos dedos a la vez); el
  gesto asume un único puntero activo, cancelando si aparece un segundo.

## Decisions

**Un solo listener de Pointer Events sobre el núcleo, capturado con
`setPointerCapture`.**
Se usa `pointerdown`/`pointermove`/`pointerup`/`pointercancel` en vez de
Touch Events + Mouse Events por separado: unifica mouse, touch y pen, y
`setPointerCapture(pointerId)` en `pointerdown` garantiza que los eventos de
`move`/`up` sigan llegando aunque el dedo salga del círculo del núcleo
mientras el usuario apunta hacia sectores externos. Alternativa descartada:
Touch Events (`touchstart/move/end`) — más verboso, sin soporte de mouse
nativo, y el proyecto ya no tiene ninguna dependencia de Touch Events hoy.

> **Corregido después (v0.12.3).** Apoyar el arrastre en la captura resultó
> ser el error de fondo de este diseño: en la PWA de Android la captura no
> redirigía los eventos, así que apenas el dedo salía del círculo el
> apuntado dejaba de recibir `pointermove` y no se podía seleccionar nada.
> Peor: la llamada estaba envuelta en un `try/catch` mudo, de modo que el
> fallo no dejaba rastro. El gesto pasó a escuchar `move`/`up`/`cancel` en
> `document`, filtrando por `pointerId`; la captura quedó como refuerzo
> —evita que el navegador reasigne el puntero a otro elemento— y ya no como
> requisito. Escuchar en el documento es además la técnica habitual para
> arrastres, precisamente porque no depende de a quién pertenezca el evento.

**Temporizador de long-press con umbral de movimiento temprano.**
`pointerdown` arma un `setTimeout` (320ms, punto medio del rango
300–350ms). Si `pointermove` excede ~10px antes de que dispare el timer, se
cancela: evita que un scroll o drag incidental dispare el despliegue.
Mismo patrón que `coreTransientTimer` ya usa en `main.js` para estado
transitorio con `clearTimeout`.

**La previsualización reutiliza el mecanismo de `coreShowingTransient`, no
uno nuevo.**
Mientras el selector está en Despliegue/Apuntado, el centro entra en el
mismo modo "prestado" que ya usa `showStreakInCore()`: se fija
`coreShowingTransient = true` (o se extiende esa misma bandera) para que
`refreshDayCore()` no lo pise mientras el gesto está activo, y al cancelar
o confirmar se limpia la bandera y se llama a `refreshDayCore()` una sola
vez para restituir el `${done}/${active.length}` correcto — igual que hace
`coreTransientTimer` al expirar. No se introduce un segundo mecanismo de
"quién es dueño del centro"; se extiende el que ya existe.

**El despliegue calcula sectores sólo sobre hábitos pendientes de hoy.**
`N = habitsActiveToday().filter(h => !isDoneToday(h)).length`. Si `N === 0`
el timer no llega a desplegar nada (spec: "Sin hábitos pendientes"). Esto
mantiene el gesto coherente con su propósito de marcar, y evita sectores
"muertos" para hábitos ya completados que sólo confundirían el apuntado.

**Overlay en SVG, no en el canvas de `fx/engine.js`.**
Los sectores se construyen como elementos SVG (`<path>` de arco) insertados
como hijos temporales de `svgEl` y eliminados al plegar, en vez de
dibujarse en el canvas de partículas. Razón: el canvas se limpia y
redibuja por completo cada frame sólo por `engine.js` (regla del sistema de
efectos) y mezclar overlay persistente con partículas efímeras violaría esa
responsabilidad única. El overlay SVG puede coexistir con
`registerEffect`/partículas para el refuerzo visual de confirmación
(reutilizando `arrivalBurst` o similar ya existente en `effects.js`).

**Confirmación reutiliza `onCellToggled`, no lo reimplementa.**
Al confirmar, el nuevo código llama directamente a la misma función que hoy
invoca el click de celda (`onCellToggled(event, habitId, dayIndex,
prevState)` en `main.js`, con `dayIndex = todayIndexOf(habit)` y
`prevState = false`, tras mutar `habit.progress[dayIndex] = true` y
`saveHabits()` igual que hace `attachListeners()`). Alternativa descartada:
duplicar la lógica de racha/cometa/supernova en el nuevo módulo — se
descarta porque introduciría una segunda fuente de verdad que diverge con
el tiempo (riesgo ya señalado en comentarios existentes de `main.js` sobre
determinismo del centro).

**Nuevo módulo `src/ui/radial-picker.js`.**
Se añade un módulo dedicado en `src/ui/` (junto a `sheet.js`/`settings.js`)
en vez de crecer `main.js` o `svg.js` más. Expone `attachRadialPicker(view,
{ onConfirm })`, encapsulando el estado de la máquina y el overlay; `main.js`
sólo lo inicializa y le pasa el callback de confirmación que delega en
`onCellToggled`. Sigue la convención existente del proyecto de módulos
`src/ui/*` para mecánica de interacción compartida (ver `sheet.js`).

**Modal accesible reutiliza el patrón de hoja (`sheet.js`) existente.**
La pulsación simple sobre el núcleo abre una hoja inferior estándar (mismo
mecanismo que `habit-sheet`/`settings`), listando hábitos pendientes como
botones; seleccionar uno ejecuta el mismo camino de confirmación que el
gesto radial. Evita introducir un segundo patrón de modal en el proyecto.

**Con un solo pendiente, `deploy()` no construye el overlay: confirma
directo.**
Hallazgo de prueba en dispositivo real (iOS): un sector de 360° (el caso
`pending.length === 1`) no tiene ángulo que apuntar y su punto medio angular
cae debajo del núcleo — un artefacto visual, no un selector útil. `deploy()`
detecta este caso antes de llamar a `buildOverlay()` y en su lugar dispara
`onAim(habit)` (para el mismo destello de previsualización que ya usa el
camino normal) seguido de `teardown()` + `onConfirm(habit)` — mismo camino
de datos, sin sectores de por medio.

**Bloqueo de selección de texto en `document.body` durante todo el gesto.**
Hallazgo de prueba en dispositivo real (iOS Safari): `touch-action: none`
en el núcleo evita que el navegador robe el gesto para hacer scroll, pero
no evita que un arrastre sobre los `<text>` del SVG (números de día,
nombres de hábito) dispare la selección nativa de texto o su menú de
copia — eso lo gobierna `user-select`/`-webkit-touch-callout`, una
propiedad distinta. `onDown` agrega la clase `radial-gesture-lock` a
`document.body` desde el primer toque (no sólo desde el despliegue, para
cubrir también la ventana de espera del long-press) y `teardown()` la
quita en cualquier salida del gesto (confirmación, cancelación,
interrupción). Alternativa descartada: aplicar `user-select: none` de forma
permanente sobre los `<text>` del SVG — se prefirió acotarlo a la duración
del gesto para no tocar comportamiento fuera de él.

**Refuerzo cross-browser en fase Apuntado: `preventDefault()` + listener no
pasivo, además de `touch-action`.**
Reporte de prueba en dispositivo real (Android + Firefox): el gesto se veía
inconsistente — a veces no se desplegaba, a veces se cancelaba apenas
arrancaba el arrastre, a veces confirmaba un sector distinto al apuntado.
`touch-action: none` no es igual de estricto en todos los motores sobre un
`<circle>` de SVG, así que `onMove` ahora también llama
`e.preventDefault()` una vez en fase `deployed` (nunca en `pending`, por la
misma razón que la captura se demora: preservar el scroll nativo si el
gesto no llega a desplegarse), y el listener de `pointermove` se registra
con `{ passive: false }` — sin eso, `preventDefault()` no tiene efecto en
algunos motores. También se fija `touch-action: none` inline sobre el
núcleo como refuerzo redundante de la regla CSS. No pudo verificarse en el
dispositivo real donde se reportó el problema — son las mitigaciones
conocidas para esta clase de bug de Pointer Events + SVG, a la espera de
una repetición de la prueba.

## Risks / Trade-offs

- [Riesgo] `setPointerCapture` en el núcleo puede interceptar gestos de
  scroll de la página si el usuario empieza a desplazarse justo desde ahí
  → Mitigación: sólo se captura el puntero después de que el timer de
  320ms dispare (Despliegue), nunca en `pointerdown` puro; antes de eso el
  scroll nativo funciona sin interferencia.
- [Riesgo] Cálculo de ángulo/sector en cada `pointermove` podría generar
  jank en dispositivos de gama baja con el motor de efectos ya en nivel
  alto → Mitigación: el cálculo es trigonometría O(1) por evento (sin
  loops sobre partículas) y sólo muta el DOM cuando cambia el índice de
  sector apuntado, no en cada movimiento.
- [Riesgo] Un segundo puntero (multi-touch accidental) durante el gesto
  podría dejar el estado inconsistente → Mitigación: `pointerdown` de un
  segundo puntero mientras el primero está activo cancela el gesto en
  curso (transición a Cancelación) igual que un `pointercancel`.
- [Trade-off] Reutilizar `onCellToggled` acopla el nuevo módulo a la firma
  actual de esa función en `main.js` → aceptado deliberadamente para evitar
  divergencia de lógica de racha/cierre de día; si esa firma cambia, este
  módulo debe actualizarse en el mismo commit.

## Migration Plan

No aplica migración de datos (no cambia el esquema de `localStorage`). El
despliegue es un cambio de UI aditivo: se puede probar `?fx=` a distintos
niveles sin tocar la detección de tier, y revertir es eliminar el nuevo
módulo y su inicialización en `main.js` sin dejar estado huérfano.
