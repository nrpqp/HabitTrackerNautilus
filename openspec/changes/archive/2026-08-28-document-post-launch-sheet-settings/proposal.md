## Why

Tras archivar `improve-add-habit-sheet-ux`, se shippearon directo a `main` varias correcciones y funcionalidades chicas surgidas de probar la app en un dispositivo real (botón de borrar caché, versión visible en el manual, botón de guardado explícito al renombrar un hábito, y la generalización del bloqueo de scroll/teclado a todo el sheet, no sólo al crear). Ninguna pasó por `/opsx:propose`, así que las specs principales quedaron desactualizadas respecto al comportamiento real de la app. Este cambio documenta retroactivamente ese comportamiento ya implementado y en producción, sin tocar código.

## What Changes

- `app-settings`: se documenta el botón "Borrar caché" en la hoja de ajustes (limpia Cache Storage y desregistra el service worker, sin tocar los datos del usuario).
- `app-manual`: se documenta el número de versión visible al final del manual.
- `habit-edit-sheet`:
  - Se documenta el botón de guardado explícito para renombrar un hábito en modo edición (bloqueado hasta que el nombre cambia).
  - El requisito de "sin scroll ni rebote" se generaliza: ya no es exclusivo del modo creación, aplica a todo el panel de hábito (creación y edición comparten el mismo sheet y el mismo bloqueo).

## Capabilities

### Modified Capabilities

- `app-settings`: nuevo requirement para el botón de borrar caché.
- `app-manual`: nuevo requirement para la versión visible.
- `habit-edit-sheet`: el requirement de edición de nombre suma el botón de guardado; el requirement del panel contextual generaliza el bloqueo de scroll; el requirement de añadir hábito pierde el texto de scroll que ahora vive en el requirement general (evita duplicar el mismo requisito en dos lugares).

## Impact

- Sólo artefactos de planificación (`openspec/specs/`). No hay cambios de código: lo que describe este change ya está implementado y en producción desde los commits `a83ac8b`, `919dd5f` y `67a688f` en `main`.
