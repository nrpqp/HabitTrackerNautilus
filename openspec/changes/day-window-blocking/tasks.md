## 1. Utilidad de fecha

- [x] 1.1 Añadir `yesterdayISO()` en `src/utils/date.js` y verificar que retorna la fecha de ayer en formato ISO local (`YYYY-MM-DD`)

## 2. Lógica de estado

- [x] 2.1 Extender `cellState()` en `src/store.js` para retornar `'yesterday'` cuando `cellDate === yesterdayISO()`, y `'old'` para cualquier fecha anterior a ayer; verificar que los estados `'today'` y `'locked'` no cambian de comportamiento

## 3. Renderer SVG

- [x] 3.1 Actualizar la asignación de clases CSS en `src/render/svg.js` para que `'yesterday'` reciba la clase `unlocked` (clickeable) y `'old'` reciba la clase `locked` (no interactivo); verificar que el cursor cambia correctamente en cada estado

- [x] 3.2 Actualizar la asignación de colores de relleno y borde en `src/render/svg.js`: `'old'` marcado usa el color del hábito (igual que completado), `'old'` no marcado usa un color de "perdido" visualmente distinto al futuro `'locked'`; verificar la distinción visual en ambos temas claro y oscuro

- [x] 3.3 Verificar que el event listener de click solo se registra en celdas con clase `unlocked` (`'today'` y `'yesterday'`), y que las celdas `'old'` y `'locked'` no responden al click
