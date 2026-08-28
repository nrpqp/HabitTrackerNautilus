# HabitTracker Nautilus — CLAUDE.md

## Proyecto

Aplicación web PWA para rastrear hábitos en un reto de 21 días. Los hábitos se visualizan como anillos concéntricos en un SVG radial. Funciona offline como PWA instalable.

## Stack

- **Runtime**: Vanilla JS (ES modules, sin frameworks ni dependencias de runtime)
- **Build**: Vite 8 + vite-plugin-pwa
- **Offline**: Workbox (service worker)
- **Estilos**: CSS puro con variables CSS para dark/light mode
- **Visualización**: SVG generado dinámicamente en JS
- **Persistencia**: `localStorage` (clave `"habits21"`)

## Archivos principales

| Archivo | Rol |
|---|---|
| `src/main.js` | Orquestación: ciclo de vida, sheet de edición, notificaciones |
| `src/store.js` | Modelo de hábito, localStorage, estado de día y racha |
| `src/constants.js` | Geometría del anillo y definición de los 7 elementos |
| `src/render/svg.js` | Construcción y repintado del nautilus; expone `view` |
| `src/fx/engine.js` | Niveles de dispositivo, bucle de canvas, partículas, háptica |
| `src/fx/effects.js` | Cometa de racha, medidor del núcleo, supernova |
| `src/ui/sheet.js` | Mecánica compartida de hoja inferior |
| `src/ui/settings.js` | Hoja de ajustes: tema, nivel de efecto, fuente |
| `src/utils/` | Fechas, color e interpolación, geometría polar |
| `style.css` | Estilos globales y variables de tema |
| `index.html` | Estructura HTML base |
| `vite.config.js` | Configuración de Vite y manifiesto PWA |
| `prototypes/` | Maquetas de exploración visual (fuera del build) |

## Dominio

- Máximo **7 hábitos** simultáneos, cada uno con su anillo en el SVG
- **21 días** por reto, empezando desde la fecha de creación del hábito
- Cada celda del anillo = un día; click para marcar/desmarcar
- Soporta **tema claro/oscuro** con toggle en el header
- Compatible con iOS/Safari y modo PWA instalado

## Comandos

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
```

## Convenciones

- **Idioma**: descripciones en español, identificadores técnicos en inglés
- **Commits**: Conventional Commits — tipo en inglés, descripción en español
  - Ejemplo: `feat: añadir botón de reset por hábito`
- **Ramas**: `v{version}/{tipo}/{descripcion}`
  - Ejemplo: `v0.1.0/feat/reset-habit`
- **Sin frameworks**: no introducir React, Vue, ni librerías de runtime
- **Preferir módulos existentes**: añadir a `src/` antes de crear archivos nuevos

## Flujo de trabajo

1. `/opsx:propose` — proponer un cambio
2. `/01-git-branch` — crear rama para implementarlo
3. Implementar las tareas del change
4. `/02-git-commit` — commitear cada tarea completada
5. `/03-git-merge` — mergear a main cuando esté listo

Para un fix o feature chica ya implementada y probada, sin pasar por
OpenSpec, `/04-git-ship` encadena los pasos 2, 4 y 5 (más el bump de
versión) en una sola confirmación en vez de una por comando. Útil para
iteraciones rápidas tipo "corregí esto, mándalo a main". Los skills
individuales siguen disponibles para cambios que ameriten revisar cada
paso por separado.

## Sistema de efectos

- El SVG se construye **una sola vez** y después sólo se mutan atributos. No
  volver a introducir `innerHTML` en el renderer: mata las animaciones en curso.
- Sólo `src/fx/engine.js` limpia el canvas y pide frames. Un efecto nuevo se
  registra con `addEffect({ draw(ctx, now) })` y devuelve `false` al terminar.
- Cada efecto declara su nivel mínimo. Niveles: 1 Calma, 2 Lite, 3 Suave,
  4 Estándar, 5 Máximo. El nivel 3 es el peldaño que dibuja partículas sin
  blending aditivo ni halo. La detección siembra el valor en el primer
  arranque y el gobernador de FPS puede degradarlo hasta el nivel 2.
- `prefers-reduced-motion` es un techo permanente: sujeta el nivel activo a 1
  sin borrar la preferencia guardada, y gana también a `?fx=`.
- `?fx=1..5` en la URL fuerza el nivel — la única forma de probarlos en un móvil.

## Notas importantes

- Verificar que el SVG radial sigue renderizando tras cambios en `src/render/`
- Probar en iOS/Safari cuando los cambios afecten layout o PWA
- iOS Safari no expone `navigator.vibrate` ni `navigator.deviceMemory`
- El service worker cachea assets — hacer hard refresh al testear el build
