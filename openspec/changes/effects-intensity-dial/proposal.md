## Why

El nivel de efectos lo decide hoy una heurística sobre lo que el navegador declara, y el usuario no tiene voz. Eso falla en las dos direcciones. Hacia abajo: la primera versión de la fórmula mandaba todos los iPhone y los navegadores con defensa antihuella al nivel sin partículas, y el usuario no tenía forma de subirlo — hubo que corregir el código y desplegar. Hacia arriba: quien encuentra la supernova excesiva, o quiere ahorrar batería un día concreto, tampoco puede bajarla.

Existe `?fx=0..3` en la URL, pero es una herramienta de diagnóstico, no un ajuste: no se guarda, se pierde al recargar y anula el gobernador de FPS, así que forzar un nivel alto en un móvil que no lo aguanta lo deja a tirones sin que nada lo corrija.

Falta lo más simple: un control para elegir cuánto efecto quieres, que se recuerde y que no rompa la protección de rendimiento.

## What Changes

- **Rueda de intensidad.** Un control radial con cinco posiciones — `Automático`, `Calma`, `Lite`, `Estándar`, `Máximo` — que se abre desde el header y se dibuja centrado sobre el nautilus, aprovechando su geometría. Se cierra tocando fuera.
- **`Automático` es la posición por defecto** y devuelve el control a la detección del dispositivo. Sin ella, tocar la rueda una vez dejaría al usuario atrapado en un valor fijo para siempre.
- **La elección se guarda** en localStorage y se aplica en el siguiente arranque.
- **Vista previa al girar.** Al moverse a una posición se dispara un efecto de muestra en ese nivel, para poder comparar sin salir del control. Elegir a ciegas entre cuatro nombres no sirve de nada.
- **El gobernador sigue protegiendo.** La preferencia fija el punto de partida de la sesión; si el dispositivo no sostiene el ritmo, el gobernador sigue pudiendo degradar. La preferencia guardada no cambia: se vuelve a intentar en el siguiente arranque.
- **`?fx=` se mantiene como anulación de diagnóstico** y sigue siendo la única que desactiva el gobernador. Gana sobre la preferencia guardada y no la sobrescribe.
- **El nivel activo se hace visible** en la propia rueda, incluyendo cuándo difiere de lo elegido porque el gobernador ha degradado. Un ajuste que se ignora en silencio es peor que no tenerlo.

## Capabilities

### New Capabilities

- `effects-preference`: Preferencia de intensidad de efectos elegida por el usuario — su control radial, su persistencia, la posición automática y cómo convive con la detección, con el gobernador de rendimiento y con la anulación por URL.

### Modified Capabilities

- `motion-tiers`: la degradación automática deja de tratar por igual a todos los niveles fijados. Hoy no sobrescribe ningún nivel establecido explícitamente; pasa a distinguir la preferencia del usuario —que sí puede degradarse, porque el rendimiento manda— de la anulación de diagnóstico por URL, que sigue siendo intocable.

## Impact

- `src/fx/engine.js` — el nivel gana origen (`auto` / `preferencia` / `diagnóstico`) en lugar de un único booleano `forced`; el gobernador consulta el origen para decidir si puede degradar.
- `src/fx/preference.js` (nuevo) — lectura y escritura de la preferencia en localStorage, con migración silenciosa de valores desconocidos a `Automático`.
- `src/ui/dial.js` (nuevo) — construcción e interacción del control radial en SVG, reutilizando `polarToCartesian` de `src/utils/svg.js`.
- `src/main.js` — botón en el header, apertura y cierre del control, y aplicación de la preferencia en el arranque antes del primer render.
- `index.html` y `style.css` — botón del header y estilos del control.
- Sin dependencias de runtime nuevas.

## No incluido en este cambio

- **Interruptores por efecto individual.** Se evaluó y se descartó: cinco interruptores dan treinta y dos combinaciones, la mayoría nunca probadas, y piden un panel de ajustes que la app no tiene. La rueda cubre la intención real —"quiero más o menos"— con un solo control.
- **Ajustes que no sean la intensidad de efectos.** El tema sigue en su propio botón; no se crea una pantalla de configuración general.
- **Sincronizar la preferencia entre dispositivos.** Vive en localStorage, como el resto del estado de la app.
- **Cambiar qué hace cada nivel.** Los cuatro niveles siguen exactamente como están; este cambio sólo decide quién los elige.
- **Recuperar el nivel tras una degradación dentro de la misma sesión.** El gobernador sigue sin promocionar nunca, para no oscilar.
