# radial-quick-mark Specification

## Purpose

Permite consultar y marcar un hábito activo del día mediante un único gesto
continuo (pulsar, mantener, arrastrar, soltar) sobre el núcleo central del
nautilus, como vía alternativa al toque directo sobre la celda de hoy.

## Requirements

### Requirement: Despliegue por pulsación prolongada
El sistema SHALL desplegar el selector radial cuando el puntero permanece
presionado sobre el núcleo central durante al menos 300ms y como máximo
350ms sin desplazarse más allá del umbral de cancelación por movimiento
temprano.

#### Scenario: Pulsación sostenida despliega el selector
- **WHEN** el usuario presiona sobre el núcleo central y mantiene el
  contacto sin soltarlo durante 350ms
- **THEN** el sistema despliega los hábitos activos y pendientes de hoy
  como sectores circulares uniformes alrededor del núcleo

#### Scenario: Pulsación corta no despliega el selector
- **WHEN** el usuario presiona y suelta el núcleo central antes de que
  transcurran 300ms
- **THEN** el sistema no despliega el selector radial y no interfiere con
  la navegación habitual de la pantalla

#### Scenario: Sin hábitos pendientes
- **WHEN** el usuario mantiene presionado el núcleo central y no hay
  ningún hábito activo pendiente de marcar hoy
- **THEN** el sistema no despliega el selector radial

### Requirement: Confirmación directa con un solo pendiente
Cuando al cumplirse la pulsación prolongada sólo hay un hábito activo
pendiente de marcar hoy, el sistema SHALL marcarlo de inmediato en vez de
desplegar el selector de sectores: con un único destino posible, no hay
nada que apuntar, así que el hábito pendiente actúa como el botón mismo.

#### Scenario: Un solo pendiente se marca sin selector
- **WHEN** el usuario mantiene presionado el núcleo central el tiempo
  suficiente para desplegar el gesto y sólo hay un hábito activo pendiente
  de marcar hoy
- **THEN** el sistema marca ese hábito como completado hoy sin mostrar
  sectores ni requerir arrastre ni soltar sobre un objetivo

### Requirement: Aislamiento del gesto frente al resto de la página
Mientras el gesto está en curso — desde la primera pulsación hasta que se
confirma, cancela o interrumpe — el sistema SHALL evitar que el arrastre
sobre el resto de la página dispare selección de texto nativa o menús
contextuales de selección/copia.

#### Scenario: El arrastre no selecciona texto de la página
- **WHEN** el usuario arrastra el puntero durante el gesto radial sobre
  números de día o nombres de hábito fuera del núcleo
- **THEN** el sistema no inicia una selección de texto nativa ni muestra
  un menú de selección/copia, y esa restricción se levanta apenas el
  gesto termina

### Requirement: Apuntado continuo de sector
Mientras el puntero permanece presionado tras el despliegue, el sistema
SHALL calcular en cada movimiento el sector de hábito bajo el puntero a
partir de su ángulo respecto al centro, y SHALL mostrar en el núcleo una
previsualización del hábito apuntado.

#### Scenario: El arrastre cambia el hábito previsualizado
- **WHEN** el selector está desplegado y el usuario arrastra el puntero
  sobre el sector de un hábito distinto al previsualizado actualmente
- **THEN** el sistema actualiza la previsualización en el centro para
  reflejar el nuevo hábito apuntado

#### Scenario: El arrastre fuera de cualquier sector no apunta ningún hábito
- **WHEN** el selector está desplegado y el puntero se mueve dentro de la
  zona muerta central o fuera del radio de los sectores
- **THEN** el sistema no mantiene ningún hábito previsualizado como
  apuntado

### Requirement: Confirmación al soltar sobre un sector
El sistema SHALL marcar como completado hoy el hábito del sector apuntado
cuando el puntero se suelta a una distancia del centro mayor o igual a la
zona muerta de seguridad, y SHALL producir el mismo efecto de datos que el
marcado por toque directo de la celda de hoy.

#### Scenario: Soltar sobre un sector confirma el marcado
- **WHEN** el usuario suelta el puntero mientras apunta al sector de un
  hábito pendiente, a una distancia del centro igual o mayor a la zona
  muerta
