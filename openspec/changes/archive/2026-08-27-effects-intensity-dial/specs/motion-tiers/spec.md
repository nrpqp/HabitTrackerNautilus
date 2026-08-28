## MODIFIED Requirements

### Requirement: Degradación automática por rendimiento sostenido

El sistema SHALL medir la tasa de refresco real durante la sesión y SHALL bajar un nivel cuando el dispositivo no sostenga una tasa fluida durante varios segundos consecutivos. La degradación SHALL ser permanente durante esa sesión y no SHALL bajar nunca por debajo del nivel 1 de forma automática.

La degradación SHALL distinguir el origen del nivel activo. Cuando el nivel proviene de la detección del dispositivo o de una preferencia elegida por el usuario, la degradación SHALL aplicarse: el rendimiento real manda sobre cualquier estimación o deseo. Cuando el nivel proviene de una anulación de diagnóstico, la degradación no SHALL aplicarse, para que el nivel bajo observación se mantenga estable durante la medición.

Degradar el nivel activo no SHALL modificar la preferencia guardada del usuario.

#### Scenario: Dispositivo que no sostiene el ritmo

- **WHEN** la tasa de refresco medida se mantiene por debajo del umbral fluido durante varios segundos seguidos
- **THEN** el nivel baja en una unidad y los efectos siguientes se ejecutan con el presupuesto reducido

#### Scenario: Suelo de la degradación automática

- **WHEN** el nivel actual es 1 y el rendimiento sigue por debajo del umbral
- **THEN** el nivel permanece en 1; la degradación automática no lleva a nivel 0

#### Scenario: Caída puntual de rendimiento

- **WHEN** la tasa de refresco cae por debajo del umbral durante un intervalo aislado y se recupera
- **THEN** el nivel no cambia

#### Scenario: Un nivel elegido por el usuario sí se degrada

- **WHEN** el usuario ha elegido un nivel de efectos y el dispositivo no sostiene la tasa fluida
- **THEN** el nivel activo baja igualmente, y la preferencia guardada permanece intacta para el siguiente arranque

#### Scenario: Un nivel de diagnóstico no se degrada

- **WHEN** el nivel proviene de una anulación de diagnóstico y el dispositivo no sostiene la tasa fluida
- **THEN** el nivel se mantiene, para que lo que se está observando no cambie a mitad de la medición
