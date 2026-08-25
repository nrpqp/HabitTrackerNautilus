## Why

El usuario puede olvidar marcar sus hábitos dentro de la ventana de 2 días disponible. Un recordatorio opcional por hábito, entregado localmente sin ningún servidor, cierra ese hueco sin comprometer el principio de privacidad total de la app (cero datos remotos, cero backend).

## What Changes

- Cada hábito puede tener un horario de recordatorio opcional (`notificationTime: "HH:MM" | null`).
- El panel de edición de hábito incluye un toggle "Activar recordatorio" y un selector de hora que aparece al activarlo.
- Al activar, la app solicita permiso de notificaciones al navegador/SO si aún no lo tiene.
- El service worker programa un `setTimeout` para disparar la notificación a la hora configurada del día actual, cuando la app está activa o el SW está vivo.
- Si el hábito del día ya está marcado como completado, la notificación no se dispara.
- La notificación muestra el nombre del hábito y un mensaje de acción directa.
- El campo `notificationTime` se persiste en localStorage junto al resto de datos del hábito.
- La UI informa claramente la limitación: el recordatorio funciona cuando la app fue abierta ese día o el SW sigue activo; no garantiza entrega con la app completamente cerrada en iOS.

## Capabilities

### New Capabilities

- `habit-notifications`: Configuración y entrega de recordatorios locales por hábito, sin backend.

### Modified Capabilities

_(ninguna — el modelo de datos del hábito se extiende, pero los requisitos de marcado y visualización no cambian)_

## Impact

- `src/store.js`: añadir campo `notificationTime` al objeto hábito; migración transparente (campo ausente = null)
- `src/render/legend.js` o sheet de edición: añadir toggle + time input
- `vite.config.js` / SW: añadir lógica de scheduling de notificaciones en el service worker
- `src/main.js`: inicializar el scheduling al cargar la app
- Permisos: `Notification.requestPermission()` solo se invoca al activar el toggle, nunca al abrir la app
- Sin nuevas dependencias de runtime

## No incluido en este cambio

- Push notifications remotas (requeriría servidor)
- Notificaciones garantizadas con app completamente cerrada en iOS
- Notificaciones de múltiples horarios por hábito
- Snooze o acciones desde la notificación
