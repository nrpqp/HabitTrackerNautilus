import { TOTAL_DAYS, DEFAULT_COLORS, ELEMENTS } from './constants.js';
import { todayISO, yesterdayISO, addDays, diffDays } from './utils/date.js';

export let habits = [];

export function loadHabits() {
  const stored = localStorage.getItem('habits21');
  if (stored) {
    habits = JSON.parse(stored);
    habits.forEach((h, i) => {
      if (!h.color) h.color = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
      if (!h.startDate) h.startDate = todayISO();
      h.notificationTime = h.notificationTime ?? null;
      if (!h.element) h.element = ELEMENTS[i % ELEMENTS.length].id;
    });
  } else {
    habits = [
      {
        id: Date.now().toString(),
        name: 'Leer 20 mins',
        element: ELEMENTS[0].id,
        startDate: todayISO(),
        progress: new Array(TOTAL_DAYS).fill(false),
        notificationTime: null,
      },
    ];
  }
  saveHabits();
}

export function saveHabits() {
  localStorage.setItem('habits21', JSON.stringify(habits));
}

export function cellState(habit, dayIndex) {
  const cellDate = addDays(habit.startDate, dayIndex);
  const today = todayISO();
  const yesterday = yesterdayISO();
  if (cellDate === today) return 'today';
  if (cellDate === yesterday) return 'yesterday';
  if (cellDate < yesterday) return 'old';
  return 'locked';
}

/**
 * Índice del día de hoy dentro del reto de un hábito, o -1 si el reto aún
 * no ha empezado o ya terminó. Un hábito terminado no puede cerrarse hoy,
 * así que tampoco cuenta para el medidor del día.
 */
export function todayIndexOf(habit) {
  const i = diffDays(habit.startDate, todayISO());
  return i >= 0 && i < TOTAL_DAYS ? i : -1;
}

export function isDoneToday(habit) {
  const i = todayIndexOf(habit);
  return i === -1 ? false : !!habit.progress[i];
}

/** Hábitos cuyo reto está en curso hoy. Son los que el día puede cerrar. */
export function habitsActiveToday() {
  return habits.filter((h) => todayIndexOf(h) !== -1);
}

/** Días consecutivos completados desde el día 1. Un hueco corta la racha. */
export function habitStreak(habit) {
  let n = 0;
  for (let i = 0; i < habit.progress.length; i++) {
    if (!habit.progress[i]) break;
    n++;
  }
  return n;
}

/* ── Indicadores del reto ─────────────────────────────────────
   Selectores de sólo lectura derivados de los hábitos guardados.
   No persisten nada: se recalculan en cada repintado. */

/** La racha más larga entre todos los hábitos, en días. */
export function bestStreak() {
  return habits.reduce((max, h) => Math.max(max, habitStreak(h)), 0);
}

/**
 * Días vencidos de un hábito: los que ya llegaron o pasaron dentro de su
 * reto. Los días futuros están bloqueados, así que no cuentan — si no,
 * un hábito recién creado nacería con un 5 % que no significa nada.
 */
function elapsedDays(habit) {
  const i = diffDays(habit.startDate, todayISO());
  if (i < 0) return 0;
  return Math.min(i + 1, TOTAL_DAYS);
}

/** Porcentaje entero de días completados sobre los días ya vencidos. */
export function effectiveness() {
  let due = 0;
  let done = 0;
  habits.forEach((h) => {
    const n = elapsedDays(h);
    due += n;
    for (let i = 0; i < n; i++) if (h.progress[i]) done++;
  });
  return due === 0 ? 0 : Math.round((done / due) * 100);
}
