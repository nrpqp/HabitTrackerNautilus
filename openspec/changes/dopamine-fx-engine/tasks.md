## 1. Render incremental del anillo

> Fase de paridad: al terminar este grupo la app debe verse y comportarse **exactamente igual** que antes. Ningún efecto nuevo entra aquí.

- [x] 1.1 Partir `renderSVG()` en construcción y repintado dentro de `src/render/svg.js`: la construcción crea el árbol con `document.createElementNS` y guarda las referencias de cada celda indexadas por hábito y día; el repintado sólo actualiza `fill`, `stroke`, `stroke-width` y clases. Verificar que `grep -n innerHTML src/render/svg.js` no devuelve nada y que el anillo se dibuja igual al cargar.
- [x] 1.2 Enganchar los listeners de click, hover y tooltip una sola vez en la construcción, comprobando el estado del día dentro del handler en vez de filtrar por selector. Verificar que marcar diez celdas seguidas no acumula listeners y que los días bloqueados siguen sin responder.
- [x] 1.3 Reconstruir sólo cuando cambia el número de anillos o su orden; el resto de repintados mutan atributos. Verificar los cuatro casos que reordenan o recuentan — añadir hábito, eliminar hábito, renombrar a un nombre más largo y renombrar a uno más corto — comprobando que el orden de los anillos resultante es el correcto.
- [x] 1.4 Exponer desde el renderer lo que los efectos necesitan: referencia de celda por hábito y día, centro de celda en coordenadas SVG y conversión a píxeles del contenedor teniendo en cuenta el encaje del `viewBox`. Verificar que un burst de partículas disparado desde el centro calculado de una celda cae sobre esa celda, con la ventana estrecha y ancha.
- [x] 1.5 Eliminar el rescate manual del canvas overlay antes del reemplazo de `innerHTML`, ahora innecesario. Verificar que las partículas siguen apareciendo sobre el SVG tras marcar una celda.
- [x] 1.6 Verificación de paridad: recorrer marcar, desmarcar, cambiar elemento, renombrar, reiniciar, eliminar, añadir y alternar tema, comprobando que el resultado visual y los datos en localStorage son idénticos a los de la versión anterior.

## 2. Motor de efectos

- [x] 2.1 Crear `src/fx/engine.js` con el objeto de nivel (valor, fijar, suscriptores, presupuesto) anclado a 2 y sin gobernador, e integrarlo sin que ningún efecto lo consulte todavía. Verificar que la app arranca sin cambios visibles.
- [x] 2.2 Implementar la detección de capacidades y la fórmula de nivel de design.md §2. Verificar los cuatro casos con overrides de DevTools: movimiento reducido da 0; ahorro de datos da 0; 8 núcleos y 8 GB dan 3; ausencia de memoria declarada con puntero grueso no da 3.
- [x] 2.3 Implementar el gobernador de FPS (tres segundos consecutivos bajo 46 fps bajan un nivel, suelo en 1, sin promoción). Verificar con throttling de CPU 6× en DevTools que el nivel baja y no vuelve a subir al quitarlo.
- [ ] 2.4 Implementar la háptica con los cuatro patrones, como no-op silencioso si `navigator.vibrate` no existe y en nivel 0. Verificar en Chrome Android que vibra y en un navegador sin soporte que no lanza errores en consola.
- [x] 2.5 Reflejar el nivel activo en `document.documentElement.dataset.tier` y anular bajo `[data-tier="0"]` las animaciones de fase que hoy dependen de `prefers-reduced-motion`. Verificar que forzar el nivel 0 deja todas las celdas estáticas.
- [x] 2.6 Implementar el bucle único de canvas: limpia una vez por frame, pide a cada efecto activo que se dibuje, se detiene sin efectos activos y se reanuda con el primero nuevo. Verificar en el panel Performance que la app en reposo no hace trabajo de canvas por frame.

## 3. Partículas

- [x] 3.1 Mover el sistema de partículas de `src/main.js` a `src/fx/engine.js` bajo el bucle único, manteniendo el comportamiento actual. Verificar que el burst al marcar es indistinguible del anterior.
- [x] 3.2 Dimensionar el canvas con `devicePixelRatio` acotado (2 en nivel 3, 1.5 por debajo) y `ctx.setTransform`, con reajuste al redimensionar. Verificar en pantalla de alta densidad que las partículas dejan de verse borrosas y siguen alineadas con las celdas tras cambiar el tamaño de la ventana.
- [x] 3.3 Añadir el sprite radial cacheado por color y el blending aditivo. Verificar que el solapamiento de partículas del mismo elemento produce un núcleo más luminoso que cada una por separado.
- [x] 3.4 Trasladar a `src/constants.js` los campos de física por elemento y aplicar el movimiento propio de cada uno. Verificar que el fuego asciende y el de tierra cae, y que los siete elementos son distinguibles por su movimiento.
- [x] 3.5 Escalar el burst con el presupuesto por nivel y no emitir nada en nivel 0. Verificar que el burst de nivel 3 tiene más partículas que el de nivel 2 y que en nivel 0 la celda cambia de color sin ninguna partícula.
- [x] 3.6 Verificar el aditivo en tema claro y ajustar el peso relativo de halo y silueta si el burst pierde contraste sobre fondo claro.

## 4. Núcleo del día

