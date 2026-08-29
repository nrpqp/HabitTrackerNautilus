## Context

El núcleo (`nautilus-core`, `src/render/svg.js`) es hoy un círculo SVG con
un único `fill` sólido (`tc.centerFill`/`tc.centerStroke` desde
`getThemeColors()`), y su texto vive aparte, en el `<div id="day-core">`
de `index.html` (`#core-value`/`#core-caption`), posicionado por CSS sobre
el SVG. `refreshDayCore()` en `main.js` es el estado de reposo: hoy escribe
`${done}/${active.length}` ahí. `showStreakInCore()` ya establece el
patrón de "tomar prestado" el centro vía `coreShowingTransient`
([[radial-quick-mark]] lo reutilizó igual para su previsualización) — este
cambio no toca ese mecanismo, sólo lo que `refreshDayCore()` pone en
reposo.

El anillo de segmentos alrededor del núcleo ya existe (`gauges` en
`svg.js`, pintado por hábito con `elementColor(habit.element, 20)`) y el
brillo que crece con la proporción del día (`setCoreCharge` en
`effects.js`, un `drop-shadow` CSS) tampoco cambia — ver proposal.md.

El sistema de efectos (`src/fx/engine.js`) sólo mantiene un
`requestAnimationFrame` mientras hay efectos activos en el `Set` de
`engine.js`; en reposo (sin marcar nada) el bucle está parado
(`rafId = null`). Cualquier diseño que mantenga una animación continua
todo el día rompería esa invariante.

## Goals / Non-Goals

**Goals:**
- El núcleo en reposo comunica qué elementos están completados hoy por
  color, sin depender de un bucle de animación continuo (batería/CPU).
- Reutilizar utilidades ya existentes (`elementColor`, `annularSectorPath`,
  `defsEl`) en vez de introducir un segundo mecanismo de dibujo.
- Transición visible al incorporar/retirar un color, acorde al nivel de
  efectos activo, sin animación en nivel 1 o con `prefers-reduced-motion`.

**Non-Goals:**
- No se diseña una mezcla física de color realista (difuminado real de
  pigmentos); alcanza con una composición visual reconocible por elemento.
- No se cambia el anillo de segmentos, el brillo de `setCoreCharge`, la
  celebración de día completo, ni ningún uso transitorio existente de
  `setCoreLabel`.

## Decisions

**La mezcla se dibuja como cuñas SVG dentro del núcleo, no como
`conic-gradient()` CSS ni como partículas de canvas.**
Tres alternativas evaluadas:
1. *Canvas continuo* (un efecto que nunca devuelve `false` en
   `addEffect`) — descartado: mantendría el `requestAnimationFrame` del
   motor de efectos corriendo todo el día, contradiciendo la invariante de
   "sin efectos activos, sin bucle" y con costo de batería en un elemento
   que no necesita redibujarse cuadro a cuadro (sólo cambia cuando se
   marca o desmarca un hábito).
2. *`conic-gradient()` en el `<div id="day-core">`* — descartado: los
   gradientes CSS no interpolan de forma nativa con `transition`, así que
   animar la incorporación de un color exigiría un truco (crossfade de
   capas, `@property` con soporte parcial) más frágil que dibujar
   geometría.
3. **Elegida: un grupo `<path>` de cuñas anulares dentro del núcleo**, una
   por hábito completado hoy, construidas con `annularSectorPath` — la
   misma utilidad que ya usan los anillos de días y el overlay de
   `radial-picker.js` — con `mix-blend-mode: lighten` (o `screen`) entre
   ellas para que los colores se perciban mezclándose donde se solapan, en
   vez de como cuñas separadas de una torta. Se actualiza mutando el
   `<path>` de cada cuña (agregar/quitar del grupo, o animar su
   `fill-opacity`/`transform` de 0 a 1), igual que el resto del SVG: se
   construye una vez, después sólo se mutan atributos.

**Cuñas con transición de opacidad/escala, no de posición angular.**
Al completarse un hábito, su cuña pasa de `opacity:0, scale:0.6` a
`opacity:1, scale:1` con una transición CSS (como ya hace
`.radial-picker-wedge`); al desmarcarse, el camino inverso. Alternativa
descartada: recalcular los ángulos de todas las cuñas cada vez que cambia
el número de completados (como hace `radial-picker` con sus sectores) —
aquí las cuñas son permanentes por hábito (posición fija según su índice
entre los activos de hoy, calculada una vez por repintado), así que sólo
su visibilidad cambia; recalcular ángulos en cada marcado sería más
trabajo por un resultado que no lo necesita — a diferencia del selector
radial, esto no se apunta con el dedo.

**Nueva función `setCoreBlend(active, doneIds)` en `effects.js`, hermana de
`setCoreCharge`.**
Recibe la lista de hábitos activos de hoy y cuáles están completados;
decide qué cuñas mostrar/ocultar. Vive en `effects.js` junto a
`setCoreCharge` porque ambas mutan presentación del núcleo en respuesta al
mismo evento (marcar/desmarcar), no porque compartan geometría.

**Nivel de efectos: la mezcla es visible desde el nivel 1.**
A diferencia de las partículas (que arrancan en nivel 3), la mezcla no es
un efecto opcional sino el reemplazo del contador — debe verse en todos
los niveles, incluido Calma. Lo que cambia por nivel es sólo la
transición: con `tier.value === 1` o `prefers-reduced-motion`, la cuña
aparece/desaparece sin animación (mismo patrón que `.radial-picker` y
`.gauge-arc` con `html[data-tier="1"]`).

## Risks / Trade-offs

- [Riesgo] Con 7 hábitos completados, 7 cuñas semitransparentes
  superpuestas podrían verse turbias en vez de "mezcladas" → Mitigación:
  probar `mix-blend-mode: lighten` vs `screen` vs opacidades escalonadas
  durante la implementación; ajustar el número de cuñas visibles a la vez
  no es necesario si el blend queda legible, pero es la primera palanca si
  no lo está.
- [Riesgo] Perder la cifra exacta en reposo puede sentirse como una
  regresión para quien prefería leerla de un vistazo → Mitigación: el
  anillo de segmentos y el brillo de `setCoreCharge` siguen dando esa
  lectura exacta; no se retira información, se reubica.
- [Riesgo] Tema claro vs oscuro: colores elementales pensados sobre fondo
  oscuro podrían perder contraste en tema claro → Mitigación: probar la
  mezcla en ambos temas antes de dar la tarea por cerrada (ya es una tarea
  de verificación establecida en este proyecto para cambios visuales).

## Migration Plan

No aplica migración de datos — la mezcla se deriva de `habit.progress` tal
cual existe. Es un cambio de UI aditivo sobre `refreshDayCore()`; revertir
es restaurar la llamada a `setCoreLabel` con la cifra y retirar las cuñas,
sin dejar estado huérfano en `localStorage`.
