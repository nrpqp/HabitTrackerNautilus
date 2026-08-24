import { registerSW } from 'virtual:pwa-register';

import { MAX_HABITS, TOTAL_DAYS, DEFAULT_COLORS, MAX_NAME_LENGTH } from './constants.js';
import { todayISO, addDays, formatDateShort, diffDays } from './utils/date.js';
import { habits, loadHabits, saveHabits } from './store.js';
import { initTheme, toggleTheme } from './theme.js';
import { renderSVG } from './render/svg.js';

if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

// ── Render ───────────────────────────────────────────────────

function renderSVGOnly() {
  renderSVG(
    renderSVGOnly,
    (habitId, event) => openHabitSheet(habitId, 'edit', event)
  );
}

function render() {
  renderSVGOnly();
  checkLimit();
}

function checkLimit() {
  const addBtn = document.getElementById('add-habit-btn');
  if (habits.length >= MAX_HABITS) {
    addBtn.disabled = true;
    addBtn.title = 'Límite de 7 hábitos alcanzado';
  } else {
    addBtn.disabled = false;
    addBtn.title = 'Añadir hábito';
  }
}

// ── Add habit ────────────────────────────────────────────────

function addHabit(name) {
  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
  if (trimmed && habits.length < MAX_HABITS) {
    habits.push({
      id: Date.now().toString(),
      name: trimmed,
      color: DEFAULT_COLORS[habits.length % DEFAULT_COLORS.length],
      startDate: todayISO(),
      progress: new Array(TOTAL_DAYS).fill(false),
    });
    saveHabits();
    render();
  }
}

// ── Sheet ────────────────────────────────────────────────────

let sheetCurrentHabitId = null;
let sheetMode = 'edit'; // 'edit' | 'create'
let sheetOriginalName = '';

function openHabitSheet(habitId, mode = 'edit', event = null) {
  sheetCurrentHabitId = habitId;
  sheetMode = mode;

  const sheetEl = document.getElementById('habit-sheet');
  const nameInput = document.getElementById('sheet-name-input');
  const swatchesEl = document.getElementById('sheet-swatches');
  const progressEl = document.getElementById('sheet-progress');
  const actionsEl = document.getElementById('sheet-actions');
  const resetBtn = document.getElementById('sheet-reset-btn');
  const deleteBtn = document.getElementById('sheet-delete-btn');
  const panel = sheetEl.querySelector('.habit-sheet-panel');

  const habit = habitId ? habits.find((h) => h.id === habitId) : null;

  // Populate name
  sheetOriginalName = habit ? habit.name : '';
  nameInput.value = sheetOriginalName;
  nameInput.maxLength = MAX_NAME_LENGTH;

  // Populate swatches
  swatchesEl.innerHTML = DEFAULT_COLORS.map((color) => `
    <button
      class="swatch${habit && habit.color === color ? ' active' : ''}"
      data-color="${color}"
      style="background: ${color};"
      aria-label="Color ${color}"
    ></button>
  `).join('');

  // Populate progress
  if (mode === 'edit' && habit) {
    const today = todayISO();
    const endDate = addDays(habit.startDate, TOTAL_DAYS - 1);
    const dayNum = diffDays(habit.startDate, today) + 1;
    const clampedDay = Math.min(Math.max(dayNum, 1), TOTAL_DAYS);
    const isFinished = dayNum > TOTAL_DAYS;

    progressEl.innerHTML = `
      <div class="progress-dates">📅 ${formatDateShort(habit.startDate)} → ${formatDateShort(endDate)}</div>
      <div class="progress-badge ${isFinished ? 'done' : ''}">
        ${isFinished ? '✓ Completado' : `Día ${clampedDay} / ${TOTAL_DAYS}`}
      </div>
    `;
    progressEl.style.display = '';
    resetBtn.style.display = '';
    deleteBtn.style.display = '';
  } else {
    progressEl.style.display = 'none';
    resetBtn.style.display = 'none';
    deleteBtn.style.display = 'none';
  }

  // Position: popover on desktop, bottom sheet on mobile
  const isDesktop = window.innerWidth > 768;
  if (isDesktop && event) {
    positionPopover(panel, event);
  } else {
    panel.style.removeProperty('left');
    panel.style.removeProperty('top');
    panel.style.removeProperty('transform');
  }

  sheetEl.classList.remove('hidden');
  requestAnimationFrame(() => sheetEl.classList.add('open'));
  nameInput.focus();
  nameInput.select();
}

function closeSheet() {
  const sheetEl = document.getElementById('habit-sheet');
  sheetEl.classList.remove('open');
  setTimeout(() => sheetEl.classList.add('hidden'), 200);
  sheetCurrentHabitId = null;
}

function positionPopover(panel, event) {
  const margin = 12;
  panel.style.position = 'fixed';
  let x = event.clientX + margin;
  let y = event.clientY + margin;
  panel.style.left = `${x}px`;
  panel.style.top = `${y}px`;
  panel.style.bottom = 'auto';
  panel.style.transform = 'none';

  // Clamp after paint so we know the panel's size
  requestAnimationFrame(() => {
    const rect = panel.getBoundingClientRect();
    if (rect.right > window.innerWidth - margin) {
      panel.style.left = `${window.innerWidth - rect.width - margin}px`;
    }
    if (rect.bottom > window.innerHeight - margin) {
      panel.style.top = `${window.innerHeight - rect.height - margin}px`;
    }
  });
}

