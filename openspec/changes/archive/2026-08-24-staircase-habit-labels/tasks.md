## 1. Preparar estructura HTML y eliminar leyenda

- [x] 1.1 En `index.html`: eliminar el `<div class="sidebar">` completo (input de añadir + `#habits-legend`) y el wrapper `.layout`; dejar `#svg-container` como hijo directo del `.container`. Verificar que `npm run dev` no lanza errores de elemento no encontrado.
- [x] 1.2 En `index.html`: añadir botón `<button id="add-habit-btn">+</button>` en el `<header>`, junto a los botones de tema e info. Verificar que el botón es visible en el header al cargar la app.
- [x] 1.3 En `index.html`: añadir el markup del panel `<div id="habit-sheet" class="habit-sheet hidden">` con sus secciones internas (nombre, swatches, progreso, acciones). Verificar que el div existe en el DOM pero está oculto al cargar.

## 2. Bajar el límite de caracteres

- [x] 2.1 En `src/constants.js`: añadir `export const MAX_NAME_LENGTH = 15`. Verificar que la constante existe y el valor es 15.
- [x] 2.2 En `src/main.js`: importar `MAX_NAME_LENGTH` y usarlo en `addHabit` (validación de longitud) y en el campo del panel de edición (`input.maxLength = MAX_NAME_LENGTH`). Verificar que intentar añadir un nombre de 16 caracteres no crea el hábito.

## 3. Escalera de labels en el SVG

- [x] 3.1 En `src/render/svg.js`: antes del loop de renderizado de anillos, crear `const sortedHabits = [...habits].sort((a, b) => a.name.length - b.name.length || habits.indexOf(a) - habits.indexOf(b))` y usar `sortedHabits` en lugar de `habits` para asignar índices de anillo. Verificar que al tener dos hábitos el más corto queda en el anillo más interno.
- [x] 3.2 En `src/render/svg.js`: añadir generación de `labelsHTML` dentro del loop de `sortedHabits`. Cada label es un `<text>` SVG con `transform="rotate(${angle}, ${dynCx}, ${dynCy})"` posicionado en la bisectriz del hueco (~240°), ancla en el radio interior del anillo. Color del label = color del hábito. Verificar que los labels aparecen dentro del hueco del SVG al cargar la app.
- [x] 3.3 En `src/render/svg.js`: por cada label, añadir un `<rect>` invisible (`fill="transparent"`) de al menos 44×44px superpuesto sobre el texto, con `data-habit-id` y clase `habit-label-hit`. Verificar que el `<rect>` existe en el DOM para cada hábito.
- [x] 3.4 En `src/render/svg.js`: añadir event listener `click` sobre `.habit-label-hit` que llame a `openHabitSheet(habitId)`. Verificar que al hacer click en el área de un label se ejecuta la función (puede ser un `console.log` temporalmente).
- [x] 3.5 En `src/render/svg.js`: calcular el font-size del label proporcionalmente a `innerRadius` (ej. `Math.max(9, innerRadius * 0.15)`). Verificar que con 7 hábitos los labels no solapan con los números de día externos en una pantalla de 320px de ancho.

## 4. Panel de edición (habit-edit-sheet)

