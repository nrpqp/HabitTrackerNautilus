## Context

Los labels de hábitos se generan en `src/render/svg.js` usando elementos `<text>` con un `transform="rotate(...)"` fijo. El ángulo de rotación actual (150°) produce texto en sentido contrario (boca abajo) respecto a la lectura natural. Además el texto es recto, sin seguir la curvatura del anillo.

El hueco donde van los labels abarca de 210° a 270° (bisectriz 240°), en la zona superior-izquierda del SVG. El radio de cada label es el punto medio del anillo (`rMid = rIn + cellThickness / 2`).

## Goals / Non-Goals

**Goals:**
- Texto de cada label curva siguiendo el arco del anillo en el hueco.
- Texto legible desde el exterior (no invertido) sin cambiar el resto del SVG.
- Área táctil de al menos 44×44 px mantenida para cada label.

**Non-Goals:**
- Cambiar fuente, tamaño o color de los labels.
- Cambiar la lógica de ordenación por longitud de nombre.
- Afectar la navegación al panel de edición de hábito.

## Decisions

### Decisión: usar `<textPath>` con arco SVG en `<defs>`

**Alternativa A — Mantener `<text>` con rotación corregida.**  
Sencillo: cambiar `rotAngle` de 150° a −30° (= 330°) corregiría la inversión. No da curvatura.

**Alternativa B — `<textPath>` sobre un arco definido en `<defs>`** ← elegida.  
Corrige orientación y añade curvatura en una sola técnica estándar de SVG. El arco de cada anillo se define como `<path id="label-arc-{habitId}">` en `<defs>`; luego `<text><textPath href="#label-arc-{habitId}" startOffset="50%" text-anchor="middle">` centra automáticamente el nombre en el hueco.

**Dirección del arco:**  
En el sistema de coordenadas del proyecto (`polarToCartesian` con 0°=derecha, ángulos crecen en sentido horario porque el eje Y de SVG baja), el hueco está en el cuadrante superior-izquierdo (210°–270°). Para que el texto sea legible desde el exterior en esa zona se necesita un arco en sentido horario (`sweep-flag=1`), partiendo desde 210° y llegando a 270°. Este comportamiento es estándar en SVG: en la mitad superior de un círculo, `sweep=1` produce texto leíble desde fuera.

**Áreas táctiles:**  
El `<rect class="habit-label-hit">` existente se mantiene pero se le aplica el mismo arco de referencia via `transform` para seguir cubriendo el label. Alternativamente, se añade `pointer-events="all"` al `<text>` con textPath y se elimina el rect; esto simplifica el DOM. Se elige **mantener el rect** para no romper la lógica de eventos existente y respetar los 44×44 px en táctil.

### Decisión: radio del arco = `rIn + 2` (borde interno + margen)

El label queda dentro del anillo, pegado al borde interior, que es la convención actual. El `dy` positivo en el textPath puede usarse si es necesario un ajuste vertical para centrar visualmente el texto en el rango `[rIn, rOut]`.

## Risks / Trade-offs

- **Compatibilidad `href` en Safari** → Safari ≥ 12 soporta `href` en `<textPath>` inline; versiones anteriores solo soportan `xlink:href`. La app ya requiere ES modules (Safari 14+), por lo que `href` es seguro. No usar `xlink:href`.
- **Longitud de nombre vs arco de 60°** → Un nombre de 15 caracteres a `labelFontSize` de 9–12 px puede exceder los 60° del hueco en anillos internos (radio pequeño). El texto se truncará visualmente por el propio hueco (las celdas del arco lo cubren). Mitigación: el límite de 15 chars ya existe; el efecto visual es aceptable dado el radio mínimo definido en `constants.js`.
- **Hit-rect no curvo** → El `<rect>` sigue siendo rectangular; en mobile el área táctil puede no coincidir perfectamente con el texto curvo. Dentro del margen aceptable (la diferencia angular es pequeña).