function commitSheetName() {
  if (!sheetCurrentHabitId) return;
  const nameInput = document.getElementById('sheet-name-input');
  const newName = nameInput.value.trim().slice(0, MAX_NAME_LENGTH);
  if (!newName) {
    nameInput.value = sheetOriginalName;
    return;
  }
  const habit = habits.find((h) => h.id === sheetCurrentHabitId);
  if (habit && newName !== habit.name) {
    habit.name = newName;
    saveHabits();
    render();
  }
  sheetOriginalName = newName;
}

function adjustSheetForKeyboard() {
  const sheetEl = document.getElementById('habit-sheet');
  if (!sheetEl || sheetEl.classList.contains('hidden')) return;
  const panel = sheetEl.querySelector('.habit-sheet-panel');
  if (window.innerWidth > 768) return; // only for mobile bottom sheet
  const offsetBottom = Math.max(
    0,
    window.innerHeight - window.visualViewport.height - window.visualViewport.offsetTop
  );
  panel.style.bottom = `${offsetBottom}px`;
}

// ── Event listeners ──────────────────────────────────────────

function setupEventListeners() {
  // Header buttons
  document.getElementById('add-habit-btn').addEventListener('click', (e) => {
    openHabitSheet(null, 'create', e);
  });

  document.getElementById('theme-toggle').addEventListener('click', () => {
    toggleTheme(renderSVGOnly);
  });

  document.getElementById('info-btn').addEventListener('click', () => {
    alert(
      '📱 Cómo instalar la App:\n\n' +
      'Para iOS (iPhone/iPad):\n' +
      '1. Abre este enlace en Safari.\n' +
      '2. Toca el botón "Compartir" (el cuadrado con la flecha hacia arriba).\n' +
      '3. Selecciona "Agregar a inicio" o "Añadir a la pantalla de inicio".\n\n' +
      'Para Android:\n' +
      '1. Abre este enlace en Chrome.\n' +
      '2. Toca el menú de 3 puntos (arriba a la derecha).\n' +
      '3. Selecciona "Instalar aplicación" o "Añadir a pantalla de inicio".'
    );
  });

  // Sheet: name input
  const nameInput = document.getElementById('sheet-name-input');
  nameInput.addEventListener('blur', () => {
    if (sheetMode === 'edit') commitSheetName();
  });
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (sheetMode === 'create') {
        const name = nameInput.value.trim().slice(0, MAX_NAME_LENGTH);
        if (name) { addHabit(name); closeSheet(); }
      } else {
        commitSheetName();
        nameInput.blur();
      }
    }
    if (e.key === 'Escape') {
      e.stopPropagation();
      if (sheetMode === 'edit') {
        nameInput.value = sheetOriginalName;
        nameInput.blur();
      } else {
        closeSheet();
      }
    }
  });

  // Sheet: swatches
  document.getElementById('sheet-swatches').addEventListener('click', (e) => {
    const btn = e.target.closest('.swatch');
    if (!btn || !sheetCurrentHabitId) return;
    const color = btn.dataset.color;
    const habit = habits.find((h) => h.id === sheetCurrentHabitId);
    if (habit) {
      habit.color = color;
      saveHabits();
      render();
      // Update active swatch
      document.querySelectorAll('#sheet-swatches .swatch').forEach((s) => {
        s.classList.toggle('active', s.dataset.color === color);
      });
    }
  });

  // Sheet: reset
  document.getElementById('sheet-reset-btn').addEventListener('click', () => {
    if (!sheetCurrentHabitId) return;
    if (confirm('¿Reiniciar este hábito? Se borrará todo el avance y empezará hoy.')) {
      const habit = habits.find((h) => h.id === sheetCurrentHabitId);
      if (habit) {
        habit.progress = new Array(TOTAL_DAYS).fill(false);
        habit.startDate = todayISO();
        saveHabits();
        closeSheet();
        render();
      }
    }
  });

  // Sheet: delete
  document.getElementById('sheet-delete-btn').addEventListener('click', () => {
    if (!sheetCurrentHabitId) return;
    if (confirm('¿Eliminar este hábito?')) {
      const idx = habits.findIndex((h) => h.id === sheetCurrentHabitId);
      if (idx !== -1) habits.splice(idx, 1);
      saveHabits();
      closeSheet();
      render();
    }
  });

  // Sheet: close on backdrop or Escape
  document.getElementById('habit-sheet').addEventListener('click', (e) => {
    if (e.target.classList.contains('habit-sheet-backdrop') ||
        e.target.classList.contains('habit-sheet')) {
      closeSheet();
    }
  });

  document.addEventListener('keydown', (e) => {
    const sheetEl = document.getElementById('habit-sheet');
    if (e.key === 'Escape' && !sheetEl.classList.contains('hidden')) {
      closeSheet();
    }
  });

  // iOS keyboard adjustment
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', adjustSheetForKeyboard);
  }
}

// ── Init ─────────────────────────────────────────────────────

function init() {
  initTheme();
  loadHabits();
  setupEventListeners();
  render();
}

init();
