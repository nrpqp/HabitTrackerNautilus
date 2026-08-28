## ADDED Requirements

### Requirement: Añadir nuevo hábito desde el acceso inferior

El sistema SHALL proveer un acceso para añadir hábito en el borde inferior de la pantalla, que abre un input o sheet mínimo para ingresar el nombre del nuevo hábito. El flujo de añadir no requiere abrir la leyenda, los ajustes, el manual ni ningún otro elemento de UI fuera de ese acceso y el panel.

Al alcanzarse el límite de hábitos, el acceso SHALL mostrarse atenuado y no SHALL responder al toque, con un texto que explique el motivo.

#### Scenario: Añadir hábito nuevo

- **WHEN** el usuario toca el acceso de añadir hábito e introduce un nombre válido (1–15 caracteres)
- **THEN** el nuevo hábito se añade a localStorage y aparece en el SVG en la posición correspondiente según la longitud de su nombre

#### Scenario: Límite de 7 hábitos alcanzado

- **WHEN** ya existen 7 hábitos y el usuario intenta añadir uno más
- **THEN** el acceso de añadir está deshabilitado o no responde, y se muestra un mensaje que indica que se alcanzó el límite

#### Scenario: El acceso ya no está en la cabecera

- **WHEN** el usuario busca cómo añadir un hábito
- **THEN** lo encuentra en el borde inferior de la pantalla, y la cabecera no contiene ningún control de añadir

## REMOVED Requirements

### Requirement: Añadir nuevo hábito desde el header

**Reason**: La cabecera se reduce a dos botones —información y ajustes— y el punto de entrada para añadir hábito se traslada a una píldora discreta en el borde inferior, siguiendo el prototipo visual de referencia.

**Migration**: Sustituido por «Añadir nuevo hábito desde el acceso inferior», que conserva íntegro el flujo: el mismo input o sheet mínimo, el mismo rango de 1 a 15 caracteres, la misma escritura en localStorage y el mismo comportamiento deshabilitado al alcanzar los 7 hábitos. Sólo cambia dónde vive el punto de entrada.
