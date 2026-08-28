## Context

Ver `proposal.md — Why` para la motivación. Lo que condiciona el enfoque técnico:

- **La rueda es intocable.** `src/render/svg.js` construye el SVG una vez y después sólo muta atributos; lee su paleta con `getThemeColors()` (`src/theme.js`), que resuelve diez variables CSS. Ese contrato queda congelado: los diez tokens conservan sus valores literales actuales en ambos temas.
- **`#svg-container` es territorio compartido.** Contiene el `<svg>`, el `<canvas id="effect-overlay">` y el `.day-core`. `build()` en `svg.js:63` retira el SVG anterior con `svgEl.remove()` precisamente para no tocar a sus hermanos. Nada nuevo debe entrar ahí.
- **`renderSVGOnly()` (`src/main.js:26`) es el único punto de repintado**: lo llaman `render()`, el toggle de tema, `onCellToggled()` y el selector de elemento. Es el sitio natural para las estadísticas.
- **La app cabe en una pantalla**: `body` tiene `height: 100vh; overflow: hidden` y `.container` es un flex column con la rueda en `flex: 1`. Añadir una fila fija abajo le quita alto a la rueda; hay que acotar cuánto.
- **El prototipo es un `.dc.html`** con sintaxis de Claude Design (`sc-for`, `{{ }}`, `React.createElement`). No es código reutilizable: se adopta el lenguaje visual, no el archivo.

## Goals / Non-Goals

**Goals:**

- Un sistema de tokens en dos capas donde la capa de la rueda quede visiblemente aislada y protegida de futuras ediciones.
- Que el rediseño sea CSS + marcado estático en su mayor parte, con el mínimo de JS nuevo posible.
- Coste de render cero para la decoración: nada que dibuje por frame ni que compita con el canvas de efectos.

**Non-Goals:**

- No se introduce un preprocesador, un framework de utilidades ni un sistema de componentes. CSS puro, como manda `CLAUDE.md`.
- No se reorganiza `style.css` en varios archivos; se reordena por secciones dentro del mismo archivo.
- No se cambia el flujo del selector radial de efectos ni el motor de partículas: sólo su piel.

## Decisions

### 1. Tokens en dos capas, con la capa de la rueda sellada

`style.css` abre con dos bloques por tema:

```
:root {
  /* ── Tokens de la rueda — NO EDITAR ─────────────────────
     Los lee getThemeColors() en src/theme.js. Cambiarlos
     altera el aspecto del nautilus. */
  --empty-cell-fill: #e8e4dc;   /* … los diez, valores actuales */

  /* ── Sistema visual ─────────────────────────────────── */
  --scene-bg-0 / --scene-bg-1 / --surface / --surface-solid /
  --border-soft / --accent-cyan / --accent-amber / --glow-cyan / …
}
```

**Por qué:** el riesgo real de este cambio es que alguien "armonice" la paleta de la rueda al retocar el CSS meses después. Un bloque con nombre y comentario explícito, separado del resto, es la barrera más barata y la que sobrevive a la sesión. El requisito de la spec lo respalda.

*Alternativa descartada:* mover los tokens de la rueda a un archivo aparte. Añade un archivo por una razón organizativa, contra la convención del proyecto de preferir módulos existentes.

### 2. El fondo escénico es SVG estático en `index.html`, fuera de `#svg-container`

Un único `<div class="scene" aria-hidden="true">` en `position: fixed; inset: 0; z-index: 0; pointer-events: none`, hermano de `.container` (que sube a `z-index: 1`). Dentro: los degradados radiales por CSS y un `<svg>` con los círculos concéntricos y tres espirales logarítmicas con el `d` **precalculado y escrito literalmente** en el HTML.

**Por qué precalculado:** la espiral del prototipo es un bucle de 220 puntos. Ejecutarlo en runtime gasta JS de arranque en una decoración, y en Vanilla JS sin plantillas obliga a crear un módulo nuevo. Un `path` estático de ~2 KB en el HTML se comprime bien, no ejecuta nada y no puede fallar. El `d` se genera una vez con la fórmula del prototipo (`r = r0 · e^(k·θ)`, `k = 0.06`) y se pega.

