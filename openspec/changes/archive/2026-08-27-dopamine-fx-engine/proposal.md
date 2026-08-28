## Why

La app ya tiene identidad elemental y partículas, pero el refuerzo se queda corto en dos puntos concretos. Marcar un día se trata como un evento aislado, cuando lo que el usuario está construyendo es una **racha**: no hay nada en pantalla que haga visible lo que lleva acumulado ni lo que pierde si lo rompe. Y **no existe ninguna celebración del día completo**, que es el único momento diario en el que cierra todo lo que se había propuesto; la app celebra cada hábito por separado y nunca el conjunto.

Debajo de eso hay un techo estructural: `renderSVG()` reemplaza el `innerHTML` completo del contenedor en cada interacción. Toda animación CSS o WAAPI en curso sobre una celda muere en ese instante, y por eso el feedback actual tiene que ser corto y aplicarse *después* del re-render. Cualquier efecto que recorra varias celdas a lo largo del tiempo es imposible mientras el render funcione así.

Además, la app corre en un abanico de dispositivos muy distinto (iPhone antiguo instalado como PWA, Android de gama media, escritorio) y hoy aplica el mismo coste visual a todos: la única distinción es `prefers-reduced-motion`.

## What Changes

**Base**

- **Render incremental del anillo.** `renderSVG()` pasa a construir el árbol SVG una sola vez con la DOM API y a mutar atributos en los repintados posteriores. El `innerHTML` completo deja de usarse. Esto conserva las animaciones en vuelo, elimina el hack de rescatar el canvas overlay a mano y deja de crear un listener nuevo por celda en cada render.
- **Motor de efectos con niveles de dispositivo.** Se introduce un nivel 0–3 (`Calma`, `Lite`, `Estándar`, `Máximo`) derivado de `prefers-reduced-motion`, modo de ahorro de datos, núcleos lógicos, memoria declarada y tipo de puntero, con un gobernador de FPS que degrada el nivel en caliente si el dispositivo no sostiene el ritmo. Cada efecto declara el nivel mínimo que necesita y su presupuesto escala con el nivel.
- **Partículas de calidad superior.** Blending aditivo (`globalCompositeOperation = 'lighter'`), sprite radial cacheado en lugar de color plano, física propia por elemento y corrección de `devicePixelRatio` en el canvas — hoy se dimensiona en píxeles CSS y se ve borroso en pantallas retina.
- **Háptica donde existe.** `navigator.vibrate` con patrones distintos para toque, confirmación, hito y rechazo. No disponible en iOS Safari, donde el refuerzo se apoya sólo en lo visual.

**Racha**

- Al marcar un día que continúa una racha, un **cometa** sale del primer día de la racha, recorre el arco reencendiendo cada celda por la que pasa y estalla en la celda nueva. Cuanto más larga la racha, más largo el recorrido.
- La racha actual se muestra al aterrizar el cometa y se desvanece, devolviendo el centro a su estado en reposo.
- Romper la racha al desmarcar tiene su propia respuesta visual: la celda se apaga y las posteriores parpadean en cascada.
- En dispositivos de nivel 1 el cometa se sustituye por un encendido escalonado de las mismas celdas, sin canvas.

**Núcleo del día**

- El círculo central vacío pasa a ser el **medidor del día**: un arco por hábito, con el color de su elemento, que se rellena cuando ese hábito queda cerrado hoy, más la cuenta `n/total`.
- Al cerrar un hábito, una traza de energía viaja de la celda al núcleo y el núcleo acusa la llegada.
- Al cerrar el último hábito pendiente, **supernova**: destello de pantalla completa, anillos de choque, rayos y burst de partículas con los colores de todos los hábitos.

## Capabilities

### New Capabilities

- `motion-tiers`: Detección de capacidades del dispositivo, clasificación en cuatro niveles de efecto, degradación automática por FPS sostenido, presupuestos de partículas por nivel y háptica condicionada al soporte del navegador.
- `habit-streak`: La racha de días consecutivos de un hábito como objeto visible — recorrido del cometa al extenderla, respuesta al romperla y presentación transitoria de su longitud.
- `daily-completion`: El núcleo central como medidor del día en curso y la celebración de pantalla completa al cerrar todos los hábitos del día.

### Modified Capabilities

- `elemental-animations`: el burst de partículas deja de ser fijo de 5–7 y pasa a escalar con el nivel de dispositivo, con composición aditiva y física propia por elemento; se añade la garantía de que las animaciones sobre las celdas sobreviven a cualquier repintado del anillo.

## Impact

- `src/render/svg.js` — reescritura del ciclo de render: construcción una vez, mutación después. Es el cambio de mayor riesgo y el que habilita todo lo demás. Pasa a exponer las referencias de celda y la conversión de coordenadas SVG a píxeles que los efectos necesitan.
- `src/fx/` (nuevo directorio, dos módulos) — `engine.js` (niveles de dispositivo, gobernador de FPS, háptica, canvas con DPR, sistema de partículas y bucle único de render) y `effects.js` (cometa, encendido en cadena, medidor del núcleo, traza de carga y supernova).
- `src/main.js` — el spawner de partículas sale de aquí hacia `src/fx/`; `main.js` queda como orquestador. La convención del proyecto pide preferir `main.js` a archivos nuevos, pero ya son 598 líneas y el motor de efectos es transversal al render, al sheet y al ciclo de vida; se sigue el precedente de `src/render/` y `src/utils/`.
- `src/constants.js` — `ELEMENTS` gana los campos de física de partícula que hoy viven implícitos en el spawner.
- `style.css` — estilos del medidor central, la etiqueta del núcleo y la capa de destello de pantalla completa; el bloque `prefers-reduced-motion` queda unificado bajo el nivel 0.
- `index.html` — etiqueta del núcleo y capa de celebración de pantalla completa.
- `prototypes/` — maquetas navegables `04-streak` y `05-core`, fuente de verdad visual de la implementación.
- Sin dependencias de runtime nuevas. Sigue siendo vanilla JS + CSS + canvas 2D.

## No incluido en este cambio

- **Impacto y onda de choque al marcar** (maqueta `01-impact`), **onda viajera desfasada en reposo** (maqueta `03-flow`), **hitos de 7/14/21 escalados** (maqueta `06-ascend`) y **paralaje por giroscopio** (maqueta `07-depth`). Están explorados y maquetados, pero cada uno merece su propio cambio; meterlos aquí haría el diff imposible de revisar y mezclaría el riesgo de la reescritura del renderer con el de cuatro efectos más.
- **La celebración de milestone actual no se toca.** Los días 7, 14 y 21 siguen mostrando el toast existente, con su burst de partículas ampliado.
- **Sonido.** Ni efectos ni música. En iOS el audio sin gesto de usuario está restringido.
- **WebGL o shaders.** Todo el presupuesto se mantiene en canvas 2D y CSS.
- **Cambios en el modelo de datos.** Ni el esquema de localStorage ni el modelo de hábito se tocan; la racha y el estado del día se derivan de `progress` y `startDate`, y el nivel de dispositivo se calcula en runtime sin persistirse.
- **Reordenar, editar o crear hábitos.** El sheet de edición no cambia.
- **Estadísticas, logros o pantallas nuevas.** Todo vive en el nautilus.
