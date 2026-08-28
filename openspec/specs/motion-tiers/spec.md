## Purpose

Define cinco niveles de efecto visual y expone el nivel activo a todo el sistema de animación, de modo que un mismo momento de recompensa se represente con el coste que el aparato puede sostener sin perder fluidez ni batería. Siembra el nivel inicial a partir del dispositivo, lo protege con un gobernador de rendimiento y lo sujeta cuando el sistema operativo pide movimiento reducido.

## Requirements

### Requirement: Degradación automática por rendimiento sostenido

El sistema SHALL medir la tasa de refresco real durante la sesión y SHALL bajar un nivel cuando el dispositivo no sostenga una tasa fluida durante varios segundos consecutivos. La degradación SHALL ser permanente durante esa sesión y no SHALL bajar nunca por debajo del nivel 2 de forma automática.

La degradación SHALL distinguir el origen del nivel activo. Cuando el nivel proviene de la semilla inicial o de una preferencia elegida por el usuario, la degradación SHALL aplicarse: el rendimiento real manda sobre cualquier estimación o deseo. Cuando el nivel proviene de una anulación de diagnóstico, la degradación no SHALL aplicarse, para que el nivel bajo observación se mantenga estable durante la medición.

Degradar el nivel activo no SHALL modificar la preferencia guardada del usuario.

#### Scenario: Dispositivo que no sostiene el ritmo

- **WHEN** la tasa de refresco medida se mantiene por debajo del umbral fluido durante varios segundos seguidos
- **THEN** el nivel baja en una unidad y los efectos siguientes se ejecutan con el presupuesto reducido

#### Scenario: Suelo de la degradación automática

- **WHEN** el nivel actual es 2 y el rendimiento sigue por debajo del umbral
- **THEN** el nivel permanece en 2; la degradación automática no lleva a nivel 1

#### Scenario: Caída puntual de rendimiento

- **WHEN** la tasa de refresco cae por debajo del umbral durante un intervalo aislado y se recupera
- **THEN** el nivel no cambia

#### Scenario: Un nivel elegido por el usuario sí se degrada

- **WHEN** el usuario ha elegido un nivel de efectos y el dispositivo no sostiene la tasa fluida
- **THEN** el nivel activo baja igualmente, y la preferencia guardada permanece intacta para el siguiente arranque

#### Scenario: Un nivel de diagnóstico no se degrada

- **WHEN** el nivel proviene de una anulación de diagnóstico y el dispositivo no sostiene la tasa fluida
- **THEN** el nivel se mantiene, para que lo que se está observando no cambie a mitad de la medición

### Requirement: Presupuesto de efecto proporcional al nivel

Cada efecto SHALL declarar el nivel mínimo que necesita y no SHALL ejecutarse en niveles inferiores. Los efectos que emiten partículas SHALL escalar su cantidad en función del nivel, de manera que el mismo momento de recompensa se represente con menos elementos en dispositivos más modestos sin dejar de representarse.

El presupuesto SHALL ser nulo en los niveles 1 y 2, reducido en el nivel 3, medio en el nivel 4 y alto en el nivel 5, y SHALL crecer de forma monótona con el nivel.

#### Scenario: Efecto por debajo de su nivel mínimo

- **WHEN** un efecto declara nivel mínimo 4 y el nivel activo es 3
- **THEN** ese efecto no se ejecuta y el momento se representa con los efectos disponibles en el nivel activo

#### Scenario: Escalado de partículas

- **WHEN** el mismo momento de recompensa se dispara en niveles 3, 4 y 5
- **THEN** el número de partículas emitidas crece con el nivel, y en los tres casos el momento resulta perceptible

#### Scenario: Nivel 0 no emite partículas

- **WHEN** el nivel activo es 1 y ocurre un momento de recompensa
- **THEN** no se emite ninguna partícula ni se ejecuta ninguna animación, y el cambio de estado se refleja igualmente en el color de la celda

#### Scenario: Nivel sin canvas no emite partículas

