## 1. Preparación

- [x] 1.1 Verificar que `src/counter.js` y `src/style.css` no tienen referencias en el proyecto con `grep -r "counter\|src/style" . --include="*.js" --include="*.html"` y eliminarlos si están sin uso
- [x] 1.2 Crear la estructura de directorios `src/utils/` y `src/render/` y verificar que existen con `ls src/`

## 2. Módulos de utilidades

- [x] 2.1 Crear `src/constants.js` con `MAX_HABITS`, `TOTAL_DAYS`, constantes de configuración SVG (`startAngle`, `sweepAngle`, `innerRadius`, `cellThickness`, `gapBetweenRings`, `svgPadding`, `DEG`) y `DEFAULT_COLORS`; verificar que exporta todos los valores con un `import` manual en la consola del dev server
- [x] 2.2 Crear `src/utils/date.js` con `toLocalISO`, `todayISO`, `addDays`, `formatDateShort`, `formatDateFull`, `diffDays`; verificar que las funciones producen los mismos resultados que en `main.js` actual comprobando en consola del dev server
- [x] 2.3 Crear `src/utils/color.js` con `lightenColor` y `darkenColor`; verificar que `lightenColor('#e74c3c', 0.4)` devuelve el mismo valor hex que antes
- [x] 2.4 Crear `src/utils/svg.js` con `polarToCartesian`, `annularSectorPath` y `computeSvgMetrics`; verificar que `computeSvgMetrics(3)` devuelve los mismos valores que en `main.js`

## 3. Módulos de estado y tema

- [x] 3.1 Crear `src/store.js` con el array `habits`, `loadHabits()`, `saveHabits()` y `cellState()`; verificar que los hábitos se cargan del localStorage correctamente arrancando el dev server
- [x] 3.2 Crear `src/theme.js` con `getThemeColors()`, `applyTheme()`, `toggleTheme()` e `initTheme()`; verificar que el toggle de tema sigue funcionando visualmente en el dev server

## 4. Módulos de render

- [x] 4.1 Crear `src/render/legend.js` con `renderLegend()` y todos sus event listeners internos (color picker, reset, edit, delete); verificar que la leyenda muestra los hábitos correctamente y todos los botones responden
- [x] 4.2 Crear `src/render/svg.js` con `renderSVG()` y sus event listeners (click en celdas, tooltip mouseenter/mousemove/mouseleave); verificar que el SVG radial se renderiza, las celdas se pueden marcar y el tooltip aparece

## 5. Punto de entrada

- [x] 5.1 Crear `src/main.js` con el registro del SW de PWA, `render()`, `checkLimit()`, `addHabit()`, `setupEventListeners()` e `init()`; importando de todos los módulos anteriores; verificar que la app arranca sin errores en consola con `npm run dev`
- [x] 5.2 Actualizar `index.html`: cambiar `./main.js` → `./src/main.js` y verificar que el dev server sirve la página correctamente

## 6. Limpieza y verificación

- [x] 6.1 Eliminar `main.js` de la raíz del proyecto y verificar que `npm run dev` sigue funcionando sin errores
- [x] 6.2 Ejecutar `npm run build` y verificar que la build completa sin errores ni warnings de módulos no encontrados
- [x] 6.3 Verificar el flujo completo en el navegador: añadir hábito, marcar celda, cambiar tema, reiniciar hábito, eliminar hábito; confirmar que localStorage persiste los cambios
