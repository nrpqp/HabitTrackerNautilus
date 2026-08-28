## Why

El prototipo de Claude Design (`prototypes/prototipoclaudedesign/`) propone una identidad visual coherente —fondo espacial profundo, acentos cian y ámbar, espirales doradas, superficies de cristal y tipografía Space Grotesk / IBM Plex Mono— que da al nautilus el marco que hoy le falta: la app actual lo presenta sobre una tarjeta blanca genérica, con botones cuadrados de emoji, un `alert()` nativo para las instrucciones de instalación y ningún resumen de progreso global.

Este cambio adopta esa identidad como sistema visual de la aplicación, sin tocar la rueda de 21 días —el componente central del producto— y sin perder ninguna funcionalidad existente.

## What Changes

- **Sistema de tokens visuales**: nueva paleta, tipografía y superficies expresadas como variables CSS, redefinidas para los dos temas (oscuro = espacial del prototipo; claro = su contraparte luminosa). El toggle de tema se conserva.
- **Fondo escénico**: capa decorativa de círculos concéntricos y espirales logarítmicas doradas detrás de todo el contenido, más los degradados radiales cian (arriba) y ámbar (abajo). Es puramente decorativa (`aria-hidden`, `pointer-events: none`) y vive **fuera** de `#svg-container`.
- **Cabecera**: los cuatro botones cuadrados pasan a botones circulares con borde y halo de color; el título adopta Space Grotesk con `letter-spacing` amplio y sombra luminosa.
- **Tarjetas de estadísticas**: nueva fila de tres tarjetas de cristal bajo la rueda — **Racha**, **Efectividad** y **Activos** — con icono SVG inline, cifra grande en ámbar y etiqueta monoespaciada en versalitas.
- **Sheets y controles**: el panel de hábito, la rueda de intensidad de efectos, el tooltip y el toast de milestone adoptan el lenguaje del prototipo (cristal oscuro, borde superior de acento, esquinas de 30 px, backdrop difuminado).
- **Hoja de información**: el `alert()` nativo del botón ℹ️ se sustituye por un sheet con el mismo contenido de instalación, con el estilo del sistema.
- **Tipografía**: Outfit → Space Grotesk (interfaz) + IBM Plex Mono (cifras y etiquetas), servidas por Google Fonts y precacheadas por el service worker para no romper el modo offline.

### No incluido en este cambio

- **La rueda de 21 días queda intacta al 100 %**: no se modifica `src/render/svg.js`, ni la geometría, ni las celdas, ni los labels en escalera, ni el medidor del núcleo, ni las interacciones. Tampoco se recolorean los tokens de tema que la rueda consume (`--empty-cell-*`, `--locked-cell-*`, `--old-cell-*`, `--center-*`, `--guide-stroke`, `--day-label-fill`): conservan exactamente sus valores actuales en ambos temas, y el resto del sistema visual se construye alrededor de ellos.
- No se toca `src/fx/` (motor de efectos, partículas, niveles de intensidad). Solo se restyliza el marcado del selector radial.
- No cambian el modelo de datos ni la clave de `localStorage`, salvo la lectura de las estadísticas, que se derivan de los datos existentes sin persistir nada nuevo.
- No se añade la opción de "duración del reto" (21/30/66) del prototipo: el reto sigue siendo de 21 días.
- No se sustituye el selector de elemento por el selector de color libre del prototipo.
- No se elimina el tema claro ni el toggle.

## Capabilities

### New Capabilities

- `visual-identity`: sistema visual de la aplicación — tokens de color y tipografía por tema, fondo escénico decorativo, superficies de cristal, botones circulares de cabecera y la hoja de información. Incluye la garantía explícita de que el contrato de tokens de la rueda no cambia.
- `progress-stats`: fila de tres indicadores derivados del estado de los hábitos (racha, efectividad y hábitos activos), con sus definiciones de cálculo y su comportamiento cuando no hay datos.

### Modified Capabilities

Ninguna. Los cambios sobre `habit-edit-sheet`, `effects-preference`, `daily-completion` y `svg-staircase-labels` son puramente de presentación: sus requisitos de comportamiento se mantienen tal cual.

## Impact

| Archivo | Impacto |
|---|---|
| `style.css` | Reescritura amplia: tokens, tipografía, cabecera, superficies, sheets, responsive. Los tokens de la rueda se mantienen literales. |
| `index.html` | Capa decorativa de fondo, fila de estadísticas, sheet de información, cambio de fuentes. |
| `src/main.js` | Render de las estadísticas tras cada cambio de estado; el botón ℹ️ abre el sheet en vez de `alert()`. |
| `src/store.js` | Tres selectores de solo lectura para las estadísticas. |
| `src/render/svg.js`, `src/fx/**` | **Sin cambios.** |
| `src/sw.js` | Dos rutas `CacheFirst` para las fuentes de Google Fonts. Hoy no hay ninguna: el proyecto usa `injectManifest`, así que las fuentes nunca se han cacheado. |
| `vite.config.js` | Sin cambios previstos; `theme_color` del manifiesto se revisa contra la nueva base oscura. |

**iOS/Safari**: `backdrop-filter` requiere prefijo `-webkit-`; las tarjetas y sheets llevan un color de fondo opaco de respaldo por si el navegador no lo soporta. La capa decorativa es SVG estático sin animación, para no penalizar dispositivos de nivel 0. El `padding-bottom` de la fila de estadísticas respeta `env(safe-area-inset-bottom)`.

**PWA offline**: al cambiar de familia tipográfica hay que actualizar el `runtimeCaching` de Workbox; si las fuentes no cargan, la app debe seguir legible con la pila de sistema de respaldo.
