## MODIFIED Requirements

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
