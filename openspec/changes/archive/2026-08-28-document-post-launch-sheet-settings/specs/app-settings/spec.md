## ADDED Requirements

### Requirement: Borrar caché desde la hoja de ajustes

La hoja de ajustes SHALL incluir una acción para borrar la caché de la aplicación: limpia el Cache Storage y desregistra el service worker, y a continuación recarga la página para forzar la descarga de los archivos más recientes. Esta acción no SHALL afectar los datos del usuario guardados en `localStorage`.

La acción SHALL pedir confirmación antes de ejecutarse, dado que fuerza una recarga completa de la aplicación.

#### Scenario: Confirmar borrado de caché

- **WHEN** el usuario activa "Borrar caché" desde la hoja de ajustes y confirma la operación
- **THEN** se limpian las cachés de assets, se desregistra el service worker, y la página se recarga

#### Scenario: Cancelar borrado de caché

- **WHEN** el usuario activa "Borrar caché" pero cancela la confirmación
- **THEN** no se borra ninguna caché ni se recarga la página

#### Scenario: Los hábitos sobreviven al borrado de caché

- **WHEN** el usuario borra la caché y la aplicación se recarga
- **THEN** los hábitos guardados en `localStorage` siguen presentes, sin ninguna pérdida de datos
