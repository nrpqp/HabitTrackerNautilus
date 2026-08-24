import { registerSW } from 'virtual:pwa-register';

import { MAX_HABITS, TOTAL_DAYS, DEFAULT_COLORS } from './constants.js';
import { todayISO } from './utils/date.js';
import { habits, loadHabits, saveHabits } from './store.js';
import { initTheme, toggleTheme } from './theme.js';
import { renderLegend } from './render/legend.js';
import { renderSVG } from './render/svg.js';

if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

function renderSVGOnly() {
  renderSVG(
    () => { renderSVGOnly(); renderLegendOnly(); },
    null,
  );
}

function renderLegendOnly() {
  renderLegend(renderSVGOnly, render);
}

function render() {
  renderLegendOnly();
  renderSVGOnly();
  checkLimit();
}

function checkLimit() {
  const addHabitContainer = document.getElementById('add-habit-container');
  const newHabitInput = document.getElementById('new-habit-input');
  if (habits.length >= MAX_HABITS) {
    addHabitContainer.classList.add('hidden');
    newHabitInput.disabled = true;
    newHabitInput.value = '';
    newHabitInput.placeholder = 'Límite de 7 hábitos alcanzado';
  } else {
    addHabitContainer.classList.remove('hidden');
    newHabitInput.disabled = false;
    newHabitInput.placeholder = 'Añadir hábito...';
  }
}

function addHabit() {
  const newHabitInput = document.getElementById('new-habit-input');
  const name = newHabitInput.value.trim();
  if (name && habits.length < MAX_HABITS) {
    habits.push({
      id: Date.now().toString(),
      name,
      color: DEFAULT_COLORS[habits.length % DEFAULT_COLORS.length],
      startDate: todayISO(),
      progress: new Array(TOTAL_DAYS).fill(false),
    });
    newHabitInput.value = '';
    saveHabits();
    render();
  }
}

function setupEventListeners() {
  document.getElementById('add-habit-btn').addEventListener('click', addHabit);
  document.getElementById('new-habit-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addHabit();
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
}

function init() {
  initTheme();
  loadHabits();
  setupEventListeners();
  render();
}

init();
