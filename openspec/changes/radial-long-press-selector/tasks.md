## 1. Máquina de estados del gesto

- [x] 1.1 Crear `src/ui/radial-picker.js` con `attachRadialPicker(view, { onConfirm })` y el estado interno (Reposo/Despliegue/Apuntado); verificar que el módulo se importa sin errores y no rompe el build (`npm run build`)
- [x] 1.2 Implementar `pointerdown` sobre `view.core`: arma timer de 320ms y umbral de movimiento temprano (~10px) que lo cancela; verificar manualmente que un toque corto (<300ms) o un arrastre inmediato no despliega nada
- [x] 1.3 Implementar transición a Despliegue al disparar el timer: calcular `N` hábitos pendientes de hoy (`habitsActiveToday().filter(h => !isDoneToday(h))`), llamar `setPointerCapture`, y no desplegar si `N === 0`; verificar con 0, 1 y 7 hábitos pendientes
- [x] 1.4 Implementar `pointermove` en estado Apuntado: cálculo de `Δx/Δy`, `r` y `θ` respecto al centro del núcleo (usar utilidades de `src/utils/` si aplica) y el índice de sector `⌊((θ+offset) mod 360) / (360/N)⌋`; verificar con log temporal que el sector calculado coincide con el hábito bajo el puntero en distintos ángulos
- [x] 1.5 Implementar `pointerup`: confirmar si `r >= R_deadzone` (45px) sobre un sector válido, cancelar en otro caso; verificar ambos caminos manualmente en desktop (mouse) y móvil (touch)
- [x] 1.6 Implementar `pointercancel` y cancelación por segundo puntero (multi-touch) como Cancelación Segura; verificar que interrumpir el gesto (p. ej. alt-tab o segundo dedo) nunca marca un hábito

## 2. Overlay radial y previsualización

- [x] 2.1 Construir los sectores como `<path>` de arco SVG insertados/eliminados dinámicamente en `svgEl` al desplegar/plegar (sin usar `innerHTML` sobre `svg-container`); verificar que el resto del nautilus sigue renderizando y animando tras abrir y cerrar el selector varias veces seguidas
- [x] 2.2 Aplicar color/icono de cada sector desde `ELEMENTS`/`habit.element`, y offset inicial alineado al eje superior; verificar visualmente con 1, 3 y 7 hábitos pendientes
- [x] 2.3 Mostrar en el centro el icono/nombre del hábito apuntado reutilizando el mecanismo de `coreShowingTransient`/`setCoreLabel` (el mismo que usa `showStreakInCore`), actualizándolo sólo cuando cambia el índice de sector, y llamar a `refreshDayCore()` una única vez al cancelar o confirmar para restituir el contador `hecho/activos`; verificar que no hay parpadeo en cada `pointermove` y que el contador vuelve exacto tras cancelar
- [x] 2.4 Animación de plegado del overlay al cancelar o confirmar (reutilizar transiciones CSS/SVG existentes del proyecto donde aplique); verificar que no deja nodos SVG huérfanos tras el plegado (inspeccionar DOM)

## 3. Confirmación y reutilización del flujo de marcado

- [x] 3.1 En confirmación, mutar `habit.progress[todayIndexOf(habit)] = true` y llamar `saveHabits()` igual que hace `attachListeners()` en `svg.js`, luego invocar `onCellToggled` (o el callback equivalente) con `prevState = false`; verificar que racha, cometa y cierre de día se comportan igual que marcando por click de celda
- [x] 3.2 Verificar que el gesto radial nunca desmarca un hábito ya completado hoy (no debe aparecer como sector apuntable); comprobar manualmente marcando todos los hábitos y confirmando que el selector no se despliega
- [x] 3.3 Conectar `radial-picker.js` en `main.js`: inicializar tras `renderSVG`, pasando el callback de confirmación; verificar con `npm run dev` que el flujo completo (long-press → drag → release) marca el hábito correcto

## 4. Feedback háptico

- [x] 4.1 Disparar `haptics` (o un patrón nuevo equivalente en `src/fx/engine.js` si los existentes no encajan) en apertura, cambio de sector apuntado y confirmación, respetando el nivel de efectos activo; verificar en un dispositivo Android que los tres momentos vibran de forma distinguible
- [ ] 4.2 Verificar en iOS Safari (o simulando `navigator.vibrate === undefined`) que el gesto completo funciona sin errores y sin refuerzo háptico

## 5. Alternativa accesible

- [x] 5.1 Detectar pulsación simple (toque breve sin desplegar el selector) sobre el núcleo y abrir una hoja inferior (reutilizando la mecánica de `src/ui/sheet.js`) que liste los hábitos pendientes de hoy; verificar que abre y cierra igual que las hojas existentes
- [x] 5.2 Seleccionar un hábito en la hoja ejecuta el mismo camino de confirmación que el gesto radial (paso 3.1); verificar que el resultado (racha, cometa, cierre de día) es idéntico
- [ ] 5.3 Verificar con teclado/lector de pantalla básico que la hoja alternativa es operable sin gestos de arrastre

## 6. Alcance: la ruleta existente no cambia

- [x] 6.1 Verificar manualmente, antes y después de este cambio, que el marcado por click directo de celda produce exactamente el mismo resultado (racha, cometa, carga del núcleo, supernova de cierre de día) — sin diferencias de comportamiento
- [x] 6.2 Verificar que ningún anillo, celda, ajuste, tema o efecto fuera del núcleo cambia su apariencia o comportamiento durante ninguna etapa del gesto radial (inspección visual + diff de `git status` limitado a los archivos tocados en el plan)

## 7. Ajustes de prueba en dispositivo real (iOS)

- [x] 7.1 Con exactamente un hábito pendiente, `deploy()` marca directo sin construir el overlay de sectores (evita el artefacto visual del sector de 360°); verificado en Chrome con 1 y 2 hábitos totales (1 pendiente en ambos casos)
- [x] 7.2 Agregar `radial-gesture-lock` a `document.body` desde `pointerdown` hasta `teardown()`, con `user-select`/`-webkit-touch-callout` en `none` mientras dura, para que el arrastre no dispare selección de texto nativa de iOS sobre los números de día o nombres de hábito; verificado en Chrome que la clase se activa al primer toque y se libera en cualquier salida del gesto

## 8. Verificación de integración

- [ ] 8.1 Probar el flujo completo en `npm run dev` en desktop (mouse) y en un dispositivo móvil real (touch) con 1, 4 y 7 hábitos activos, en tema claro y oscuro
- [ ] 8.2 Probar con `?fx=1` y `?fx=5` que el gesto y el overlay no degradan el framerate del canvas de partículas ni al revés
- [ ] 8.3 Ejecutar `npm run build` y `npm run preview`, hacer hard refresh, y confirmar que el gesto funciona igual bajo el build cacheado por el service worker

## 9. Ajustes de prueba en dispositivo real (Android/Firefox)

- [x] 9.1 Reporte de Android+Firefox: comportamiento inconsistente (a veces no despliega, a veces cancela al mover, a veces confirma un sector distinto). Agregado `e.preventDefault()` en `onMove` durante la fase Apuntado, listener `pointermove` registrado con `{ passive: false }`, y `touch-action: none` inline como refuerzo de la regla CSS; verificado en Chrome que el flujo multi-sector y el de un solo pendiente siguen funcionando igual
- [ ] 9.2 Repetir la prueba en el mismo dispositivo Android + Firefox para confirmar que el refuerzo resuelve los tres síntomas reportados (no verificable desde este entorno)