- **THEN** el sistema marca ese hábito como completado en el día de hoy y
  persiste el cambio

#### Scenario: El gesto no permite desmarcar
- **WHEN** el usuario completa el gesto de confirmación sobre un hábito
- **THEN** el sistema únicamente puede llevarlo de pendiente a completado;
  nunca revierte un hábito ya marcado como completado hoy mediante este
  gesto

### Requirement: Cancelación segura
El sistema SHALL plegar el selector radial sin registrar ningún cambio
cuando el puntero se suelta dentro de la zona muerta central, o cuando el
gesto se interrumpe antes de completarse.

#### Scenario: Soltar cerca del centro cancela sin marcar
- **WHEN** el usuario, con el selector desplegado, regresa el puntero a
  una distancia del centro menor que la zona muerta y lo suelta
- **THEN** el sistema pliega el selector radial sin marcar ningún hábito

#### Scenario: Cancelación del puntero por el sistema
- **WHEN** el gesto en curso es interrumpido por el sistema operativo o el
  navegador (por ejemplo, un `pointercancel`) antes de soltarse
- **THEN** el sistema pliega el selector radial sin marcar ningún hábito

### Requirement: Refuerzo háptico por etapa
El sistema SHALL disparar un patrón de vibración distinto en cada etapa del
gesto — apertura, cambio de sector apuntado y confirmación — en los
dispositivos que exponen vibración, y SHALL degradar silenciosamente a
únicamente el refuerzo visual cuando no la exponen.

#### Scenario: Vibración en dispositivo compatible
- **WHEN** el dispositivo expone `navigator.vibrate` y el nivel de efectos
  activo lo permite
- **THEN** el sistema vibra al desplegarse el selector, al cambiar de
  sector apuntado y al confirmarse el marcado, con patrones distintos entre
  sí

#### Scenario: Sin vibración disponible
- **WHEN** el dispositivo no expone `navigator.vibrate` (por ejemplo, iOS
  Safari)
- **THEN** el sistema completa el gesto con normalidad, mostrando sólo el
  refuerzo visual, sin generar errores

### Requirement: Alternativa accesible
El sistema SHALL ofrecer una vía alternativa al arrastre radial para marcar
un hábito desde el núcleo, activable con una pulsación simple, que no
requiera sostener un gesto de arrastre continuo.

#### Scenario: Pulsación simple abre el modal alternativo
- **WHEN** el usuario realiza una pulsación simple (toque breve, sin
  arrastre) sobre el núcleo central
- **THEN** el sistema abre un modal estándar que lista los hábitos activos
  y pendientes de hoy, seleccionables mediante toque directo

#### Scenario: La pulsación simple sobrevive a la interrupción del navegador
- **WHEN** el usuario realiza una pulsación simple sobre el núcleo y el
  navegador interrumpe el puntero con un gesto propio antes de que el
  usuario levante el dedo
- **THEN** el sistema abre igualmente el modal alternativo: una
  interrupción durante un toque breve y quieto no descarta la pulsación

### Requirement: Alcance acotado al núcleo central
El sistema SHALL limitar todo el comportamiento nuevo de este cambio al
núcleo central de la ruleta. Los anillos, las celdas de día, su marcado por
toque directo, la animación de racha, el cometa, la supernova de cierre de
día y el contador diario en reposo del núcleo SHALL permanecer con el
mismo comportamiento observable que antes de este cambio, tanto durante
como después de cualquier gesto radial.

#### Scenario: El contador diario se restituye igual tras cancelar
- **WHEN** el usuario despliega el selector radial, previsualiza un hábito
  y cancela soltando dentro de la zona muerta
- **THEN** el núcleo vuelve a mostrar exactamente el mismo contador
  `hecho/activos` de hoy que mostraba antes de iniciar el gesto, sin que
  el estado de ningún hábito haya cambiado

#### Scenario: El resto de la ruleta no reacciona al gesto
- **WHEN** el usuario realiza cualquier etapa del gesto radial (despliegue,
  apuntado, confirmación o cancelación) sobre el núcleo
- **THEN** ningún anillo, celda o control fuera del núcleo central cambia
  de apariencia o comportamiento como consecuencia directa del gesto, más
  allá de la actualización de datos que produce una confirmación
  equivalente a marcar por toque directo de celda
