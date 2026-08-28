## MODIFIED Requirements

### Requirement: Cabecera con botones circulares

Los dos controles de la cabecera —información y ajustes— SHALL presentarse como botones circulares con borde de acento y halo luminoso, situados en extremos opuestos: información a la izquierda y ajustes a la derecha. El área táctil de cada botón SHALL medir al menos 44 × 44 px.

El acento SHALL distinguir su naturaleza: el botón que abre contenido de lectura y el que abre ajustes no SHALL compartir color de acento.

El título SHALL usar la tipografía de interfaz en versalitas con espaciado amplio y un halo de acento, y SHALL disponer del ancho que dejan libre los dos botones sin solaparse con ellos.

#### Scenario: Cabecera despejada

- **WHEN** el usuario abre la aplicación en una pantalla estrecha
- **THEN** la cabecera muestra exactamente dos botones, uno en cada extremo, y el título se lee completo entre ambos

#### Scenario: Navegación por teclado

- **WHEN** el usuario recorre la cabecera con el tabulador
- **THEN** cada botón recibe un foco visible con suficiente contraste sobre el fondo escénico

#### Scenario: Límite de hábitos alcanzado

- **WHEN** ya existen 7 hábitos
- **THEN** la cabecera no cambia: no contiene ningún control de añadir, y el estado atenuado lo muestra el acceso del borde inferior

#### Scenario: Acentos diferenciados

- **WHEN** el usuario observa la cabecera
- **THEN** el botón de información y el de ajustes se distinguen entre sí por su color de acento

### Requirement: Fondo escénico decorativo

El sistema SHALL mostrar detrás de todo el contenido una capa decorativa compuesta por círculos concéntricos tenues y espirales logarítmicas doradas, sobre degradados radiales de acento. La capa SHALL ser puramente decorativa: sin texto, sin interacción y sin animación continua.

En el nivel de efectos 1 (Calma) y con `prefers-reduced-motion`, la capa SHALL seguir siendo estática y no SHALL introducir ningún movimiento.

#### Scenario: Fondo presente en ambos temas

- **WHEN** la aplicación se carga en cualquiera de los dos temas
- **THEN** el fondo escénico se ve con el contraste adecuado a ese tema y el contenido por encima permanece legible

#### Scenario: Nivel de efectos Calma

- **WHEN** la aplicación se abre con `?fx=1` o con `prefers-reduced-motion: reduce`
- **THEN** el fondo escénico no se anima ni pulsa

### Requirement: Superficies de cristal para paneles y avisos

El panel contextual de hábito, la hoja de ajustes, el manual, el tooltip de celda y el toast de milestone SHALL adoptar el mismo lenguaje de superficie: fondo translúcido oscurecido, borde superior de acento, esquinas redondeadas y difuminado del fondo. Su comportamiento —apertura, cierre, posicionamiento en móvil y escritorio, y contenido— SHALL permanecer sin cambios salvo donde otra capacidad lo redefina.

Cuando el navegador no soporte el difuminado de fondo, la superficie SHALL mostrarse con un color opaco de respaldo que mantenga la legibilidad del texto.

#### Scenario: Panel de hábito en móvil

- **WHEN** el usuario toca el nombre de un hábito en la rueda desde una pantalla estrecha
- **THEN** el panel sube desde abajo con la nueva superficie y ofrece las mismas acciones: renombrar, elegir elemento, ver progreso, configurar recordatorio, reiniciar y eliminar

#### Scenario: Navegador sin soporte de difuminado

- **WHEN** la aplicación se abre en un navegador que no soporta `backdrop-filter`
- **THEN** los paneles se muestran con fondo opaco y todo su texto sigue siendo legible

## ADDED Requirements

### Requirement: Acceso discreto para añadir hábito

El punto de entrada para añadir un hábito SHALL presentarse como una píldora translúcida centrada en el borde inferior de la pantalla, con un tratamiento visual deliberadamente contenido: menor contraste que los indicadores del reto y que los botones de la cabecera.

La píldora SHALL respetar el área segura inferior del dispositivo, de modo que en una PWA instalada no quede bajo el indicador del sistema. Su área táctil SHALL medir al menos 44 px de alto.

La píldora no SHALL solaparse con la fila de indicadores del reto ni tapar ninguna parte del nautilus.

#### Scenario: Presencia discreta

- **WHEN** el usuario abre la aplicación
- **THEN** la píldora de añadir hábito se ve en el borde inferior con menos peso visual que los indicadores y los botones de la cabecera

#### Scenario: PWA instalada en iOS

- **WHEN** la aplicación se abre instalada en un dispositivo con área segura inferior
- **THEN** la píldora queda completamente visible y accionable por encima de esa zona

#### Scenario: Sin solapamiento

- **WHEN** la aplicación se muestra en cualquier tamaño de pantalla soportado
- **THEN** la píldora no cubre el nautilus ni la fila de indicadores

## REMOVED Requirements

### Requirement: Hoja de información de instalación

**Reason**: El botón de información deja de abrir una hoja dedicada a la instalación y pasa a abrir un manual de la aplicación. Las instrucciones de instalación siguen existiendo, pero como una sección de ese manual.

**Migration**: Sustituido por los requisitos de la capacidad `app-manual`, en particular «Manual abierto desde la cabecera» —que conserva el cierre por botón, por toque exterior y por `Escape`, y la prohibición de diálogos nativos— y «Instalación como sección del manual», que conserva íntegras las instrucciones paso a paso para iOS y para Android.
