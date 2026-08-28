## Context

Ver `proposal.md` — *Why* para la motivación. Las restricciones que dan forma a este diseño:

- `renderSVG()` (en `src/render/svg.js`) construye una plantilla de string y la asigna a `svgContainer.innerHTML` en cada repintado. Todos los listeners se vuelven a enganchar después con `querySelectorAll`, y el canvas overlay tiene que rescatarse a mano antes del reemplazo y volver a insertarse después. Cualquier animación CSS o WAAPI sobre una celda muere en ese instante.
- El burst de partículas actual dibuja con color plano y `globalAlpha`, y el canvas se dimensiona en píxeles CSS sin tener en cuenta `devicePixelRatio`.
- Objetivo declarado del proyecto: sin dependencias de runtime. Todo tiene que caber en vanilla JS, CSS y canvas 2D.
- El público incluye iPhones instalados como PWA. Safari no expone `navigator.deviceMemory` ni `navigator.vibrate`, y penaliza los filtros SVG.
- Las maquetas `prototypes/04-streak.html` y `prototypes/05-core.html` ya materializan las decisiones de abajo y son la referencia visual de la implementación, no un anexo. Las otras cinco maquetas quedan como exploración para cambios posteriores.

## Goals / Non-Goals

**Goals:**

- Que una animación en curso sobre una celda sobreviva a cualquier repintado del anillo.
- Un único punto de verdad sobre "cuánto efecto puede permitirse este dispositivo", consultable por todos los efectos.
- Que el catálogo de efectos sea ampliable sin tocar el renderer ni el orquestador.
- Que el degradado entre niveles sea de contenido, no de interruptor: el nivel 1 no es "sin celebración", es la misma celebración con menos capas.
- Un único bucle de `requestAnimationFrame` dueño del canvas de efectos.

**Non-Goals:**

- Render por diff genérico. El anillo tiene como máximo 7 × 21 = 147 celdas y una geometría fija; la construcción única con mutación de atributos es suficiente y no necesita una capa de reconciliación.
- Abstraer el sistema de partículas para reutilizarlo fuera del nautilus.
- Persistir el nivel de dispositivo o preferencias de intensidad. Se recalcula en cada arranque.
- Tocar las animaciones CSS de fase. Siguen exactamente como están; sólo pasan a anularse por nivel 0 en vez de por `prefers-reduced-motion` directamente.

## Decisions

### 1. Construcción única del SVG y mutación de atributos

**Decisión**: `renderSVG()` se parte en dos. `buildSVG()` crea el árbol una sola vez con `document.createElementNS`, guarda referencias a cada `<path>` en una matriz `cells[habitIndex][dayIndex]` y engancha los listeners una vez. `paintSVG()` recorre esa matriz y sólo actualiza `fill`, `stroke`, `stroke-width` y clases. `innerHTML` desaparece del renderer.

**Por qué**: es la causa raíz. Con nodos persistentes, una animación WAAPI lanzada sobre una celda sobrevive a que el usuario marque otra, y el efecto de propagación en cadena pasa a ser posible. Como beneficio secundario desaparecen dos parches: el rescate manual del canvas overlay antes del reemplazo, y el re-enganche de listeners en cada repintado (que además hoy crea un listener nuevo por celda en cada render).

**Cuándo hay que reconstruir**: sólo cuando cambia el número de anillos (añadir o eliminar hábito) o su orden (el renombrado reordena por longitud de nombre). Esos dos casos llaman a `buildSVG()`; todo lo demás llama a `paintSVG()`.

**Alternativa descartada**: mantener `innerHTML` y mover todos los efectos al canvas. Deja las celdas sin poder deformarse, que es justo el feedback que falta.

### 2. El nivel de dispositivo es un módulo con estado, no un valor calculado en cada uso

**Decisión**: `src/fx/engine.js` expone un objeto `tier` con el nivel activo, un método para fijarlo y una lista de suscriptores. Los efectos consultan `tier.value` y los presupuestos se piden con `tier.budget(base)`.

