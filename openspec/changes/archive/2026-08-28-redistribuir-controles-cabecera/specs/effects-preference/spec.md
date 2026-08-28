## ADDED Requirements

### Requirement: Preferencia de nivel en escala de 1 a 5

El sistema SHALL ofrecer al usuario cinco opciones de nivel de efecto visual, numeradas de 1 a 5 y ordenadas de menor a mayor intensidad. No SHALL existir una posición automática: la elección es siempre un número concreto.

La preferencia SHALL persistir entre sesiones y SHALL aplicarse antes del primer render, de modo que la aplicación nunca se muestre con un nivel distinto del elegido.

Cuando no exista preferencia guardada, el sistema SHALL sembrar una a partir de las señales del dispositivo y guardarla como elección del usuario.

#### Scenario: Primer arranque sin preferencia

- **WHEN** el usuario abre la aplicación por primera vez
- **THEN** el nivel activo es el derivado de las señales del dispositivo, y queda guardado como la preferencia del usuario

#### Scenario: Elegir un nivel

- **WHEN** el usuario selecciona uno de los cinco niveles
- **THEN** el nivel activo pasa a ser el elegido y la elección queda guardada

#### Scenario: La elección sobrevive a la recarga

- **WHEN** el usuario elige un nivel, cierra la aplicación y la vuelve a abrir
- **THEN** la aplicación arranca con ese nivel, sin mostrar antes ningún otro

#### Scenario: Preferencia guardada ilegible

- **WHEN** el valor guardado no corresponde a ninguno de los cinco niveles
- **THEN** el sistema siembra de nuevo a partir de las señales del dispositivo, sin errores

#### Scenario: Almacenamiento no disponible

- **WHEN** el navegador impide leer o escribir el almacenamiento local
- **THEN** la sesión en curso respeta igualmente la elección del usuario y la aplicación no falla

### Requirement: Control de nivel dentro de los ajustes

El sistema SHALL presentar la preferencia como una escala numérica de cinco posiciones dentro de la hoja de ajustes. La escala SHALL indicar en todo momento qué posición está seleccionada y SHALL aplicar la selección al instante, sin botón de confirmación.

Las posiciones extremas SHALL estar rotuladas de forma que se entienda el sentido de la escala sin necesidad de recorrerla.

El control SHALL ser operable con teclado y SHALL exponer cada posición a las tecnologías de asistencia como parte de un mismo grupo de selección única.

#### Scenario: Selección visible

- **WHEN** el usuario abre la hoja de ajustes
- **THEN** la escala muestra marcada la posición correspondiente al nivel elegido

#### Scenario: Aplicación inmediata

- **WHEN** el usuario selecciona una posición distinta
- **THEN** el cambio se aplica de inmediato, sin necesidad de confirmar, cerrar la hoja ni recargar

#### Scenario: El sentido de la escala es legible

- **WHEN** el usuario ve la escala por primera vez
- **THEN** distingue qué extremo corresponde a menos movimiento y cuál a más, sin haber seleccionado ninguna posición

#### Scenario: Operable con teclado

- **WHEN** el usuario alcanza la escala con el tabulador y navega con las flechas
- **THEN** puede recorrer las cinco posiciones y seleccionar una sin usar el puntero

### Requirement: Migración de la preferencia guardada anterior

El sistema SHALL migrar las preferencias escritas con la numeración anterior de cuatro niveles a la escala de 1 a 5, según la correspondencia `0 → 1`, `1 → 2`, `2 → 4`, `3 → 5`. Una preferencia guardada en la posición automática anterior SHALL tratarse como ausencia de preferencia y SHALL sembrarse desde las señales del dispositivo.

La migración SHALL ejecutarse una sola vez y SHALL ser idempotente: repetirla no SHALL alterar el resultado. Interpretar un valor antiguo con la escala nueva sin migrarlo SHALL considerarse un fallo de esta capacidad.

#### Scenario: Usuario que había elegido el máximo

- **WHEN** un usuario con la preferencia anterior `3` abre la versión nueva
- **THEN** su nivel activo es 5, el máximo de la escala nueva, y no un nivel intermedio

#### Scenario: Usuario que había elegido calma

- **WHEN** un usuario con la preferencia anterior `0` abre la versión nueva
- **THEN** su nivel activo es 1 y sigue sin haber movimiento

#### Scenario: Usuario que estaba en automática