**Por qué fuera de `#svg-container`:** es la regla del proyecto y de la memoria de sesión — ese contenedor lo comparten el SVG, el canvas de efectos y el `.day-core`. Un `viewBox` de pantalla completa además cubre toda la app, no sólo la rueda, que es lo que pide el prototipo.

*Alternativa descartada:* dibujar la decoración en el canvas de `src/fx/engine.js`. Mezclaría decoración estática con el bucle de partículas y obligaría a repintarla en cada frame.

### 3. `.container` deja de ser tarjeta y pasa a ser lienzo

Hoy `.container` es una tarjeta blanca con sombra sobre un fondo crema. En el prototipo no hay tarjeta: el contenido flota sobre la escena. `.container` pierde `background` y `box-shadow` y conserva el `max-width`, el padding y el layout flex. El color de fondo pasa a `body`.

Esto también resuelve el contraste: el `--center-fill` de la rueda (`#ffffff` en claro, `#141424` en oscuro) queda sobre el fondo de la escena, no sobre una tarjeta, así que la escena clara debe permanecer clara y la oscura permanecer muy oscura. Es el corsé que impone la decisión de no tocar los tokens de la rueda, y define ambas paletas:

- **Oscuro**: base `#04060e → #0b1424`, acento cian `#22d3ee`, ámbar `#f6d28a`. La rueda oscura (`#2c2c4a`, `#504e70`, `#f0c640`) encaja sin retoques.
- **Claro**: base `#f4f1ea → #e7eef3` con los mismos acentos en versión saturada (`#0e7f96`, `#a9761b`) para que el texto sobre fondo claro llegue a AA. La rueda clara (`#e8e4dc`, `#c5c0b6`, `#b8860b`) es cálida, así que la escena clara se mantiene cálida en la parte inferior y sólo se enfría arriba.

### 4. Las estadísticas son tres selectores puros en `store.js` + un render en `main.js`

En `src/store.js`, junto a `habitStreak()` y `habitsActiveToday()` que ya existen:

- `bestStreak()` → `Math.max(0, ...habits.map(habitStreak))`
- `effectiveness()` → recorre cada hábito hasta `min(diffDays(startDate, hoy), 20)`, cuenta vencidos y completados, devuelve el entero redondeado
- `activeSummary()` → `{ active: habitsActiveToday().length, total: habits.length }`

En `main.js`, `renderStats()` escribe los tres valores por `textContent` sobre marcado ya presente en `index.html`, y se llama desde `renderSVGOnly()`.

**Por qué en `renderSVGOnly()` y no en `render()`:** `render()` no cubre `onCellToggled()` ni el toggle de tema, que son justo los momentos en los que las cifras cambian o el color debe reaccionar. `renderSVGOnly()` es el único punto por el que pasan todos.

**Por qué `textContent` sobre marcado estático:** los iconos son SVG inline fijos y las etiquetas no cambian nunca. Regenerar la fila con `innerHTML` en cada toggle sería tirar y recrear tres nodos por nada — y es exactamente el patrón que ya causó problemas en este proyecto.

**Definiciones elegidas** (el prototipo no las especifica y sus cifras son de maqueta):

| Indicador | Definición | Por qué |
|---|---|---|
| Racha | la mayor `habitStreak()` de todos los hábitos | Reutiliza la definición ya especificada en `habit-streak`. No inventa una segunda noción de racha que contradiga la que la app ya celebra. |
| Efectividad | completados / días vencidos, todos los hábitos | Los días futuros están bloqueados por `day-window`: contarlos haría que un hábito nuevo naciera con 5 % y el número no significaría nada al principio del reto. |
| Activos | hábitos en curso hoy / total | `habitsActiveToday()` ya existe y ya define "en curso". El `n/7` del prototipo (días activos de la última semana) duplicaría el concepto de racha. |

### 5. La hoja de información reutiliza el patrón de sheet, no el de `habit-sheet`

Se añade un `#info-sheet` con su propia estructura mínima (backdrop + panel + botón de cierre), no se reaprovecha `#habit-sheet`: ese panel está gobernado por `openHabitSheet()`/`closeSheet()` con estado de hábito, modo crear/editar, posicionamiento de popover y ajuste de teclado. Meterle un tercer modo enredaría una función que ya hace bastante. Las dos hojas comparten las clases de superficie del sistema visual, no el JS.