- [ ] 4.1 Añadir la etiqueta del núcleo en `index.html` y `style.css`, posicionada sobre el centro real del SVG (no sobre el centro del contenedor, que no coinciden cuando el contenedor no es cuadrado). Verificar que queda centrada con la ventana estrecha, ancha y en móvil.
- [ ] 4.2 Dibujar un arco por hábito alrededor del núcleo con el color de su elemento, reconstruido cuando cambia el número de hábitos. Verificar que con 1, 3 y 7 hábitos los arcos se reparten correctamente.
- [ ] 4.3 Rellenar y vaciar el arco de cada hábito según el estado del día de hoy y mostrar la cuenta `n/total`. Verificar que marcar y desmarcar hoy mueve cuenta y arco, y que marcar ayer no los mueve.
- [ ] 4.4 Verificar que al cargar la app con hábitos ya marcados hoy el medidor aparece con el estado correcto y no se dispara ninguna celebración.
- [ ] 4.5 Implementar la traza de energía de la celda al núcleo con nivel mínimo 2, y hacer que la intensidad del núcleo en reposo crezca con la proporción de hábitos cerrados hoy. Verificar que en nivel 1 el arco se rellena igualmente sin traza.

## 5. Celebración del día completo

- [ ] 5.1 Detectar la transición a día completo comparando la cuenta de hábitos cerrados hoy antes y después de marcar. Verificar que se dispara al marcar el último pendiente, que no se dispara si queda alguno, y que se dispara con un único hábito activo.
- [ ] 5.2 Añadir la capa de destello de pantalla completa y el mensaje de día completo que desaparece solo. Verificar que desaparece sin intervención del usuario.
- [ ] 5.3 Implementar los anillos de choque, los rayos y el burst de la supernova, escalados por nivel y bajo el bucle único. Verificar que en nivel 0 se muestra el mensaje y el medidor lleno sin ninguna animación.
- [ ] 5.4 Verificar el ciclo de desmarcar y volver a marcar: la celebración se dispara de nuevo por tratarse de una nueva transición.

## 6. Racha

- [ ] 6.1 Implementar el cálculo de la racha en `src/store.js` como días consecutivos desde el día 1. Verificar los tres casos del spec: racha corrida, racha cortada por un hueco y racha vacía.
- [ ] 6.2 Implementar el encendido de una celda (escala con retorno más brillo) reutilizable por el cometa y por la variante sin canvas, quitando `filter` de los keyframes por debajo del nivel 2. Verificar que la celda recupera su aspecto al terminar.
- [ ] 6.3 Implementar el cometa sobre el arco con nivel mínimo 2: interpola el ángulo entre el primer día de la racha y el día marcado, deja rastro aditivo y deduce del ángulo la celda que enciende a su paso. Verificar con 1, 3 y 7 hábitos que el rastro sigue el anillo correcto y que las celdas encendidas son las que el cometa atraviesa.
- [ ] 6.4 Acotar la duración del recorrido y encadenar el estallido de llegada en la celda marcada. Verificar que una racha de 20 días no supera el tope de duración.
- [ ] 6.5 Implementar la variante de nivel 1: encendido escalonado de las celdas de la racha sin canvas ni rastro. Verificar forzando el nivel 1 que las celdas se encienden en secuencia y no hay traza.
- [ ] 6.6 Implementar los casos sin recorrido: marcar el día 1, y marcar un día posterior a un hueco. Verificar que ambos reciben el estallido de llegada directamente, sin cometa.
- [ ] 6.7 Mostrar la longitud de la racha en la etiqueta del núcleo al aterrizar el cometa, con retorno automático al estado del día y reemplazo de la presentación anterior si llega otra. Verificar marcando varios días seguidos que el centro acaba siempre volviendo a `n/total`.
- [ ] 6.8 Distinguir visualmente los tramos de racha de una, dos y tres semanas en la presentación. Verificar comparando una racha de 3 y una de 14.
- [ ] 6.9 Implementar la respuesta al romper la racha: apagado de la celda desmarcada y cascada en las posteriores. Verificar que es claramente distinta del refuerzo de marcar y que en nivel 0 no hay animación.

## 7. Verificación transversal

- [ ] 7.1 Recorrer los cuatro niveles forzados (0, 1, 2, 3) sobre el conjunto completo de interacciones, comprobando que en cada uno el momento de recompensa sigue siendo perceptible y que ningún efecto se ejecuta por debajo de su nivel mínimo.
- [ ] 7.2 Verificar la interacción entre los dos momentos: marcar el último hábito pendiente cuando además extiende una racha larga, comprobando que cometa y supernova se componen sin borrarse mutuamente.
- [ ] 7.3 Probar en iOS Safari con la app instalada como PWA: fluidez al marcar, ausencia de errores por `navigator.vibrate` inexistente, y que el nivel asignado no es 3.
- [ ] 7.4 Probar en Chrome Android: la háptica se emite y el gobernador no degrada en un dispositivo que sí sostiene el ritmo.
- [ ] 7.5 Comprobar que la app sigue funcionando offline y que el service worker cachea los archivos nuevos de `src/fx/` (hard refresh sobre el build de producción).
- [ ] 7.6 Ejecutar `npm run build` y `npm run preview`, y verificar sobre el build que el anillo renderiza y ambos momentos se disparan correctamente.
