## Why

La cabecera acumula cuatro botones circulares en la esquina derecha —tema, información, añadir hábito e intensidad de efectos—. En un móvil de 390 px ocupan unos 220 px de ancho: cuatro decisiones apiladas antes de que el usuario haya visto el nautilus. El prototipo visual de referencia (`prototypes/prototipoclaudedesign/`) resuelve la misma pantalla con **dos** botones —información a la izquierda, ajustes a la derecha— y baja la acción de añadir a una píldora discreta en el borde inferior.

Al recoger la intensidad de efectos dentro de una hoja de ajustes, el control deja de ser una rueda radial y pasa a ser una escala. Y una escala numérica honesta destapa un hueco del motor: hoy el salto de Lite a Estándar va de cero partículas al canvas completo, sin peldaño intermedio. La gama media cae en Lite y se queda sin ninguna recompensa visual. Numerar la escala de 1 a 5 obliga a crear ese peldaño que faltaba.

## What Changes

### Cabecera y distribución

- La cabecera pasa de cuatro botones a **dos**: información (cian) arriba a la izquierda, ajustes (ámbar, icono de engranaje) arriba a la derecha.
- El botón `+` de añadir hábito abandona la cabecera y se convierte en una **píldora translúcida centrada en el borde inferior**, con el tratamiento discreto del prototipo. Conserva su estado deshabilitado al alcanzar los 7 hábitos.
- **BREAKING** El toggle de tema deja de ser accesible en un toque: pasa a vivir dentro de la hoja de ajustes.

### Hoja de ajustes (capacidad nueva)

- Nueva hoja inferior "Ajustes" abierta desde el engranaje, con tres filas: **tema**, **nivel de efecto visual** y **fuente de texto**.
- La fila de fuente se muestra **deshabilitada, marcada como próximamente**. No cambia ninguna tipografía en este ciclo.
- Su velo de fondo es un **degradado**: transparente sobre el nautilus y opaco junto al panel, para que la muestra de efectos siga siendo visible al elegir un nivel.

### Escala de efectos de 1 a 5

- **BREAKING** Desaparece la posición **automática**. La detección del dispositivo pasa a sembrar el valor en el primer arranque y deja de ser un modo persistente.
- **BREAKING** Desaparece el **control radial** de intensidad. `src/ui/dial.js` y sus estilos se eliminan.
- **BREAKING** Los niveles se renumeran de `0..3` a `1..5` y se inserta un peldaño nuevo entre Lite y Estándar: canvas y partículas con presupuesto reducido, sin filtros.
- Las preferencias guardadas con la numeración vieja se **migran** (`0→1`, `1→2`, `2→4`, `3→5`); sin migración, quien eligió Máximo arrancaría dos escalones por debajo.
- **BREAKING** La anulación de diagnóstico por URL pasa de `?fx=0..3` a `?fx=1..5`.
- Nuevo: `prefers-reduced-motion` deja de ser una entrada de la detección y pasa a ser un **techo permanente** que sujeta el nivel activo a 1 sin borrar la preferencia guardada. Hoy, elegir un nivel alto anula la preferencia del sistema operativo; después de este cambio, no.

### Información como manual (capacidad nueva)

- El botón de información deja de abrir una hoja dedicada a la instalación y abre un **manual** en secciones plegables: qué es el nautilus, cómo se marca un día, preguntas frecuentes y **cómo instalar la app** como una sección más.
- Las preguntas frecuentes documentan comportamientos que hoy la app no explica en ninguna parte: la ventana de edición de dos días, los límites de 7 hábitos y 15 caracteres, por qué un recordatorio puede no llegar y **dónde se guardan los datos** —`localStorage`, sin cuenta ni copia remota, se pierden al borrar los datos del navegador—.

## Capabilities

### New Capabilities

- `app-settings`: hoja de ajustes de la aplicación abierta desde la cabecera; alberga tema, nivel de efecto visual y el hueco reservado para la fuente de texto.
- `app-manual`: manual en secciones plegables abierto desde el botón de información, con preguntas frecuentes e instrucciones de instalación.

