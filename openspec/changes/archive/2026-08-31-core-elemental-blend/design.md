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

**Revisión post-uso real.** La primera iteración de este diseño dibujaba
una cuña `annularSectorPath` fija por cada hábito guardado — visible si
estaba completado, atenuada si no. En uso real eso se sintió "infantil"
(cuñas planas de torta) y, más importante, generó ansiedad: ver el
círculo con sectores sin completar se leyó como un checklist a medio
llenar, no como una mezcla que va creciendo. Esta revisión reemplaza esa
geometría — ver Decisiones — sin tocar nada del resto del cambio
(anillo de segmentos, `setCoreCharge`, niveles de efecto).

## Goals / Non-Goals

**Goals:**
- El núcleo en reposo comunica qué elementos están completados hoy por
  color, sin depender de un bucle de animación continuo (batería/CPU).
- **Nunca representar lo pendiente como un vacío.** Sólo se dibuja lo ya
  logrado; un hábito sin marcar no reserva espacio, hueco ni casillero
  visible en el núcleo. Este es el objetivo que motivó la revisión de este
  diseño tras la primera iteración (ver Context): un círculo con sectores
  vacíos se leyó como un checklist incompleto, no como una mezcla que
  crece — y eso genera la misma ansiedad de cumplimiento que el contador
  numérico que este cambio buscaba evitar en primer lugar.
- Reutilizar utilidades ya existentes (`elementColor`, `defsEl`) en vez de
  introducir un segundo mecanismo de dibujo.
- Transición visible al incorporar/retirar un color, acorde al nivel de
  efectos activo, sin animación en nivel 1 o con `prefers-reduced-motion`.

**Non-Goals:**
- No se implementan fusiones específicas por combinación de elementos
  (fuego+agua → vapor, etc.) — ver "Ideas futuras" más abajo. Este cambio
  resuelve la mezcla genérica por superposición de color.
- No se cambia el anillo de segmentos, el brillo de `setCoreCharge`, la
  celebración de día completo, ni ningún uso transitorio existente de
  `setCoreLabel`.

## Decisions

**La mezcla se dibuja como formas orgánicas difuminadas que sólo existen
si el hábito está completado — no como cuñas de una torta.**
La iteración anterior reservaba una cuña por cada hábito guardado, visible
u oculta: un hábito pendiente todavía "ocupaba" un sector oscuro y
delimitado del círculo, leído como espacio vacío (ver Context). El nuevo
enfoque invierte la relación entre geometría y dato: en vez de un sector
fijo por hábito que se enciende o apaga, cada hábito completado hoy
**aporta** una forma (círculo con `filter: blur(...)`, un glow suave, no
un borde recto) de su color elemental. Un hábito pendiente no aporta nada
— no hay ninguna forma "apagada" esperando su turno, así que no hay nada
que leer como incompleto.

Tres alternativas evaluadas para la forma/mecanismo:
1. *Canvas continuo* (un efecto que nunca devuelve `false` en
   `addEffect`) — descartado: mantendría el `requestAnimationFrame` del
   motor de efectos corriendo todo el día, contradiciendo la invariante de
   "sin efectos activos, sin bucle".
2. *`conic-gradient()` en el `<div id="day-core">`* — descartado: no
   interpola con `transition` de forma nativa, y de todos modos vuelve a
   la lógica de "sectores de una torta" que es justo lo que se está
   dejando atrás.
3. **Elegida: un grupo de `<circle>` difuminados dentro del núcleo**, uno
   por hábito guardado (igual que antes, para no depender de un signature
   de rebuild aparte — ver tarea 1.1 original), pero con dos cambios
   clave: (a) cada círculo se ubica en un punto pseudo-aleatorio fijo
   cerca del centro, con semilla determinística por `habitId` (no por
   índice de posición, para que no lea como "slot N de M"), y (b) en
   reposo (`opacity:0`) es indistinguible del fondo — no hay contorno, aro
   ni marca que insinúe su existencia. Con `mix-blend-mode: screen` (o
   `lighten`), los círculos que se solapan generan un tono nuevo donde se
   cruzan: ahí sí hay mezcla real, no dos colores uno junto al otro.

