## Purpose

Permite al usuario configurar un horario de recordatorio local por hábito, entregado a través del sistema de notificaciones del navegador o del SO, sin necesidad de backend ni datos remotos.

## Requirements

### Requirement: Configuración opcional de recordatorio por hábito

El sistema SHALL permitir activar o desactivar un recordatorio diario para cada hábito de forma independiente, con una hora específica elegida por el usuario.

#### Scenario: Activar recordatorio desde el panel de edición

- **WHEN** el usuario activa el toggle de recordatorio en el panel de edición de un hábito
- **THEN** el sistema muestra un selector de hora con valor por defecto (08:00) y solicita permiso de notificaciones si aún no fue concedido

#### Scenario: Desactivar recordatorio

- **WHEN** el usuario desactiva el toggle de recordatorio en el panel de edición
- **THEN** el sistema elimina el horario configurado y cancela cualquier notificación pendiente para ese hábito

#### Scenario: Guardar horario de recordatorio

- **WHEN** el usuario guarda el hábito con el recordatorio activado y una hora seleccionada
- **THEN** el sistema persiste el campo `notificationTime` en localStorage junto al resto de datos del hábito

### Requirement: Solicitud de permiso de notificaciones

El sistema SHALL solicitar permiso de notificaciones al sistema operativo únicamente cuando el usuario activa el toggle de recordatorio por primera vez, nunca al abrir la app.

#### Scenario: Permiso concedido

- **WHEN** el usuario activa el toggle y el SO concede el permiso
- **THEN** el sistema continúa con la configuración del horario normalmente

#### Scenario: Permiso denegado

- **WHEN** el usuario activa el toggle y el SO deniega el permiso
- **THEN** el sistema muestra un mensaje informando que las notificaciones están bloqueadas e instruye cómo habilitarlas en el navegador; el toggle vuelve al estado desactivado

### Requirement: Entrega de la notificación

El sistema SHALL disparar una notificación local a la hora configurada del día actual para cada hábito con recordatorio activo, siempre que el hábito de ese día no esté ya marcado como completado.

#### Scenario: Notificación a tiempo con hábito pendiente

- **WHEN** llega la hora configurada, el SW está activo, y el hábito del día no está marcado
- **THEN** el sistema dispara una notificación local con el nombre del hábito

#### Scenario: Notificación suprimida por hábito completado

- **WHEN** llega la hora configurada y el hábito del día ya está marcado como completado
- **THEN** el sistema no dispara ninguna notificación

#### Scenario: Scheduling al abrir la app

- **WHEN** el usuario abre la app durante el día y existe un hábito con recordatorio activo cuya hora aún no pasó
- **THEN** el sistema programa la notificación para esa hora del día mediante el service worker

### Requirement: Honestidad sobre limitaciones de entrega

El sistema SHALL informar al usuario que la entrega del recordatorio no está garantizada cuando la app está completamente cerrada, especialmente en iOS.

#### Scenario: Aviso de limitación en la configuración

- **WHEN** el usuario activa un recordatorio en cualquier plataforma
- **THEN** la UI muestra una nota explicando que el recordatorio funciona mientras la app estuvo abierta ese día o el service worker permanece activo, y que en iOS la entrega en background es limitada

### Requirement: Compatibilidad con datos existentes

El sistema SHALL cargar hábitos existentes sin `notificationTime` como si tuvieran el recordatorio desactivado, sin pérdida de datos ni errores.

#### Scenario: Migración transparente de hábito existente

- **WHEN** se carga un hábito desde localStorage que no tiene el campo `notificationTime`
- **THEN** el sistema lo trata como `notificationTime: null` (recordatorio desactivado) sin modificar ni perder ningún otro dato del hábito
