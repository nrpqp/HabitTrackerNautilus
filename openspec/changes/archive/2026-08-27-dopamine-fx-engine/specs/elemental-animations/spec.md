## ADDED Requirements

### Requirement: Continuidad de las animaciones al repintar el anillo

Las animaciones en curso sobre las celdas del SVG SHALL sobrevivir a cualquier repintado del anillo provocado por un cambio de estado. Marcar una celda, cambiar el elemento de un hábito, renombrar un hábito o alternar el tema no SHALL interrumpir ni reiniciar una animación que estuviera ejecutándose sobre otra celda.

#### Scenario: Marcar una celda mientras otra se anima

- **WHEN** el usuario marca una celda mientras un efecto lanzado por un marcado anterior sigue en curso sobre otras celdas
- **THEN** las animaciones anteriores continúan hasta terminar y la nueva se superpone sin cortarlas

#### Scenario: Cambio de elemento con animaciones activas

- **WHEN** el usuario cambia el elemento de un hábito desde el sheet de edición mientras hay celdas animándose
- **THEN** los colores se actualizan al nuevo elemento y las animaciones en vuelo no se reinician

#### Scenario: Cambio de tema con animaciones activas

- **WHEN** el usuario alterna el tema claro/oscuro mientras hay efectos en curso
- **THEN** los colores neutros se actualizan y ni las animaciones de celda ni las partículas en vuelo se interrumpen

## MODIFIED Requirements

### Requirement: Feedback de partículas al interactuar con celdas

El sistema SHALL mostrar un burst de partículas específicas del elemento al interactuar con una celda (marcar, desmarcar, o hacer click en una ya marcada). Las partículas se renderizan en un canvas overlay posicionado sobre el SVG con `pointer-events: none`, de modo que el repintado del anillo no interrumpa ni elimine las partículas en vuelo.

El tamaño del burst SHALL escalar con el nivel de dispositivo: en nivel 0 no se emite ninguna partícula, y a partir del nivel 2 la cantidad crece con el nivel. En todos los niveles que emiten partículas el burst SHALL ser perceptible.

Las partículas SHALL componerse de forma aditiva, de manera que el solapamiento de varias partículas del mismo elemento produzca un núcleo más luminoso que cada una por separado. Cada elemento SHALL tener un comportamiento de movimiento propio y distinguible del resto.

#### Scenario: Partículas al marcar una celda

- **WHEN** el usuario hace click en la celda del día siguiente (siguiente a completar) y el nivel activo es 2 o superior
- **THEN** aparece un burst de partículas con la forma y movimiento específicos del elemento desde el centro de esa celda

#### Scenario: Partículas al visitar una celda ya completada

- **WHEN** el usuario hace click en una celda ya completada
- **THEN** aparece el mismo burst de partículas; el estado de la celda no cambia

#### Scenario: Partículas no se interrumpen por re-render del SVG

- **WHEN** el anillo se repinta (por cualquier cambio de estado) mientras hay partículas en vuelo en el overlay
- **THEN** las partículas continúan su animación hasta el final sin verse afectadas

#### Scenario: Solapamiento aditivo

- **WHEN** varias partículas del mismo elemento se solapan en pantalla
- **THEN** la zona de solapamiento es más luminosa que cada partícula por separado

#### Scenario: Movimiento distinguible por elemento

- **WHEN** se comparan los bursts de dos elementos distintos
- **THEN** su movimiento es distinguible: por ejemplo el fuego asciende y el de tierra cae por gravedad

#### Scenario: Burst proporcional al nivel del dispositivo

- **WHEN** el mismo marcado ocurre en nivel 2 y en nivel 3
- **THEN** el burst de nivel 3 contiene más partículas que el de nivel 2, y ambos resultan perceptibles

#### Scenario: Burst proporcional en milestone

- **WHEN** el usuario completa exactamente el día 7, 14 o 21
- **THEN** el burst de partículas es notablemente mayor que el de un marcado normal y parte desde el centro del ring, adicionalmente al burst de la celda

#### Scenario: Sin partículas en nivel de calma

- **WHEN** el usuario marca una celda y el nivel activo es 0
- **THEN** no se emite ninguna partícula y la celda refleja igualmente su nuevo estado
