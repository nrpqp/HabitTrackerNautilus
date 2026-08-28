## Context

Ver `proposal.md — Why` para la motivación. El estado actual que condiciona el enfoque:

- Los cuatro botones de cabecera son `position: absolute` anclados a `right` con cuatro juegos de coordenadas por breakpoint (`style.css:307-316`, `1189-1258`). No hay layout: hay cuatro números por punto de ruptura.
- El selector de intensidad es un control radial (`src/ui/dial.js`) montado dentro de `#svg-container`. Su velo (`.fx-dial-backdrop`, `inset: 0` del host) cubre sólo el nautilus, y por eso la muestra de partículas se ve al elegir.
- `#info-sheet` e `#habit-sheet` implementan por separado la misma mecánica de hoja inferior. `main.js:214` documenta por qué la de info no se metió dentro de la de hábito: aquella arrastra estado de hábito y modo crear/editar.
- Los efectos no consultan cuatro niveles: consultan tres umbrales. `tier.value === 0` apaga todo, `tier.value < 2` apaga canvas **y** filtros, `tier.value >= 3` añade capas. Ese solapamiento del segundo umbral es lo que permite insertar un nivel nuevo sin inventar comportamiento.
- `BUDGET = [0, 0, 1, 1.8]` (`engine.js:59`) y `tier.set()` recorta a `0..3` (`engine.js:77`).
- La preferencia vive en la clave `fx-level` con valores `'auto' | '0' | '1' | '2' | '3'`.
- `document.documentElement.dataset.tier` alimenta selectores CSS (`html[data-tier="0"]`), y `?fx=0..3` fuerza el nivel para poder probarlo en un móvil.

## Goals / Non-Goals

**Goals:**

- Que la cabecera quede con dos botones y el resto de controles encuentren un sitio sin perder ninguna capacidad.
- Insertar el quinto nivel donde el motor ya tenía un hueco, no encima de la escala.
- Que ningún usuario existente arranque con menos efectos de los que había elegido.
- Que `prefers-reduced-motion` deje de poder ser anulado por una preferencia guardada.
- Que la muestra de intensidad siga siendo comparable entre niveles después de mover el control a una hoja.

**Non-Goals:**

- Reescribir el sistema de efectos. Los tres umbrales se re-mapean; no se rediseñan los efectos.
- Unificar `#habit-sheet` con las otras hojas.
- Cualquier cambio en `src/render/svg.js`, `src/constants.js` o la geometría del nautilus.
- Implementar el cambio de tipografía.

## Decisions

### D1 — El quinto nivel se inserta entre Lite y Estándar, no encima de Máximo

Máximo ya está definido como «todo, sin recortes»; un sexto escalón por encima sería presupuesto inventado. En cambio el salto de Lite a Estándar va de cero partículas al canvas completo, y es el único tramo de la escala donde el umbral `< 2` hace dos cosas a la vez: apagar el canvas y apagar los filtros. Separar esas dos responsabilidades **produce** el nivel intermedio en lugar de fabricarlo.

```
umbral viejo        →  umbrales nuevos
tier.value === 0    →  tier.value === 1        (sin movimiento)
tier.value < 2      →  tier.value < 3          (sin canvas)
     ″              →  tier.value < 4          (sin filtros)
tier.value >= 3     →  tier.value >= 5         (capas extra)

BUDGET  [0, 0, 1, 1.8]  →  [_, 0, 0, 0.5, 1, 1.8]   (índice 0 sin uso)
```

*Alternativa descartada*: nivel 6 por encima de Máximo. No hay comportamiento que le corresponda, y obligaría a inventar presupuestos que ningún dispositivo pide.

*Alternativa descartada*: mantener cuatro niveles internos y mapear cinco posiciones de UI. Dos posiciones distintas producirían efectos idénticos, y la escala mentiría.

### D2 — Numeración interna 1..5, no 0..4 con desplazamiento en la vista

Mantener `0..4` internamente y mostrar `n+1` deja una conversión en cada frontera —CSS, URL, almacenamiento, mensajes— y cada una es una oportunidad de error por uno. Se renumera de verdad: `tier.value` toma valores `1..5`, `data-tier` los refleja, `?fx=` los acepta.

El índice 0 de `BUDGET` queda sin usar. Es un hueco deliberado y comentado; la alternativa —restar uno en `budget()`— reintroduce exactamente la conversión que este renumerado elimina.

*Coste asumido*: `?fx=0..3` deja de funcionar. Es una herramienta de diagnóstico documentada en `CLAUDE.md`, no una API pública, y se actualiza en el mismo cambio.

### D3 — Clave nueva para la preferencia, con migración de un solo sentido

Reusar `fx-level` con la escala nueva haría que `'3'` significase Máximo antes y Suave después. La lectura sería silenciosamente errónea y no habría forma de distinguir un valor migrado de uno sin migrar.

Se escribe en `fx-nivel`. Al leer:

