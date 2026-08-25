## 1. Modelo de datos

- [x] 1.1 Añadir `notificationTime: null` como default en `loadHabits()` de `src/store.js` para hábitos sin el campo; verificar que hábitos existentes en localStorage cargan sin errores y con `notificationTime === null`

- [x] 1.2 Incluir `notificationTime` en el objeto hábito inicial de ejemplo (el hábito "Leer 20 mins" que se crea la primera vez); verificar que `saveHabits()` persiste el campo correctamente

## 2. UI de configuración en el panel de edición

- [x] 2.1 Añadir toggle "Activar recordatorio" en el sheet de edición de hábito (`src/render/legend.js` o equivalente); verificar que el toggle refleja el estado actual de `habit.notificationTime` al abrir el panel

- [x] 2.2 Mostrar u ocultar `<input type="time">` condicionalmente según el estado del toggle; verificar que el input aparece al activar y desaparece al desactivar

- [x] 2.3 Añadir nota de limitación de plataforma visible cuando el toggle está activo (texto honesto sobre iOS y app cerrada); verificar que el texto es visible en pantallas pequeñas (mobile)

- [x] 2.4 Guardar `notificationTime` (string "HH:MM") o `null` en el objeto hábito al confirmar el panel de edición; verificar que `saveHabits()` persiste el valor y que reabre el panel con el valor correcto

## 3. Solicitud de permisos

- [x] 3.1 Invocar `Notification.requestPermission()` al activar el toggle si el permiso no es `'granted'`; verificar que la solicitud NO se dispara al abrir la app ni al desactivar el toggle

- [x] 3.2 Manejar permiso denegado: mostrar mensaje informativo y revertir el toggle a desactivado; verificar el comportamiento en un browser con notificaciones bloqueadas para el sitio

## 4. Service Worker — scheduling

- [x] 4.1 Añadir handler `message` en el SW (`vite.config.js` / archivo SW custom) que recibe `{ type: 'SCHEDULE_NOTIFICATIONS', habits: [...] }` y programa un `setTimeout` por hábito con `notificationTime`; verificar que el handler se registra sin errores en la consola del SW

- [x] 4.2 Implementar lógica anti-duplicado en el SW: `Map<habitId, timeoutId>` con `clearTimeout` antes de registrar cada nuevo timeout; verificar que abrir la app dos veces antes de la hora configurada no duplica la notificación

- [x] 4.3 Implementar la llamada a `self.registration.showNotification(habitName, { body: '...' })` dentro del timeout; verificar que la notificación aparece con el nombre correcto del hábito

- [x] 4.4 Suprimir la notificación si el hábito ya está marcado como completado al momento del disparo; verificar que no aparece notificación para un hábito ya marcado

## 5. Integración en arranque de app

- [x] 5.1 En `src/main.js`, tras cargar los hábitos, enviar `postMessage` al SW con los hábitos que tienen `notificationTime` activo; verificar que el mensaje llega al SW (log en consola del SW)

- [x] 5.2 Verificar integración completa: configurar un recordatorio a 2 minutos en el futuro, abrir la app, esperar y confirmar que la notificación aparece en navegador de escritorio, Android (PWA instalada) y browser móvil
