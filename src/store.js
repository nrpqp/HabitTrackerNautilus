import { TOTAL_DAYS, DEFAULT_COLORS, ELEMENTS } from './constants.js';
import { todayISO, yesterdayISO, addDays } from './utils/date.js';

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