**Transición de opacidad/escala al aparecer, no de posición.**
Al completarse un hábito, su forma pasa de `opacity:0, scale:0.5` a
`opacity:0.7, scale:1` con una transición CSS; al desmarcarse, el camino
inverso. La posición de cada forma es fija (seedeada por `habitId`,
calculada una vez por repintado) — sólo cambia su visibilidad, igual que
en la iteración anterior; lo que cambia es la forma en sí (círculo
difuminado en un punto pseudo-aleatorio, no una cuña en un sector fijo) y
que en `opacity:0` no queda ningún rastro visible del sector.

**Nueva función `setCoreBlend(active, doneIds)` en `effects.js`, hermana de
`setCoreCharge`.**
Recibe la lista de hábitos activos de hoy y cuáles están completados;
decide qué formas mostrar/ocultar. Vive en `effects.js` junto a
`setCoreCharge` porque ambas mutan presentación del núcleo en respuesta al
mismo evento (marcar/desmarcar), no porque compartan geometría.

**Nivel de efectos: la mezcla es visible desde el nivel 1.**
A diferencia de las partículas (que arrancan en nivel 3), la mezcla no es
un efecto opcional sino el reemplazo del contador — debe verse en todos
los niveles, incluido Calma. Lo que cambia por nivel es sólo la
transición: con `tier.value === 1` o `prefers-reduced-motion`, la forma
aparece/desaparece sin animación (mismo patrón que `.radial-picker` y
`.gauge-arc` con `html[data-tier="1"]`).

## Ideas futuras (fuera de alcance de este cambio)

El pedido original apunta a algo más ambicioso que una mezcla genérica de
color: que combinaciones **específicas** de elementos generen su propio
motivo visual — por ejemplo fuego+agua → vapor/niebla, fuego+planta →
ceniza, agua+tierra → barro, hielo+aire → escarcha. Con 7 elementos eso
son 21 pares posibles (más las combinaciones de 3 o más), cada uno con su
propia lógica y posiblemente su propio arte — un sistema en sí mismo, no
un ajuste de este cambio. Queda anotado acá como semilla para una futura
iteración; este cambio resuelve la mezcla genérica por superposición de
color y el problema del "vacío visible", no la tabla de fusiones.

## Risks / Trade-offs

- [Riesgo] Con 7 hábitos completados, muchas formas difuminadas
  superpuestas podrían verse turbias en vez de "mezcladas" → Mitigación:
  probar `mix-blend-mode: lighten` vs `screen`, radio/blur de cada forma y
  la dispersión de las posiciones pseudo-aleatorias durante la
  implementación.
- [Riesgo] Perder la cifra exacta en reposo puede sentirse como una
  regresión para quien prefería leerla de un vistazo → Mitigación: el
  anillo de segmentos y el brillo de `setCoreCharge` siguen dando esa
  lectura exacta; no se retira información, se reubica.
- [Riesgo] Tema claro vs oscuro: colores elementales pensados sobre fondo
  oscuro podrían perder contraste en tema claro → Mitigación: probar la
  mezcla en ambos temas antes de dar la tarea por cerrada (ya es una tarea
  de verificación establecida en este proyecto para cambios visuales).
- [Riesgo] Posiciones pseudo-aleatorias por `habitId` podrían agrupar mal
  (dos formas casi encimadas sin solaparse lo suficiente, o muy separadas
  y sin mezclar nunca) → Mitigación: usar un hash simple y determinístico
  del `habitId` para el ángulo/radio de cada forma, con un radio de
  dispersión acotado que garantice solape frecuente entre 2 o más formas
  activas; ajustar el radio de dispersión en la implementación si con
  hábitos reales no se solapan lo suficiente.

## Migration Plan

No aplica migración de datos — la mezcla se deriva de `habit.progress` tal
cual existe. Es un cambio de UI aditivo sobre `refreshDayCore()`; revertir
es restaurar la llamada a `setCoreLabel` con la cifra y retirar las formas,
sin dejar estado huérfano en `localStorage`.
