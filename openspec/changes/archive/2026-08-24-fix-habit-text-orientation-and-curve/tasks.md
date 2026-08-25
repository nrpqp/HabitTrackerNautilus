## 1. Arcos en `<defs>` para cada anillo

- [x] 1.1 En `src/render/svg.js`, dentro del bucle `sortedHabits.forEach`, calcular los puntos de inicio y fin del arco del hueco para cada anillo: `polarToCartesian(dynCx, dynCy, rIn + 2, 210)` y `polarToCartesian(dynCx, dynCy, rIn + 2, 270)`, y añadir un `<path id="label-arc-{habit.id}">` en `defsHTML` con `sweep-flag=1` y `large-arc-flag=0`. Verificar en DevTools que el elemento `<defs>` del SVG contiene un path por hábito con el id correcto.

## 2. Texto curvo con `<textPath>`

- [x] 2.1 Sustituir el bloque `<text ... transform="rotate(...)">` de `labelsHTML` en `src/render/svg.js` por un elemento `<text><textPath href="#label-arc-{habit.id}" startOffset="50%" text-anchor="middle">{habit.name}</textPath></text>`, manteniendo los mismos atributos de estilo (`font-size`, `font-weight`, `font-family`, `fill`). Verificar visualmente en el navegador que el texto de cada hábito sigue la curvatura del arco y se lee sin inversión.

## 3. Área táctil

- [x] 3.1 Actualizar el `<rect class="habit-label-hit">` para que su posición y transformación sigan siendo correctas con el nuevo render. Verificar que hacer click en la zona del label sigue abriendo el panel de edición del hábito correspondiente en desktop y táctil.

## 4. Verificación final

- [x] 4.1 Con `npm run dev`, añadir entre 1 y 7 hábitos y confirmar que: todos los labels aparecen curvos en el hueco, se leen en orientación correcta (no boca abajo), el click en cada label abre su panel de edición, y el SVG sigue renderizando correctamente en los modos claro y oscuro.
