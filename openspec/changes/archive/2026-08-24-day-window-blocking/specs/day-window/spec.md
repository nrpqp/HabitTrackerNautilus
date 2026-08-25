## Purpose

Define qué días del anillo de un hábito son editables por el usuario y cuáles están congelados, garantizando que solo se pueda registrar el cumplimiento del día actual o del día anterior.

## ADDED Requirements

### Requirement: Ventana de edición de dos días

El sistema SHALL permitir marcar o desmarcar únicamente las celdas correspondientes al día actual y al día inmediatamente anterior (ayer) de cada anillo de hábito.

#### Scenario: Marcar el día de hoy

- **WHEN** el usuario hace click en la celda correspondiente a la fecha de hoy
- **THEN** el sistema alterna el estado de completado de ese día y guarda el cambio

#### Scenario: Marcar el día de ayer

- **WHEN** el usuario hace click en la celda correspondiente a la fecha de ayer
- **THEN** el sistema alterna el estado de completado de ese día y guarda el cambio

### Requirement: Bloqueo de días pasados fuera de la ventana

El sistema SHALL bloquear la edición de cualquier celda cuya fecha sea anterior a ayer (más de 1 día en el pasado), independientemente de si está marcada o no.

#### Scenario: Click en día antiguo no marcado

- **WHEN** el usuario intenta hacer click en una celda con fecha anterior a ayer
- **THEN** el sistema no altera el estado de esa celda ni emite ninguna acción

#### Scenario: Click en día antiguo ya marcado

- **WHEN** el usuario intenta hacer click en una celda con fecha anterior a ayer que ya fue marcada como completada
- **THEN** el sistema no altera el estado de esa celda — el check permanece congelado

### Requirement: Bloqueo de días futuros

El sistema SHALL bloquear la edición de cualquier celda cuya fecha sea posterior a hoy.

#### Scenario: Click en día futuro

- **WHEN** el usuario intenta hacer click en una celda con fecha futura
- **THEN** el sistema no altera el estado de esa celda

### Requirement: Representación visual diferenciada por estado

El sistema SHALL representar visualmente de forma distinguible cada uno de los cuatro estados posibles de una celda: hoy (`today`), ayer (`yesterday`), pasado congelado (`old`), y futuro (`locked`).

#### Scenario: Celda de hoy sin marcar

- **WHEN** la celda corresponde a la fecha de hoy y no está marcada
- **THEN** la celda se muestra con indicador visual de "día activo" (borde o punto distintivo)

#### Scenario: Celda en estado old marcada

- **WHEN** la celda corresponde a un día anterior a ayer y está marcada como completada
- **THEN** la celda se muestra con el color de completado del hábito, sin cursor de interacción (no-pointer)

#### Scenario: Celda en estado old no marcada

- **WHEN** la celda corresponde a un día anterior a ayer y no está marcada
- **THEN** la celda se muestra con estilo de bloqueada/perdida, sin cursor de interacción
