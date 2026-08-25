## Why

Los nombres de los hábitos en el SVG radial aparecen girados 180° respecto a la orientación correcta (se leen al revés o boca abajo), y están renderizados como texto recto sin seguir la curvatura del anillo. El efecto resultante rompe la integración visual entre el label y el arco al que pertenece.

## What Changes

- El texto de cada label curva siguiendo el arco del anillo correspondiente en la zona del hueco (~60° entre 210° y 270°), usando `<textPath>` sobre un arco SVG definido en `<defs>`.
- Se corrige la dirección del arco de forma que el texto se lea correctamente (no invertido) desde el exterior del SVG.
- El hit-rect táctil se adapta a la nueva posición curva del texto para mantener la superficie táctil mínima de 44×44 px.

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `svg-staircase-labels`: los labels pasan de ser texto recto con rotación fija a texto curvo alineado con el arco del hueco; se añaden requisitos de orientación correcta y curvatura.

## Impact

- `src/render/svg.js`: sustitución del bloque de generación de `labelsHTML` (texto recto + rect hit) por textPath sobre arcos definidos en `<defs>`.
- No hay cambios en `localStorage`, serviceworker, CSS ni en ningún otro módulo.
- Compatible con iOS/Safari: `<textPath>` y `href` en SVG inline son soportados desde Safari 12+; verificar que se usa `href` (no `xlink:href` que está deprecated).

## No incluido en este cambio

- Cambios en el orden de los labels (escalera por longitud de nombre) — ya implementado.
- Cambios en el límite de 15 caracteres del nombre — ya implementado.
- Ajuste del tamaño de fuente, color, o fuente tipográfica de los labels.
- Animaciones o transiciones del texto.
