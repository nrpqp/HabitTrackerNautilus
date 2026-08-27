## MODIFIED Requirements

### Requirement: Swatches de color

El panel SHALL mostrar una fila de íconos de elemento para que el usuario cambie el elemento del hábito. El elemento seleccionado determina la paleta de colores del anillo; ya no existe una selección de color hexadecimal independiente. El elemento activo SHALL aparecer visualmente destacado (borde o fondo diferenciado). Al seleccionar un nuevo elemento se actualiza de inmediato el SVG con la nueva paleta interpolada sin cerrar el panel.

#### Scenario: Seleccionar elemento

- **WHEN** el usuario toca o hace click en un ícono de elemento en el panel
- **THEN** el elemento del hábito se actualiza en localStorage, el SVG se re-renderiza con la paleta del nuevo elemento y el ícono seleccionado aparece marcado como activo

#### Scenario: Elemento activo destacado

- **WHEN** el panel está abierto
- **THEN** el ícono correspondiente al elemento actual del hábito aparece visualmente distinguido de los demás (borde activo o fondo resaltado)

#### Scenario: Sin swatch de color hex

- **WHEN** el usuario abre el panel de edición de cualquier hábito
- **THEN** no aparece ninguna fila de swatches de color hexadecimal; el color del anillo se deriva exclusivamente del elemento activo
