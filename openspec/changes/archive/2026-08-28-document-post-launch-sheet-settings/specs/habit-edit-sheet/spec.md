## MODIFIED Requirements

### Requirement: Panel contextual por hábito

El sistema SHALL mostrar un panel contextual al tocar o hacer click sobre el label de un hábito en el SVG. En móvil el panel es un bottom sheet que sube desde la parte inferior de la pantalla; en desktop es un popover posicionado cerca del label.

Mientras el panel está abierto, en cualquier modo (creación o edición), el sistema SHALL impedir que la pantalla se desplace o rebote (scroll/bounce del viewport), incluyendo el reacomodo provocado por la aparición del teclado virtual al enfocar el campo de nombre.

#### Scenario: Bottom sheet en pantalla pequeña

- **WHEN** el usuario toca un label en un dispositivo con viewport ≤ 768px
- **THEN** aparece un bottom sheet que emerge desde el borde inferior de la pantalla, con un indicador de arrastre visible

#### Scenario: Popover en desktop

- **WHEN** el usuario hace click en un label en un viewport > 768px
- **THEN** aparece un popover posicionado cerca del label, sin cubrir el SVG innecesariamente

#### Scenario: Cerrar el panel

- **WHEN** el usuario toca fuera del panel (backdrop) o presiona Escape
- **THEN** el panel se cierra sin guardar cambios no confirmados

#### Scenario: Sin scroll ni rebote de pantalla mientras el panel está abierto

- **WHEN** el usuario abre el panel (creando o editando un hábito) y el teclado virtual aparece al enfocarse el campo de nombre
- **THEN** el contenido de la pantalla no se desplaza ni rebota más allá del propio panel; sólo el panel se reposiciona para no quedar oculto tras el teclado

#### Scenario: Scroll restaurado al cerrar el panel

- **WHEN** el panel se cierra (por confirmación, Escape o toque fuera del panel)
- **THEN** el comportamiento normal de la pantalla se restaura sin dejar la vista desplazada

### Requirement: Edición de nombre dentro del panel

El panel SHALL incluir un campo de texto editable con el nombre actual del hábito, limitado a 15 caracteres, que al confirmar actualiza el nombre y re-renderiza el SVG.

En modo edición, el panel SHALL mostrar además un botón de guardado explícito junto al campo de nombre. El botón SHALL aparecer bloqueado (visualmente atenuado, no interactivo) mientras el campo coincida con el nombre guardado, y SHALL desbloquearse en cuanto el usuario escriba un nombre distinto y no vacío. La confirmación por Enter o pérdida de foco SHALL seguir funcionando como atajo equivalente.

#### Scenario: Editar y confirmar nombre

- **WHEN** el usuario modifica el nombre en el campo y presiona Enter o pierde el foco del campo
- **THEN** el nuevo nombre se guarda en localStorage y el SVG se actualiza inmediatamente (incluyendo el reordenamiento por longitud si aplica)

#### Scenario: Cancelar edición con Escape

- **WHEN** el usuario presiona Escape mientras edita el nombre
- **THEN** el campo vuelve al nombre original sin guardar cambios

#### Scenario: Botón de guardado bloqueado sin cambios

- **WHEN** el usuario abre el panel de edición y el campo de nombre todavía coincide con el nombre guardado
- **THEN** el botón de guardado aparece bloqueado y no hace nada si se toca

#### Scenario: Botón de guardado se desbloquea y guarda

- **WHEN** el usuario escribe un nombre distinto y no vacío, y toca el botón de guardado
- **THEN** el nombre se guarda en localStorage, el SVG se actualiza, y el botón vuelve a su estado bloqueado

### Requirement: Añadir nuevo hábito desde el acceso inferior

El sistema SHALL proveer un acceso para añadir hábito en el borde inferior de la pantalla, que abre un input o sheet mínimo para ingresar el nombre del nuevo hábito. El flujo de añadir no requiere abrir la leyenda, los ajustes, el manual ni ningún otro elemento de UI fuera de ese acceso y el panel.

Al alcanzarse el límite de hábitos, el acceso SHALL mostrarse atenuado y no SHALL responder al toque, con un texto que explique el motivo.

Mientras el sheet está en modo creación, el panel SHALL mostrar un botón de confirmación explícito y visible. La confirmación por Enter en el campo de nombre SHALL seguir funcionando como atajo, pero no SHALL ser el único mecanismo disponible para crear el hábito.

Los íconos de elemento del panel SHALL aparecer bloqueados (no interactivos, con una indicación visual de estado pendiente) mientras el campo de nombre esté vacío. En cuanto el campo de nombre contenga un nombre válido (1–15 caracteres tras recortar espacios), SHALL desbloquearse únicamente los íconos de elemento disponibles; los íconos ya asignados a otro hábito SHALL permanecer bloqueados con su indicación existente de "ya asignado".

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
- **THEN** el contenido de la pantalla no se desplaza ni rebota más allá del propio sheet; sólo el panel se reposiciona para no quedar oculto tras el teclado (caso particular del comportamiento general descrito en "Panel contextual por hábito")

#### Scenario: Scroll restaurado al cerrar el sheet

- **WHEN** el sheet de creación se cierra (por confirmación, Escape o toque fuera del panel)
- **THEN** el comportamiento normal de la pantalla se restaura sin dejar la vista desplazada
