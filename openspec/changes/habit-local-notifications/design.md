## Context

La app es una PWA con service worker gestionado por Workbox (vite-plugin-pwa). El SW actual cachea assets para soporte offline pero no tiene lógica de negocio propia. La Notifications API del navegador requiere permiso explícito del usuario y solo funciona en contexto seguro (HTTPS o localhost).

## Goals / Non-Goals

**Goals:**
- Entregar notificaciones locales sin ningún servidor ni push subscription
- Scheduling basado en `setTimeout` dentro del SW para el día actual
- Permisos solicitados bajo demanda, nunca en el arranque de la app

**Non-Goals:**
- Entrega garantizada con app cerrada (requiere Push API + servidor)
- Notificaciones en iOS con app no instalada como PWA
- Múltiples recordatorios por hábito
- Acciones o respuestas desde la notificación

## Decisions

### 1. setTimeout en el SW en lugar de lógica en el main thread

El main thread solo vive mientras la pestaña está abierta. El SW puede sobrevivir más tiempo (especialmente en Android Chrome). Al registrar el setTimeout en el SW a través de `postMessage`, las notificaciones tienen más chances de llegar aunque el usuario minimice el navegador.

_Alternativa descartada_: scheduling solo en el main thread — demasiado frágil, se cancela al cambiar de pestaña.

_Alternativa descartada_: Periodic Background Sync — soporte limitado, requiere condiciones de red, comportamiento no determinista para notificaciones de hora exacta.

### 2. Scheduling diario al abrir la app

Al cargar la app, `main.js` lee todos los hábitos con `notificationTime` y envía un mensaje al SW para programar los timeouts del día. Esto cubre el caso de uso principal: el usuario abre la app por la mañana y el recordatorio llega más tarde ese mismo día.

El scheduling no persiste entre reinicios del SW. Si el SW muere y se relanza (sin que el usuario abra la app), los timeouts se pierden — es la limitación conocida y comunicada en la UI.

### 3. Extensión del modelo de datos del hábito

Se añade `notificationTime: string | null` al objeto hábito en localStorage. La migración es transparente: `loadHabits()` ya itera sobre todos los hábitos para asignar defaults (color, startDate); se añade `h.notificationTime = h.notificationTime ?? null` en ese mismo bucle.

### 4. UI en el sheet de edición existente

El panel de edición por hábito (sheet/bottom-sheet actual en `legend.js`) recibe el toggle + time input. No se crea un nuevo panel. El input `<input type="time">` es nativo, sin dependencias, y tiene buen soporte cross-platform.

### 5. Comunicación main → SW vía postMessage

```
main.js  →  postMessage({ type: 'SCHEDULE_NOTIFICATIONS', habits: [...] })
SW       →  recibe, calcula delay, setTimeout → self.registration.showNotification()
```

El SW no accede a localStorage directamente (está en otro contexto). El main le pasa solo los datos necesarios: `{ habitId, habitName, notificationTime, isTodayDone }`.

## Risks / Trade-offs

- **iOS limitación**: iOS 16.4+ soporta notificaciones en PWA instalada, pero solo en foreground o background inmediato. Si el usuario no abre la app ese día, no recibirá el recordatorio.  
  → Se comunica en la UI con texto honesto. No hay workaround sin push.

- **SW lifecycle**: El SW puede ser terminado por el browser antes de que dispare el setTimeout.  
  → Limitación aceptada y documentada. El scheduling se recrea cada vez que el usuario abre la app.

- **Duplicación de notificaciones**: Si el usuario abre la app múltiples veces antes de la hora configurada, el SW podría registrar múltiples timeouts para el mismo hábito.  
  → El SW lleva un registro en memoria (`Map<habitId, timeoutId>`) y llama a `clearTimeout` antes de registrar uno nuevo.
