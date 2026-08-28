## Why

En móvil, el flujo de "Nuevo hábito" sólo se confirma pulsando Enter en el teclado virtual, lo cual no es un gesto intuitivo ni descubrible (nada en la interfaz lo indica). Además, los íconos de elemento aparecen todos seleccionables desde el primer instante — incluso antes de escribir un nombre — sin comunicar cuáles quedan realmente disponibles, y la apertura del sheet junto con el foco automático del teclado provoca que la pantalla se desplace hacia arriba y abajo, dando una sensación de scroll indeseado en una app que por diseño no debería tener scroll.

## What Changes

- Añadir un botón de confirmación explícito y visible en el sheet cuando está en modo "crear" (actualmente `sheet-actions` sólo muestra Reiniciar/Eliminar, ocultos en creación, dejando el sheet sin ninguna acción visible).
- La tecla Enter dentro del campo de nombre deja de ser el único mecanismo de confirmación en modo creación: sigue funcionando como atajo, pero el botón nuevo es la vía primaria y visible.
- Los íconos de elemento (`#sheet-swatches`) en modo creación aparecen bloqueados (no interactivos, con estado visual "pendiente") mientras el campo de nombre esté vacío. Al escribir un nombre válido se desbloquean únicamente los elementos disponibles; los ya asignados a otro hábito permanecen bloqueados con su indicación actual ("Ya asignado a otro hábito").
- Bloquear el desplazamiento/rebote de la pantalla (scroll o bounce del viewport) mientras el sheet de hábito está abierto, incluyendo el reacomodo por aparición del teclado virtual, de forma que el layout no "suba y baje" al enfocar el input.

## Capabilities

### Modified Capabilities

- `habit-edit-sheet`: el requirement "Añadir nuevo hábito desde el acceso inferior" cambia su mecanismo de confirmación (botón explícito en vez de sólo Enter) y añade reglas de bloqueo progresivo de los íconos de elemento y de contención del scroll/bounce de pantalla mientras el sheet está abierto.

## Impact

- `index.html`: nuevo botón de confirmación dentro de `#sheet-actions` (o análogo) visible en modo creación; posibles atributos `disabled`/`aria-disabled` en los botones de `#sheet-swatches`.
- `src/main.js`: lógica de `openHabitSheet` (render de swatches y su estado bloqueado), listener `keydown` del `sheet-name-input` (ya no cierra por sí solo el flujo), listener `input` nuevo para desbloquear swatches, y manejo de bloqueo de scroll/bounce al abrir/cerrar el sheet (`openHabitSheet`/`closeSheet`, y el listener existente de `visualViewport`).
- `style.css`: estados visuales `locked`/bloqueado para `.element-btn`, estilo del nuevo botón de confirmación, y reglas para impedir rebote de scroll mientras el sheet está abierto.
- Sin cambios en el modelo de datos (`store.js`) ni en `localStorage`.
- Verificar en iOS/Safari, donde el rebote elástico del viewport y el comportamiento del teclado virtual son más pronunciados.
