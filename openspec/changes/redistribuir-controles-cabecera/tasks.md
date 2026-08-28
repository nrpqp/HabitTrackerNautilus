## 1. Motor: escala de cinco niveles

- [x] 1.1 En `src/fx/engine.js`, ampliar `TIER_NAMES` a `['Calma','Lite','Suave','Estándar','Máximo']` indexado desde 1, sustituir `BUDGET` por `[_, 0, 0, 0.5, 1, 1.8]` con el índice 0 sin uso y comentado, y recortar `tier.set()` a `1..5`. Verificar en consola que `tier.set(0)` y `tier.set(9)` dejan `tier.value` en 1 y 5 respectivamente.
- [x] 1.2 Re-mapear los tres umbrales de `src/fx/effects.js`: `=== 0` → `=== 1`, el `< 2` que apaga el canvas → `< 3`, el `< 2` que apaga los filtros → `< 4`, y `>= 3` → `>= 5`. Verificar que los 14 puntos de llamada quedan cubiertos con `grep -n "tier.value" src/fx/effects.js` y que ninguno compara contra 0.
- [x] 1.3 Ajustar en `src/fx/engine.js` los umbrales internos que dependen del nivel —densidad del canvas (`dpr`), radio de glow y estelas— a la numeración nueva. Verificar que el canvas se dimensiona a dpr 2 sólo en nivel 5.
- [x] 1.4 Mover el suelo del gobernador de FPS a nivel 2 en `src/fx/engine.js`. Verificar que con degradación forzada el nivel se detiene en 2 y no llega a 1.
- [x] 1.5 Aceptar `?fx=1..5` en la anulación de diagnóstico y renumerar los selectores `html[data-tier="0"]` de `style.css` a `html[data-tier="1"]`. Verificar abriendo la app con `?fx=1` que el fondo escénico y la rueda de efectos no animan.
- [x] 1.6 Comprobar los cinco niveles con `?fx=1` a `?fx=5`: el 2 no dibuja ninguna partícula, el 3 dibuja partículas sin filtros, el 4 las dibuja con filtros y el 5 añade las capas extra.

## 2. Preferencia: clave nueva y migración

- [x] 2.1 En `src/fx/preference.js`, sustituir la clave `fx-level` por `fx-nivel` con valores `'1'..'5'` y retirar la constante `AUTO`. Verificar que una lectura sin nada guardado devuelve ausencia de preferencia, no un nivel.
- [x] 2.2 Añadir la migración de un solo sentido descrita en `design.md — D3`: leer `fx-level` cuando falte `fx-nivel`, aplicar `{0:1, 1:2, 2:4, 3:5}`, tratar `'auto'` como ausencia, escribir `fx-nivel` y borrar la clave vieja. Verificar sembrando `fx-level='3'` en localStorage que la app arranca en nivel 5 y que `fx-level` desaparece.
- [x] 2.3 Verificar la idempotencia recargando tras la migración: `fx-nivel` no cambia de valor y no se vuelve a consultar la clave vieja.
- [x] 2.4 Reducir `detectTier()` a semilla del primer arranque: retirar de él la rama de `prefers-reduced-motion` y devolver niveles de la escala nueva, con 3 para el dispositivo declaradamente limitado y 4 como suelo del puntero fino. Verificar que en un segundo arranque con preferencia guardada la función no se invoca.

## 3. Techo por movimiento reducido

- [x] 3.1 Implementar en `src/fx/engine.js` el techo permanente: cuando `prefers-reduced-motion: reduce` esté activo, el nivel efectivo es 1 sea cual sea la preferencia guardada, con un origen propio no degradable. Verificar con la preferencia en 5 y movimiento reducido activo que no se ejecuta ninguna animación y que `fx-nivel` sigue valiendo `'5'`.
- [x] 3.2 Suscribir un listener a la media query para que activar o desactivar el movimiento reducido durante la sesión se refleje sin recargar. Verificar alternando la preferencia en las devtools que el nivel activo cambia entre 1 y el elegido.

