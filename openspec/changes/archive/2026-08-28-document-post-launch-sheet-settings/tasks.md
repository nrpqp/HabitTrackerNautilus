## 1. Verificación retroactiva (ya implementado y en producción)

- [x] 1.1 Botón "Borrar caché" en Ajustes: verificado en `main` (commit `a83ac8b`) — limpia Cache Storage, desregistra el service worker y recarga, sin tocar `localStorage`
- [x] 1.2 Versión visible en el manual: verificado en `main` (commit `a83ac8b`) — se expone `package.json.version` vía Vite (`__APP_VERSION__`) y se muestra en `#info-sheet-version`
- [x] 1.3 Botón de guardado al editar nombre: verificado en `main` (commit `67a688f`) — bloqueado hasta que el nombre cambia, guarda y vuelve a bloquearse
- [x] 1.4 Bloqueo de scroll/rebote generalizado a todo el panel (no sólo creación): verificado en `main` (commits `919dd5f` y `67a688f`) — el sheet se ancla al `visualViewport` en ambos modos

## 2. Sincronización de specs

- [x] 2.1 Sincronizar la delta de `app-settings` a la spec principal y verificar `openspec validate --specs`
- [x] 2.2 Sincronizar la delta de `app-manual` a la spec principal y verificar `openspec validate --specs`
- [x] 2.3 Sincronizar la delta de `habit-edit-sheet` a la spec principal y verificar `openspec validate --specs`
