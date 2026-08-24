## Why

`main.js` concentra 597 líneas de constantes, helpers de fecha y color, matemática SVG, estado, persistencia, temas y render en un único archivo plano. Esto dificulta navegar, testear y extender el código. La reorganización en módulos ES con responsabilidades claras mejora la mantenibilidad sin alterar ningún comportamiento observable.

## What Changes

- `main.js` (raíz) se divide en módulos bajo `src/`:
  - `src/constants.js` — constantes globales (`MAX_HABITS`, `TOTAL_DAYS`, SVG config, paleta de colores)
  - `src/utils/date.js` — helpers de fecha (`toLocalISO`, `todayISO`, `addDays`, `formatDateShort`, `formatDateFull`, `diffDays`)
  - `src/utils/color.js` — helpers de color (`lightenColor`, `darkenColor`)
  - `src/utils/svg.js` — matemática SVG (`polarToCartesian`, `annularSectorPath`, `computeSvgMetrics`)
  - `src/store.js` — persistencia en localStorage (`loadHabits`, `saveHabits`, estado `habits`)
  - `src/theme.js` — gestión del tema (`getThemeColors`, `applyTheme`, `toggleTheme`, `initTheme`)
  - `src/render/legend.js` — render de la leyenda lateral y sus eventos
  - `src/render/svg.js` — render del SVG radial, tooltips y eventos de celda
  - `src/main.js` — punto de entrada: PWA registration, `init`, `setupEventListeners`
- `index.html` actualiza la referencia del script: `./main.js` → `./src/main.js`
- Los archivos `src/counter.js` y `src/style.css` (plantilla Vite no utilizada) se eliminan
- `style.css` (raíz) permanece sin cambios
- `vite.config.js` permanece sin cambios

## Capabilities

_Refactor puro — sin cambios de comportamiento observable. `skip_specs: true`._

## Impact

- Todos los módulos nuevos están bajo `src/`; los archivos raíz (`index.html`, `style.css`, `vite.config.js`) no cambian en funcionalidad
- El build de Vite y el service worker de Workbox siguen funcionando igual (`globPatterns` ya cubre `src/**/*.js`)
- Compatible con iOS/Safari y PWA instalada: no hay cambios en el manifest ni en el SW
- Sin nuevas dependencias de runtime

## No incluido en este cambio

- Refactor de `style.css` (estilos)
- Cambios de comportamiento: nueva funcionalidad, lógica de negocio, UI
- Tests unitarios (no existen en el proyecto actualmente)
- Migración a TypeScript
