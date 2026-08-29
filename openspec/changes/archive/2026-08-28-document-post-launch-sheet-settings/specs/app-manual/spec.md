## ADDED Requirements

### Requirement: Versión de la app visible en el manual

El manual SHALL mostrar el número de versión de la aplicación (tomado de `package.json`) al final de su contenido, antes del botón de cierre, de modo que el usuario pueda reportar en qué versión está viendo un problema.

#### Scenario: Consultar la versión

- **WHEN** el usuario abre el manual y llega al final de su contenido
- **THEN** ve el número de versión actual de la aplicación

#### Scenario: La versión coincide con el build publicado

- **WHEN** se publica una nueva versión de la aplicación
- **THEN** el número mostrado en el manual coincide con la versión declarada en `package.json` para ese build
