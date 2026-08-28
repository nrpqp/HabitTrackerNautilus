## Context

Ver `proposal.md` — *Why*. Lo que condiciona el diseño:

- `src/fx/engine.js` guarda el nivel en `tier.value` con un único booleano `tier.forced`. El gobernador comprueba `!tier.forced` para decidir si puede degradar, así que hoy sólo hay dos estados: detectado o intocable. La preferencia del usuario necesita un tercero.
- `?fx=0..3` ya existe y llama a `tier.set(n, true)`. Es la anulación de diagnóstico y su comportamiento no cambia.
- El centro del nautilus ya está ocupado: los arcos del medidor del día, la cuenta `n/total` y, de forma transitoria, la longitud de la racha. Ya hubo un conflicto por ese espacio y se resolvió con una regla de precedencia.
- La app no tiene ninguna pantalla de ajustes. El header son tres botones sueltos.

## Goals / Non-Goals

**Goals:**

- Que el usuario pueda subir o bajar la intensidad y que se recuerde.
- Que elegir no desactive la protección de rendimiento.
- Que la diferencia entre opciones se pueda percibir en el momento de elegir, no después.
- Que el control quepa en la app sin introducir una pantalla de configuración.

**Non-Goals:**

- Cambiar qué hace cada nivel.
- Un modelo de ajustes general que otras preferencias puedan reutilizar. Hay una sola preferencia; abstraer ahora sería inventar el problema.

## Decisions

### 1. El nivel gana origen en vez de un booleano

**Decisión**: `tier.forced` se sustituye por `tier.source`, con tres valores: `'auto'`, `'preference'` y `'diagnostic'`. El gobernador degrada cuando el origen es `auto` o `preference`, y no cuando es `diagnostic`.

**Por qué**: el booleano actual junta dos intenciones distintas bajo la misma palabra. "El usuario quiere el máximo" y "estoy midiendo el nivel 3 y no quiero que se mueva" merecen respuestas opuestas del gobernador. Con un booleano habría que elegir una y la otra saldría mal: o la preferencia deja el móvil a tirones, o el diagnóstico cambia de nivel a mitad de la prueba.

**Alternativa descartada**: un segundo booleano `userChosen`. Dos booleanos permiten cuatro combinaciones de las que sólo tres tienen sentido, y la cuarta es una fuente de errores silenciosos.

### 2. La preferencia es el punto de partida, no un techo permanente

**Decisión**: la preferencia fija el nivel al arrancar. El gobernador puede bajarlo durante la sesión. Lo guardado no se toca: en el siguiente arranque se vuelve a intentar el nivel elegido.

**Por qué**: si degradar reescribiera la preferencia, un pico de carga ajeno a la app —otra pestaña, una notificación— dejaría al usuario rebajado para siempre sin haber pedido nada. Y si la preferencia bloqueara al gobernador, el usuario podría dejarse la app inservible sin entender por qué. Reintentar cada arranque es lo que respeta ambas cosas: la elección persiste, y cada sesión se juzga por sus propios datos.

### 3. `Automático` es una posición del control, no un botón de reset

**Decisión**: la rueda tiene cinco posiciones y `Automático` es la primera y el valor por defecto. Guardarla equivale a no tener preferencia.

**Por qué**: sin ella, la primera interacción con la rueda es irreversible — el usuario queda anclado a un número y ya no puede volver a "lo que decida el aparato", que es justo lo correcto cuando cambia de dispositivo o cuando mejoramos la detección. Es la diferencia entre un ajuste y una trampa.

### 4. Control transitorio sobre el nautilus, no un anillo permanente

**Decisión**: la rueda se abre desde un botón del header, se dibuja centrada sobre el nautilus mientras está abierta, y se cierra al tocar fuera o con Escape.

**Por qué**: el centro ya lo ocupan el medidor del día y la cuenta, y la racha lo toma prestado. Un anillo de ajustes permanente sería el tercer inquilino de ese espacio y volveríamos al mismo conflicto que ya costó una regla de precedencia. Como control transitorio aprovecha la geometría del nautilus —que es lo que hace atractiva la idea— sin disputar nada de forma permanente.

**Alternativa descartada**: un panel deslizante como el sheet de edición. Funciona, pero desperdicia la única forma que hace especial a esta app y se parece a cualquier menú de ajustes.

### 5. Vista previa en el momento de elegir

