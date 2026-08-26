## Context

El SVG se genera completamente por innerHTML en `renderSVG()` en cada interacción. Esto elimina del DOM cualquier animación CSS activa en paths del SVG. El modelo de hábito persiste en localStorage; cualquier campo nuevo necesita migración hacia atrás. Hay un máximo de 7 hábitos y 21 días fijos. Ver `proposal.md` para motivación.

## Goals / Non-Goals

**Goals:**

- Identidad elemental persistida en el modelo de dato sin romper hábitos existentes.
- Progresión cromática calculada en runtime (sin almacenar colores).
- Animaciones por fase en CSS que sobrevivan al pattern de re-render total del SVG.
- Partículas en un overlay de canvas desacoplado del ciclo de renderizado del SVG.
- Celebración de milestone sin estado adicional en localStorage.
- Selector de elemento en el sheet de edición reemplazando los swatches de color.

**Non-Goals:**

- Optimizar el ciclo de re-render del SVG (diff rendering).
- Animaciones WebGL o partículas 3D.
- Soporte para más de 7 elementos o paletas personalizadas.

## Decisions

### 1. Canvas overlay independiente para partículas

**Decisión**: Un `<canvas id="effect-overlay">` con `position: absolute` sobre el SVG container, con `pointer-events: none`.

**Por qué**: El re-render completo del SVG (innerHTML replace) elimina cualquier animación que viva dentro del SVG. Al separar los efectos efímeros en un canvas hermano, el SVG puede re-renderizarse libremente sin interrumpir partículas en vuelo. Alternativa descartada: overlay de divs CSS — el canvas da control total de timing y formas arbitrarias con bajo costo DOM.

### 2. Colores calculados en runtime, no almacenados

**Decisión**: La función `elementColor(element, dayIndex)` calcula `hsl(h, s, l)` por interpolación lineal en `t = dayIndex / 20` cada vez que se renderiza el SVG.

**Por qué**: Almacenar 21 colores por hábito en localStorage añadiría complejidad innecesaria y sincronización. La interpolación es O(1) y trivialmente correcta. Si se cambia el elemento, el recálculo es automático sin migraciones. Alternativa descartada: precalcular y cachear colores en memoria — agrega estado y no resuelve el problema más simple.

### 3. Animaciones CSS por clase de fase, no por atributo inline

**Decisión**: Cada path completado recibe una clase CSS (`phase-1`, `phase-2`, `phase-3`) según `Math.floor(dayIndex / 7)`. Los keyframes se definen una sola vez en `style.css`.

**Por qué**: CSS animations se reinician cuando el elemento es re-insertado en el DOM (por el innerHTML replace). Dado que el re-render ocurre típicamente una vez por click y el usuario no ve el frame intermedio (es síncrono y rápido), el restart es imperceptible. Mantener las animaciones en CSS evita JS animation loops para el estado persistente. `prefers-reduced-motion` se maneja con un bloque `@media` que elimina todas las animaciones de fase de una sola vez.

### 4. Definición de elementos en `constants.js`

**Decisión**: El array `ELEMENTS` en `constants.js` define cada elemento como objeto `{ id, name, icon, h0, s0, l0, h1, s1, l1, particleType, speed, gravity }`. El orden del array determina la auto-asignación por índice.

**Por qué**: Centralizar las constantes de elemento en el mismo módulo que `DEFAULT_COLORS`, `MAX_HABITS`, etc., mantiene la convención existente y evita imports cruzados. Alternativa descartada: objeto keyed por id — el array hace que la auto-asignación por índice sea directa (`ELEMENTS[habits.length % ELEMENTS.length]`).

### 5. `DEFAULT_COLORS` se depreca sin eliminar

**Decisión**: `DEFAULT_COLORS` se mantiene en `constants.js` pero deja de usarse al crear hábitos. El campo `color` en el modelo del hábito se convierte en derivado (no se guarda); el color del anillo se obtiene siempre de `elementColor(habit.element, dayIndex)`.

**Por qué**: Eliminar `color` del modelo sería un breaking change que requiere una migración más agresiva. Al dejarlo en el modelo pero ignorarlo en el render, los hábitos existentes que tienen `color` guardado no se corrompen. `DEFAULT_COLORS` puede eliminarse en un refactor futuro.

### 6. Milestone: detección en el handler de click, no en el render

**Decisión**: La función que maneja el toggle de una celda compara `dayIndex === 6 || 13 || 20` y `habit.progress[dayIndex]` pasó de `false` a `true` para disparar el milestone. No se almacena ningún estado de milestone.

**Por qué**: Los milestones son momentos puntuales (el instante de completar el día). Detectarlos en el toggle handler es directo y no añade persistencia. Calcularlos en el render sería incorrecto (el render ocurre también en load, donde no debe dispararse la celebración).

### 7. Migración de hábitos existentes: `loadHabits` con fallback

**Decisión**: En `store.js`, `loadHabits` aplica un `.map()` que asigna `element` cuando el campo está ausente, usando el índice del hábito en el array: `h.element ?? ELEMENTS[i % ELEMENTS.length].id`.

**Por qué**: Los usuarios existentes tienen hábitos sin campo `element`. La migración debe ser transparente, silenciosa y en el punto de carga, no en el guardado. Alternativa descartada: migración en `saveHabits` — complicaría el flujo de escritura y podría sobrescribir elementos antes de que el usuario los personalice.

## Risks / Trade-offs

- **Restart de animaciones en cada re-render** → Las animaciones de fase 2 y 3 se reinician en cada click. En la práctica un click ocurre máximo una vez por segundo y el restart sincrónico es imperceptible. Si se vuelve un problema, se puede optimizar con diff render (fuera de scope).

- **Canvas overlay en iOS Safari** → El canvas con `requestAnimationFrame` funciona en iOS pero puede drop frames si el dispositivo está bajo carga. Las partículas son pocas (6–22) y de vida corta (< 700ms), por lo que el impacto debería ser mínimo. Validar en dispositivo físico en la fase de QA.

- **`color` campo obsoleto en localStorage** → Los hábitos existentes seguirán teniendo `color` guardado, ocupando espacio inútil. Aceptable por ahora; no causa errores funcionales.

- **`feTurbulence` y SVG filters descartados** → Se evaluó usar SVG filters para efectos de fuego/agua, pero tienen alto costo GPU en iOS Safari. La decisión de usar CSS animations + canvas particles es la opción de rendimiento segura.

## Migration Plan

1. `loadHabits` asigna `element` a hábitos existentes sin ese campo antes de devolverlos — migración transparente en carga.
2. El campo `color` del hábito pasa a ser ignorado en `renderSVG`; no requiere limpieza inmediata en localStorage.
3. No hay cambios de esquema de localStorage que requieran versioning; el campo nuevo es aditivo.
4. Rollback: si se revierte el cambio, los hábitos tendrán un campo `element` extra inerte que no rompe la versión anterior.

## Open Questions

- ¿El selector de elemento en el sheet debería mostrar el nombre del elemento además del ícono, o solo el ícono? (No cambia specs ni arquitectura; decisión de UX menor.)