**Por qué**: el gobernador de FPS puede bajar el nivel a mitad de sesión y hay componentes (el medidor del núcleo, las clases CSS del `<html>`) que necesitan enterarse. Un valor calculado en cada uso no permitiría reaccionar al cambio.

**Fórmula**: `prefers-reduced-motion` o `saveData` fuerzan 0. Si no, se parte de 2 y sólo se mueve con evidencia fuerte: sube a 3 con 8 o más núcleos —y 8 GB o más si el navegador declara memoria— y baja a 1 con valores declarados de 2 o menos. Un puntero fino pone suelo en 2.

**Por qué sólo con evidencia fuerte**: la primera versión restaba un nivel por no declarar `deviceMemory` y otro por declarar pocos núcleos. En la práctica eso mandaba **todos los iPhone al nivel 1**, que es el único sin partículas, y también a los navegadores que falsean núcleos y memoria a la baja por privacidad, como Brave. Se verificó en dispositivos reales: iPhone y Brave de escritorio se quedaban sin ningún efecto de canvas. No declarar memoria no es síntoma de debilidad — Safari y Firefox nunca la declaran — y un valor bajo puede ser una defensa antihuella, no el aparato. El suelo por puntero fino recoge lo que sí sabemos con certeza: un escritorio aguanta el nivel estándar.

**Quién decide de verdad**: las capacidades declaradas son una pista; el gobernador de FPS mide. Cualquier dispositivo que no sostenga el ritmo acaba degradado con datos reales, así que equivocarse por generoso se corrige solo y equivocarse por tacaño no.

**Alternativa descartada**: `matchMedia` sobre `(update: fast)` y similares. No discriminan gama en la práctica.

### 3. El gobernador de FPS degrada, nunca promociona

**Decisión**: se muestrean los frames por segundo; tres segundos consecutivos por debajo de 46 fps bajan un nivel. No hay camino de vuelta dentro de la sesión, y el suelo automático es el nivel 1.

**Por qué**: promocionar produciría oscilación —el nivel sube, la carga sube, los fps bajan, el nivel baja— que es peor que quedarse bajo. El suelo en 1 evita que un pico de carga ajeno a la app (otra pestaña, una notificación) deje al usuario sin ningún feedback.

**Trade-off aceptado**: un usuario que abrió la app durante un pico de carga se queda con menos efecto hasta que recargue.

### 4. Presupuesto multiplicativo, no catálogos separados por nivel

**Decisión**: cada efecto declara una cantidad base y `tier.budget(base)` la multiplica por `[0, 0.35, 1, 1.8]` según el nivel. Además cada efecto declara un nivel mínimo por debajo del cual no se ejecuta.

**Por qué**: mantener tres versiones de cada efecto multiplicaría por tres la superficie de mantenimiento y garantizaría que las variantes de gama baja se quedaran sin probar. Un multiplicador más un umbral cubre los dos ejes reales: *cuánto* y *si*.

### 5. Partículas: blending aditivo con sprite radial cacheado

**Decisión**: el canvas dibuja con `globalCompositeOperation = 'lighter'` y cada partícula pinta un `<canvas>` de gradiente radial pregenerado por color, escalado con `drawImage`, más una silueta sólida encima con la forma del elemento.

**Por qué**: el aditivo es lo que hace que el solapamiento sature a blanco, y es el 80 % de la diferencia percibida frente a lo actual. Crear un `createRadialGradient` por partícula y frame sería inviable; un sprite por color se genera una vez y `drawImage` es una operación de blit. El caché se indexa por color RGB, y los colores posibles están acotados por los siete elementos.

**Alternativa descartada**: `shadowBlur` del canvas. Produce el mismo halo pero es de las operaciones más caras de canvas 2D y se nota en cuanto hay más de una decena de partículas.

### 6. `devicePixelRatio` acotado a 2, y a 1.5 por debajo del nivel 3

**Decisión**: el canvas se dimensiona en píxeles físicos con el DPR acotado, y `ctx.setTransform` reescala para que el resto del código siga trabajando en píxeles CSS.

