## 1. Botón de confirmación en modo creación

- [x] 1.1 Añadir el botón de confirmación (p. ej. `#sheet-confirm-btn`) dentro de `#sheet-actions` en `index.html`, y verificar que existe en el DOM al cargar la página
- [x] 1.2 En `openHabitSheet` (`src/main.js`), mostrar el botón sólo cuando `sheetMode === 'create'` y ocultarlo en `edit`, verificando visualmente ambos modos
- [x] 1.3 Cablear el `click` del botón para ejecutar el mismo flujo de creación que hoy dispara Enter (`addHabit` + `closeSheet`), verificando que crear un hábito por botón añade la entrada a `localStorage` y al SVG
- [x] 1.4 Mantener el `keydown` de Enter como atajo equivalente en modo creación, verificando que ambas vías (botón y Enter) producen el mismo resultado
- [x] 1.5 Deshabilitar el botón mientras el nombre esté vacío o sólo tenga espacios, alternando `disabled` únicamente cuando el resultado de `trim()` cambia de vacío a no-vacío (según design.md), y verificar que tocar el botón deshabilitado no crea ningún hábito

## 2. Bloqueo progresivo de íconos de elemento

- [x] 2.1 En la función que puebla `#sheet-swatches`, añadir la condición `lockedByEmptyName = sheetMode === 'create' && !nameInput.value.trim()` combinada con el `shouldDisable` existente, y verificar que al abrir el sheet de creación todos los íconos aparecen bloqueados
- [x] 2.2 Añadir un listener `input` en `sheet-name-input`, activo sólo en modo `create`, que reevalúe el bloqueo de swatches en cada tecleo, verificando que escribir un nombre desbloquea los íconos disponibles y borrar el nombre los vuelve a bloquear
- [x] 2.3 Verificar que los íconos ya asignados a otro hábito (`taken`) permanecen bloqueados con el mensaje "ya asignado a otro hábito" incluso después de escribir un nombre válido
- [x] 2.4 Añadir el estilo visual de estado "bloqueado por falta de nombre" en `style.css` para `.element-btn` (distinguible del estado `taken` existente si es necesario), y verificar en claro/oscuro

## 3. Bloqueo de scroll/bounce mientras el sheet está abierto

- [x] 3.1 En `openHabitSheet`, guardar `window.scrollY` y fijar `document.body` con `position: fixed; top: -scrollY` (o técnica equivalente) al abrir el sheet, verificando que la página no rebota al enfocar `sheet-name-input` en un dispositivo/emulación móvil
- [x] 3.2 En `closeSheet`, revertir los estilos fijados sobre `body` y restaurar el `scrollY` guardado con `window.scrollTo` sin animación, verificando que no queda salto visual al cerrar
- [x] 3.3 Añadir `overscroll-behavior: none` en `.habit-sheet-backdrop` y `.habit-sheet-panel` en `style.css`, verificando que el scroll interno del panel (si lo hay) no hace bubble hacia el documento
- [ ] 3.4 Probar en iOS/Safari (real o simulado) que `adjustSheetForKeyboard` sigue reposicionando el panel correctamente sin que aparezca rebote elástico del viewport al mostrarse/ocultarse el teclado — PENDIENTE: esta sesión sólo tuvo Chrome de escritorio (con viewport móvil emulado); el rebote elástico de iOS Safari no es reproducible con fidelidad ahí. Requiere un iPhone/iPad real o un servicio tipo BrowserStack.

## 4. Verificación integral

- [x] 4.1 Ejecutar `npm run build` y verificar que compila sin errores
- [x] 4.2 Probar manualmente el flujo completo de "Nuevo hábito" en viewport móvil (≤768px): sheet bloqueado al abrir, desbloqueo al escribir, creación por botón y por Enter, sin scroll de fondo
- [x] 4.3 Probar manualmente el flujo de edición (`edit` mode) para confirmar que no hay regresión: swatches siguen mostrando el estado activo/`taken` habitual y el sheet sigue sin scroll de fondo
- [x] 4.4 Verificar que el límite de 7 hábitos sigue deshabilitando el acceso de añadir como antes (`checkLimit`), sin interferencia de los cambios anteriores
