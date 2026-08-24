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
| `main.js` | Toda la lógica: hábitos, SVG, localStorage, UI, eventos |
| `style.css` | Estilos globales y variables de tema |
| `index.html` | Estructura HTML base |
| `vite.config.js` | Configuración de Vite y manifiesto PWA |

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
- **Preferir `main.js`**: cambios de lógica van ahí antes de crear nuevos archivos

## Flujo de trabajo

1. `/opsx:propose` — proponer un cambio
2. `/01-git-branch` — crear rama para implementarlo
3. Implementar las tareas del change
4. `/02-git-commit` — commitear cada tarea completada
5. `/03-git-merge` — mergear a main cuando esté listo

## Notas importantes

- Verificar que el SVG radial sigue renderizando tras cambios en `main.js`
- Probar en iOS/Safari cuando los cambios afecten layout o PWA
- El service worker cachea assets — hacer hard refresh al testear el build