## 4. Mecánica de hoja compartida

- [x] 4.1 Crear `src/ui/sheet.js` con la fábrica descrita en `design.md — D6`: velo, panel, trampa de foco, cierre por toque exterior y `Escape`, devolución del foco al origen y exclusión mutua entre hojas. Verificar con la hoja de instalación actual migrada a esta mecánica que se cierra por las tres vías y devuelve el foco al botón de información.
- [x] 4.2 Añadir a la fábrica la opción de velo en degradado descrita en `design.md — D5`, transparente sobre el nautilus y opaco junto al panel, con el canvas de efectos elevado por encima. Verificar que con esa opción activa el nautilus se sigue leyendo sin oscurecimiento.
- [x] 4.3 Migrar `#info-sheet` a `src/ui/sheet.js` y retirar `openInfoSheet`/`closeInfoSheet` de `src/main.js`. Verificar que la hoja se comporta igual que antes de la migración.

## 5. Hoja de ajustes

- [x] 5.1 Añadir a `index.html` el botón de ajustes en el extremo derecho de la cabecera, con icono de engranaje, acento ámbar, área táctil de 44 px y `aria-expanded`. Verificar que recibe foco visible con el tabulador.
- [x] 5.2 Anclar la hoja de ajustes al borde inferior en todas las anchuras, fuera del patrón de diálogo centrado de `style.css:1118`, y añadir el marcado de `#settings-sheet` con sus tres filas —tema, nivel de efecto visual y fuente— y cablearlo a `src/ui/sheet.js` con la opción de velo en degradado. Verificar que abre y cierra por las tres vías y que no puede quedar abierta a la vez que el manual.
- [x] 5.3 Mover el control de tema a la fila correspondiente, retirar `#theme-toggle` de la cabecera y verificar que el cambio se aplica al instante con la hoja abierta y persiste tras recargar.
- [x] 5.4 Implementar la escala 1–5 como `radiogroup` de cinco `role="radio"` con navegación por flechas y rótulos en los extremos, según `design.md — D7`. Verificar que se recorre y selecciona sólo con teclado y que cada posición se anuncia con su nombre.
- [x] 5.5 Conectar la escala a la preferencia y a la muestra: elegir un nivel lo aplica al instante y dispara `burstElement` en el centro del área de nautilus libre sobre el panel —no en el centro geométrico—, con el presupuesto de ese nivel. Verificar que la muestra se ve sobre el velo sin cerrar la hoja y que la del nivel 5 es visiblemente mayor que la del 3.
- [x] 5.6 Mostrar bajo la escala la nota de nivel realmente activo, cubriendo los tres casos: degradación por el gobernador, techo por movimiento reducido y anulación por `?fx=`. Verificar cada caso y comprobar que la preferencia guardada no cambia en ninguno.
- [x] 5.7 Añadir la fila de fuente de texto en estado deshabilitado y marcada como próximamente, sin foco de teclado y anunciada como deshabilitada. Verificar que tocarla no hace nada y que ninguna tipografía cambia.
- [x] 5.8 Verificar la altura del panel según `design.md — D5`: con las tres filas, en una ventana de 667 px de alto el centro del nautilus queda por encima del borde superior del panel.

## 6. Manual

