## 1. Origen del nivel en el motor

> Fase sin cambio observable: al terminar, la app se comporta exactamente igual que hoy.

- [x] 1.1 Sustituir `tier.forced` por `tier.source` con los valores `auto`, `preference` y `diagnostic` en `src/fx/engine.js`, y actualizar los puntos que lo consultan. Verificar que `grep -n "forced" src/` no devuelve restos.
- [ ] 1.2 Hacer que el gobernador degrade cuando el origen es `auto` o `preference`, y no cuando es `diagnostic`. Verificar con carga sintética que un nivel de origen `auto` se degrada y uno de origen `diagnostic` no.
- [ ] 1.3 Marcar `?fx=` como origen `diagnostic` y la detección como `auto`. Verificar que `?fx=3` sigue sin degradarse bajo carga y que sin parámetro sí.
- [x] 1.4 Reflejar el origen en `window.__nautilusFx` junto al nivel, para poder diagnosticarlo desde cualquier navegador.

## 2. Preferencia persistida

- [x] 2.1 Crear `src/fx/preference.js` con lectura y escritura de la clave `fx-level`, aceptando `auto`, `0`, `1`, `2` y `3`. Verificar que un valor desconocido, uno vacío y localStorage inaccesible se leen todos como `auto` sin lanzar.
- [x] 2.2 Aplicar la preferencia en el arranque antes del primer render, con prioridad por debajo de `?fx=`. Verificar que con preferencia `1` y `?fx=3` en la URL manda el 3, y que la preferencia guardada no se sobrescribe.
- [x] 2.3 Verificar que la aplicación nunca se pinta con un nivel distinto del elegido: con preferencia `0` guardada, no debe haber ninguna animación en el primer frame.
- [ ] 2.4 Verificar que degradar el nivel activo no modifica la preferencia guardada, y que al recargar se vuelve a intentar el nivel elegido.

## 3. Rueda

- [x] 3.1 Añadir el botón de intensidad al header de `index.html` y `style.css`, junto a los de tema e info. Verificar que no rompe la disposición en el viewport más estrecho.
- [x] 3.2 Crear `src/ui/dial.js` que construya el control radial en SVG con cinco posiciones, reutilizando `polarToCartesian` de `src/utils/svg.js`. Verificar que las cinco áreas de toque miden al menos 44 px en un viewport de 380 px.
- [x] 3.3 Abrir el control desde el botón y cerrarlo al tocar fuera o pulsar Escape, sin botón de confirmación. Verificar los tres caminos de cierre.
- [x] 3.4 Marcar la opción seleccionada y aplicar el cambio al instante al elegir otra. Verificar que el nivel activo cambia sin recargar.
- [x] 3.5 Hacer el control operable con teclado y etiquetar cada opción para tecnologías de asistencia. Verificar recorriendo las cinco opciones y seleccionando una sólo con el teclado.
- [x] 3.6 Verificar que con el control abierto el estado del día sigue legible detrás, y que al cerrarlo el centro vuelve a mostrar lo que mostraba antes.

## 4. Vista previa y discrepancia

- [x] 4.1 Disparar un burst de muestra con el nivel ya aplicado al seleccionar una opción. Verificar que la muestra de una intensidad superior tiene más partículas que la de la inferior.
- [x] 4.2 Verificar que seleccionar la intensidad de calma no ejecuta ninguna animación.
- [ ] 4.3 Señalar en el control cuándo el nivel activo difiere del elegido, distinguiendo degradación del gobernador de anulación por diagnóstico. Verificar los dos casos y que sin discrepancia no se muestra ningún aviso.

## 5. Verificación transversal

- [x] 5.1 Recorrer las cinco posiciones comprobando que el nivel activo resultante es el esperado y que la app sigue usable en todas.
- [x] 5.2 Verificar el ciclo completo de `Automático`: elegir un nivel fijo, recargar, volver a `Automático`, recargar, y comprobar que se vuelve a la detección.
- [x] 5.3 Probar en móvil real que las cinco posiciones se pueden tocar sin fallar y que la rueda cabe en pantalla.
- [x] 5.4 Ejecutar `npm run build` y verificar el control sobre el build de producción.

## 6. Gobernador: techo de muestreo

> Salió al intentar verificar el grupo 1. No es de la rueda, pero sí de
> `motion-tiers`, y afecta al dispositivo más lento, que es donde importa.

- [x] 6.1 Sustituir el techo de muestreo de 500 ms por 2000 ms más una comprobación de `document.hidden`. Con el límite en 500 ms, un dispositivo tan ahogado que tarda más que eso por frame dejaba de medirse y no se degradaba nunca — justo el caso que el gobernador existe para atrapar. El techo protegía en realidad de los huecos de pestaña en segundo plano, que `document.hidden` cubre de forma explícita.
- [x] 6.2 Exponer `fps` y `avisos` en `window.__nautilusFx`, para poder diagnosticar el gobernador desde el móvil sin instrumentar nada.
- [ ] 6.3 Verificar el cambio con carga sintética en una ventana visible: no se pudo comprobar en esta sesión porque la pestaña de automatización está en `document.hidden` y ahí `requestAnimationFrame` no dispara, así que el gobernador no llega a medir por construcción.

## 7. Verificación diferida al archivar

Confirmado en dispositivo real por el usuario: la rueda se abre, las cinco
posiciones se tocan sin fallar y cabe en pantalla.

Se archiva con una cosa sin ejercitar, y conviene decirlo claro: **nadie ha
provocado una degradación real del gobernador desde que se tocó**. La
implementación está completa y las specs describen el comportamiento
pretendido; lo que falta es la comprobación empírica, no código.

- [ ] 7.1 Provocar una degradación con carga sintética en una ventana visible y comprobar de una vez: que un nivel de origen `preference` baja y uno `diagnostic` no (1.2, 1.3), que la preferencia guardada no se altera (2.4), que la rueda avisa de la discrepancia (4.3) y que el techo de muestreo nuevo mide lo que debe (6.3). No se pudo hacer en sesión porque la pestaña de automatización corre con `document.hidden` y ahí `requestAnimationFrame` no dispara, así que el gobernador no llega a medir por construcción.
