# app-settings Specification

## Purpose

Reúne en una sola superficie los ajustes de presentación de la aplicación —tema, nivel de efecto visual y, más adelante, tipografía— para que la cabecera quede libre de controles y el usuario encuentre en un único sitio todo lo que puede cambiar sobre cómo se ve la app.

## Requirements

### Requirement: Hoja de ajustes abierta desde la cabecera

El sistema SHALL ofrecer en la cabecera un botón de ajustes que abre una hoja inferior con los ajustes de presentación de la aplicación. La hoja SHALL cerrarse al tocar fuera de ella, al pulsar su botón de cierre o con la tecla `Escape`, y al cerrarse SHALL devolver el foco al botón que la abrió.

El botón de ajustes SHALL tener un área táctil de al menos 44 × 44 px y SHALL exponer su estado de apertura a las tecnologías de asistencia.

#### Scenario: Abrir y cerrar la hoja

- **WHEN** el usuario pulsa el botón de ajustes
- **THEN** la hoja sube desde el borde inferior mostrando los ajustes disponibles, y se cierra al tocar fuera, al pulsar su botón de cierre o con `Escape`

#### Scenario: El foco vuelve al origen

- **WHEN** el usuario cierra la hoja de ajustes por cualquiera de las tres vías
- **THEN** el foco del teclado regresa al botón de ajustes de la cabecera

#### Scenario: Navegación por teclado dentro de la hoja

- **WHEN** el usuario recorre la hoja abierta con el tabulador
- **THEN** puede alcanzar y operar todos sus controles habilitados, y cada uno recibe un foco visible

### Requirement: Ajuste de tema dentro de la hoja

La hoja de ajustes SHALL contener el control de tema claro/oscuro, que SHALL ser el único punto de la interfaz desde el que se cambia el tema. El cambio SHALL aplicarse de inmediato, con la hoja todavía abierta, y SHALL persistir entre sesiones igual que hasta ahora.

#### Scenario: Cambio inmediato de tema

- **WHEN** el usuario cambia el tema desde la hoja de ajustes
- **THEN** toda la interfaz adopta el tema nuevo al instante, sin cerrar la hoja ni recargar

#### Scenario: El tema sobrevive a la recarga

- **WHEN** el usuario cambia el tema, cierra la aplicación y la vuelve a abrir
- **THEN** la aplicación arranca con el tema elegido

#### Scenario: El control refleja el tema activo

- **WHEN** el usuario abre la hoja de ajustes
- **THEN** el control de tema indica cuál de los dos temas está activo en ese momento

### Requirement: El velo de la hoja no oculta el nautilus

Mientras la hoja de ajustes está abierta, el velo que la acompaña SHALL dejar el nautilus visible y sin oscurecer, y SHALL concentrar su opacidad en la franja contigua al panel. Los efectos que se disparen desde la hoja SHALL dibujarse por encima de ese velo.

La hoja de ajustes SHALL anclarse al borde inferior en todas las anchuras de pantalla, sin adoptar la disposición centrada que usan las demás superficies en escritorio, de modo que siempre quede área de nautilus libre por encima del panel.

Los efectos disparados desde la hoja SHALL originarse en el área de nautilus que queda visible sobre el panel, no en el centro geométrico de la rueda. La muestra no SHALL dibujarse sobre el propio panel.

Esta condición es necesaria para que la muestra de intensidad definida en `effects-preference` sea perceptible y comparable entre dos niveles distintos.

#### Scenario: El nautilus permanece legible

- **WHEN** la hoja de ajustes está abierta
- **THEN** el nautilus y su núcleo siguen viéndose sin oscurecimiento apreciable, y el texto del panel mantiene su contraste sobre el velo

#### Scenario: La muestra de efectos se ve

- **WHEN** el usuario elige un nivel de efecto visual con la hoja abierta
- **THEN** la muestra correspondiente se dibuja sobre el nautilus y es visible sin cerrar la hoja

#### Scenario: Comparación entre dos niveles con la hoja abierta

- **WHEN** el usuario elige un nivel y a continuación otro superior, sin cerrar la hoja
- **THEN** la diferencia entre ambas muestras es perceptible

#### Scenario: Anclaje inferior en escritorio

- **WHEN** el usuario abre la hoja de ajustes en una ventana ancha, donde el manual se mostraría centrado como diálogo
- **THEN** la hoja de ajustes sube igualmente desde el borde inferior y deja el nautilus visible por encima

#### Scenario: La muestra no cae sobre el panel

- **WHEN** el usuario elige un nivel con la hoja abierta, en cualquier tamaño de pantalla
- **THEN** la muestra se dibuja en el área de nautilus libre sobre el panel, y no sobre el texto del panel

### Requirement: Hueco reservado para la fuente de texto

La hoja de ajustes SHALL mostrar una fila de fuente de texto en estado deshabilitado, identificada como disponible próximamente. La fila no SHALL ser accionable ni SHALL alterar ninguna tipografía de la aplicación.

La fila SHALL comunicar su estado deshabilitado a las tecnologías de asistencia, de modo que no se anuncie como un control operable.

#### Scenario: La fila no responde

- **WHEN** el usuario toca la fila de fuente de texto
- **THEN** no ocurre nada: no se abre ningún selector y ninguna tipografía cambia

#### Scenario: El estado es evidente

- **WHEN** el usuario abre la hoja de ajustes
- **THEN** la fila de fuente se distingue visualmente de las filas operables y su etiqueta indica que llegará más adelante

#### Scenario: Deshabilitada para el teclado y el lector

- **WHEN** el usuario recorre la hoja con el tabulador o con un lector de pantalla
- **THEN** la fila de fuente se anuncia como deshabilitada y no recibe foco como control activo

### Requirement: La hoja convive con el resto de superficies

La hoja de ajustes SHALL adoptar el mismo lenguaje de superficie que el resto de paneles de la aplicación: fondo translúcido oscurecido, borde superior de acento, esquinas redondeadas y difuminado del fondo, con respaldo opaco donde el navegador no soporte el difuminado.

No SHALL haber nunca dos hojas abiertas a la vez.

#### Scenario: Navegador sin soporte de difuminado

- **WHEN** la aplicación se abre en un navegador que no soporta `backdrop-filter`
- **THEN** la hoja de ajustes se muestra con fondo opaco y todo su texto sigue siendo legible

#### Scenario: Exclusión mutua entre hojas

- **WHEN** el usuario abre la hoja de ajustes con el manual o el panel de hábito abiertos
- **THEN** la superficie que estuviera abierta se cierra y sólo queda visible la hoja de ajustes

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
