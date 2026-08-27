## Purpose

Convierte el círculo central vacío del nautilus en el medidor del día en curso y define la celebración que se dispara al cerrar todos los hábitos de un mismo día, que es el único momento diario en el que el usuario completa todo lo que se había propuesto.

## ADDED Requirements

### Requirement: Medidor del día en el núcleo central

El núcleo central del nautilus SHALL mostrar cuántos hábitos del día en curso están completados sobre el total de hábitos activos. El medidor SHALL incluir un segmento por hábito, distinguible por el color del elemento de ese hábito, que se rellena cuando el día de hoy de ese hábito queda marcado y se vacía cuando se desmarca. El medidor SHALL reflejar el estado correcto al cargar la aplicación, sin disparar ninguna celebración.

#### Scenario: Estado inicial al abrir la aplicación

- **WHEN** el usuario abre la aplicación con dos de tres hábitos ya marcados hoy
- **THEN** el núcleo muestra dos de tres y los dos segmentos correspondientes aparecen llenos, sin celebración alguna

#### Scenario: Marcar el día de hoy de un hábito

- **WHEN** el usuario marca el día de hoy de un hábito que no estaba marcado
- **THEN** el segmento de ese hábito se rellena y la cuenta del núcleo aumenta en uno

#### Scenario: Desmarcar el día de hoy de un hábito

- **WHEN** el usuario desmarca el día de hoy de un hábito que estaba marcado
- **THEN** el segmento de ese hábito se vacía y la cuenta del núcleo disminuye en uno

#### Scenario: Marcar un día que no es hoy

- **WHEN** el usuario marca el día de ayer de un hábito
- **THEN** el medidor del día no cambia; sólo el día de hoy alimenta el medidor

### Requirement: El estado del día es el reposo del centro

El centro del nautilus SHALL mostrar el estado del día en curso siempre que no haya una presentación transitoria en marcha. Cualquier información temporal que ocupe el centro SHALL devolverlo al estado del día al terminar, sin intervención del usuario. Ninguna presentación transitoria SHALL dejar el centro en un estado distinto de forma permanente.

#### Scenario: Retorno tras una presentación transitoria

- **WHEN** el centro ha mostrado temporalmente otra información y esa presentación termina
- **THEN** el centro vuelve a mostrar la cuenta de hábitos cerrados hoy sobre el total

#### Scenario: El medidor de arcos no se oculta

- **WHEN** el centro muestra una presentación transitoria
- **THEN** los arcos del medidor siguen visibles y reflejando el estado real del día

### Requirement: Carga visible hacia el núcleo al cerrar un hábito

Al marcar el día de hoy de un hábito, el sistema SHALL representar visualmente que esa acción alimenta el núcleo, mediante un desplazamiento de energía desde la celda marcada hasta el centro. La intensidad del estado de reposo del núcleo SHALL crecer con la proporción de hábitos ya cerrados hoy. Este efecto requiere nivel de dispositivo 2 o superior; por debajo, el medidor se actualiza sin la animación de trayecto.

#### Scenario: Trayecto de la celda al núcleo

- **WHEN** el usuario marca el día de hoy de un hábito y el nivel activo es 2 o superior
- **THEN** una traza de energía viaja desde la celda marcada hasta el núcleo y el núcleo acusa la llegada

#### Scenario: Nivel bajo sin animación de trayecto

- **WHEN** el usuario marca el día de hoy de un hábito y el nivel activo es 1
- **THEN** el segmento del medidor se rellena igualmente, sin traza de energía

### Requirement: Celebración al cerrar el día completo

El sistema SHALL disparar una celebración de pantalla completa cuando el usuario marque el día de hoy del último hábito que le quedaba pendiente, de modo que todos los hábitos activos queden completados en el día en curso. La celebración SHALL incluir un mensaje explícito de día completo y SHALL desaparecer sola sin requerir intervención del usuario. La celebración SHALL dispararse como máximo una vez por transición a día completo.

#### Scenario: Último hábito del día

- **WHEN** el usuario marca el día de hoy del último hábito pendiente y con ello todos los hábitos activos quedan completados hoy
- **THEN** se dispara la celebración de día completo y aparece el mensaje correspondiente

#### Scenario: No hay celebración con hábitos pendientes

- **WHEN** el usuario marca el día de hoy de un hábito y todavía queda al menos un hábito sin marcar hoy
- **THEN** no se dispara la celebración de día completo

#### Scenario: Desmarcar y volver a marcar

- **WHEN** el día ya estaba completo, el usuario desmarca un hábito y vuelve a marcarlo
- **THEN** la celebración se dispara de nuevo, porque se ha producido una nueva transición a día completo

#### Scenario: Un solo hábito activo

- **WHEN** el usuario tiene un único hábito activo y marca su día de hoy
- **THEN** se dispara la celebración de día completo, porque todos los hábitos activos quedan completados

#### Scenario: La celebración respeta el nivel del dispositivo

- **WHEN** se cierra el día completo y el nivel activo es 0
- **THEN** el mensaje de día completo se muestra igualmente y el medidor queda lleno, sin animación ni partículas

#### Scenario: Recarga con el día ya completo

- **WHEN** el usuario recarga la aplicación con todos los hábitos ya marcados hoy
- **THEN** el medidor aparece lleno y no se dispara ninguna celebración
