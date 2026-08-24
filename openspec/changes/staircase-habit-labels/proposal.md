## Why

La vista de hábitos se siente como una lista con gráfico adjunto. Queremos que el SVG sea el protagonista total de la interfaz: un "reloj de hábitos" legible de un vistazo, fácil de llevar en pantalla de inicio, y con nombres integrados al propio visual en vez de en una leyenda aparte que repite información.

## What Changes

- **Eliminación de la leyenda inferior** (`#habits-legend` y su sidebar): ya no existe como sección de UI.
- **Escalera de nombres en el hueco del SVG**: los hábitos muestran su nombre dentro del arco de 60° vacío (zona superior-izquierda, ~210°–270°), uno por anillo, orientados radialmente desde el centro hacia el exterior.
- **Orden visual automático por longitud de nombre**: el hábito con el nombre más corto ocupa el anillo más interno y el más largo el más externo. El color sigue atado al hábito (no al anillo), por lo que el color del label coincide con el color del arco.
- **Límite de 15 caracteres** en el nombre del hábito (antes 30), validado al añadir o editar.
- **Nuevo sistema de edición por panel contextual**: tocar un label en la escalera abre un bottom sheet (móvil) o popover (desktop) con nombre editable, swatches de color, fechas/progreso, y acciones de reiniciar y eliminar. Desaparece el botón ✏ y la fila de iconos de la leyenda.
- **Botón `+` en el header** para añadir hábitos (reemplaza el input siempre visible en el sidebar).
- El layout pasa de `sidebar + svg` a **SVG a pantalla completa** dentro del contenedor.

## Capabilities

### New Capabilities

- `svg-staircase-labels`: Nombres de hábitos renderizados dentro del SVG, en el hueco del arco, ordenados automáticamente por longitud de nombre de menor a mayor (innermost → outermost). Cada label usa el color del hábito y es táctil/clickeable.
- `habit-edit-sheet`: Panel contextual (bottom sheet en móvil, popover en desktop) que se abre al tocar un label de la escalera. Permite editar nombre (máx. 15 chars), cambiar color mediante swatches, ver fechas de inicio/fin y día actual, y ejecutar reiniciar o eliminar.

### Modified Capabilities

_(No hay specs existentes que modifiquen requisitos previos escritos.)_

## Impact

- `src/render/svg.js`: añadir generación de labels en el hueco del arco, lógica de orden por nombre, eventos de tap/click sobre labels.
- `src/render/legend.js`: se elimina por completo (o se vacía y se retira del árbol de módulos).
- `index.html`: eliminar `#habits-legend`, `.sidebar`, `#add-habit-container` del markup. Añadir el panel contextual y el botón `+` en el header.
- `style.css`: eliminar estilos de leyenda; añadir estilos de bottom sheet/popover, label SVG interactivo, swatches de color.
- `src/constants.js`: bajar `MAX_NAME_LENGTH` de 30 a 15 (nueva constante o ajuste de maxlength).
- `src/main.js`: actualizar flujo de `addHabit` para el nuevo `+` del header; actualizar `checkLimit`.
- Compatible con iOS/Safari y modo PWA instalado: el bottom sheet debe funcionar sin hover y con touch events.

## No incluido en este cambio

- Cambio en el número máximo de hábitos (sigue siendo 7).
- Cambio en la duración del reto (sigue siendo 21 días).
- Animaciones o transiciones del panel contextual (puede añadirse después).
- Tooltip de celdas (se mantiene igual).
