/* ============================================================
   Preferencia de nivel de efecto visual.

   Vive en su propia clave, como el tema. Meterla dentro de
   `habitos_nautilus` mezclaría ajustes de interfaz con los datos
   del reto.
   ============================================================ */

import { MIN_TIER, MAX_TIER } from './engine.js';

const KEY = 'fx-nivel';

/* Clave y valores anteriores. La escala vieja iba de 0 a 3 y admitía una
   posición automática; reusar su clave haría que un '3' guardado —Máximo
   entonces— se leyese como Suave ahora, dos escalones por debajo de lo
   que el usuario eligió. Por eso la clave cambia de nombre. */
const OLD_KEY = 'fx-level';
const OLD_TO_NEW = { 0: 1, 1: 2, 2: 4, 3: 5 };

/** Ausencia de preferencia. Quien la reciba debe sembrar desde el dispositivo. */
export const NONE = null;

function isValid(n) {
  return Number.isInteger(n) && n >= MIN_TIER && n <= MAX_TIER;
}

/**
 * Traslada la preferencia de la escala vieja a la nueva y borra el rastro.
 * Un solo sentido y una sola vez: el siguiente arranque ya encuentra la
 * clave nueva y no vuelve a mirar aquí.
 *
 * La posición automática se lee como ausencia, no como un nivel: era
 * "decide tú por mí", y su equivalente ahora es sembrar desde el
 * dispositivo y guardar el resultado.
 */
function migrate() {
  let raw;
  try {
    raw = localStorage.getItem(OLD_KEY);
  } catch (_) {
    return NONE;
  }
  if (raw === null) return NONE;

  const nuevo = OLD_TO_NEW[Number(raw)];
  try {
    localStorage.removeItem(OLD_KEY);
    if (nuevo !== undefined) localStorage.setItem(KEY, String(nuevo));
  } catch (_) {
    /* sin persistencia; la sesión en curso respeta igualmente el traslado */
  }
  return nuevo !== undefined ? nuevo : NONE;
}

/**
 * Nivel guardado, o `NONE` si no hay ninguno utilizable. Un valor
 * ilegible —clave manipulada, escala futura, localStorage inaccesible en
 * modo privado— se trata como ausencia: se siembra de nuevo en vez de
 * arrancar con un nivel arbitrario.
 */
export function readPreference() {
  let raw;
  try {
    raw = localStorage.getItem(KEY);
  } catch (_) {
    return NONE;
  }
  if (raw === null) return migrate();
  const n = Number(raw);
  return isValid(n) ? n : NONE;
}

export function writePreference(value) {
  const n = Number(value);
  if (!isValid(n)) return;
  try {
    localStorage.setItem(KEY, String(n));
  } catch (_) {
    /* sin persistencia; la sesión en curso sigue respetando la elección */
  }
}