```
¿existe 'fx-nivel'?
  sí  → usar (validado contra 1..5; si no valida, sembrar)
  no  → ¿existe 'fx-level'?
          sí, '0'|'1'|'2'|'3' → migrar {0:1, 1:2, 2:4, 3:5}, escribir 'fx-nivel'
          sí, 'auto'          → sembrar desde detectTier(), escribir
          no                  → sembrar desde detectTier(), escribir
```

La clave vieja se borra tras migrar. La operación es idempotente porque el segundo arranque ya encuentra `fx-nivel` y no vuelve a mirar la vieja.

*Alternativa descartada*: versionar dentro del mismo valor (`v2:5`). Complica el parseo para ahorrar una clave de localStorage.

### D4 — `prefers-reduced-motion` pasa de entrada de detección a techo permanente

Hoy es una rama de `detectTier()`, lo que significa que sólo se respeta mientras el usuario esté en automática. Al desaparecer automática, un valor guardado ganaría siempre a la preferencia del sistema operativo: una regresión de accesibilidad clara.

Se saca de `detectTier()` y se convierte en una función del nivel efectivo:

```
nivelEfectivo = reducedMotion.matches ? 1 : nivelElegido
```

Se suscribe un listener a la media query, de modo que activarlo o desactivarlo durante la sesión se refleja sin recargar. El techo **no** escribe en la preferencia: al desactivar el movimiento reducido, el usuario recupera su nivel.

Esto añade un cuarto origen conceptual al lado de `SOURCES.AUTO | PREFERENCE | DIAGNOSTIC`. `AUTO` deja de tener sentido como modo persistente y se retira; el nuevo `REDUCED_MOTION` no es degradable ni por el gobernador ni por nada, igual que `DIAGNOSTIC`.

*Nota*: el resultado es mejor que el comportamiento actual, no sólo equivalente. Hoy, tocar el dial anula la preferencia del sistema hasta volver a automática.

### D5 — Velo en degradado para la hoja de ajustes

La muestra de intensidad se dibuja en `#effect-overlay`, dentro de `.container` (`z-index: 1`). Una hoja `fixed` con velo uniforme al 72 % la deja detrás y borrosa, y «comparar dos intensidades» deja de ser posible.

La hoja de ajustes usa un velo propio: transparente en la franja superior —donde vive el nautilus— y opaco junto al panel, con la transición en la zona muerta entre el nautilus y los indicadores. El canvas de efectos se eleva por encima de ese velo mientras la hoja está abierta.

Elevar el canvas se hace con una clase que pone la propia fábrica de hojas, no con `body:has(...)`: `:has()` no llegó a Safari hasta la 15.4 y en un iPhone más antiguo la muestra se quedaría detrás del velo sin que nada lo avisara.

**Corrección tras medir en la app.** La primera versión de esta decisión daba por hecho que un panel de tres filas dejaba libre el centro del nautilus, y que bastaba con no dejar crecer el panel. Las dos suposiciones eran falsas:

```
móvil (555×711)                      escritorio (2048×994)
centro del nautilus   y=387          centro del nautilus   y=514
panel anclado abajo   y=411  ✓       panel anclado abajo   y=694  ✓
   margen: 24 px  ← al límite        panel centrado        y=347  ✗
panel centrado        y=206  ✗
```

El centro del nautilus no cae al 47 % de la ventana sino al 54 %, porque la cabecera empuja hacia abajo: con 300 px de panel quedan 24 px de margen, y en una pantalla de 667 px el margen es negativo. Y `style.css` ya establece que a partir de 769 px las hojas se centran como diálogo, lo que planta el panel justo sobre el centro —y, con el canvas elevado, dibujaría las partículas *sobre el texto del panel*.

Por tanto:

1. **El origen de la muestra no es el centro geométrico del nautilus, sino el centro del área que queda libre sobre el panel.** Se calcula al disparar, con la geometría real de la hoja abierta.
2. **La hoja de ajustes se ancla abajo en todas las anchuras**, saliéndose del patrón de diálogo centrado que siguen el manual y el panel de hábito.

Juntas eliminan la restricción «el panel no puede crecer»: la muestra encuentra su hueco sea cual sea la altura del panel. La inconsistencia del punto 2 se justifica igual que el velo: los ajustes son la única hoja cuyo contenido actúa sobre lo que hay detrás.

*Alternativa descartada*: dibujar la muestra dentro de la propia hoja. Duplicaría la lógica de presupuesto de `engine.js` y la muestra podría divergir de lo que ocurre de verdad, que es justo lo que `main.js:606` evita hoy a propósito.

*Alternativa descartada*: atenuar la hoja durante 700 ms al elegir. Produce un parpadeo en cada toque de la escala.

### D6 — `src/ui/sheet.js` compartido por ajustes y manual, no por el panel de hábito

Ajustes y manual comparten toda la mecánica: velo, panel que sube, trampa de foco, cierre por toque exterior y por `Escape`, devolución del foco al origen y exclusión mutua. Escribir eso dos veces para borrar una copia después no tiene defensa.

