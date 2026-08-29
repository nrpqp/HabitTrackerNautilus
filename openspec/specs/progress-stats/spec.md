## Purpose

Resume el estado del reto en tres cifras siempre visibles —racha, efectividad y avance del día— para que el usuario sepa cómo va sin tener que interpretar la rueda anillo por anillo.

## Requirements

### Requirement: Fila de tres indicadores

El sistema SHALL mostrar bajo la rueda una fila de tres indicadores, cada uno con un icono, una cifra y una etiqueta: **Racha**, **Efectividad** y **Hoy**. Los tres SHALL derivarse de los hábitos guardados, sin persistir ningún dato nuevo.

Los indicadores SHALL ser informativos: no reciben interacción y no alteran el estado de ningún hábito.

#### Scenario: Los tres indicadores visibles al cargar

- **WHEN** el usuario abre la aplicación con al menos un hábito
- **THEN** se muestran los tres indicadores con sus valores actuales, sin desplazar ni encoger la rueda por debajo de su tamaño legible

#### Scenario: Los indicadores no son interactivos

- **WHEN** el usuario toca un indicador
- **THEN** no ocurre nada: no se abre ningún panel ni cambia ningún hábito

### Requirement: Racha

El indicador de racha SHALL mostrar la racha más larga entre todos los hábitos, expresada en días. La racha de un hábito es la ya definida por la capacidad `habit-streak`: días consecutivos completados desde el primer día del reto, interrumpida por el primer día sin completar.

Con cero hábitos, o cuando ningún hábito tiene el día 1 completado, el indicador SHALL mostrar `0d`.

#### Scenario: Varios hábitos con rachas distintas

- **WHEN** un hábito lleva 5 días consecutivos desde el día 1 y otro lleva 2
- **THEN** el indicador muestra `5d`

#### Scenario: Ninguna racha en curso

- **WHEN** ningún hábito tiene marcado su día 1
- **THEN** el indicador muestra `0d`

### Requirement: Efectividad

El indicador de efectividad SHALL mostrar el porcentaje entero de días completados sobre los días ya vencidos, sumando todos los hábitos. Un día está vencido cuando su fecha es anterior o igual a hoy dentro del reto de ese hábito; los días futuros bloqueados no SHALL contarse.

Cuando no hay ningún día vencido, el indicador SHALL mostrar `0%`.

#### Scenario: Cálculo sobre días vencidos

- **WHEN** un hábito lleva 4 días de reto y tiene 3 marcados, y otro lleva 2 días con 1 marcado
- **THEN** el indicador muestra `67%` — 4 de 6 días vencidos, redondeado al entero

#### Scenario: Los días futuros no penalizan

- **WHEN** un hábito creado hoy tiene marcado su primer día
- **THEN** el indicador muestra `100%` y no se degrada por los 20 días que aún faltan

#### Scenario: Reto recién creado sin marcar

- **WHEN** existe un único hábito creado hoy y sin marcar
- **THEN** el indicador muestra `0%`

### Requirement: Hoy

El indicador "Hoy" SHALL mostrar cuántos hábitos activos ya están completados en el día en curso sobre el total de hábitos activos, en formato `n/m` — el mismo par de cifras que muestra el medidor del núcleo central. Un hábito está activo cuando la fecha de hoy cae dentro de sus 21 días.

Con cero hábitos activos, el indicador SHALL mostrar `0/0`.

#### Scenario: Avance parcial del día

- **WHEN** hay tres hábitos activos hoy y dos ya están marcados
- **THEN** el indicador muestra `2/3`

#### Scenario: Sin hábitos activos

- **WHEN** el usuario no tiene ningún hábito con el reto en curso hoy (sin hábitos, o todos ya superaron sus 21 días)
- **THEN** el indicador muestra `0/0` y la fila sigue visible sin errores

### Requirement: Actualización inmediata de los indicadores

Los tres indicadores SHALL reflejar el estado actual tras cualquier operación que repinte la rueda: marcar o desmarcar un día, crear, reiniciar o eliminar un hábito, y cambiar de tema.

#### Scenario: Marcar el día de hoy

- **WHEN** el usuario marca el día de hoy de un hábito
- **THEN** "Hoy" se actualiza de inmediato, y la efectividad y, si procede, la racha se actualizan en el mismo instante, sin recargar la página

#### Scenario: Eliminar un hábito

- **WHEN** el usuario elimina un hábito desde su panel
- **THEN** los tres indicadores se recalculan sin ese hábito