### Modified Capabilities

- `motion-tiers`: la clasificación pasa de cuatro a cinco niveles con un peldaño nuevo entre Lite y Estándar; se ajustan los presupuestos y el suelo del gobernador; se añade el techo permanente por `prefers-reduced-motion`.
- `effects-preference`: se elimina la posición automática y el control radial; la preferencia se elige en la hoja de ajustes sobre una escala de 1 a 5 y se migra desde la numeración anterior.
- `visual-identity`: la cabecera pasa de cuatro botones a dos; el requisito de la hoja de instalación se retira porque su contenido se traslada a `app-manual`; las referencias a `?fx=0` se renumeran.
- `habit-edit-sheet`: el punto de entrada para añadir un hábito deja de estar en la cabecera y pasa a la píldora inferior.
- `elemental-animations`: las referencias a los niveles 0, 2 y 3 se renumeran a la escala de 1 a 5.
- `habit-streak`: las referencias a los niveles 0, 1 y 2 se renumeran a la escala de 1 a 5.

## Impact

**Código eliminado**

- `src/ui/dial.js` completo (~170 líneas).
- Bloque `.fx-dial*` de `style.css` (~100 líneas).
- Botones `#theme-toggle`, `#add-habit-btn` y `#fx-toggle` de la cabecera en `index.html`.

**Código nuevo**

- `src/ui/sheet.js`: mecánica compartida de hoja inferior (velo, panel, foco, cierre por fuera y `Escape`). La consumen la hoja de ajustes y el manual. `#habit-sheet` se queda fuera: arrastra estado de hábito y modo crear/editar, y no gana nada absorbiendo un tercer modo.
- `#settings-sheet` y su fila de escala 1–5 en `index.html` y `style.css`.
- Píldora `.add-habit-pill` posicionada sobre el contenedor.

**Código modificado**

- `src/fx/engine.js`: `TIER_NAMES` con cinco entradas, tabla `BUDGET`, recorte a `1..5`, `detectTier()` reducido a semilla, techo por `prefers-reduced-motion`, suelo del gobernador.
- `src/fx/effects.js`: los tres umbrales (`=== 0`, `< 2`, `>= 3`) se reescriben sobre la escala nueva; catorce puntos de llamada.
- `src/fx/preference.js`: clave nueva y migración desde `fx-level`.
- `src/main.js`: cableado de las dos hojas, la píldora y la escala.
- `style.css`: selectores `html[data-tier="0"]` renumerados.
- `CLAUDE.md`: niveles `1..5` y `?fx=1..5`.

**Compatibilidad**

- **iOS/Safari**: las dos hojas nuevas usan la misma mecánica de superficie ya probada en `#info-sheet`, con respaldo opaco donde no hay `backdrop-filter`. La píldora inferior debe respetar el área segura inferior en PWA instalada.
- **PWA offline**: no se añaden recursos remotos. El service worker sólo necesita recachear los assets del build.
- **Datos**: los hábitos en `habitos_nautilus` no se tocan. Sólo migra la clave de preferencia de efectos.

## No incluido en este cambio

- **No se toca la rueda principal.** `src/render/svg.js`, `src/constants.js` y la geometría del nautilus quedan intactos, igual que el contrato de tokens visuales del anillo.
- **No se implementa el cambio de fuente.** La fila queda visible y deshabilitada; elegir tipografía llega en un ciclo posterior, donde habrá que decidir qué pasa con la `Outfit` que `src/render/svg.js` fija como atributo en los labels y los números.
- No se rediseña `#habit-sheet` ni la fila de indicadores.
- No se añade un sexto nivel de efectos ni se revisan los presupuestos de los niveles existentes más allá de lo que exige insertar el peldaño nuevo.
- No se añade sincronización, cuenta de usuario ni copia remota de los datos: el manual se limita a explicar con honestidad el modelo actual.
