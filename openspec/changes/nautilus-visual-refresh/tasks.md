## 1. Fundamentos: tokens y tipografía

- [ ] 1.1 Reestructurar la cabecera de `style.css` en dos bloques por tema: "Tokens de la rueda — NO EDITAR" con los diez tokens actuales copiados **literalmente** (`--empty-cell-*`, `--locked-cell-*`, `--old-cell-*`, `--center-*`, `--guide-stroke`, `--day-label-fill`) y "Sistema visual" con los tokens nuevos de escena, superficie, borde, texto y acentos. Verificar con `git diff style.css` que ninguna de las diez líneas de la rueda cambia de valor en `:root` ni en `[data-theme="dark"]`.
- [ ] 1.2 Definir la paleta oscura del sistema visual (base `#04060e → #0b1424`, cian `#22d3ee`, ámbar `#f6d28a`) y aplicarla a `body` y `.container`, que pierde `background` y `box-shadow` y conserva layout, `max-width` y padding. Verificar en `npm run dev` con tema oscuro que la rueda sigue legible sobre la base nueva, con 1 y con 7 hábitos.
- [ ] 1.3 Definir la paleta clara como contraparte (base `#f4f1ea → #e7eef3`, acentos saturados `#0e7f96` / `#a9761b`). Verificar que el `--center-fill` blanco de la rueda y sus celdas crema no se pierden sobre el fondo, y que el texto secundario sobre fondo claro pasa contraste AA.
- [ ] 1.4 Sustituir Outfit por Space Grotesk (400/500/700) e IBM Plex Mono (400/500) en `index.html` y en todas las reglas `font-family` de `style.css`, cada una con su pila de respaldo. Verificar con las fuentes bloqueadas en DevTools que la app sigue legible y no se descuadra.
- [ ] 1.5 Comprobar que los labels de hábito dentro del SVG no se salen del arco con la fuente nueva: crear un hábito con un nombre de 15 caracteres y revisarlo en ambos temas. Si desborda, ajustar el `font-size` del label **sólo por CSS**, sin tocar `src/render/svg.js`.

## 2. Fondo escénico

- [ ] 2.1 Generar los `d` de las tres espirales logarítmicas con la fórmula del prototipo (`r = r0 · e^(k·θ)`, `k = 0.06`, 220 puntos) mediante un script desechable en el scratchpad. Verificar que el resultado son tres cadenas `M…L…` listas para pegar.
- [ ] 2.2 Añadir a `index.html` el `<div class="scene" aria-hidden="true">` como hermano de `.container`, con el SVG estático de círculos concéntricos y las tres espirales pegadas. Verificar en el inspector que el nodo está **fuera** de `#svg-container`.
- [ ] 2.3 Estilar `.scene` (`position: fixed; inset: 0; z-index: 0; pointer-events: none`), los degradados radiales cian y ámbar por tema, y subir `.container` a `z-index: 1`. Verificar que al tocar una celda sobre la zona del fondo la celda sigue respondiendo, y que el canvas de efectos dibuja partículas por encima del fondo.
- [ ] 2.4 Verificar que la escena es estática con `?fx=0` y con `prefers-reduced-motion: reduce` forzado en DevTools: sin animación ni pulso.

## 3. Cabecera

- [ ] 3.1 Convertir los cuatro botones de cabecera (`.theme-toggle`, `.info-toggle`, `.add-toggle`, `.fx-toggle`) en círculos con borde de acento y halo, manteniendo sus posiciones, sus `aria-label` y un área táctil de 44 × 44 px como mínimo. Verificar que el botón de añadir sigue atenuado y sin respuesta con 7 hábitos.
- [ ] 3.2 Restilar `header h1` y `header p` con Space Grotesk, versalitas, espaciado amplio y halo de acento. Verificar en un viewport de 360 px que el título no se solapa con los botones.
- [ ] 3.3 Añadir un estilo de `:focus-visible` a los botones de cabecera con contraste suficiente sobre el fondo escénico. Verificar recorriéndolos con el tabulador en ambos temas.

## 4. Estadísticas

