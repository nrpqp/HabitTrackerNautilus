# app-manual Specification

## Purpose

Explica dentro de la propia aplicación cómo se lee el nautilus, por qué ciertos días no se dejan marcar, qué límites tiene el reto y dónde viven los datos, de modo que el usuario resuelva sus dudas sin salir de la app y sin descubrir por accidente reglas que hoy no están escritas en ninguna parte.

## Requirements

### Requirement: Manual abierto desde la cabecera

El sistema SHALL ofrecer en la cabecera un botón de información, situado en el extremo opuesto al de ajustes, que abre un manual dentro de la aplicación. El manual SHALL cerrarse al tocar fuera de él, al pulsar su botón de cierre o con la tecla `Escape`, y al cerrarse SHALL devolver el foco al botón que lo abrió.

El sistema no SHALL emplear diálogos nativos del navegador para presentar esta información.

#### Scenario: Abrir y cerrar el manual

- **WHEN** el usuario pulsa el botón de información
- **THEN** aparece el manual con sus secciones, y se cierra al tocar fuera, al pulsar su botón de cierre o con `Escape`

#### Scenario: Sin diálogos nativos

- **WHEN** el usuario pulsa el botón de información
- **THEN** no se muestra ningún `alert()` del navegador

#### Scenario: El foco vuelve al origen

- **WHEN** el usuario cierra el manual por cualquiera de las tres vías
- **THEN** el foco del teclado regresa al botón de información de la cabecera

### Requirement: Organización en secciones plegables

El manual SHALL organizar su contenido en secciones plegables, de modo que el usuario vea de un vistazo todos los temas disponibles antes de desplegar uno. Como máximo una sección SHALL estar desplegada al abrirse el manual.

Cada sección SHALL ser operable con teclado y SHALL comunicar su estado —desplegada o plegada— a las tecnologías de asistencia.

#### Scenario: Vista general al abrir

- **WHEN** el usuario abre el manual
- **THEN** ve la lista completa de secciones sin necesidad de desplazarse por el contenido de todas ellas

#### Scenario: Desplegar una sección

- **WHEN** el usuario toca el encabezado de una sección plegada
- **THEN** su contenido se despliega y el encabezado refleja el estado nuevo

#### Scenario: Operable con teclado

- **WHEN** el usuario recorre el manual con el tabulador y activa un encabezado
- **THEN** la sección se despliega o se pliega sin necesidad de usar el puntero

### Requirement: Explicación de la lectura del nautilus

El manual SHALL explicar la correspondencia entre lo que se ve y lo que significa: cada anillo es un hábito, cada sector es un día del reto, el segmento se enciende al cumplir ese hábito ese día, y el núcleo central resume los hábitos cumplidos del día visible. SHALL explicar también cómo se marca un día.

#### Scenario: El usuario consulta qué es cada elemento

- **WHEN** el usuario despliega la sección sobre el nautilus
- **THEN** encuentra descrito el significado de los anillos, los sectores, los segmentos encendidos y el núcleo central

#### Scenario: El usuario consulta cómo marcar

- **WHEN** el usuario despliega la sección sobre cómo se marca un día
- **THEN** encuentra descrita la interacción que registra un día como cumplido

### Requirement: Preguntas frecuentes sobre reglas y límites

El manual SHALL incluir una sección de preguntas frecuentes que responda, como mínimo, a las reglas del sistema que el usuario descubre hoy sólo al chocar con ellas:

- Por qué no puede marcarse un día anterior a ayer, y por qué tampoco un día futuro.
- Cuántos hábitos simultáneos admite el reto y qué longitud máxima tiene un nombre.
- Qué ocurre al reiniciar un hábito y qué ocurre al eliminarlo.
- Por qué un recordatorio diario puede no llegar, incluyendo la limitación de la entrega en segundo plano en iOS.

Las respuestas SHALL describir el comportamiento real del sistema; una respuesta que contradiga lo que la aplicación hace SHALL considerarse un fallo de esta capacidad.

#### Scenario: Duda sobre un día bloqueado

- **WHEN** el usuario intenta marcar un día anterior a ayer, no lo consigue y consulta el manual
- **THEN** encuentra explicada la ventana de edición de hoy y ayer, y el motivo de que los días anteriores queden congelados

#### Scenario: Duda sobre el límite de hábitos

- **WHEN** el usuario consulta cuántos hábitos puede llevar a la vez
- **THEN** encuentra el número máximo de hábitos simultáneos y el límite de caracteres del nombre

#### Scenario: Duda sobre un recordatorio que no llegó

- **WHEN** el usuario consulta por qué no recibió un recordatorio
- **THEN** encuentra explicadas las condiciones de entrega, incluida la limitación en iOS, sin prometer una fiabilidad que el sistema no tiene

### Requirement: Transparencia sobre dónde viven los datos

El manual SHALL declarar que los datos del reto se guardan únicamente en el navegador del dispositivo, que no existe cuenta de usuario ni copia remota, y que borrar los datos del navegador o desinstalar la aplicación los elimina de forma irrecuperable.

Esta declaración SHALL ser localizable sin depender de que el usuario sepa qué buscar.

#### Scenario: El usuario pregunta dónde están sus datos

- **WHEN** el usuario despliega la sección sobre dónde se guardan los datos
- **THEN** lee que residen sólo en ese navegador, que no hay copia remota ni cuenta, y que se pierden al borrar los datos del navegador

#### Scenario: La advertencia no depende del vocabulario técnico

- **WHEN** el usuario recorre los títulos de las secciones del manual
- **THEN** identifica la sección sobre sus datos sin necesidad de conocer el término técnico del almacenamiento

### Requirement: Instalación como sección del manual

El manual SHALL contener las instrucciones de instalación de la aplicación para iOS y para Android como una sección más, con el mismo contenido paso a paso que hasta ahora presentaba una hoja dedicada.

#### Scenario: Instrucciones de iOS y Android

- **WHEN** el usuario despliega la sección de instalación
- **THEN** encuentra los pasos para instalar la aplicación tanto en iOS mediante Safari como en Android mediante Chrome

#### Scenario: La instalación ya no es una hoja aparte

- **WHEN** el usuario pulsa el botón de información
- **THEN** se abre el manual completo, no una hoja dedicada exclusivamente a la instalación

### Requirement: Versión de la app visible en el manual

El manual SHALL mostrar el número de versión de la aplicación (tomado de `package.json`) al final de su contenido, antes del botón de cierre, de modo que el usuario pueda reportar en qué versión está viendo un problema.

#### Scenario: Consultar la versión

- **WHEN** el usuario abre el manual y llega al final de su contenido
- **THEN** ve el número de versión actual de la aplicación

#### Scenario: La versión coincide con el build publicado

- **WHEN** se publica una nueva versión de la aplicación
- **THEN** el número mostrado en el manual coincide con la versión declarada en `package.json` para ese build
