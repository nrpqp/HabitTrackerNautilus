## Purpose

Clasifica el dispositivo en uno de cuatro niveles de efecto visual y expone ese nivel a todo el sistema de animación, de modo que un mismo momento de recompensa se represente con el coste que el aparato puede sostener sin perder fluidez ni batería.

## ADDED Requirements

### Requirement: Clasificación del dispositivo en cuatro niveles

El sistema SHALL clasificar el dispositivo en uno de cuatro niveles de efecto al arrancar la aplicación:

- **Nivel 0 — Calma**: sin movimiento. Los estados se distinguen sólo por color, forma y peso.
- **Nivel 1 — Lite**: animaciones limitadas a `transform` y `opacity`. Sin canvas de partículas y sin filtros.
- **Nivel 2 — Estándar**: canvas de partículas con blending aditivo y presupuestos medios.
- **Nivel 3 — Máximo**: presupuestos altos y capas adicionales de efecto.

La clasificación SHALL derivarse de señales del navegador: `prefers-reduced-motion`, modo de ahorro de datos, número de núcleos lógicos, memoria declarada del dispositivo y tipo de puntero. El sistema SHALL funcionar correctamente cuando alguna de esas señales no esté disponible, sin asumir el nivel más alto por defecto.

#### Scenario: Movimiento reducido fuerza el nivel mínimo

- **WHEN** el sistema operativo o navegador declara `prefers-reduced-motion: reduce`
- **THEN** el nivel asignado es 0 y ningún efecto de movimiento se ejecuta, independientemente de la potencia del dispositivo

#### Scenario: Ahorro de datos fuerza el nivel mínimo

- **WHEN** el navegador declara el modo de ahorro de datos activo
- **THEN** el nivel asignado es 0

#### Scenario: Señales de capacidad no disponibles

- **WHEN** el navegador no expone memoria del dispositivo ni número de núcleos
- **THEN** el sistema asigna un nivel intermedio conservador y la aplicación se comporta con normalidad, sin errores ni nivel máximo por defecto

#### Scenario: Dispositivo de gama alta

- **WHEN** el navegador declara 8 o más núcleos y 8 GB o más de memoria, y no hay movimiento reducido ni ahorro de datos
- **THEN** el nivel asignado es 3

### Requirement: Degradación automática por rendimiento sostenido

El sistema SHALL medir la tasa de refresco real durante la sesión y SHALL bajar un nivel cuando el dispositivo no sostenga una tasa fluida durante varios segundos consecutivos. La degradación SHALL ser permanente durante esa sesión y no SHALL bajar nunca por debajo del nivel 1 de forma automática. La degradación automática no SHALL sobrescribir un nivel fijado explícitamente.

#### Scenario: Dispositivo que no sostiene el ritmo

- **WHEN** la tasa de refresco medida se mantiene por debajo del umbral fluido durante varios segundos seguidos
- **THEN** el nivel baja en una unidad y los efectos siguientes se ejecutan con el presupuesto reducido

#### Scenario: Suelo de la degradación automática

- **WHEN** el nivel actual es 1 y el rendimiento sigue por debajo del umbral
- **THEN** el nivel permanece en 1; la degradación automática no lleva a nivel 0

#### Scenario: Caída puntual de rendimiento

- **WHEN** la tasa de refresco cae por debajo del umbral durante un intervalo aislado y se recupera
- **THEN** el nivel no cambia

### Requirement: Presupuesto de efecto proporcional al nivel

Cada efecto SHALL declarar el nivel mínimo que necesita y no SHALL ejecutarse en niveles inferiores. Los efectos que emiten partículas SHALL escalar su cantidad en función del nivel, de manera que el mismo momento de recompensa se represente con menos elementos en dispositivos más modestos sin dejar de representarse.

#### Scenario: Efecto por debajo de su nivel mínimo

- **WHEN** un efecto declara nivel mínimo 2 y el nivel activo es 1
- **THEN** ese efecto no se ejecuta y el momento se representa con los efectos disponibles en el nivel activo

#### Scenario: Escalado de partículas

- **WHEN** el mismo momento de recompensa se dispara en nivel 2 y en nivel 3
- **THEN** el número de partículas emitidas en nivel 3 es mayor que en nivel 2, y en ambos casos el momento resulta perceptible

#### Scenario: Nivel 0 no emite partículas

- **WHEN** el nivel activo es 0 y ocurre un momento de recompensa
- **THEN** no se emite ninguna partícula ni se ejecuta ninguna animación, y el cambio de estado se refleja igualmente en el color de la celda

### Requirement: Nitidez del canvas de efectos en pantallas de alta densidad

El canvas donde se dibujan los efectos SHALL dimensionarse teniendo en cuenta la densidad de píxeles de la pantalla, de modo que las partículas no se vean borrosas en pantallas de alta densidad. El factor de densidad aplicado SHALL estar acotado para que el coste de relleno no crezca sin límite en pantallas de densidad muy alta.

#### Scenario: Pantalla de alta densidad

- **WHEN** la aplicación se ejecuta en una pantalla con densidad de píxeles mayor que 1
- **THEN** las partículas se dibujan nítidas, sin el desenfoque de un canvas dimensionado en píxeles CSS

#### Scenario: Cambio de tamaño de la ventana

- **WHEN** la ventana o el contenedor del nautilus cambian de tamaño
- **THEN** el canvas se redimensiona y los efectos posteriores siguen alineados con las celdas del SVG

### Requirement: Realimentación háptica cuando el navegador la soporta

El sistema SHALL emitir un patrón de vibración distinto para cada clase de evento — toque simple, confirmación de día marcado, hito alcanzado y acción rechazada — cuando el navegador exponga la API de vibración. Cuando no la exponga, la ausencia de háptica no SHALL degradar ni interrumpir el refuerzo visual. La háptica no SHALL emitirse en nivel 0.

#### Scenario: Navegador con soporte de vibración

- **WHEN** el usuario marca un día en un navegador que expone la API de vibración y el nivel activo es mayor que 0
- **THEN** se emite el patrón de confirmación

#### Scenario: Navegador sin soporte de vibración

- **WHEN** el usuario marca un día en un navegador que no expone la API de vibración
- **THEN** la interacción se completa con normalidad y el refuerzo visual ocurre íntegro, sin errores en consola

#### Scenario: Sin háptica en nivel de calma

- **WHEN** el nivel activo es 0 y el usuario marca un día
- **THEN** no se emite ninguna vibración
