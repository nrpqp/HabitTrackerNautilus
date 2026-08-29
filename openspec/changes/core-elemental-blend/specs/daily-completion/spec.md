## MODIFIED Requirements

### Requirement: Medidor del día en el núcleo central

El núcleo central del nautilus SHALL representar cuántos hábitos del día en
curso están completados sobre el total de hábitos activos mediante dos
capas independientes: un anillo de segmentos alrededor del núcleo —uno por
hábito, distinguible por el color del elemento de ese hábito, que se
rellena cuando el día de hoy de ese hábito queda marcado y se vacía cuando
se desmarca— y una mezcla elemental dentro del propio núcleo. La mezcla
SHALL representar únicamente los hábitos ya completados hoy: un hábito
pendiente SHALL NOT ocupar ningún espacio, hueco, contorno ni marcador
visible dentro del núcleo — su ausencia es simplemente la ausencia de una
forma, nunca un indicio visual de tarea sin hacer. Ambas capas SHALL
reflejar el estado correcto al cargar la aplicación, sin disparar ninguna
celebración. Sin ningún hábito completado hoy, el núcleo SHALL mostrar su
estado neutro de base (equivalente al núcleo anterior a este cambio), sin
ninguna implicación visual de tareas pendientes.

#### Scenario: Estado inicial al abrir la aplicación

- **WHEN** el usuario abre la aplicación con dos de tres hábitos ya
  marcados hoy
- **THEN** los dos segmentos correspondientes del anillo aparecen llenos y
  el núcleo muestra la mezcla de los elementos de esos dos hábitos, sin
  celebración alguna

#### Scenario: Marcar el día de hoy de un hábito

- **WHEN** el usuario marca el día de hoy de un hábito que no estaba
  marcado
- **THEN** el segmento de ese hábito se rellena y el color de su elemento
  se incorpora a la mezcla del núcleo

#### Scenario: Desmarcar el día de hoy de un hábito

- **WHEN** el usuario desmarca el día de hoy de un hábito que estaba
  marcado
- **THEN** el segmento de ese hábito se vacía y el color de su elemento se
  retira de la mezcla del núcleo

#### Scenario: El medidor aparece colocado desde el primer pintado

- **WHEN** la aplicación termina de cargar, antes de cualquier interacción
- **THEN** el anillo de segmentos y la mezcla del núcleo aparecen centrados
  sobre el nautilus, sin depender de un repintado posterior para colocarse

#### Scenario: Marcar un día que no es hoy

- **WHEN** el usuario marca el día de ayer de un hábito
- **THEN** ni el anillo de segmentos ni la mezcla del núcleo cambian; sólo
  el día de hoy los alimenta

#### Scenario: Sin hábitos completados hoy

- **WHEN** ningún hábito activo tiene marcado su día de hoy
- **THEN** el núcleo muestra el estado neutro, sin colores de ningún
  elemento

#### Scenario: Ningún hábito pendiente se representa como vacío

- **WHEN** el usuario tiene varios hábitos activos hoy y sólo algunos de
  ellos están completados
- **THEN** el núcleo muestra únicamente los colores de los hábitos
  completados; ningún hábito pendiente aparece representado por un hueco,
  sector oscuro, contorno o marcador vacío dentro del núcleo

### Requirement: El estado del día es el reposo del centro

El centro del nautilus SHALL mostrar la mezcla elemental del día en curso
siempre que no haya una presentación transitoria en marcha. Cualquier
información temporal que ocupe el centro SHALL devolverlo a la mezcla al
terminar, sin intervención del usuario. Ninguna presentación transitoria
SHALL dejar el centro en un estado distinto de forma permanente.

#### Scenario: Retorno tras una presentación transitoria

- **WHEN** el centro ha mostrado temporalmente otra información y esa
  presentación termina
- **THEN** el centro vuelve a mostrar la mezcla elemental de los hábitos
  cerrados hoy

#### Scenario: El medidor de arcos no se oculta

- **WHEN** el centro muestra una presentación transitoria
- **THEN** los arcos del medidor siguen visibles y reflejando el estado
  real del día

## ADDED Requirements

### Requirement: Cada elemento aportado se identifica con su icono

Por cada hábito completado hoy, el núcleo SHALL mostrar el icono de su
elemento junto a la mancha de color que ese hábito aporta, de modo que la
mezcla no sea sólo color sino que diga qué elementos la componen. Los
iconos SHALL permanecer legibles y sin encimarse entre sí con cualquier
cantidad de hábitos completados, hasta el máximo de siete. Un hábito
pendiente SHALL NOT mostrar icono alguno.

#### Scenario: El icono aparece al completar el hábito

- **WHEN** el usuario marca el día de hoy de un hábito
- **THEN** el icono del elemento de ese hábito aparece en el núcleo junto
  a su mancha de color

#### Scenario: Los iconos no se enciman con el máximo de hábitos

- **WHEN** el usuario tiene siete hábitos completados hoy
- **THEN** los siete iconos se distinguen sin superponerse entre sí

#### Scenario: El icono acompaña a su propia mancha

- **WHEN** el núcleo muestra la mezcla de varios hábitos completados
- **THEN** el icono de cada elemento aparece sobre la mancha de color de
  ese mismo hábito, no separado de ella

#### Scenario: Sin hábitos completados no hay iconos

- **WHEN** ningún hábito activo tiene marcado su día de hoy
- **THEN** el núcleo no muestra ningún icono

### Requirement: La mezcla elemental respeta el nivel de efectos activo

La mezcla elemental del núcleo SHALL seguir la escala de niveles de efecto
ya establecida (1 Calma a 5 Máximo) y SHALL quedar sujeta al techo de
`prefers-reduced-motion`. Por debajo del nivel mínimo que requiera
transición animada entre estados de la mezcla, el cambio SHALL aplicarse
igual pero sin animación de transición.

#### Scenario: Transición animada en niveles altos

- **WHEN** el usuario marca un hábito con el nivel de efectos en 2 o
  superior
- **THEN** el color de ese elemento se incorpora a la mezcla con una
  transición visible, no un salto instantáneo

#### Scenario: Cambio instantáneo en nivel Calma o con movimiento reducido

- **WHEN** el usuario marca un hábito con el nivel de efectos en 1, o con
  `prefers-reduced-motion` activo
- **THEN** el color de ese elemento aparece en la mezcla de inmediato, sin
  animación de transición

### Requirement: Órbita continua de la mezcla en los niveles altos

En los niveles de efecto 4 y 5, el conjunto de la mezcla —las manchas de
color junto con sus iconos— SHALL girar de forma continua alrededor del
centro del núcleo, conservando la separación entre partículas. Los iconos
SHALL mantener su orientación mientras orbitan, sin darse vuelta. Por
debajo del nivel 4 la mezcla SHALL permanecer inmóvil.

#### Scenario: La mezcla orbita en nivel Estándar o Máximo

- **WHEN** el nivel de efectos activo es 4 o 5 y hay al menos un hábito
  completado hoy
- **THEN** las manchas y sus iconos giran lentamente alrededor del centro,
  y cada icono se mantiene derecho durante todo el giro

#### Scenario: Sin órbita por debajo del nivel 4

- **WHEN** el nivel de efectos activo es 3 o inferior, o
  `prefers-reduced-motion` está activo
- **THEN** la mezcla del núcleo permanece inmóvil
