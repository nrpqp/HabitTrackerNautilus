## Purpose

Hace visible la racha de días consecutivos de un hábito como un objeto con continuidad propia, de modo que extender la racha se represente como un recorrido sobre todo lo ya conseguido y romperla tenga una consecuencia perceptible.

## Requirements

### Requirement: Definición de la racha de un hábito

La racha de un hábito SHALL ser el número de días consecutivos completados contando desde el primer día del reto. Un día sin completar interrumpe la racha, y los días completados posteriores a esa interrupción no SHALL contarse.

#### Scenario: Racha desde el inicio

- **WHEN** un hábito tiene los días 1 a 5 completados y el resto sin completar
- **THEN** su racha es 5

#### Scenario: Hueco en el recorrido

- **WHEN** un hábito tiene los días 1 a 3 completados, el día 4 sin completar y los días 5 y 6 completados
- **THEN** su racha es 3

#### Scenario: Racha vacía

- **WHEN** un hábito no tiene ningún día completado
- **THEN** su racha es 0

### Requirement: Recorrido de la racha al extenderla

Al marcar un día que extiende una racha de longitud mayor que uno, el sistema SHALL representar un recorrido que parte del primer día de la racha, avanza a lo largo del arco del anillo de ese hábito y termina en el día recién marcado. Cada celda por la que pasa el recorrido SHALL reaccionar al ser alcanzada, de modo que la racha se lea como algo que se reenciende entero y no como una celda suelta.

La duración del recorrido SHALL crecer con la longitud de la racha y SHALL estar acotada, de manera que una racha larga no obligue a esperar. Al llegar al destino SHALL producirse un estallido en la celda recién marcada.

#### Scenario: Recorrido sobre una racha existente

- **WHEN** el usuario marca el día 8 de un hábito que ya tenía los días 1 a 7 completados
- **THEN** el recorrido parte del día 1, alcanza en orden las celdas intermedias y termina con un estallido en el día 8

#### Scenario: Primer día del reto

- **WHEN** el usuario marca el día 1 de un hábito sin ningún día previo completado
- **THEN** no hay recorrido, y el día marcado recibe directamente el estallido de llegada

#### Scenario: Duración acotada

- **WHEN** el usuario marca el día 21 de un hábito con los veinte días anteriores completados
- **THEN** el recorrido completa el anillo sin superar el tope de duración establecido

#### Scenario: Marcar un día que no extiende la racha

- **WHEN** el usuario marca un día posterior a un hueco, de modo que la racha no aumenta
- **THEN** no hay recorrido; el día marcado recibe el estallido de llegada sin más

### Requirement: Variante del recorrido según el nivel del dispositivo

El recorrido SHALL adaptarse al nivel de efecto visual activo. A partir del nivel 3 se representa con una traza luminosa continua sobre el canvas de efectos, cuya densidad crece con el nivel. En el nivel 2 se representa con el mismo encendido escalonado de las celdas de la racha, sin traza y sin canvas. En el nivel 1 no hay recorrido ni estallido.

#### Scenario: Recorrido con traza

- **WHEN** el usuario extiende una racha y el nivel activo es 3 o superior
- **THEN** una traza luminosa recorre el arco y las celdas se encienden a su paso

#### Scenario: Recorrido sin canvas

- **WHEN** el usuario extiende una racha y el nivel activo es 2
- **THEN** las celdas de la racha se encienden en secuencia desde la primera hasta la recién marcada, sin traza luminosa

#### Scenario: Sin recorrido en nivel de calma

- **WHEN** el usuario extiende una racha y el nivel activo es 1
- **THEN** la celda cambia de color y no hay recorrido, encendido escalonado ni estallido

### Requirement: Presentación transitoria de la longitud de la racha

Al completarse el recorrido, el sistema SHALL mostrar la longitud de la racha en el centro del nautilus durante un intervalo breve y SHALL devolver después el centro a su estado en reposo sin intervención del usuario. La presentación SHALL distinguir visualmente los tramos alcanzados de una, dos y tres semanas.

#### Scenario: Aparición y retorno

- **WHEN** termina el recorrido de una racha
- **THEN** el centro muestra la longitud de la racha y, pasado un intervalo breve, vuelve por sí solo a mostrar el estado del día

#### Scenario: Distinción por tramo

- **WHEN** se comparan la presentación de una racha de 3 días y la de una de 14
- **THEN** ambas son visualmente distinguibles entre sí en algo más que el número

#### Scenario: El centro no queda ocupado

- **WHEN** el usuario marca varios días seguidos en rápida sucesión
- **THEN** el centro no queda bloqueado mostrando la racha: cada presentación reemplaza a la anterior y el centro acaba volviendo al estado del día

### Requirement: Respuesta al romper la racha

Al desmarcar un día previamente completado, el sistema SHALL dar una respuesta visual que comunique la pérdida: la celda desmarcada se apaga con una transición perceptible y las celdas posteriores del mismo anillo responden en cascada. Esta respuesta SHALL distinguirse claramente del refuerzo positivo de marcar.

#### Scenario: Desmarcar un día

- **WHEN** el usuario desmarca un día completado y el nivel activo es 1 o superior
- **THEN** la celda se apaga con una transición visible y las celdas posteriores parpadean en cascada

#### Scenario: La ruptura no se confunde con el logro

- **WHEN** se comparan marcar y desmarcar el mismo día
- **THEN** las dos respuestas son claramente distintas: la de desmarcar no incluye recorrido ni estallido

#### Scenario: Sin respuesta en nivel de calma

- **WHEN** el usuario desmarca un día y el nivel activo es 0
- **THEN** la celda cambia de color sin ninguna animación
