## MODIFIED Requirements

### Requirement: Añadir nuevo hábito desde el acceso inferior

El sistema SHALL proveer un acceso para añadir hábito en el borde inferior de la pantalla, que abre un input o sheet mínimo para ingresar el nombre del nuevo hábito. El flujo de añadir no requiere abrir la leyenda, los ajustes, el manual ni ningún otro elemento de UI fuera de ese acceso y el panel.

Al alcanzarse el límite de hábitos, el acceso SHALL mostrarse atenuado y no SHALL responder al toque, con un texto que explique el motivo.

Mientras el sheet está en modo creación, el panel SHALL mostrar un botón de confirmación explícito y visible. La confirmación por Enter en el campo de nombre SHALL seguir funcionando como atajo, pero no SHALL ser el único mecanismo disponible para crear el hábito.

Los íconos de elemento del panel SHALL aparecer bloqueados (no interactivos, con una indicación visual de estado pendiente) mientras el campo de nombre esté vacío. En cuanto el campo de nombre contenga un nombre válido (1–15 caracteres tras recortar espacios), SHALL desbloquearse únicamente los íconos de elemento disponibles; los íconos ya asignados a otro hábito SHALL permanecer bloqueados con su indicación existente de "ya asignado".

Mientras el sheet de añadir hábito está abierto, el sistema SHALL impedir que la pantalla se desplace o rebote (scroll/bounce del viewport), incluyendo el reacomodo provocado por la aparición del teclado virtual al enfocar el campo de nombre.

#### Scenario: Añadir hábito nuevo

- **WHEN** el usuario toca el acceso de añadir hábito e introduce un nombre válido (1–15 caracteres)
- **THEN** el nuevo hábito se añade a localStorage y aparece en el SVG en la posición correspondiente según la longitud de su nombre

#### Scenario: Límite de 7 hábitos alcanzado

- **WHEN** ya existen 7 hábitos y el usuario intenta añadir uno más
- **THEN** el acceso de añadir está deshabilitado o no responde, y se muestra un mensaje que indica que se alcanzó el límite

#### Scenario: El acceso ya no está en la cabecera

- **WHEN** el usuario busca cómo añadir un hábito
- **THEN** lo encuentra en el borde inferior de la pantalla, y la cabecera no contiene ningún control de añadir

#### Scenario: Confirmar con el botón explícito

- **WHEN** el usuario escribe un nombre válido en el sheet de creación y toca el botón de confirmación
- **THEN** el nuevo hábito se añade a localStorage, el sheet se cierra y el SVG se actualiza, igual que si hubiera confirmado con Enter

#### Scenario: Enter sigue funcionando como atajo

- **WHEN** el usuario escribe un nombre válido en el sheet de creación y presiona Enter en el teclado
- **THEN** el hábito se crea igual que al tocar el botón de confirmación

#### Scenario: Botón de confirmación deshabilitado sin nombre

- **WHEN** el sheet de creación está abierto y el campo de nombre está vacío o sólo contiene espacios
- **THEN** el botón de confirmación aparece deshabilitado y no crea ningún hábito si se toca

#### Scenario: Íconos de elemento bloqueados antes de escribir el nombre

- **WHEN** el usuario abre el sheet para crear un hábito y el campo de nombre está vacío
- **THEN** todos los íconos de elemento aparecen bloqueados (no responden al toque) con una indicación visual de que están pendientes de un nombre

#### Scenario: Desbloqueo de elementos disponibles al escribir el nombre

- **WHEN** el usuario escribe un nombre válido en el campo del sheet de creación
- **THEN** los íconos de elemento no asignados a otro hábito se desbloquean y quedan seleccionables; los íconos ya asignados a otro hábito permanecen bloqueados con la indicación "ya asignado a otro hábito"

#### Scenario: Re-bloqueo al vaciar el nombre

- **WHEN** el usuario borra el nombre hasta dejar el campo vacío en el sheet de creación
- **THEN** los íconos de elemento vuelven a bloquearse, incluso los que estaban disponibles un instante antes

#### Scenario: Sin scroll ni rebote de pantalla al abrir el sheet de creación

- **WHEN** el usuario toca el acceso de añadir hábito y el teclado virtual aparece al enfocarse el campo de nombre
- **THEN** el contenido de la pantalla no se desplaza ni rebota más allá del propio sheet; sólo el panel se reposiciona para no quedar oculto tras el teclado

#### Scenario: Scroll restaurado al cerrar el sheet

- **WHEN** el sheet de creación se cierra (por confirmación, Escape o toque fuera del panel)
- **THEN** el comportamiento normal de la pantalla se restaura sin dejar la vista desplazada
