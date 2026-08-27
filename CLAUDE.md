# HabitTracker Nautilus — CLAUDE.md

## Proyecto

Aplicación web PWA para rastrear hábitos en un reto de 21 días. Los hábitos se visualizan como anillos concéntricos en un SVG radial. Funciona offline como PWA instalable.

## Stack

- **Runtime**: Vanilla JS (ES modules, sin frameworks ni dependencias de runtime)
- **Build**: Vite 8 + vite-plugin-pwa
- **Offline**: Workbox (service worker)
- **Estilos**: CSS puro con variables CSS para dark/light mode
- **Visualización**: SVG generado dinámicamente en JS
- **Persistencia**: `localStorage` (clave `"habitos_nautilus"`)

## Archivos principales

| Archivo | Rol |
|---|---|
| `src/main.js` | Orquestación: ciclo de vida, sheet de edición, notificaciones |
| `src/store.js` | Modelo de hábito, localStorage, estado de día y racha |
| `src/constants.js` | Geometría del anillo y definición de los 7 elementos |
| `src/render/svg.js` | Construcción y repintado del nautilus; expone `view` |
| `src/fx/engine.js` | Niveles de dispositivo, bucle de canvas, partículas, háptica |
| `src/fx/effects.js` | Cometa de racha, medidor del núcleo, supernova |
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

## Sistema de efectos

- El SVG se construye **una sola vez** y después sólo se mutan atributos. No
  volver a introducir `innerHTML` en el renderer: mata las animaciones en curso.
- Sólo `src/fx/engine.js` limpia el canvas y pide frames. Un efecto nuevo se
  registra con `addEffect({ draw(ctx, now) })` y devuelve `false` al terminar.
- Cada efecto declara su nivel mínimo. Niveles: 0 Calma, 1 Lite, 2 Estándar,
  3 Máximo. Se detectan al arrancar y el gobernador de FPS puede degradarlos.
- `?fx=0..3` en la URL fuerza el nivel — la única forma de probarlos en un móvil.

## Notas importantes

- Verificar que el SVG radial sigue renderizando tras cambios en `src/render/`
- Probar en iOS/Safari cuando los cambios afecten layout o PWA
- iOS Safari no expone `navigator.vibrate` ni `navigator.deviceMemory`
- El service worker cachea assets — hacer hard refresh al testear el build
