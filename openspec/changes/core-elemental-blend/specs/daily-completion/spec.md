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
