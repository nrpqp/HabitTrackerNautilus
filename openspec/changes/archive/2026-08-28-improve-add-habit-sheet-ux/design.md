## Context

El sheet de hábito (`#habit-sheet`) es compartido entre modo `edit` y modo `create` (`src/main.js`, `openHabitSheet`/`closeSheet`). En modo `create`, `#sheet-actions` oculta Reiniciar/Eliminar y no queda ningún botón visible: la única confirmación es el `keydown` de Enter en `#sheet-name-input` (línea ~436-446). Los íconos de `#sheet-swatches` ya calculan qué elementos están "taken" por otros hábitos (línea ~260-279), pero no distinguen si el nombre está vacío: en creación aparecen todos seleccionables desde el primer render. El body ya tiene `overflow: hidden` y `height: 100vh` fijos, y existe un listener de `visualViewport.resize` (`adjustSheetForKeyboard`, línea ~405-421) que reposiciona el panel cuando aparece el teclado, pero no impide el rebote elástico de iOS Safari ni el scroll del documento durante ese reacomodo.

Ver proposal.md - Why / What Changes para la motivación completa.

## Goals / Non-Goals

**Goals:**
- Un botón de confirmación visible y siempre presente en modo creación, sin eliminar el atajo de Enter.
- Estado bloqueado/desbloqueado de los íconos de elemento controlado por el contenido del campo de nombre, reutilizando la lógica "taken" existente.
- Ningún scroll ni rebote de página mientras el sheet de hábito está abierto, en cualquier modo.

**Non-Goals:**
- No se rediseña el panel de edición (`edit` mode) más allá de heredar el bloqueo de scroll.
- No se cambia el límite de 7 hábitos ni la validación de longitud de nombre (ya cubiertos por `habit-edit-sheet`).
- No se introduce un sistema de gestión de foco/scroll genérico reutilizable fuera de este sheet.

## Decisions

**Botón de confirmación reutiliza `#sheet-actions`.** Se añade un botón (p. ej. `#sheet-confirm-btn`) a `#sheet-actions`, visible sólo en modo `create` (análogo a cómo hoy Reiniciar/Eliminar sólo se muestran en `edit`). Alternativa descartada: crear un contenedor de acciones separado sólo para creación — añade complejidad sin necesidad, ya que `#sheet-actions` ya alterna visibilidad por modo.

**El botón está deshabilitado hasta que el nombre sea válido**, escuchando el mismo evento `input` que desbloquea los swatches, en vez de validar sólo al hacer click. Alternativa descartada: validar sólo al click (permitir click y mostrar error) — peor UX en un formulario de un solo campo y no pedido por el usuario.

**Bloqueo de swatches condicionado por modo y contenido del nombre.** La función que puebla `#sheet-swatches` ya calcula `usedElements`; se añade una condición adicional `lockedByEmptyName = mode === 'create' && !nameInput.value.trim()` que se combina con `shouldDisable`. Un listener `input` en `sheet-name-input` vuelve a poblar (o sólo actualiza clases de) los swatches en cada tecleo. Alternativa descartada: deshabilitar swatches globalmente (también en `edit`) — el modo edición siempre tiene un nombre ya existente, así que no aplica y complicaría la condición sin beneficio.

**Bloqueo de scroll con `position: fixed` + guardado de `scrollY`, no `overflow: hidden` adicional.** El body ya usa `overflow: hidden` y `height: 100vh`, lo que normalmente basta en desktop, pero iOS Safari puede rebotar igual al mover el foco a un input. La técnica estándar para ese caso es fijar `body { position: fixed; top: -scrollY }` al abrir el sheet y restaurarlo al cerrar, combinada con `overscroll-behavior: none` en el `.habit-sheet-backdrop`/`.habit-sheet-panel` para que el propio scroll interno del panel no burbujee. Alternativa descartada: `touchmove` `preventDefault()` global — bloquearía también el scroll interno legítimo de contenido largo dentro del panel (notificaciones, progreso) y es más frágil en Safari que el patrón `position: fixed`.

## Risks / Trade-offs

- [Riesgo: fijar `position: fixed` en body puede introducir un salto visual de 1 frame en dispositivos lentos] → Mitigación: guardar `scrollY` antes de fijar y restaurarlo con `window.scrollTo` sin animación al liberar; probar en el nivel de dispositivo más bajo (`fx/engine.js` nivel 1).
- [Riesgo: deshabilitar el botón de confirmación mientras se escribe puede sentirse "tembloroso" si se habilita/deshabilita en cada tecla] → Mitigación: sólo alternar el atributo `disabled` cuando el resultado de `trim()` cambia de vacío a no-vacío o viceversa, no en cada evento `input`.
- [Riesgo: el listener `input` que repuebla swatches podría interferir con la actualización existente en modo `edit` al cambiar de hábito] → Mitigación: aplicar el listener sólo cuando `sheetMode === 'create'`, dejando `edit` con su comportamiento actual de swatches ya-pobladas al abrir.
