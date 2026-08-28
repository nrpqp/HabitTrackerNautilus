## Purpose

Da al usuario la última palabra sobre cuánta intensidad visual quiere, mediante un control radial que recuerda su elección, sin quitarle al sistema la capacidad de proteger el rendimiento del dispositivo.

## ADDED Requirements

### Requirement: Preferencia de intensidad con posición automática

El sistema SHALL ofrecer cinco opciones de intensidad de efectos: una posición **automática** y las cuatro correspondientes a los niveles 0 a 3. La posición automática SHALL ser el valor por defecto y SHALL devolver la decisión a la detección del dispositivo. Elegir cualquiera de las otras cuatro SHALL fijar ese nivel como punto de partida de la sesión.

La preferencia SHALL persistir entre sesiones y SHALL aplicarse antes del primer render, de modo que la aplicación nunca se muestre con un nivel distinto del elegido.

#### Scenario: Valor por defecto

- **WHEN** el usuario abre la aplicación por primera vez, sin preferencia guardada
- **THEN** la intensidad está en automática y el nivel activo es el que determina la detección del dispositivo

#### Scenario: Elegir un nivel concreto

- **WHEN** el usuario selecciona una de las cuatro intensidades
- **THEN** el nivel activo pasa a ser el elegido y la elección queda guardada

#### Scenario: La elección sobrevive a la recarga

- **WHEN** el usuario elige una intensidad, cierra la aplicación y la vuelve a abrir
- **THEN** la aplicación arranca con esa intensidad, sin mostrar antes ningún otro nivel

#### Scenario: Volver a automática

- **WHEN** el usuario tenía un nivel fijo elegido y selecciona la posición automática
- **THEN** el nivel activo vuelve a ser el de la detección del dispositivo y deja de haber preferencia fija guardada

#### Scenario: Preferencia guardada ilegible

- **WHEN** el valor guardado no corresponde a ninguna de las cinco opciones
- **THEN** el sistema se comporta como si estuviera en automática, sin errores

### Requirement: Control radial de intensidad

El sistema SHALL presentar la preferencia como un control radial que se abre desde el header y se dispone alrededor del centro del nautilus. El control SHALL indicar en todo momento qué opción está seleccionada y SHALL cerrarse al tocar fuera de él o al pulsar Escape, sin requerir un botón de confirmación: la selección se aplica al instante.

El control SHALL ser operable con teclado y SHALL exponer el nombre de cada opción a tecnologías de asistencia.

#### Scenario: Abrir y cerrar

- **WHEN** el usuario pulsa el botón de intensidad del header
- **THEN** aparece el control radial con la opción actual marcada, y se cierra al tocar fuera o pulsar Escape

#### Scenario: Aplicación inmediata

- **WHEN** el usuario selecciona una opción distinta dentro del control
- **THEN** el cambio se aplica de inmediato, sin necesidad de confirmar ni de recargar

#### Scenario: El control no bloquea el nautilus

- **WHEN** el control está abierto
- **THEN** el estado del día sigue siendo legible y, al cerrarlo, el centro vuelve a mostrar lo que mostraba antes

#### Scenario: Operable con teclado

- **WHEN** el usuario abre el control y navega con el teclado
- **THEN** puede recorrer las cinco opciones y seleccionar una sin usar el puntero

### Requirement: Vista previa al cambiar de intensidad

Al seleccionar una intensidad, el sistema SHALL disparar un efecto de muestra ejecutado con esa intensidad, de modo que la diferencia entre opciones sea perceptible en el momento de elegir. En la intensidad que no produce movimiento, la ausencia de muestra SHALL ser en sí misma la vista previa.

#### Scenario: Muestra al elegir

- **WHEN** el usuario selecciona una intensidad con movimiento
- **THEN** se ejecuta un efecto de muestra con el presupuesto y las capas de esa intensidad

#### Scenario: Comparación entre dos intensidades

- **WHEN** el usuario pasa de una intensidad a otra superior
- **THEN** la segunda muestra es visiblemente mayor que la primera

#### Scenario: Sin muestra en la intensidad de calma

- **WHEN** el usuario selecciona la intensidad sin movimiento
- **THEN** no se ejecuta ninguna animación

### Requirement: Visibilidad del nivel realmente activo

Cuando el nivel activo no coincida con la preferencia elegida —porque el gobernador de rendimiento lo ha degradado o porque hay una anulación de diagnóstico— el control SHALL indicarlo. Un ajuste que se ignora en silencio SHALL considerarse un fallo de esta capacidad.

#### Scenario: Degradación tras elegir un nivel alto

- **WHEN** el usuario ha elegido la intensidad máxima y el gobernador degrada el nivel activo por bajo rendimiento
- **THEN** el control muestra que la intensidad activa es menor que la elegida, y la preferencia guardada no cambia

#### Scenario: Anulación de diagnóstico activa

- **WHEN** la aplicación se ha abierto con una anulación de diagnóstico por URL
- **THEN** el control indica que el nivel lo fija la anulación, y la preferencia guardada permanece intacta

#### Scenario: Sin discrepancia

- **WHEN** el nivel activo coincide con la preferencia elegida
- **THEN** el control no muestra ninguna advertencia