- [ ] 4.1 Añadir a `src/store.js` los selectores `bestStreak()`, `effectiveness()` y `activeSummary()` según las definiciones de `specs/progress-stats/spec.md`. Verificar en la consola del navegador los casos de la spec: sin hábitos → `0`, `0`, `{active:0,total:0}`; hábito creado hoy y marcado → efectividad `100`.
- [ ] 4.2 Añadir a `index.html` la fila `.stats` con las tres tarjetas (icono SVG inline, cifra y etiqueta) y los `id` de los tres valores, entre `#svg-container` y el final de `.container`. Verificar que el marcado no entra dentro de `#svg-container`.
- [ ] 4.3 Añadir `renderStats()` a `src/main.js` escribiendo los tres valores por `textContent`, y llamarla desde `renderSVGOnly()`. Verificar que al marcar y desmarcar el día de hoy las cifras cambian al instante y que al eliminar un hábito se recalculan.
- [ ] 4.4 Estilar las tarjetas como superficies de cristal (translúcido, borde suave, `backdrop-filter` con prefijo `-webkit-` y respaldo opaco bajo `@supports not`). Verificar el respaldo desactivando `backdrop-filter` en DevTools.
- [ ] 4.5 Aplicar el presupuesto de alto: fila de ~92 px, colapso a línea compacta por debajo de 700 px de alto y ocultación por debajo de 600 px. Verificar en el emulador con un iPhone SE que la rueda no se encoge por debajo de su tamaño legible.

## 5. Superficies y hoja de información

- [ ] 5.1 Restilar `#habit-sheet` (panel, backdrop, handle, input, swatches, progreso, notificaciones y acciones) con las superficies del sistema visual. Verificar que se abre y cierra igual en móvil (bottom sheet) y en escritorio (popover), y que las seis acciones siguen funcionando: renombrar, elegir elemento, ver progreso, recordatorio, reiniciar y eliminar.
- [ ] 5.2 Restilar el selector radial de intensidad (`.fx-dial`, `.fx-dial-ring`, `.fx-opt`, backdrop y nota) sin tocar `src/ui/dial.js`. Verificar que las cinco opciones siguen seleccionables y que la elección persiste tras recargar.
- [ ] 5.3 Restilar `.cell-tooltip` y `.milestone-toast` con el mismo lenguaje. Verificar el tooltip al pasar sobre una celda y el toast forzando un milestone.
- [ ] 5.4 Añadir `#info-sheet` a `index.html` (backdrop, panel, título, el contenido de instalación de iOS y Android, botón de cierre) con las clases de superficie del sistema. Verificar que el marcado es independiente de `#habit-sheet`.
- [ ] 5.5 Cambiar el handler del botón ℹ️ en `src/main.js` para que abra `#info-sheet` en vez de llamar a `alert()`, con cierre por botón, por toque fuera y por `Escape`. Verificar que ya no aparece ningún diálogo nativo.

## 6. PWA, compatibilidad y cierre

- [ ] 6.1 Añadir a `src/sw.js` dos rutas `CacheFirst` con `registerRoute` para `fonts.googleapis.com` y `fonts.gstatic.com`. Verificar con `npm run build && npm run preview`, hard refresh, y luego modo offline en DevTools: la app carga con la tipografía correcta.
- [ ] 6.2 Revisar `theme_color` y `background_color` del manifiesto en `vite.config.js` contra la nueva base oscura. Verificar que la barra de estado de la PWA instalada no desentona con el fondo.
- [ ] 6.3 Probar en iOS/Safari (o en el simulador): sheets, `backdrop-filter`, `env(safe-area-inset-bottom)` bajo la fila de estadísticas y la app instalada en modo standalone.
- [ ] 6.4 Verificación de no-regresión de la rueda: `git diff --stat src/render/ src/fx/` debe salir vacío, y con 7 hábitos comprobar que celdas, labels en escalera, medidor del núcleo, indicador de hoy, partículas al marcar y la supernova al cerrar el día se ven y se comportan igual que antes.
- [ ] 6.5 Comparar capturas de ambos temas contra el prototipo (`prototypes/prototipoclaudedesign/`) y ajustar los desajustes visuales que queden. Verificar que la comparación cubre cabecera, fondo, estadísticas y los dos sheets.
