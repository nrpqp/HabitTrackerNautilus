## Purpose

Panel contextual que agrupa todas las acciones de gestión de un hábito (editar nombre, cambiar color, ver progreso, reiniciar y eliminar) en una superficie cohesiva que se activa desde el label de la escalera SVG, reemplazando la leyenda inferior.

## Requirements

### Requirement: Panel contextual por hábito

El sistema SHALL mostrar un panel contextual al tocar o hacer click sobre el label de un hábito en el SVG. En móvil el panel es un bottom sheet que sube desde la parte inferior de la pantalla; en desktop es un popover posicionado cerca del label.

#### Scenario: Bottom sheet en pantalla pequeña

- **WHEN** el usuario toca un label en un dispositivo con viewport ≤ 768px
- **THEN** aparece un bottom sheet que emerge desde el borde inferior de la pantalla, con un indicador de arrastre visible

#### Scenario: Popover en desktop

- **WHEN** el usuario hace click en un label en un viewport > 768px
- **THEN** aparece un popover posicionado cerca del label, sin cubrir el SVG innecesariamente

#### Scenario: Cerrar el panel

- **WHEN** el usuario toca fuera del panel (backdrop) o presiona Escape
- **THEN** el panel se cierra sin guardar cambios no confirmados

### Requirement: Edición de nombre dentro del panel

El panel SHALL incluir un campo de texto editable con el nombre actual del hábito, limitado a 15 caracteres, que al confirmar actualiza el nombre y re-renderiza el SVG.

#### Scenario: Editar y confirmar nombre

- **WHEN** el usuario modifica el nombre en el campo y presiona Enter o pierde el foco del campo
- **THEN** el nuevo nombre se guarda en localStorage y el SVG se actualiza inmediatamente (incluyendo el reordenamiento por longitud si aplica)

#### Scenario: Cancelar edición con Escape

- **WHEN** el usuario presiona Escape mientras edita el nombre
- **THEN** el campo vuelve al nombre original sin guardar cambios

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

### Requirement: Información de progreso

El panel SHALL mostrar la fecha de inicio, fecha de fin y el día actual del reto (ej. "Día 5 de 21") para el hábito en cuestión.

#### Scenario: Progreso visible al abrir el panel

- **WHEN** el panel se abre para un hábito activo
- **THEN** se muestran la fecha de inicio, la fecha de fin calculada (inicio + 20 días) y el número de día actual dentro del reto

#### Scenario: Hábito completado

- **WHEN** el panel se abre para un hábito cuyo día actual supera el día 21
- **THEN** se muestra un indicador de "Completado" en lugar del contador de día

### Requirement: Acción de reiniciar hábito

El panel SHALL incluir una acción para reiniciar el hábito: borra todo el progreso y establece la fecha de inicio como el día actual, previa confirmación del usuario.

#### Scenario: Confirmar reinicio

- **WHEN** el usuario activa la acción de reiniciar y confirma la operación
- **THEN** el progreso del hábito se resetea a cero días completados y la fecha de inicio cambia a hoy; el SVG y el panel se actualizan

#### Scenario: Cancelar reinicio

- **WHEN** el usuario activa la acción de reiniciar pero cancela la confirmación
- **THEN** el hábito no se modifica

### Requirement: Acción de eliminar hábito

El panel SHALL incluir una acción para eliminar el hábito, previa confirmación. Al eliminar, el panel se cierra, el hábito desaparece del SVG y del localStorage, y los demás hábitos se re-renderizan.

#### Scenario: Confirmar eliminación

- **WHEN** el usuario activa la acción de eliminar y confirma
- **THEN** el hábito se elimina de localStorage, el panel se cierra y el SVG se re-renderiza sin ese hábito

#### Scenario: Cancelar eliminación

- **WHEN** el usuario activa la acción de eliminar pero cancela la confirmación
- **THEN** el hábito permanece sin cambios y el panel sigue abierto

### Requirement: Añadir nuevo hábito desde el header

El sistema SHALL proveer un botón `+` en el header que abre un input o sheet mínimo para ingresar el nombre del nuevo hábito. El flujo de añadir no requiere abrir la leyenda ni ningún elemento de UI fuera del header y el panel.

#### Scenario: Añadir hábito nuevo

- **WHEN** el usuario toca el botón `+` en el header e introduce un nombre válido (1–15 caracteres)
- **THEN** el nuevo hábito se añade a localStorage y aparece en el SVG en la posición correspondiente según la longitud de su nombre

#### Scenario: Límite de 7 hábitos alcanzado

- **WHEN** ya existen 7 hábitos y el usuario intenta añadir uno más
- **THEN** el botón `+` está deshabilitado o no responde, y se muestra un mensaje que indica que se alcanzó el límite
