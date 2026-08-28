/* ============================================================
   Preferencia de intensidad de efectos.

   Vive en su propia clave, como el tema. Meterla dentro de
   `habits21` mezclaría ajustes de interfaz con los datos del reto.
   ============================================================ */

const KEY = 'fx-level';

/** La posición automática devuelve la decisión a la detección del dispositivo. */
export const AUTO = 'auto';

export const OPTIONS = [AUTO, '0', '1', '2', '3'];

/**
 * Ausencia de clave, valor desconocido o localStorage inaccesible —modo
 * privado en algunos navegadores— se leen todos como automática, que es
 * el comportamiento que la app tenía antes de existir esta preferencia.
 */
export function readPreference() {
  try {
    const raw = localStorage.getItem(KEY);
    return OPTIONS.includes(raw) ? raw : AUTO;
  } catch (_) {
    return AUTO;
  }
}

export function writePreference(value) {
  try {
    // Guardar la automática como ausencia mantiene la operación idempotente:
    // no hay dos formas distintas de representar el mismo estado.
    if (value === AUTO || !OPTIONS.includes(value)) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, value);
  } catch (_) {
    /* sin persistencia; la sesión en curso sigue respetando la elección */
  }
}
