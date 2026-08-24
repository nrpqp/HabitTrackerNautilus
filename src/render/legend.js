import { TOTAL_DAYS } from '../constants.js';
import { todayISO, addDays, formatDateShort, diffDays } from '../utils/date.js';
import { habits, saveHabits } from '../store.js';

export function renderLegend(onRender, onFullRender) {
  const legendContainer = document.getElementById('habits-legend');
  legendContainer.innerHTML = '';
  const today = todayISO();

  habits.forEach((habit) => {
    const endDate = addDays(habit.startDate, TOTAL_DAYS - 1);
    const dayNum = diffDays(habit.startDate, today) + 1;
    const clampedDay = Math.min(Math.max(dayNum, 0), TOTAL_DAYS);
    const isFinished = dayNum > TOTAL_DAYS;
    const completedCount = habit.progress.filter(Boolean).length;

    const item = document.createElement('div');
    item.className = 'legend-item';

    item.innerHTML = `
      <div class="legend-top-row">
        <div class="legend-info">
          <div class="color-picker-wrapper">
            <div class="color-dot" style="background: ${habit.color};"></div>
            <input type="color" class="color-picker-native" value="${habit.color}" data-id="${habit.id}" />
          </div>
          <div class="habit-name" data-id="${habit.id}" title="Clic para editar">${habit.name}</div>
        </div>
        <div class="legend-actions">
          <button class="edit-btn" data-id="${habit.id}" title="Editar nombre">✏</button>
          <button class="reset-btn" data-id="${habit.id}" title="Reiniciar hábito">↺</button>
          <button class="delete-btn" data-id="${habit.id}" title="Eliminar hábito">×</button>
        </div>
      </div>
      <div class="legend-dates">
        <div class="date-info">📅 <strong>${formatDateShort(habit.startDate)}</strong> → <strong>${formatDateShort(endDate)}</strong></div>
        ${isFinished
          ? `<span class="today-badge" style="background:#2ecc71">✓ Completado</span>`
          : `<span class="today-badge">Día ${clampedDay} / ${TOTAL_DAYS}</span>`
        }
      </div>
    `;

    legendContainer.appendChild(item);
  });

  document.querySelectorAll('.color-picker-native').forEach((picker) => {
    picker.addEventListener('input', (e) => {
      const id = e.target.dataset.id;
      const habit = habits.find((h) => h.id === id);
      if (habit) {
        habit.color = e.target.value;
        e.target.previousElementSibling.style.background = e.target.value;
        saveHabits();
        if (onRender) onRender();
      }
    });
  });

  document.querySelectorAll('.reset-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm('¿Reiniciar este hábito? Se borrará todo el avance y empezará hoy.')) {
        const habit = habits.find((h) => h.id === id);
        if (habit) {
          habit.progress = new Array(TOTAL_DAYS).fill(false);
          habit.startDate = todayISO();
          saveHabits();
          if (onFullRender) onFullRender();
        }
      }
    });
  });

  function startEditing(habitId) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const nameEl = document.querySelector(`.habit-name[data-id="${habitId}"]`);
    if (!nameEl || nameEl.querySelector('input')) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'habit-name-input';
    input.value = habit.name;
    input.maxLength = 30;

    const commitEdit = () => {
      const newName = input.value.trim();
      if (newName && newName !== habit.name) {
        habit.name = newName;
        saveHabits();
      }
      renderLegend(onRender, onFullRender);
    };

    input.addEventListener('blur', commitEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { input.value = habit.name; input.blur(); }
    });

    nameEl.textContent = '';
    nameEl.appendChild(input);
    input.focus();
    input.select();
  }

  document.querySelectorAll('.habit-name').forEach((el) => {
    el.addEventListener('click', () => startEditing(el.dataset.id));
  });

  document.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', () => startEditing(btn.dataset.id));
  });

  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm('¿Eliminar este hábito?')) {
        const idx = habits.findIndex((h) => h.id === id);
        if (idx !== -1) habits.splice(idx, 1);
        saveHabits();
        if (onFullRender) onFullRender();
      }
    });
  });
}
