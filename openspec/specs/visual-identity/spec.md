## Purpose

Define la identidad visual de la aplicación —paleta por tema, tipografía, fondo escénico, superficies y controles— de modo que el nautilus aparezca dentro de un marco coherente y reconocible, y garantiza que ese marco nunca altere el aspecto de la rueda de 21 días.

## Requirements

### Requirement: Contrato de tokens de la rueda intacto

El sistema visual SHALL preservar sin cambios los tokens de tema que consume el renderizador de la rueda: `--empty-cell-fill`, `--empty-cell-stroke`, `--locked-cell-fill`, `--locked-cell-stroke`, `--old-cell-fill`, `--old-cell-stroke`, `--center-fill`, `--center-stroke`, `--guide-stroke` y `--day-label-fill`. Sus valores SHALL ser idénticos a los actuales en el tema claro y en el oscuro.

Ningún elemento del sistema visual SHALL solaparse sobre la rueda ni interceptar sus eventos de puntero: las capas decorativas SHALL declararse `aria-hidden` y SHALL ser transparentes a los eventos.

#### Scenario: La rueda se ve igual antes y después del rediseño

- **WHEN** se compara la rueda renderizada antes y después del cambio, con los mismos hábitos y el mismo tema
- **THEN** las celdas vacías, bloqueadas, antiguas, el círculo central, las guías y los números de día conservan exactamente los mismos colores

#### Scenario: Las capas decorativas no bloquean la interacción

- **WHEN** el usuario toca una celda de un anillo sobre la zona que ocupa el fondo escénico
- **THEN** la celda recibe el evento y cambia de estado con normalidad

#### Scenario: El canvas de efectos sobrevive al rediseño

- **WHEN** se dispara un efecto de partículas tras marcar una celda
- **THEN** el efecto se dibuja sobre la rueda igual que antes, sin quedar tapado ni recortado por ninguna superficie nueva

### Requirement: Sistema de tokens visuales por tema

El sistema SHALL exponer la identidad visual como variables CSS: fondos, superficies, bordes, texto, acento primario (cian) y acento secundario (ámbar), sombras y halos. El tema oscuro SHALL usar una base espacial profunda; el tema claro SHALL usar su contraparte luminosa con los mismos acentos y la misma estructura de tokens.

El toggle de tema SHALL conservar su comportamiento actual: alterna claro/oscuro, persiste la elección y respeta la preferencia del sistema en la primera visita.

#### Scenario: Cambio de tema

- **WHEN** el usuario pulsa el botón de tema
- **THEN** todas las superficies, textos, bordes y halos cambian a los valores del otro tema, la rueda mantiene su paleta propia y la elección persiste tras recargar

#### Scenario: Primera visita sin preferencia guardada

- **WHEN** el usuario abre la aplicación por primera vez
- **THEN** se aplica el tema que corresponde a `prefers-color-scheme` y la interfaz se muestra ya con ese tema, sin destello del tema contrario

### Requirement: Fondo escénico decorativo

El sistema SHALL mostrar detrás de todo el contenido una capa decorativa compuesta por círculos concéntricos tenues y espirales logarítmicas doradas, sobre degradados radiales de acento. La capa SHALL ser puramente decorativa: sin texto, sin interacción y sin animación continua.

En el nivel de efectos 1 (Calma) y con `prefers-reduced-motion`, la capa SHALL seguir siendo estática y no SHALL introducir ningún movimiento.

#### Scenario: Fondo presente en ambos temas

- **WHEN** la aplicación se carga en cualquiera de los dos temas
- **THEN** el fondo escénico se ve con el contraste adecuado a ese tema y el contenido por encima permanece legible

#### Scenario: Nivel de efectos Calma

- **WHEN** la aplicación se abre con `?fx=1` o con `prefers-reduced-motion: reduce`
- **THEN** el fondo escénico no se anima ni pulsa

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

### Requirement: Superficies de cristal para paneles y avisos

El panel contextual de hábito, la hoja de ajustes, el manual, el tooltip de celda y el toast de milestone SHALL adoptar el mismo lenguaje de superficie: fondo translúcido oscurecido, borde superior de acento, esquinas redondeadas y difuminado del fondo. Su comportamiento —apertura, cierre, posicionamiento en móvil y escritorio, y contenido— SHALL permanecer sin cambios salvo donde otra capacidad lo redefina.

Cuando el navegador no soporte el difuminado de fondo, la superficie SHALL mostrarse con un color opaco de respaldo que mantenga la legibilidad del texto.

#### Scenario: Panel de hábito en móvil

- **WHEN** el usuario toca el nombre de un hábito en la rueda desde una pantalla estrecha
- **THEN** el panel sube desde abajo con la nueva superficie y ofrece las mismas acciones: renombrar, elegir elemento, ver progreso, configurar recordatorio, reiniciar y eliminar

#### Scenario: Navegador sin soporte de difuminado

- **WHEN** la aplicación se abre en un navegador que no soporta `backdrop-filter`
- **THEN** los paneles se muestran con fondo opaco y todo su texto sigue siendo legible

### Requirement: Tipografía del sistema

La interfaz SHALL usar una tipografía de palo seco geométrica para títulos, controles y texto, y una tipografía monoespaciada para cifras y etiquetas en versalitas. Si las fuentes remotas no están disponibles, la aplicación SHALL seguir siendo legible con la pila de fuentes del sistema.

La aplicación instalada como PWA SHALL mostrar la tipografía correcta sin conexión.

#### Scenario: Sin conexión tras la primera visita

- **WHEN** el usuario abre la aplicación instalada sin conexión, después de haberla visitado al menos una vez
- **THEN** los textos se muestran con la tipografía del sistema visual, servida desde la caché

#### Scenario: Fuentes remotas bloqueadas

- **WHEN** la carga de las fuentes remotas falla
- **THEN** la interfaz se muestra con la pila de respaldo, sin texto invisible ni saltos de maquetación que oculten contenido

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