**Decisión**: seleccionar una posición dispara un burst de muestra en el centro con el presupuesto de ese nivel.

**Por qué**: los nombres `Lite`, `Estándar` y `Máximo` no significan nada hasta que los ves. Sin muestra, el usuario elige a ciegas y la única forma de comparar es cerrar el control, marcar un día real y volver a abrirlo. Con muestra, la decisión se toma en dos segundos.

**Detalle**: la muestra se ejecuta con el nivel ya aplicado, no simulado. Simularlo duplicaría la lógica de presupuesto y podría divergir de lo que luego pasa de verdad.

### 6. Mostrar el nivel activo cuando difiere del elegido

**Decisión**: si el nivel activo no coincide con la preferencia, la rueda marca la posición elegida y además señala la activa.

**Por qué**: el gobernador puede degradar en silencio. Un usuario que eligió `Máximo` y ve menos efectos que antes concluiría que el ajuste no funciona. Mostrar la diferencia convierte una aparente avería en información: el aparato no da para más.

### 7. Persistencia en su propia clave

**Decisión**: clave `fx-level` en localStorage, con los valores `auto`, `0`, `1`, `2` y `3`. Cualquier otro valor se lee como `auto`.

**Por qué**: sigue el patrón de `theme`, que ya vive en su propia clave. Meterla dentro de `habits21` mezclaría preferencias de interfaz con los datos del reto y complicaría un futuro export.

### 8. El techo de muestreo del gobernador mide lentitud, no pausas

**Decisión**: la ventana de medición descarta un frame sólo si dura más de 2 s o si la pestaña está oculta, en lugar del techo anterior de 500 ms.

**Por qué**: apareció al intentar verificar la decisión 2. Con el techo en 500 ms, un dispositivo tan ahogado que tarda más de medio segundo por frame quedaba fuera de la medición y no se degradaba **nunca** — el gobernador dejaba de funcionar exactamente en el caso para el que existe. El techo pretendía descartar huecos que no miden rendimiento (pestaña en segundo plano, equipo suspendido), y eso se expresa mejor con `document.hidden` y un margen mucho más alto.

**No verificado en sesión**: la pestaña de automatización corre con `document.hidden`, y ahí `requestAnimationFrame` no dispara, así que el gobernador no llega a medir. Queda como tarea 6.3.

## Risks / Trade-offs

- **El cambio del techo de muestreo va sin verificar** → Sólo puede provocar *más* degradación, nunca menos, y hacen falta tres segundos malos seguidos con decremento en los buenos, así que un tirón aislado no degrada. Aun así es una modificación a la red de seguridad y necesita la comprobación 6.3 en una ventana visible.

- **La rueda tapa el nautilus mientras está abierta** → Es transitoria y se cierra tocando fuera. El estado del día debe seguir legible detrás; hay tarea de verificación para eso.

- **Un usuario puede elegir `Máximo` en un móvil que no lo aguanta** → El gobernador lo degrada en segundos y la rueda lo muestra. Es exactamente el caso que la decisión 2 y la 6 cubren juntas.

- **`Calma` deja la app sin ningún movimiento y el usuario puede olvidarlo** → La rueda es el único sitio donde se cambió y donde se ve marcado. El riesgo real sería que no hubiera forma de volver, y `Automático` la da.

- **Cinco posiciones en un control radial son pocas para arrastrar y muchas para tocar en un móvil pequeño** → Se resuelve con posiciones discretas y áreas de toque de al menos 44 px, no con un arrastre continuo. Verificar en el viewport más estrecho.

- **La preferencia y `prefers-reduced-motion`** → Si el sistema pide movimiento reducido, `Automático` da nivel 0. Elegir explícitamente un nivel superior es una acción consciente del usuario sobre su propio dispositivo y se respeta; la rueda deja claro que el sistema pedía calma.

## Migration Plan

1. Introducir el origen del nivel en el motor y adaptar el gobernador, sin cambiar comportamiento observable: `?fx=` pasa a `diagnostic` y la detección a `auto`.
2. Añadir la lectura y escritura de la preferencia, aplicándola en el arranque.
3. Construir la rueda y conectarla.
4. Añadir la vista previa y el aviso de discrepancia.

No hay migración de datos: la clave es nueva y su ausencia significa `Automático`, que es el comportamiento actual. Revertir el cambio deja una clave inerte en localStorage.
