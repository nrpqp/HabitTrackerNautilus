## Context

El SVG radial actual genera los anillos en `src/render/svg.js` usando `computeSvgMetrics` para dimensionar el viewBox en función del número de hábitos. Los hábitos se ordenan por índice de inserción; no existe lógica de reordenamiento. La leyenda vive en `src/render/legend.js` como HTML aparte del SVG. El layout HTML divide la pantalla en `.sidebar` (leyenda + input) y `.svg-container`.

El hueco del arco ocupa 60° (startAngle = −90°, sweepAngle = 300°), entre los ángulos ~210° y ~270° en el sistema de coordenadas de `polarToCartesian`. La bisectriz del hueco está en ~240°, que en pantalla corresponde a la zona superior-izquierda del círculo.

## Goals / Non-Goals

**Goals:**
- Renderizar labels de hábitos dentro del SVG en el hueco del arco con orden por longitud de nombre
- Que los labels sean interactivos y abran el panel de edición
- Reemplazar la leyenda HTML con un panel contextual (bottom sheet / popover)
- Eliminar el sidebar del layout; SVG ocupa todo el ancho disponible

**Non-Goals:**
- Animaciones de apertura del panel (puede añadirse en un cambio posterior)
- Cambiar la geometría del hueco o el ángulo de barrido del arco
- Soporte de nombres con más de 15 caracteres

## Decisions

### D1: Orientación del texto de labels — texto rotado radialmente

Los labels se renderizan como elementos `<text>` SVG con un atributo `transform="rotate(angle, cx, cy)"` que los alinea con la dirección radial del bisector del hueco. El punto de anclaje (`text-anchor="start"`) se coloca en el radio interior de cada anillo en esa dirección, de modo que el texto se extiende hacia el exterior.

**Alternativa descartada**: texto horizontal posicionado a la izquierda del SVG con conectores. Requeriría ampliar el viewBox a la izquierda y complicaría la geometría en distintos tamaños de pantalla.

### D2: Ordenamiento visual — sort de la copia antes de renderizar, sin mutar `habits`

En `renderSVG`, antes de asignar anillos, se crea una copia ordenada de `habits` (`[...habits].sort((a, b) => a.name.length - b.name.length || habitsOriginalIndex)`). El array `habits` en `store.js` mantiene el orden original de inserción (preserva colores y IDs intactos); sólo el renderizado usa el orden por longitud.

**Alternativa descartada**: reordenar el array `habits` en localStorage. Cambiaría la semántica del índice de color y podría romper flujos que asumen estabilidad del orden.

### D3: Panel contextual — elemento HTML fuera del SVG, controlado por JS

El panel se implementa como un `<div id="habit-sheet">` en `index.html`, posicionado con CSS fijo en la parte inferior (bottom sheet). En desktop (viewport > 768px) se posiciona como popover absoluto cerca del label clicado, usando las coordenadas del evento.

Se eligió HTML + CSS sobre un `<foreignObject>` SVG porque el SVG tiene `overflow: visible` y las interacciones táctiles con elementos dentro de `<foreignObject>` son inconsistentes en iOS/Safari.

**Alternativa descartada**: `<dialog>` nativo. Tiene buena accesibilidad pero no permite el posicionamiento de popover anclado a un elemento SVG sin JS adicional, y el comportamiento en iOS Safari con el teclado virtual es impredecible.

### D4: Botón `+` en el header — reemplaza el input siempre visible

El `<input id="new-habit-input">` y el `<button id="add-habit-btn">` actuales se sustituyen por un `<button id="add-habit-btn">` en el header. Al pulsarlo aparece el panel de edición en modo "crear" (nombre vacío, sin acciones de reiniciar/eliminar).

El panel de creación reutiliza el mismo `#habit-sheet` con un estado `mode: create | edit` gestionado en JS.

### D5: Área táctil de labels — `<rect>` transparente de al menos 44×44px

Los `<text>` SVG no tienen área de hit configurable fácilmente en iOS. Se superpone un `<rect>` invisible con `fill="transparent"` y dimensiones mínimas de 44×44px centrado en cada label. El `<rect>` lleva los `data-habit-id` y los event listeners.

## Risks / Trade-offs

- **Labels largos en anillos externos pueden solapar con los números de día** si el SVG es muy pequeño. Mitigación: `font-size` de los labels se escala proporcionalmente con `innerRadius`; se establece un mínimo de 9px.
- **El reordenamiento visual puede confundir al usuario** si cambia el anillo de un hábito al editar su nombre. Mitigación: el color (el identificador visual principal) no cambia; solo la posición del anillo varía. El efecto es inmediato y reversible.
- **El panel en iOS con teclado virtual** puede quedar tapado al editar el nombre. Mitigación: usar `scroll-padding-bottom` y `visualViewport` API para ajustar la posición del panel cuando el teclado aparece.

## Migration Plan

1. Eliminar `#habits-legend`, `.sidebar` del HTML y los estilos asociados en CSS.
2. Añadir `#habit-sheet` al HTML y sus estilos.
3. Actualizar `src/render/svg.js` para generar los labels y `<rect>` interactivos.
4. Eliminar `src/render/legend.js` del árbol de módulos.
5. Actualizar `src/main.js` para el nuevo flujo de añadir hábito y la lógica del panel.
6. Bajar `maxlength` a 15 en constantes y en el campo del panel.

No hay datos en localStorage que requieran migración: el schema de `habitos_nautilus` no cambia.

**Rollback**: `git revert` del commit de esta feature. Sin efecto en datos del usuario.
