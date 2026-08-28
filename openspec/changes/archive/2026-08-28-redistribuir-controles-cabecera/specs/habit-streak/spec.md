## MODIFIED Requirements

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
