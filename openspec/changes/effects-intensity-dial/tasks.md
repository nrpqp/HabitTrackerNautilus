## 1. Origen del nivel en el motor

> Fase sin cambio observable: al terminar, la app se comporta exactamente igual que hoy.

- [ ] 1.1 Sustituir `tier.forced` por `tier.source` con los valores `auto`, `preference` y `diagnostic` en `src/fx/engine.js`, y actualizar los puntos que lo consultan. Verificar que `grep -n "forced" src/` no devuelve restos.
- [ ] 1.2 Hacer que el gobernador degrade cuando el origen es `auto` o `preference`, y no cuando es `diagnostic`. Verificar con carga sintética que un nivel de origen `auto` se degrada y uno de origen `diagnostic` no.
- [ ] 1.3 Marcar `?fx=` como origen `diagnostic` y la detección como `auto`. Verificar que `?fx=3` sigue sin degradarse bajo carga y que sin parámetro sí.
- [ ] 1.4 Reflejar el origen en `window.__nautilusFx` junto al nivel, para poder diagnosticarlo desde cualquier navegador.

## 2. Preferencia persistida

- [ ] 2.1 Crear `src/fx/preference.js` con lectura y escritura de la clave `fx-level`, aceptando `auto`, `0`, `1`, `2` y `3`. Verificar que un valor desconocido, uno vacío y localStorage inaccesible se leen todos como `auto` sin lanzar.
- [ ] 2.2 Aplicar la preferencia en el arranque antes del primer render, con prioridad por debajo de `?fx=`. Verificar que con preferencia `1` y `?fx=3` en la URL manda el 3, y que la preferencia guardada no se sobrescribe.
- [ ] 2.3 Verificar que la aplicación nunca se pinta con un nivel distinto del elegido: con preferencia `0` guardada, no debe haber ninguna animación en el primer frame.
- [ ] 2.4 Verificar que degradar el nivel activo no modifica la preferencia guardada, y que al recargar se vuelve a intentar el nivel elegido.

## 3. Rueda

- [ ] 3.1 Añadir el botón de intensidad al header de `index.html` y `style.css`, junto a los de tema e info. Verificar que no rompe la disposición en el viewport más estrecho.
- [ ] 3.2 Crear `src/ui/dial.js` que construya el control radial en SVG con cinco posiciones, reutilizando `polarToCartesian` de `src/utils/svg.js`. Verificar que las cinco áreas de toque miden al menos 44 px en un viewport de 380 px.
- [ ] 3.3 Abrir el control desde el botón y cerrarlo al tocar fuera o pulsar Escape, sin botón de confirmación. Verificar los tres caminos de cierre.
- [ ] 3.4 Marcar la opción seleccionada y aplicar el cambio al instante al elegir otra. Verificar que el nivel activo cambia sin recargar.
- [ ] 3.5 Hacer el control operable con teclado y etiquetar cada opción para tecnologías de asistencia. Verificar recorriendo las cinco opciones y seleccionando una sólo con el teclado.
- [ ] 3.6 Verificar que con el control abierto el estado del día sigue legible detrás, y que al cerrarlo el centro vuelve a mostrar lo que mostraba antes.

## 4. Vista previa y discrepancia

- [ ] 4.1 Disparar un burst de muestra con el nivel ya aplicado al seleccionar una opción. Verificar que la muestra de una intensidad superior tiene más partículas que la de la inferior.
- [ ] 4.2 Verificar que seleccionar la intensidad de calma no ejecuta ninguna animación.
- [ ] 4.3 Señalar en el control cuándo el nivel activo difiere del elegido, distinguiendo degradación del gobernador de anulación por diagnóstico. Verificar los dos casos y que sin discrepancia no se muestra ningún aviso.

## 5. Verificación transversal

- [ ] 5.1 Recorrer las cinco posiciones comprobando que el nivel activo resultante es el esperado y que la app sigue usable en todas.
- [ ] 5.2 Verificar el ciclo completo de `Automático`: elegir un nivel fijo, recargar, volver a `Automático`, recargar, y comprobar que se vuelve a la detección.
- [ ] 5.3 Probar en móvil real que las cinco posiciones se pueden tocar sin fallar y que la rueda cabe en pantalla.
- [ ] 5.4 Ejecutar `npm run build` y verificar el control sobre el build de producción.