- [x] 4.1 En `src/main.js` (o nuevo `src/sheet.js` si la lógica es extensa): implementar `openHabitSheet(habitId, mode = 'edit')`. En modo `edit` puebla el panel con el nombre, color, fechas y progreso del hábito; en modo `create` muestra el panel con campos vacíos y sin acciones de reiniciar/eliminar. Verificar que el panel se muestra al hacer click en un label.
- [x] 4.2 Implementar edición de nombre en el panel: el campo `<input>` con `maxLength=15` confirma al perder foco o al pulsar Enter, actualiza `habit.name`, llama a `saveHabits()` y re-renderiza el SVG. Escape restaura el nombre original. Verificar que editar y confirmar actualiza el label en el SVG.
- [x] 4.3 Implementar swatches de color en el panel: generar un swatch por cada color de `DEFAULT_COLORS`. Al seleccionar uno, actualiza `habit.color`, llama a `saveHabits()` y re-renderiza el SVG sin cerrar el panel. Marcar el swatch activo visualmente. Verificar que cambiar color actualiza el arco y el label en el SVG inmediatamente.
- [x] 4.4 Implementar la sección de progreso en el panel: mostrar fecha de inicio, fecha de fin y `Día X / 21` (o "Completado" si X > 21). Verificar que los datos son correctos al abrir el panel de un hábito activo y de uno completado.
- [x] 4.5 Implementar acción de reiniciar en el panel: pide confirmación (`confirm()`), y si se acepta resetea `habit.progress` y `habit.startDate = todayISO()`, guarda y re-renderiza. Verificar que tras reiniciar el SVG muestra todos los días vacíos para ese hábito.
- [x] 4.6 Implementar acción de eliminar en el panel: pide confirmación, elimina el hábito del array `habits`, guarda, cierra el panel y re-renderiza. Verificar que el hábito desaparece del SVG y del localStorage.
- [x] 4.7 Implementar cierre del panel al hacer click en el backdrop o presionar Escape. Verificar que el panel se cierra sin guardar cambios no confirmados.
- [x] 4.8 En `src/main.js` (o `src/sheet.js`): suscribir el evento `visualViewport.resize` para ajustar `bottom` o `transform` del panel cuando el teclado virtual aparece en iOS. Verificar en Safari iOS que el campo de nombre del panel es visible al editarlo sin que el teclado lo tape.

## 5. Flujo de añadir hábito desde el header

- [x] 5.1 En `src/main.js`: enlazar el `<button id="add-habit-btn">` del header para que llame a `openHabitSheet(null, 'create')`. En modo `create`, al confirmar el nombre se llama a `addHabit(name)` y se cierra el panel. Verificar que añadir un hábito desde el header lo crea y aparece en el SVG.
- [x] 5.2 Implementar la lógica de `checkLimit` para el nuevo botón: si hay 7 hábitos, deshabilitar el botón `+` del header. Verificar que con 7 hábitos el botón `+` no responde o aparece visualmente deshabilitado.

## 6. Estilos CSS

- [x] 6.1 En `style.css`: eliminar todos los estilos de `.sidebar`, `.habits-legend`, `.legend-item`, `.legend-top-row`, `.legend-info`, `.legend-actions`, `.legend-dates`, `.color-picker-wrapper`, `.color-picker-native`, `.edit-btn`, `.reset-btn`, `.delete-btn`, `.habit-name`, `.habit-name-input`. Verificar que `npm run build` no genera warnings de selectores huérfanos y la app no muestra residuos visuales.
- [x] 6.2 En `style.css`: añadir estilos del panel `#habit-sheet` — bottom sheet en móvil (≤768px: `position: fixed; bottom: 0; left: 0; right: 0; border-radius: 16px 16px 0 0`) y popover en desktop (>768px: `position: absolute`). Verificar que el panel es visible y usable en ambos breakpoints.
- [x] 6.3 En `style.css`: añadir estilos de swatches de color, sección de progreso e indicador visual del swatch activo. Verificar que los swatches son visibles y el activo está destacado.
- [x] 6.4 En `style.css`: añadir estilos para el botón `+` en el header y el cursor interactivo sobre los labels SVG. Verificar que el botón `+` tiene apariencia consistente con los demás botones del header.

## 7. Limpieza y verificación final

- [x] 7.1 Eliminar `src/render/legend.js` del árbol de módulos: retirar su import de `src/main.js`. Verificar que `npm run build` completa sin errores.
- [x] 7.2 Verificar flujo completo en móvil (viewport ≤768px): añadir hábito, marcar días, editar nombre, cambiar color, reiniciar y eliminar. Verificar que el bottom sheet no es tapado por el teclado virtual en iOS.
- [x] 7.3 Verificar flujo completo en desktop (viewport >768px): las mismas acciones con el popover. Verificar que el popover no cubre el SVG innecesariamente.
- [x] 7.4 Verificar soporte dark/light mode: abrir el panel y cambiar el tema; los colores del panel deben responder a las variables CSS del tema. Verificar que el SVG radial sigue renderizando correctamente tras los cambios.
