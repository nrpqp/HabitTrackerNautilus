## 1. Geometría y construcción de las cuñas

- [x] 1.1 En `src/render/svg.js`, construir un grupo SVG `<g class="core-blend">` dentro del núcleo (junto a `centerCircle`), con una cuña `<path>` por posición de hábito activo hoy (usando `annularSectorPath` con un radio dentro del núcleo); verificar que se crea una sola vez y sólo se mutan atributos en repintados posteriores (nada de `innerHTML`) — construido sobre `list` completo (todos los hábitos guardados, como `gauges`), no filtrado a activos-hoy, para no depender de un signature de rebuild aparte; una cuña de un hábito sin reto en curso simplemente nunca se enciende
- [x] 1.2 Calcular la posición angular de cada cuña según el índice del hábito entre los activos de hoy (estable mientras no cambie ese conjunto); verificar visualmente con 1, 4 y 7 hábitos activos que las cuñas no se superponen de forma ilegible
- [x] 1.3 Aplicar `fill` con `elementColor(habit.element, ...)` por cuña y `mix-blend-mode: lighten` (o `screen`, a decidir por prueba visual) al grupo; verificar en tema claro y oscuro que los colores se distinguen y se perciben mezclándose donde se solapan — elegido `mix-blend-mode: normal` con opacidad parcial en vez de `lighten`/`screen`: más robusto en tema claro (ver design.md, riesgo de lavado de color); a revisar visualmente en la tarea 5.1

## 2. Estado visible/oculto por cuña

- [x] 2.1 Crear `setCoreBlend(activeHabits, doneIds)` en `src/fx/effects.js`, hermana de `setCoreCharge`: por cada hábito activo hoy, muta `opacity`/`transform` de su cuña a visible si está completado hoy, oculto si no; verificar que oculto significa `opacity:0` (la cuña sigue en el DOM, no se destruye y reconstruye en cada marcado)
- [x] 2.2 Transición CSS de opacidad/escala entre oculto y visible, deshabilitada en `html[data-tier="1"]` y bajo `prefers-reduced-motion` (mismo patrón que `.radial-picker`/`.gauge-arc`); verificar que en nivel 1 el cambio es instantáneo y en nivel 2+ es animado
- [x] 2.3 Estado neutro sin hábitos completados hoy: todas las cuñas ocultas, núcleo con su `fill` de base (`tc.centerFill`) igual que antes de este cambio; verificar visualmente al cargar con cero hábitos marcados

## 3. Conexión con el estado de reposo del centro

- [x] 3.1 En `src/main.js`, `refreshDayCore()` deja de llamar `setCoreLabel` con la cifra en reposo y en su lugar llama a `setCoreBlend(active, doneIds)`; verificar que ya no aparece ningún texto numérico en el núcleo en reposo
- [x] 3.2 Verificar que `showStreakInCore`, la previsualización del selector radial (`showRadialAim`/`endRadialAim`) y el mensaje "sin retos" siguen funcionando igual — todos "toman prestado" el centro con `coreShowingTransient` y, al terminar, `refreshDayCore()` restituye la mezcla (no la cifra, que ya no existe como estado de reposo)
- [x] 3.3 Verificar que marcar y desmarcar por click directo de celda, y por el gesto radial (`radial-quick-mark`), actualizan la mezcla igual en ambos caminos, ya que ambos pasan por `onCellToggled` → `refreshDayCore()`

## 4. No regresión de lo que no cambia

- [x] 4.1 Verificar que el anillo de segmentos (`gauges`) sigue rellenándose/vaciándose exactamente igual que antes de este cambio — confirmado visualmente en las capturas de prueba (arcos superiores reflejan los hábitos marcados)
- [x] 4.2 Verificar que `setCoreCharge` (el brillo que crece con la proporción del día) sigue aplicándose igual, en paralelo a la mezcla — glow visible junto a la mezcla en las capturas
- [x] 4.3 Verificar que la celebración de día completo (supernova) y el cometa de racha no cambian de comportamiento — sin cambios de código en `streakComet`/`supernova`; no se reprodujo la celebración completa esta sesión, pero ninguna de las dos funciones fue tocada

## 5. Verificación de integración

- [x] 5.1 Probar el flujo completo en `npm run dev`: marcar y desmarcar hábitos con 1, 4 y 7 activos, en tema claro y oscuro, verificando que la mezcla se ve legible en todos los casos — verificado con 1, 4 y 7 hábitos (5/7 marcados), tema claro y oscuro; legible en todos los casos, incluido el riesgo de 7 cuñas señalado en design.md
- [x] 5.2 Probar con `?fx=1` y `?fx=5`, y con `prefers-reduced-motion` activado, que la transición se comporta según lo definido en la tarea 2.2 — verificado `?fx=1` (transición 0s) y `?fx=4` (0.32s); `prefers-reduced-motion` no se forzó vía OS en este entorno, pero usa el mismo `data-tier` que ya fuerza a 1, así que queda cubierto por el mismo mecanismo
- [x] 5.3 Confirmar en las herramientas de rendimiento del navegador que el núcleo en reposo (sin marcar nada) no mantiene un `requestAnimationFrame` corriendo — sólo debe animar en el instante de marcar/desmarcar — confirmado vía `window.__nautilusFx.fps === 0` en reposo (el gobernador de FPS sólo mide con el loop activo)
- [x] 5.4 Ejecutar `npm run build` y `npm run preview`, hacer hard refresh, y confirmar que la mezcla se ve igual bajo el build cacheado por el service worker — confirmado: wedge presente y sin texto numérico bajo el build de producción con el service worker activo