### 6. Fuentes: cambio de familia + precache explícito

`index.html` pasa de `Outfit` a `Space Grotesk` (400/500/700) e `IBM Plex Mono` (400/500). Cada declaración `font-family` lleva su pila de respaldo (`system-ui, sans-serif` / `ui-monospace, monospace`) y `display=swap` evita el texto invisible.

Hoy las fuentes **no se cachean**: el proyecto usa `strategies: 'injectManifest'` con un `src/sw.js` propio que sólo hace `precacheAndRoute(self.__WB_MANIFEST)`, y la opción `runtimeCaching` de vite-plugin-pwa sólo aplica a `generateSW`. Así que la ruta hay que escribirla a mano en `src/sw.js` con `registerRoute` de `workbox-routing` y `CacheFirst` de `workbox-strategies` (ambos ya están instalados), una regla para `fonts.googleapis.com` y otra para `fonts.gstatic.com`. Es la única forma de cumplir el escenario offline de la spec — y de paso arregla un agujero que ya existía con Outfit.

*Alternativa descartada:* autoalojar las fuentes en `public/`, donde el precache del manifiesto las cogería sin tocar el SW. Es más robusto, pero añade ~200 KB de binarios al repositorio para un cambio de aspecto; dos `registerRoute` son menos superficie.

### 7. Presupuesto de alto para la fila de estadísticas

La fila ocupa alto fijo (~92 px con su margen) y la rueda sigue en `flex: 1` con `min-height: 0`. En pantallas de menos de 700 px de alto la fila colapsa a una sola línea compacta (icono + cifra en horizontal, ~56 px); por debajo de 600 px se oculta. La rueda nunca cede su espacio a las estadísticas.

## Risks / Trade-offs

- **La escena oscura tras la rueda clara, o al revés** → Los tokens de la rueda están congelados, así que la validación es visual y obligatoria: revisar los dos temas con 1 y con 7 hábitos antes de dar por buena cada tarea de CSS.
- **La fila de estadísticas encoge la rueda en móviles bajos** → Presupuesto de alto de la decisión 7, con colapso y ocultación por `@media (max-height)`. Verificar en un iPhone SE (568 px de alto útil).
- **`backdrop-filter` en Safari** → Prefijo `-webkit-backdrop-filter` en todas las superficies y `--surface-solid` opaco de respaldo bajo `@supports not (backdrop-filter: blur(1px))`.
- **Muchas capas translúcidas sobre el canvas de partículas degradan el FPS en móviles antiguos** → La escena es un único nodo estático sin `filter` ni animación; el difuminado se limita a las superficies pequeñas (tarjetas, sheets), nunca a un contenedor que envuelva la rueda. Si el gobernador de FPS del motor sigue degradando el nivel tras el cambio, retirar el `backdrop-filter` de las tarjetas de estadísticas.
- ~~**El cambio de fuente descuadra los labels de la rueda**~~ → **Riesgo descartado durante la implementación.** `src/render/svg.js` no hereda la fuente: la fija como atributo (`font-family: 'Outfit'` en los labels de hábito, línea 133, y en los números de día, línea 199). La rueda conserva Outfit pase lo que pase en el CSS. La consecuencia es la inversa de la prevista: **`index.html` debe seguir cargando Outfit con los mismos pesos (300;400;600)** junto a las familias nuevas, porque retirarla dejaría los textos de la rueda en la fuente por defecto y eso sí cambiaría su aspecto.
- **Regresión silenciosa en el canvas de efectos por el nuevo `z-index`** → La escena va en `z-index: 0` y `.container` en `1`; el canvas y el `.day-core` conservan los suyos. Probar un cierre de día completo (supernova) tras el rediseño.

## Migration Plan

No hay migración de datos: `localStorage` no cambia de forma. El despliegue es una publicación normal; el service worker sirve la versión nueva tras el ciclo de actualización habitual, y hay que forzar un hard refresh al probar el build. La reversión es un `git revert` del merge.

## Open Questions

- Ninguna que bloquee la implementación. Queda para después del rediseño, como cambio aparte: si conviene sustituir los emojis de los botones de cabecera por los iconos SVG del prototipo (el engranaje y la "i"), decisión que depende de cómo se vean los emojis nativos sobre el fondo oscuro en iOS.