**Por qué**: el coste de relleno crece con el cuadrado del DPR. En una pantalla 3x, dibujar a densidad completa multiplica por nueve el trabajo por un glow difuso que nadie distingue de la versión a 2x.

### 7. Un solo bucle de rAF dueño del canvas

**Decisión**: existe un único bucle que limpia el canvas y luego pide a cada efecto activo que se dibuje. Los efectos no llaman a `requestAnimationFrame` por su cuenta ni a `clearRect`.

**Por qué**: esta decisión salió de un fallo real en las maquetas. En `03-flow` el barrido especular y la gota de llenado corrían en bucles independientes sobre el mismo canvas; el `clearRect` del primero borraba al segundo un frame después de dibujarlo, y la gota resultaba invisible. Con varios efectos simultáneos el problema sólo empeora.

### 8. `filter: brightness()` sobre `<path>` sólo a partir del nivel 2

**Decisión**: los keyframes de golpe incluyen `filter` y `transform`; por debajo del nivel 2 se elimina la propiedad `filter` de los keyframes antes de pasarlos a `element.animate()`.

**Por qué**: `transform` y `opacity` se resuelven en el compositor; `filter` sobre un elemento SVG obliga a repintar la capa. Es la primera propiedad que hay que sacrificar y la que menos se echa de menos, porque el golpe de escala ya transmite el impacto.

### 9. La celebración de día completo se detecta por transición, no por estado

**Decisión**: al marcar el día de hoy de un hábito se compara el número de hábitos cerrados hoy antes y después. La celebración se dispara sólo cuando la cuenta pasa de `n-1` a `n` siendo `n` el total de hábitos activos. No se persiste ningún estado de "ya celebrado hoy".

**Por qué**: la misma lógica que ya usa la detección de milestone. Calcularlo por estado dispararía la celebración en cada carga de la aplicación con el día ya cerrado, que es exactamente lo que el spec prohíbe. Como consecuencia deliberada, desmarcar y volver a marcar vuelve a celebrar: es una transición real y el usuario la ha provocado.

### 10. El cometa se calcula sobre el arco, no sobre una ruta declarada

**Decisión**: el cometa interpola el ángulo entre el centro angular del primer día de la racha y el del día recién marcado, y su posición en píxeles sale de la misma función `polar()` que dibuja las celdas. La celda que se enciende a su paso se deduce del ángulo actual, no de una lista precalculada.

**Por qué**: la geometría ya existe y es la única fuente de verdad del anillo. Declarar una ruta aparte —con `offset-path` o con una lista de puntos— crearía una segunda representación de la misma curva que puede desincronizarse si cambian `innerRadius`, `cellThickness` o el número de anillos. Deducir la celda del ángulo también hace que el encendido acierte solo cuando el usuario tiene 3 o 7 hábitos y los radios cambian.

**Alternativa descartada**: `offset-path: path()` en CSS sobre un elemento HTML. Habría que regenerar el `path` en cada repintado y no da acceso al índice de celda alcanzada.

### 11. La háptica es opcional por diseño, no un fallo a manejar

**Decisión**: `haptics.go()` comprueba el soporte y no hace nada si no existe. Ningún llamante consulta el soporte ni ramifica.

**Por qué**: iOS Safari no expone `navigator.vibrate` y es una fracción grande del público. Si la háptica fuera un requisito con fallback, cada punto de llamada tendría una rama muerta en el navegador más restrictivo. Haciéndola un no-op silencioso, el código de efectos se escribe una vez.

### 12. El centro es del día; la racha lo toma prestado

**Decisión**: el estado en reposo del centro es el medidor del día (arcos por hábito + cuenta `n/total`). Al aterrizar el cometa, la etiqueta central cambia a la longitud de la racha durante ~1,9 s y vuelve sola. Los arcos del medidor no se ocultan en ningún momento; sólo cambia el texto del interior.

