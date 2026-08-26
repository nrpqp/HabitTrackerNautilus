## 1. Modelo de datos y constantes

- [x] 1.1 Agregar el array `ELEMENTS` en `src/constants.js` con los 7 objetos elemento (`id`, `name`, `icon`, `h0`, `s0`, `l0`, `h1`, `s1`, `l1`, `particleType`, `speed`, `gravity`); verificar que los 7 elementos están definidos y que `ELEMENTS.length === 7`
- [x] 1.2 Actualizar `loadHabits` en `src/store.js` para aplicar migración silenciosa: si un hábito cargado desde localStorage no tiene campo `element`, asignarle `ELEMENTS[i % ELEMENTS.length].id` según su posición en el array; verificar que hábitos existentes sin `element` en localStorage reciben un elemento tras recargar sin perder ningún otro dato
- [x] 1.3 Actualizar `addHabit` en `src/main.js` para asignar `element: ELEMENTS[habits.length % ELEMENTS.length].id` al crear un hábito nuevo en lugar de `color: DEFAULT_COLORS[...]`; verificar que un hábito recién creado tiene campo `element` persistido en localStorage

## 2. Cálculo de color elemental

- [x] 2.1 Implementar la función `elementColor(elementId, dayIndex)` en `src/utils/color.js` que retorna un string `hsl(h, s%, l%)` interpolando linealmente en `t = dayIndex / 20` entre los extremos `(h0,s0,l0)` y `(h1,s1,l1)` del elemento; verificar que `elementColor('fire', 0)` y `elementColor('fire', 20)` retornan los valores HSL esperados de los extremos de Fuego

## 3. Render SVG con colores elementales y fases

- [x] 3.1 Modificar `renderSVG` en `src/render/svg.js` para usar `elementColor(habit.element, dayIndex)` como fill de cada celda completada en lugar del `habit.color` fijo y del gradiente; verificar en `npm run dev` que el ring muestra una progresión de color visible de celda en celda dentro de un mismo hábito
- [x] 3.2 Agregar clases CSS `phase-1`, `phase-2`, `phase-3` a los paths de celdas completadas según el día (días 0–6 → `phase-1`, 7–13 → `phase-2`, 14–20 → `phase-3`); verificar inspeccionando el DOM que las clases correctas están presentes en cada celda

## 4. Animaciones CSS de fase

- [x] 4.1 Añadir en `style.css` los keyframes `@keyframes breathe` (opacidad 1→0.65→1, ~3.4s) y `@keyframes surge` (opacidad 1→0.8→1 con filter brightness, ~1.7s), y aplicar `.phase-2 { animation: breathe ... }` y `.phase-3 { animation: surge ... }`; verificar en el browser que celdas en fase 2 pulsean suavemente y celdas en fase 3 tienen animación más intensa
- [x] 4.2 Añadir `@media (prefers-reduced-motion: reduce)` en `style.css` que anule todas las animaciones de fase (`.phase-1, .phase-2, .phase-3 { animation: none }`); verificar activando reduced-motion en el OS que todas las celdas quedan estáticas

## 5. Canvas overlay y sistema de partículas

- [x] 5.1 Agregar `<canvas id="effect-overlay">` en `index.html` dentro de `#svg-container`, con CSS `position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none`; verificar que el canvas es visible en el DOM y no intercepta clicks en el SVG
- [x] 5.2 Implementar en `src/main.js` el módulo de partículas: array `particles`, función `spawnParticles(x, y, elementId, isMilestone)` que crea 6 partículas (o 20 si `isMilestone`) y un loop `requestAnimationFrame` que actualiza posición, gravedad, opacidad y llama a `drawParticleShape`; verificar que el loop se auto-detiene cuando `particles` está vacío
- [x] 5.3 Implementar `drawParticleShape(ctx, particle)` en `src/main.js` con una rama por `particleType` (`spark`, `ripple`, `leaf`, `bolt`, `crystal`, `chunk`, `swirl`); verificar visualmente en el browser que cada elemento muestra partículas de forma claramente distinta
- [x] 5.4 Conectar `spawnParticles` al handler de click de celda en `renderSVG`: calcular la posición canvas del centro de la celda clicada (usando el ratio CSS/SVG del container) y llamar a `spawnParticles` antes de actualizar `habit.progress` y re-renderizar; verificar que al hacer click en una celda aparece el burst de partículas y que persiste aunque el SVG se re-renderice en el mismo instante

## 6. Celebración de milestone

- [x] 6.1 Agregar `<div id="milestone-toast">` en `index.html` y sus estilos en `style.css`: posicionado como overlay centrado, invisible por defecto (`opacity: 0; pointer-events: none`), con transición de entrada `scale + opacity` usando `cubic-bezier(0.34, 1.56, 0.64, 1)`
- [x] 6.2 Implementar `checkMilestone(dayIndex, habit)` en `src/main.js` que detecta si `dayIndex` es 6, 13 o 20 y la celda pasó de `false` a `true`, entonces: muestra el toast con el mensaje correspondiente, lo oculta tras 2.8s, y llama a `spawnParticles` con `isMilestone: true` desde el centro del SVG container; verificar que al completar el día 7 aparece el toast y el burst ampliado, y que completar otros días no dispara el toast

## 7. Selector de elemento en el sheet de edición

- [x] 7.1 Reemplazar la fila de swatches de color en el sheet de edición (`openHabitSheet` en `src/main.js`) por una cuadrícula de 7 botones de elemento, cada uno mostrando el ícono y el nombre corto del elemento; el botón del elemento activo SHALL estar visualmente destacado (borde o fondo diferenciado); verificar que el sheet renderiza los 7 elementos y que el elemento actual aparece marcado
- [x] 7.2 Conectar el click de cada botón de elemento en el sheet: actualizar `habit.element`, guardar en localStorage con `saveHabits()` y llamar a `renderSVGOnly()` sin cerrar el sheet; verificar que al seleccionar un elemento distinto el ring cambia de paleta de colores en tiempo real

## 8. QA y verificación final

- [x] 8.1 Abrir la app con hábitos pre-existentes en localStorage (sin campo `element`) y verificar que cargan sin errores, se les asigna un elemento visible y no pierden nombre, color original, progreso ni fecha de inicio
- [ ] 8.2 Probar en iOS Safari (o simulador): verificar que las animaciones de fase 2 y 3 funcionan, que el canvas de partículas no bloquea interacción y que no hay jank perceptible al disparar el burst de 6 partículas
- [x] 8.3 Ejecutar `npm run build` y verificar que no hay errores ni advertencias nuevas en la salida de Vite; verificar con `npm run preview` que el build de producción funciona igual que el modo dev