- **WHEN** el nivel activo es 2 y ocurre un momento de recompensa
- **THEN** no se dibuja ninguna partícula en el canvas, y el momento se representa con animaciones de `transform` y `opacity`

### Requirement: Nitidez del canvas de efectos en pantallas de alta densidad

El canvas donde se dibujan los efectos SHALL dimensionarse teniendo en cuenta la densidad de píxeles de la pantalla, de modo que las partículas no se vean borrosas en pantallas de alta densidad. El factor de densidad aplicado SHALL estar acotado para que el coste de relleno no crezca sin límite en pantallas de densidad muy alta.

#### Scenario: Pantalla de alta densidad

- **WHEN** la aplicación se ejecuta en una pantalla con densidad de píxeles mayor que 1
- **THEN** las partículas se dibujan nítidas, sin el desenfoque de un canvas dimensionado en píxeles CSS

#### Scenario: Cambio de tamaño de la ventana

- **WHEN** la ventana o el contenedor del nautilus cambian de tamaño
- **THEN** el canvas se redimensiona y los efectos posteriores siguen alineados con las celdas del SVG

### Requirement: Realimentación háptica cuando el navegador la soporta

El sistema SHALL emitir un patrón de vibración distinto para cada clase de evento — toque simple, confirmación de día marcado, hito alcanzado y acción rechazada — cuando el navegador exponga la API de vibración. Cuando no la exponga, la ausencia de háptica no SHALL degradar ni interrumpir el refuerzo visual. La háptica no SHALL emitirse en nivel 1.

#### Scenario: Navegador con soporte de vibración

- **WHEN** el usuario marca un día en un navegador que expone la API de vibración y el nivel activo es mayor que 1
- **THEN** se emite el patrón de confirmación

#### Scenario: Navegador sin soporte de vibración

- **WHEN** el usuario marca un día en un navegador que no expone la API de vibración
- **THEN** la interacción se completa con normalidad y el refuerzo visual ocurre íntegro, sin errores en consola

#### Scenario: Sin háptica en nivel de calma

- **WHEN** el nivel activo es 1 y el usuario marca un día
- **THEN** no se emite ninguna vibración

### Requirement: Clasificación del dispositivo en cinco niveles

El sistema SHALL reconocer cinco niveles de efecto visual, numerados de 1 a 5:

- **Nivel 1 — Calma**: sin movimiento. Los estados se distinguen sólo por color, forma y peso.
- **Nivel 2 — Lite**: animaciones limitadas a `transform` y `opacity`. Sin canvas de partículas y sin filtros.
- **Nivel 3 — Suave**: canvas de partículas con presupuesto reducido, sin filtros ni capas adicionales.
- **Nivel 4 — Estándar**: canvas de partículas con blending aditivo, filtros y presupuestos medios.
- **Nivel 5 — Máximo**: presupuestos altos y capas adicionales de efecto.

El nivel activo SHALL estar siempre dentro de ese rango; ningún origen —semilla, preferencia, degradación o anulación de diagnóstico— SHALL producir un valor fuera de él.

El nivel 3 SHALL ser el peldaño intermedio entre no dibujar partículas y dibujarlas con coste completo: SHALL emitir partículas perceptibles sin aplicar filtros de composición.

#### Scenario: Rango del nivel activo

- **WHEN** el nivel activo se establece desde cualquier origen
- **THEN** su valor está comprendido entre 1 y 5, ambos incluidos

#### Scenario: El nivel intermedio sí emite partículas

- **WHEN** el nivel activo es 3 y ocurre un momento de recompensa
- **THEN** se emiten partículas perceptibles, con menos cantidad que en el nivel 4 y sin aplicar filtros

#### Scenario: Distinción entre el nivel sin canvas y el intermedio

- **WHEN** el mismo momento de recompensa ocurre en nivel 2 y en nivel 3
- **THEN** en el nivel 2 no se dibuja ninguna partícula y en el nivel 3 sí

### Requirement: Semilla del nivel en el primer arranque

