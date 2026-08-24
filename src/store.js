import { TOTAL_DAYS, DEFAULT_COLORS } from './constants.js';
import { todayISO, addDays } from './utils/date.js';

export let habits = [];

export function loadHabits() {
  const stored = localStorage.getItem('habits21');
  if (stored) {
    habits = JSON.parse(stored);
    habits.forEach((h, i) => {
      if (!h.color) h.color = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
      if (!h.startDate) h.startDate = todayISO();
    });
  } else {
    habits = [
      {
        id: Date.now().toString(),
        name: 'Leer 20 mins',
        color: DEFAULT_COLORS[0],
        startDate: todayISO(),
        progress: new Array(TOTAL_DAYS).fill(false),
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
  if (cellDate === today) return 'today';
  if (cellDate < today) return 'unlocked';
  return 'locked';
}
