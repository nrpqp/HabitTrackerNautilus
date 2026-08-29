## Why

El núcleo hoy resume el día como una cifra (`2/4 hoy`). El usuario pidió que,
en cambio, el reposo del centro se sienta como parte del sistema elemental
del resto de la app: que los elementos de los hábitos ya completados hoy se
vean mezclándose visualmente en el núcleo, en vez de reducir el avance del
día a un número. La cifra funciona, pero no conecta con la identidad
elemental (fuego, agua, planta...) que ya define cada anillo.

## What Changes

- El **reposo del centro** deja de mostrar el contador `hecho/activos`: pasa
  a mostrar una mezcla visual construida con los colores elementales de los
  hábitos ya marcados hoy. Es persistente — se ve mientras dure el día, no
  un destello que aparece y se apaga —, y crece a medida que se marcan más
  hábitos.
- Sin hábitos completados hoy, el núcleo queda en un estado neutro (sin
  mezcla, equivalente al "vacío" actual).
- Las presentaciones transitorias que ya "toman prestado" el centro —racha,
  apuntado del selector radial, mensaje de "sin retos"— **no cambian**:
  siguen mostrando su texto encima, y al terminar devuelven el centro a la
  mezcla (no a la cifra, que deja de existir como estado de reposo).
- El medidor de arcos alrededor del núcleo (uno por hábito, ya existente)
  y el brillo que crece con la proporción del día (`setCoreCharge`) **no
  cambian** — siguen siendo la lectura numérica exacta para quien la
  necesita; la mezcla es el lenguaje visual nuevo, no un reemplazo de esos
  dos.
- La celebración de día completo (supernova) tampoco cambia.

## Capabilities

### New Capabilities
(ninguna)

### Modified Capabilities
- `daily-completion`: los requisitos "Medidor del día en el núcleo
  central" y "El estado del día es el reposo del centro" cambian — el
  reposo del centro pasa de una cifra a una mezcla visual elemental de los
  hábitos completados hoy. Los demás requisitos de esa capability (carga
  hacia el núcleo, celebración de día completo) no cambian de
  comportamiento, sólo se ajustan las referencias a "la cuenta" donde
  corresponda.

## Impact

- **`src/main.js`**: `refreshDayCore()` deja de llamar `setCoreLabel` con
  la cifra en reposo; en su lugar actualiza la mezcla. `showStreakInCore` y
  el resto de usos transitorios de `setCoreLabel` no cambian.
- **`src/render/svg.js`**: el núcleo (`centerCircle`) dentro de `defsEl`
  gana los elementos SVG de la mezcla (a decidir su forma exacta en
  design.md); sigue construyéndose una sola vez y sólo mutando atributos,
  conforme al sistema de efectos del proyecto.
- **`src/fx/effects.js`**: posible nueva función para actualizar la mezcla,
  hermana de `setCoreCharge`; no se toca `chargeToCore`, `pulseCore` ni
  `supernova`.
- **`src/utils/color.js`**: se reutiliza `elementColor`/`elementRGB`, ya
  existentes; sin cambios.
- **Sistema de efectos (niveles 1-5)**: la mezcla debe declarar su
  comportamiento en cada nivel, incluyendo `prefers-reduced-motion`, según
  la convención ya establecida en CLAUDE.md.
- **No hay cambios de esquema en `localStorage`**: la mezcla se deriva de
  `habit.progress` tal cual existe hoy.

## No incluido en este cambio

- No se toca el medidor de arcos alrededor del núcleo ni el brillo de
  `setCoreCharge` — siguen mostrando el avance exacto en paralelo a la
  mezcla.
- No se rediseña la celebración de día completo (supernova) ni el cometa
  de racha.
- No se resuelve aquí una preferencia de usuario para volver al modo
  numérico anterior — si se pide más adelante, es un cambio aparte.
- No se corrige en este change el desvío de spec ya detectado en
  `progress-stats` (tarjeta "Activos"/"Hoy") — es una capability distinta,
  se corrige por separado.