Cuando no exista preferencia guardada, el sistema SHALL derivar un nivel inicial de las señales del navegador: modo de ahorro de datos, número de núcleos lógicos, memoria declarada del dispositivo y tipo de puntero. Ese nivel SHALL quedar como preferencia del usuario a partir de ese momento.

La derivación SHALL funcionar correctamente cuando alguna señal no esté disponible, sin asumir el nivel más alto por defecto. La detección no SHALL volver a ejecutarse en arranques posteriores: a partir del primero, el nivel lo determina la preferencia guardada.

#### Scenario: Ahorro de datos

- **WHEN** el navegador declara el modo de ahorro de datos activo y no hay preferencia guardada
- **THEN** el nivel inicial es 1

#### Scenario: Señales de capacidad no disponibles

- **WHEN** el navegador no expone memoria del dispositivo ni número de núcleos
- **THEN** el sistema asigna un nivel intermedio y la aplicación se comporta con normalidad, sin errores ni nivel máximo por defecto

#### Scenario: Dispositivo táctil que no declara memoria

- **WHEN** el navegador de un dispositivo táctil expone núcleos pero no memoria — el caso de cualquier iPhone o iPad
- **THEN** el nivel inicial es 4 o superior; no declarar memoria no SHALL tratarse como evidencia de un dispositivo limitado

#### Scenario: Navegador que falsea sus capacidades por privacidad

- **WHEN** un navegador de escritorio declara valores artificialmente bajos de núcleos o memoria como defensa antihuella
- **THEN** el nivel inicial es 4 o superior, porque el puntero fino identifica un equipo de escritorio y las declaraciones no son fiables

#### Scenario: Dispositivo declaradamente limitado

- **WHEN** un dispositivo táctil declara 2 GB de memoria o menos, o 2 núcleos o menos
- **THEN** el nivel inicial es 3, de modo que recibe partículas con presupuesto reducido en lugar de quedarse sin ninguna

#### Scenario: Dispositivo de gama alta

- **WHEN** el navegador declara 8 o más núcleos y 8 GB o más de memoria, y no hay ahorro de datos
- **THEN** el nivel inicial es 5

#### Scenario: La detección no se repite

- **WHEN** el usuario abre la aplicación por segunda vez, con una preferencia ya guardada
- **THEN** el nivel activo es el de la preferencia guardada, aunque las señales del dispositivo hayan cambiado

### Requirement: Techo permanente por movimiento reducido

Cuando el sistema operativo o el navegador declaren `prefers-reduced-motion: reduce`, el sistema SHALL sujetar el nivel activo al nivel 1, con independencia de la preferencia guardada y de cualquier otro origen.

El techo SHALL evaluarse en cada arranque y SHALL responder a los cambios de esa preferencia durante la sesión, sin necesidad de recargar. Aplicar el techo no SHALL modificar la preferencia guardada del usuario: al desactivarse el movimiento reducido, el nivel activo SHALL volver al nivel elegido.

Mientras el techo esté activo, el sistema SHALL indicarlo allí donde se elige el nivel, de modo que la escala no aparente estar aplicándose cuando no lo está.

#### Scenario: Movimiento reducido con preferencia alta guardada

- **WHEN** el usuario tiene guardado el nivel 5 y el sistema operativo declara movimiento reducido
- **THEN** el nivel activo es 1, no se ejecuta ningún efecto de movimiento y la preferencia guardada sigue siendo 5

#### Scenario: Activación del movimiento reducido durante la sesión

- **WHEN** el usuario activa el movimiento reducido en su sistema operativo con la aplicación abierta
- **THEN** el nivel activo pasa a 1 sin recargar la aplicación

#### Scenario: Desactivación del movimiento reducido

- **WHEN** el usuario desactiva el movimiento reducido en su sistema operativo
- **THEN** el nivel activo vuelve a ser el de la preferencia guardada

#### Scenario: El techo es visible

- **WHEN** el usuario abre los ajustes con el movimiento reducido activo
- **THEN** el control de nivel indica que el movimiento reducido está fijando el nivel activo, y sigue mostrando cuál es su elección guardada
