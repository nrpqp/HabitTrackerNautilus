## Context

`main.js` (raíz) tiene 597 líneas planas sin separación de responsabilidades. `src/` existe pero solo contiene artefactos de la plantilla Vite (`counter.js`, `style.css` sin uso). Vite soporta nativamente ES modules con múltiples puntos de entrada; no se necesita ningún bundler adicional. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**
- Dividir `main.js` en módulos ES con una única responsabilidad cada uno
- Establecer una estructura de directorios clara y escalable bajo `src/`
- Eliminar archivos de plantilla Vite sin uso (`src/counter.js`, `src/style.css`)
- Mantener el build de Vite, PWA y SW intactos
- No introducir ningún cambio observable en el comportamiento

**Non-Goals:**
- Refactor de `style.css`, `index.html` o `vite.config.js` (más allá del path del script)
- TypeScript, testing, ni nuevas features

## Decisions

### 1. Estructura de módulos

```
src/
  constants.js        ← MAX_HABITS, TOTAL_DAYS, SVG config, DEFAULT_COLORS
  store.js            ← estado `habits[]`, loadHabits(), saveHabits()
  theme.js            ← getThemeColors(), applyTheme(), toggleTheme(), initTheme()
  utils/
    date.js           ← toLocalISO, todayISO, addDays, formatDateShort, formatDateFull, diffDays
    color.js          ← lightenColor, darkenColor
    svg.js            ← polarToCartesian, annularSectorPath, computeSvgMetrics
  render/
    legend.js         ← renderLegend() y sus event listeners
    svg.js            ← renderSVG() y sus event listeners (click, tooltip)
  main.js             ← init(), setupEventListeners(), PWA registration, arranque
```

**Alternativa descartada — un único archivo `utils.js`:** agrupa helpers heterogéneos sin separación de dominio; dificulta localizar código y añadir helpers más adelante.

**Alternativa descartada — carpeta `modules/` plana:** sin subdirectorio `render/` ni `utils/` no hay señal visual de la naturaleza de cada módulo.

### 2. Estado compartido en `store.js`

`habits[]` vive en `store.js` y se exporta como array mutable compartido. Los módulos de render lo importan directamente; `store.js` expone `loadHabits()` y `saveHabits()`.

**Alternativa descartada — clase `HabitStore` con getter/setter:** añade complejidad sin beneficio real en Vanilla JS sin framework reactivo.

### 3. `cellState()` permanece en `store.js`

Es lógica de dominio pura (calcula el estado de una celda a partir de fecha del hábito y fecha de hoy). Pertenece junto al estado, no al render.

### 4. `render/legend.js` y `render/svg.js` importan de `store.js` y `constants.js`

El flujo de datos es unidireccional: render lee estado, despacha mutaciones a través de las funciones de `store.js`, y re-renderiza. No hay comunicación entre módulos de render entre sí.

### 5. `index.html` apunta a `src/main.js`

Solo cambia `./main.js` → `./src/main.js`. Vite lo resuelve igual. El `main.js` raíz se elimina.

## Risks / Trade-offs

| Riesgo | Mitigación |
|---|---|
| Importaciones circulares entre módulos | `store.js` no importa nada de `render/`; flujo siempre hacia arriba (main → render → store/utils) |
| El SW de Workbox cachea el `main.js` antiguo | Vite regenera hashes de contenido en cada build; el SW detecta el cambio automáticamente |
| `src/style.css` y `src/counter.js` eliminados podrían tener referencias ocultas | Buscar referencias antes de eliminar con `grep -r "counter\|src/style" .` |
| Merge conflicts si hay trabajo en paralelo sobre `main.js` | Coordinar con el equipo antes de implementar |