El panel de hábito se queda fuera, por la razón que ya documenta `main.js:214`: arrastra estado de hábito, modo crear/editar y posicionamiento de popover en escritorio. La ganancia de meterlo no compensa el acoplamiento.

La fábrica recibe el nodo del panel y opciones (acento del borde, si el velo es uniforme o en degradado) y devuelve `{ open, close, isOpen }`. La exclusión mutua vive en el módulo: abrir una hoja cierra la que estuviera abierta.

### D7 — La escala 1–5 es un `radiogroup`, no un `input[type=range]`

Un slider nativo comunica magnitud continua y su valor no se anuncia con nombre. Aquí hay cinco estados discretos con significado propio, y el requisito de accesibilidad pide que cada posición se exponga con su nombre. Se implementa como cinco `role="radio"` dentro de un `role="radiogroup"`, con navegación por flechas —el mismo patrón que ya tenía `dial.js:78-84`, que se conserva aunque el contenedor cambie de forma—.

Los rótulos de los extremos («calma» / «máximo») dan el sentido de la escala sin obligar a etiquetar las cinco posiciones, que no cabrían.

### D8 — La píldora inferior es hermana de `.container`, no hija del flujo

`.container` es `flex column` con `max-height: 850px` y `.stats` al final. Meter la píldora en el flujo le robaría margen a los indicadores en pantallas cortas.

Se posiciona absoluta respecto al contenedor, con `bottom` calculado sobre `env(safe-area-inset-bottom)` para que en PWA instalada no quede bajo el indicador del sistema. En escritorio, con 900 px de ancho, se mantiene centrada y con el mismo tratamiento discreto.

## Risks / Trade-offs

**[El nivel semilla sube para dispositivos declaradamente limitados: de Lite a Suave]** → Es intencionado y es el motivo del nuevo nivel: hoy esos dispositivos no ven ni una partícula. El riesgo de que no lo sostengan está cubierto por el gobernador de FPS, cuyo suelo (nivel 2, Lite) es exactamente el comportamiento actual de esos aparatos. En el peor caso vuelven donde estaban, midiendo en vez de estimando.

**[La migración corre una sola vez; si falla, el usuario pierde su elección]** → El fallback de cualquier lectura inválida es sembrar desde el dispositivo, nunca dejar la app sin nivel. Se pierde una preferencia, no la sesión ni los datos del reto. Los hábitos viven en otra clave (`habitos_nautilus`) y no se tocan.

**[Cambiar el tema pasa de uno a dos toques]** → Coste asumido y consciente: es el precio de despejar la cabecera. Si en uso resulta molesto, la salida barata es un toque largo sobre el engranaje que alterne el tema sin abrir la hoja; no se implementa ahora para no añadir un gesto oculto sin evidencia de que haga falta.

**[El velo en degradado hace la hoja de ajustes menos «modal» que el manual]** → Dos hojas con velos distintos es una inconsistencia visual deliberada, justificada porque sólo una de ellas tiene contenido que actúa sobre lo que hay detrás. Se mitiga manteniendo idénticos panel, bordes, radios y animación: lo único que difiere es el velo.

**[El renumerado toca seis specs y cinco archivos; un `0` olvidado degrada en silencio]** → El recorte de `tier.set()` a `1..5` convierte cualquier `0` superviviente en `1` (Calma), que es visible de inmediato en vez de silencioso. Los selectores `html[data-tier="0"]` sin renumerar dejan de aplicar, lo que se detecta probando el nivel 1 con `?fx=1`.

**[iOS Safari no expone `navigator.deviceMemory` ni `navigator.vibrate`]** → Sin cambios respecto a hoy: la semilla trata la ausencia de memoria como no-evidencia y la háptica es un no-op silencioso. La escala 1–5 no introduce ninguna dependencia nueva de esas APIs.

## Migration Plan

1. **Motor primero, UI después.** Renumerar `engine.js` y `effects.js` con la cabecera todavía intacta permite verificar los cinco niveles con `?fx=1..5` antes de tocar ningún botón.
2. **Migración de preferencia antes de retirar el dial.** Mientras el dial siga vivo se puede comprobar que un `fx-level` antiguo produce el nivel correcto en la escala nueva.
3. **Hoja compartida antes que sus dos consumidores**, para que ajustes y manual nazcan ya sobre la mecánica definitiva.
4. **Retirada del dial en último lugar**, cuando la escala dentro de ajustes ya funcione.

**Rollback**: revertir el cambio deja `fx-nivel` escrito en los navegadores que ya lo migraron. La versión anterior lee `fx-level`, que ya no existe, y cae en automática — comportamiento correcto y sin errores, aunque el usuario pierda su elección. No hace falta migración inversa.

## Open Questions

- **Rótulos de los extremos de la escala.** «calma / máximo» describe el modelo, pero puede quedar mejor «menos / más» o un par de iconos. Es texto y no afecta a specs, enfoque ni tareas; se decide al ver la fila montada.
- **Orden de las secciones del manual.** Si la instalación va la primera —lo que más se busca al llegar— o la última, después de entender el nautilus. Se resuelve con el contenido delante.