**Por qué**: las maquetas `04-streak` y `05-core` se diseñaron por separado y **ambas reclaman el centro**. Hay que elegir un dueño. El del día gana el reposo porque es información de estado —está siempre vigente y el usuario la consulta— mientras que la racha es información de evento: importa en el instante en que crece. Un temporizador con reemplazo (cada presentación cancela la anterior) evita que marcar varios días seguidos deje el centro atascado.

**Regla de precedencia**: si un mismo marcado cierra el día *y* extiende la racha, la racha no toma el centro. Sin esta regla el ganador dependería de si el cometa llega antes o después de la supernova — con una racha corta el cometa llega en ~360 ms y la supernova en 420 ms, con una larga al revés. El resultado sería indeterminista según la longitud de la racha.

**Alternativa descartada**: partir el centro en dos mitades. A ese radio —52 unidades de SVG— no caben dos cifras legibles, y menos en un móvil pequeño.

## Risks / Trade-offs

- **La reescritura del renderer es el cambio de mayor riesgo del lote** → Va primera y sola. Se valida con el comportamiento actual intacto —marcar, desmarcar, cambiar elemento, renombrar, añadir, eliminar, cambiar tema— antes de añadir ningún efecto nuevo. Si algo se rompe después, la primera sospechosa es esta tarea y se puede revertir sin tocar el resto.

- **Reordenamiento de anillos al renombrar** → El orden de los anillos depende de la longitud del nombre. Con construcción única hay que detectar que el orden cambió y reconstruir. Es el caso que más fácilmente se escapa; tiene tarea de verificación propia.

- **`deviceMemory` no existe en Safari ni Firefox** → La heurística resta un nivel cuando falta memoria y el puntero es grueso. Un iPhone reciente y potente quedará clasificado en nivel 2 en vez de 3. Es la equivocación barata: sobra fluidez, falta un poco de espectáculo.

- **El aditivo se lee peor en tema claro** → Sobre fondo claro, sumar luz satura hacia el blanco del fondo y el burst pierde contraste. Mitigación: en tema claro la silueta sólida de la partícula pesa más y el halo menos. Hay que verificarlo en tema claro explícitamente, no sólo en oscuro.

- **La duración del cometa en rachas largas** → El recorrido crece con la racha. Con el tope en 1,25 s, una racha de 20 días recorre el anillo entero en ese tiempo; si en pruebas se hace largo, la palanca es el tope, no eliminar el recorrido. El usuario no queda bloqueado en ningún caso: el estado ya está guardado antes de que el cometa salga.

- **La celebración de pantalla completa puede resultar invasiva a diario** → Sólo se dispara al cerrar el día completo, como mucho una vez al día si el usuario no desmarca. Si en pruebas resulta excesiva, la palanca es la duración, no eliminarla.



## Migration Plan

1. Reescribir el renderer y verificar paridad funcional completa con la versión actual. Nada de efectos nuevos en este paso.
2. Introducir `src/fx/engine.js` con el nivel fijado a 2 y sin gobernador, y comprobar que nada cambia visualmente.
3. Migrar el sistema de partículas actual al nuevo (aditivo, DPR, sprite) manteniendo el mismo momento de disparo. Aquí la app ya se ve mejor sin comportamiento nuevo.
4. Activar la fórmula de nivel y el gobernador.
5. Añadir el medidor del día, la traza de carga y la supernova.
6. Añadir el cometa de racha, el encendido en cadena, la presentación de racha y la respuesta al romperla.

No hay migración de datos: el esquema de localStorage no cambia. Revertir el cambio no deja ningún residuo en los datos del usuario.

## Open Questions

- El multiplicador de presupuesto para el nivel 3 (`1.8`) sale de las maquetas en escritorio. Puede necesitar ajuste tras probar en un móvil de gama alta real, y es un número suelto que no afecta ni a los specs ni al reparto de tareas.
- Si la duración de la celebración de día completo debe acortarse a partir de la primera semana de uso. Es una decisión de producto que se puede tomar con la implementación ya en marcha.
