## Purpose

Integra los nombres de los hábitos directamente en el SVG radial, posicionados en el hueco del arco y ordenados automáticamente por longitud de nombre para crear un efecto visual de escalera que conecta cada nombre con su anillo.

## Requirements

### Requirement: Labels en el hueco del arco

El sistema SHALL renderizar el nombre de cada hábito dentro del SVG, en la zona del hueco (arco vacío de 60°, entre los ángulos ~210° y ~270°), uno por anillo, siguiendo la curvatura del arco de su anillo y con orientación correcta para ser leído desde el exterior del SVG (no invertido).

#### Scenario: Labels visibles al cargar la app

- **WHEN** la app carga con al menos un hábito registrado
- **THEN** cada hábito tiene su nombre visible dentro del SVG, posicionado en el hueco del arco a la altura de su anillo correspondiente

#### Scenario: Label con color del hábito

- **WHEN** se renderizan los labels en el SVG
- **THEN** cada label usa el mismo color que el arco de su hábito

#### Scenario: Label alineado al anillo

- **WHEN** se renderizan los labels
- **THEN** cada label está centrado en el rango de radios de su anillo correspondiente

#### Scenario: Label curvo sigue el arco del anillo

- **WHEN** se renderizan los labels en el SVG
- **THEN** el texto de cada label sigue la curvatura del arco del hueco de su anillo, no aparece en línea recta

#### Scenario: Label legible desde el exterior

- **WHEN** se renderizan los labels en el SVG
- **THEN** el texto de cada label se puede leer en orientación normal (no invertida ni boca abajo) desde la perspectiva de un usuario mirando la pantalla

### Requirement: Orden automático por longitud de nombre

El sistema SHALL ordenar los hábitos en el SVG de menor a mayor longitud de nombre: el hábito con el nombre más corto ocupa el anillo más interno y el más largo el más externo. El color y el id del hábito no cambian al reordenar.

#### Scenario: Un solo hábito siempre en anillo interno

- **WHEN** hay un único hábito
- **THEN** ocupa el anillo más interno independientemente de la longitud de su nombre

#### Scenario: Reordenamiento al añadir hábito

- **WHEN** el usuario añade un nuevo hábito cuyo nombre es más corto que el de un hábito existente
- **THEN** el SVG se re-renderiza con el nuevo hábito en una posición más interna y el existente en una posición más externa

#### Scenario: Orden estable con nombres de igual longitud

- **WHEN** dos hábitos tienen nombres de la misma longitud
- **THEN** el orden relativo entre ellos es estable (determinista: por ejemplo, por fecha de creación)

### Requirement: Límite de 15 caracteres en el nombre

El sistema SHALL limitar a 15 caracteres la longitud de los nombres de los hábitos, tanto al añadir como al editar.

#### Scenario: Input bloqueado al llegar al límite

- **WHEN** el usuario escribe o pega texto que excede 15 caracteres en el campo de nombre
- **THEN** el campo no acepta caracteres adicionales y muestra el texto truncado a 15 caracteres

#### Scenario: Intento de guardar nombre vacío

- **WHEN** el usuario intenta guardar un nombre con cero caracteres
- **THEN** el cambio se descarta y el nombre original permanece sin modificar

### Requirement: Labels táctiles y clickeables

El sistema SHALL hacer cada label del SVG interactivo: tocar o hacer click sobre él abre el panel de edición del hábito correspondiente (`habit-edit-sheet`).

#### Scenario: Tap en label abre el panel de edición

- **WHEN** el usuario toca o hace click sobre el nombre de un hábito en la escalera del SVG
- **THEN** se abre el panel de edición (`habit-edit-sheet`) para ese hábito concreto

#### Scenario: Área táctil suficiente en móvil

- **WHEN** el usuario intenta tocar un label en pantalla táctil
- **THEN** el área interactiva tiene al menos 44×44 puntos CSS de superficie táctil