- **WHEN** un usuario que nunca fijó un nivel, o que había vuelto a la posición automática, abre la versión nueva
- **THEN** el nivel se siembra desde las señales del dispositivo y queda guardado

#### Scenario: Migración repetida

- **WHEN** la aplicación arranca de nuevo tras haber migrado la preferencia
- **THEN** el nivel guardado permanece igual y no vuelve a transformarse

## MODIFIED Requirements

### Requirement: Vista previa al cambiar de intensidad

Al seleccionar un nivel, el sistema SHALL disparar un efecto de muestra ejecutado con ese nivel, de modo que la diferencia entre opciones sea perceptible en el momento de elegir. En el nivel que no produce movimiento, la ausencia de muestra SHALL ser en sí misma la vista previa.

La muestra SHALL ser visible sin cerrar la hoja de ajustes: la superficie desde la que se elige no SHALL ocultar ni atenuar el área donde se dibuja la muestra.

#### Scenario: Muestra al elegir

- **WHEN** el usuario selecciona un nivel con movimiento
- **THEN** se ejecuta un efecto de muestra con el presupuesto y las capas de ese nivel

#### Scenario: Comparación entre dos intensidades

- **WHEN** el usuario pasa de un nivel a otro superior
- **THEN** la segunda muestra es visiblemente mayor que la primera

#### Scenario: Sin muestra en la intensidad de calma

- **WHEN** el usuario selecciona el nivel 1
- **THEN** no se ejecuta ninguna animación

#### Scenario: La muestra no queda tapada

- **WHEN** el usuario selecciona un nivel con la hoja de ajustes abierta
- **THEN** la muestra se ve por encima del velo de la hoja, sin necesidad de cerrarla

### Requirement: Visibilidad del nivel realmente activo

Cuando el nivel activo no coincida con la preferencia elegida —porque el gobernador de rendimiento lo ha degradado, porque el movimiento reducido está fijando un techo o porque hay una anulación de diagnóstico— el control SHALL indicarlo. Un ajuste que se ignora en silencio SHALL considerarse un fallo de esta capacidad.

#### Scenario: Degradación tras elegir un nivel alto

- **WHEN** el usuario ha elegido el nivel 5 y el gobernador degrada el nivel activo por bajo rendimiento
- **THEN** el control muestra que el nivel activo es menor que el elegido, y la preferencia guardada no cambia

#### Scenario: Movimiento reducido activo

- **WHEN** el sistema operativo declara movimiento reducido
- **THEN** el control indica que el nivel activo está sujeto a 1 por esa preferencia del sistema, y sigue mostrando cuál es la elección guardada

#### Scenario: Anulación de diagnóstico activa

- **WHEN** la aplicación se ha abierto con una anulación de diagnóstico por URL
- **THEN** el control indica que el nivel lo fija la anulación, y la preferencia guardada permanece intacta

#### Scenario: Sin discrepancia

- **WHEN** el nivel activo coincide con la preferencia elegida
- **THEN** el control no muestra ninguna advertencia

## REMOVED Requirements

### Requirement: Preferencia de intensidad con posición automática

**Reason**: La escala pasa a ser numérica de 1 a 5 y no admite una posición que no sea un nivel. La detección del dispositivo deja de ser un modo persistente y pasa a sembrar el valor inicial una sola vez.

**Migration**: Sustituido por «Preferencia de nivel en escala de 1 a 5», que recoge la persistencia y la aplicación antes del primer render, y por «Migración de la preferencia guardada anterior», que define la correspondencia entre la numeración vieja y la nueva. Quien estuviera en la posición automática recibe una semilla derivada de su dispositivo, guardada ya como elección concreta.

### Requirement: Control radial de intensidad

**Reason**: La intensidad se recoge dentro de la hoja de ajustes junto al tema y a la fuente, de modo que la cabecera queda con dos botones. Un control radial anidado dentro de una hoja no es operable con comodidad en pantallas estrechas, y el espacio alrededor del nautilus deja de estar disponible mientras la hoja está abierta.

**Migration**: Sustituido por «Control de nivel dentro de los ajustes». El cierre por toque exterior y por `Escape` y la aplicación instantánea sin confirmación se conservan, ahora como comportamiento de la hoja que lo contiene, definido en `app-settings`. La garantía de que el nautilus siga legible mientras se elige pasa al requisito de velo de esa misma capacidad.