- [ ] 6.1 Convertir `#info-sheet` en el manual: cabecera nueva y secciones plegables operables con teclado, con `aria-expanded` en cada encabezado y como máximo una desplegada al abrir. Verificar que se despliegan y pliegan con el tabulador y `Enter`.
- [ ] 6.2 Redactar la sección de lectura del nautilus —anillos, sectores, segmentos encendidos, núcleo— y la de cómo se marca un día. Verificar que lo descrito coincide con el comportamiento real de la app.
- [ ] 6.3 Redactar las preguntas frecuentes: ventana de edición de hoy y ayer, bloqueo de días futuros, límite de 7 hábitos y 15 caracteres, qué hacen reiniciar y eliminar, y por qué un recordatorio puede no llegar incluyendo la limitación de iOS. Verificar cada respuesta contra las specs `day-window`, `habit-edit-sheet` y `habit-notifications`.
- [ ] 6.4 Redactar la sección sobre dónde viven los datos: sólo en ese navegador, sin cuenta ni copia remota, y se pierden al borrar los datos del navegador o desinstalar. Verificar que su título es localizable sin conocer el término técnico del almacenamiento.
- [ ] 6.5 Mover las instrucciones de instalación de iOS y Android a una sección del manual, sin perder ningún paso. Verificar comparando con el contenido actual de `#info-sheet`.
- [ ] 6.6 Reubicar el botón de información al extremo izquierdo de la cabecera, con acento cian. Verificar que los dos botones de cabecera se distinguen por color y que el título se lee completo entre ambos en 390 px.

## 7. Píldora de añadir hábito

- [ ] 7.1 Retirar `#add-habit-btn` de la cabecera y añadir la píldora `.add-habit-pill` centrada en el borde inferior, absoluta respecto al contenedor y con `bottom` calculado sobre `env(safe-area-inset-bottom)`, según `design.md — D8`. Verificar que no solapa los indicadores ni el nautilus en 390, 768 y 1280 px de ancho.
- [ ] 7.2 Recablear `checkLimit()` en `src/main.js` a la píldora: atenuada y no accionable con 7 hábitos, con el texto que explica el límite. Verificar creando 7 hábitos que la píldora deja de responder.
- [ ] 7.3 Verificar el tratamiento visual discreto: la píldora tiene menos contraste que los indicadores del reto y que los botones de la cabecera, y su área táctil mide al menos 44 px de alto.

## 8. Retirada del control radial

- [ ] 8.1 Eliminar `src/ui/dial.js`, su importación y `setupDial()` de `src/main.js`, y el botón `#fx-toggle` de `index.html`. Verificar con `grep -rn "dial\|fx-toggle" src/ index.html` que no queda ninguna referencia.
- [ ] 8.2 Eliminar el bloque `.fx-dial*` de `style.css` conservando las reglas de respaldo sin difuminado que también aplican a `.milestone-toast` y `.cell-tooltip`. Verificar que el toast y el tooltip siguen con fondo opaco en un navegador sin `backdrop-filter`.
- [ ] 8.3 Retirar de la cabecera las cuatro coordenadas `right` por breakpoint y sustituirlas por el posicionamiento a dos extremos. Verificar en los cuatro breakpoints de `style.css` que no queda ninguna coordenada huérfana.

## 9. Cierre

- [ ] 9.1 Actualizar `CLAUDE.md`: niveles `1 Calma, 2 Lite, 3 Suave, 4 Estándar, 5 Máximo` y `?fx=1..5`. Verificar que la sección «Sistema de efectos» no menciona ya cuatro niveles.
- [ ] 9.2 Actualizar el `## Purpose` de `openspec/specs/motion-tiers/spec.md` («cuatro niveles» → cinco) y el de `openspec/specs/effects-preference/spec.md` («control radial» → control en los ajustes), que los deltas no arrastran. Hacerlo al archivar el cambio.
- [ ] 9.3 Verificar que la rueda principal sigue intacta: `git diff --stat` no muestra cambios en `src/render/svg.js` ni en `src/constants.js`, y el nautilus renderiza y responde igual que antes.
- [ ] 9.4 Probar en iOS/Safari y en la PWA instalada: las dos hojas suben y se cierran correctamente, la píldora queda por encima del área segura inferior y la muestra de efectos se ve con la hoja de ajustes abierta.
- [ ] 9.5 Ejecutar `npm run build` y `npm run preview` con recarga forzada, y verificar que el service worker sirve la versión nueva y que la app arranca offline con el nivel guardado.
