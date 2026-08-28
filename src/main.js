import { registerSW } from 'virtual:pwa-register';

import { MAX_HABITS, TOTAL_DAYS, ELEMENTS, MAX_NAME_LENGTH } from './constants.js';
import { todayISO, addDays, formatDateShort, diffDays } from './utils/date.js';
import {
  habits, loadHabits, saveHabits,
  todayIndexOf, isDoneToday, habitsActiveToday, habitStreak,
  bestStreak, effectiveness, activeSummary,
} from './store.js';
import { initTheme, toggleTheme } from './theme.js';
import { renderSVG, view } from './render/svg.js';
import {
  tier, detectTier, haptics, initFxCanvas, burstElement, setUnitScale, SOURCES,
} from './fx/engine.js';
import { readPreference, writePreference, NONE } from './fx/preference.js';
import { createDial } from './ui/dial.js';
import { createSheet } from './ui/sheet.js';
import {
  streakComet, arrivalBurst, extinguishCell, chargeToCore, setCoreCharge, supernova,
} from './fx/effects.js';

if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

// ── Render ───────────────────────────────────────────────────

function renderSVGOnly() {
  setUnitScale(view.centerPx().scale);
  renderSVG(onCellToggled, (habitId, event) => openHabitSheet(habitId, 'edit', event));
  refreshDayCore();
  renderStats();
}

/* Indicadores del reto. Se escriben por textContent sobre el marcado fijo
   de index.html: los iconos y las etiquetas no cambian nunca, así que no
   hay motivo para regenerar nodos en cada repintado. */
function renderStats() {
  const { active, total } = activeSummary();
  document.getElementById('stat-streak').textContent = `${bestStreak()}d`;
  document.getElementById('stat-effectiveness').textContent = `${effectiveness()}%`;
  document.getElementById('stat-active').textContent = `${active}/${total}`;
}

// ── Núcleo del día ───────────────────────────────────────────

let coreTransientTimer = null;
let coreShowingTransient = false;

function setCoreLabel(value, caption, full) {
  const core = document.getElementById('day-core');
  document.getElementById('core-value').textContent = value;
  document.getElementById('core-caption').textContent = caption;
  core.classList.toggle('is-full', !!full);
  core.classList.remove('swapping');
  // Reiniciar la animación de cambio sin esperar al siguiente frame de CSS.
  void core.offsetWidth;
  core.classList.add('swapping');
}

/** Estado en reposo del centro: cuántos hábitos quedan cerrados hoy. */
function refreshDayCore() {
  const core = document.getElementById('day-core');
  if (!core) return;

  const active = habitsActiveToday();
  const done = active.filter(isDoneToday).length;
  setCoreCharge(active.length ? done / active.length : 0);

  if (coreShowingTransient) return;
  if (!active.length) {
    setCoreLabel('—', 'sin retos', false);
    return;
  }
  setCoreLabel(`${done}/${active.length}`, 'hoy', done === active.length);
}

/**
 * La racha ocupa el centro un instante y lo devuelve. El centro es del
 * día: la racha sólo lo toma prestado, y cada presentación reemplaza a
 * la anterior para que marcar varios días seguidos no lo deje atascado.
 */
function showStreakInCore(streak) {
  const icon = streak >= 21 ? '🏆' : streak >= 14 ? '⚡' : streak >= 7 ? '🔥' : '✨';
  coreShowingTransient = true;
  setCoreLabel(`${icon} ${streak}`, 'racha', false);
  clearTimeout(coreTransientTimer);
  coreTransientTimer = setTimeout(() => {
    coreShowingTransient = false;
    refreshDayCore();
  }, 1900);
}

// ── Marcado de una celda ─────────────────────────────────────

function onCellToggled(event, habitId, dayIndex, prevState) {
  const habit = habits.find((h) => h.id === habitId);
  renderSVGOnly();
  scheduleNotifications();
  if (!habit) return;

  const marking = !prevState;
  const isTodayCell = dayIndex === todayIndexOf(habit);

  if (!marking) {
    haptics.tap();
    extinguishCell(habitId, dayIndex);
    return;
  }

  haptics.success();

  // El cometa sólo sale si el marcado ha extendido la racha de verdad:
  // marcar el día 1, o un día posterior a un hueco, no la extiende.
  const streak = habitStreak(habit);
  const extendsStreak = dayIndex > 0 && streak === dayIndex + 1;

  // Si este mismo marcado cierra el día, la racha no toma el centro: el
  // día manda. Sin esta regla, quién ocupa el centro dependería de si el
  // cometa llega antes o después de la supernova — indeterminista.
  const closesDay = isTodayCell && willCloseDay();

  const onArrive = () => {
    arrivalBurst(habitId, dayIndex, habit.element);
    if (extendsStreak && !closesDay) showStreakInCore(streak);
    if (!prevState && habit.progress[dayIndex]) checkMilestone(dayIndex, habit);
  };

  if (extendsStreak) {
    streakComet(habitId, 0, dayIndex, habit.element, onArrive);
  } else {
    onArrive();
  }

  if (isTodayCell) closeDay(habit, habitId, dayIndex, closesDay);
}

/**
 * ¿El marcado que se acaba de aplicar deja el día completo? El estado ya
 * está mutado, así que "todos cerrados" equivale a la transición.
 */
function willCloseDay() {
  const active = habitsActiveToday();
  return active.length > 0 && active.every(isDoneToday);
}

/** Carga del núcleo y, si era el último pendiente, supernova. */
function closeDay(habit, habitId, dayIndex, closesDay) {
  chargeToCore(habitId, dayIndex, habit.element);
  if (!closesDay) return;

  const active = habitsActiveToday();
  setTimeout(() => {
    haptics.milestone();
    supernova(active.map((h) => h.element));
    // Una presentación de racha de otro hábito también cede el centro.
    coreShowingTransient = false;
    clearTimeout(coreTransientTimer);
    refreshDayCore();
  }, 420);
}

function checkMilestone(dayIndex, habit) {
  const milestones = {
    6:  { ico: '🌟', title: '¡Primera semana!',  sub: 'Fase "Despertar" completada' },
    13: { ico: '⚡', title: '¡Dos semanas!',      sub: 'Fase "Creciendo" completada' },
    20: { ico: '🏆', title: '¡Reto completado!',  sub: '21 días · Hábito dominado' },
  };
  const m = milestones[dayIndex];
  if (!m) return;

  document.getElementById('milestone-ico').textContent = m.ico;
  document.getElementById('milestone-title').textContent = m.title;
  document.getElementById('milestone-sub').textContent = m.sub;

  const toast = document.getElementById('milestone-toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2800);

  haptics.milestone();
  const c = view.centerPx();
  burstElement(c.x, c.y, habit.element, dayIndex, { base: 44, scale: 1.6, spread: 1.8 });
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
      element: ELEMENTS[habits.length % ELEMENTS.length].id,
      startDate: todayISO(),
      progress: new Array(TOTAL_DAYS).fill(false),
    });
    saveHabits();
    render();
  }
}

// ── Hoja de instalación ──────────────────────────────────────

/* Sustituye al alert() nativo. La mecánica —velo, foco, Escape, cierre por
   fuera— la pone `createSheet`; aquí sólo queda el cableado. Vive aparte de
   #habit-sheet: aquel arrastra estado de hábito, modo crear/editar y
   posicionamiento de popover, y no gana nada absorbiendo un tercer modo. */

let infoSheet = null;

function setupInfoSheet() {
  infoSheet = createSheet({ root: document.getElementById('info-sheet') });
  document.getElementById('info-btn').addEventListener('click', () => infoSheet.open());
  document.getElementById('info-sheet-close').addEventListener('click', () => infoSheet.close());
  document.getElementById('info-sheet-ok').addEventListener('click', () => infoSheet.close());
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

  // Populate element selector — disable elements already used by other habits
  const usedElements = habits
    .filter((h) => !(habit && h.id === habit.id))
    .map((h) => h.element);
  swatchesEl.innerHTML = ELEMENTS.map((el) => {
    const taken = usedElements.includes(el.id);
    const active = habit && habit.element === el.id;
    const shouldDisable = taken && !active;
    return `
    <button
      class="element-btn${active ? ' active' : ''}${shouldDisable ? ' taken' : ''}"
      data-element="${el.id}"
      aria-label="${el.name}"
      ${shouldDisable ? 'disabled' : ''}
      title="${shouldDisable ? 'Ya asignado a otro hábito' : el.name}"
    >
      <span class="element-icon">${el.icon}</span>
      <span class="element-name">${el.name}</span>
    </button>`;
  }).join('');

  // Populate notification section
  const notifSection = document.getElementById('sheet-notification');
  const notifToggle = document.getElementById('sheet-notif-toggle');
  const notifTimeRow = document.getElementById('sheet-notif-time-row');
  const notifTimeInput = document.getElementById('sheet-notif-time');
  const notifDenied = document.getElementById('sheet-notif-denied');
  if (mode === 'edit' && habit) {
    notifToggle.checked = !!habit.notificationTime;
    notifTimeInput.value = habit.notificationTime || '08:00';
    notifTimeRow.classList.toggle('notif-hidden', !habit.notificationTime);
    notifDenied.classList.add('notif-hidden');
    notifSection.style.display = '';
  } else {
    notifSection.style.display = 'none';
  }

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

function saveNotifTime() {
  const habit = habits.find((h) => h.id === sheetCurrentHabitId);
  const timeInput = document.getElementById('sheet-notif-time');
  if (habit && timeInput.value) {
    habit.notificationTime = timeInput.value;
    saveHabits();
    scheduleNotifications();
  }
}

function scheduleNotifications() {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  navigator.serviceWorker.ready.then((reg) => {
    if (!reg.active) return;
    const today = todayISO();
    const habitsToSchedule = habits
      .filter((h) => h.notificationTime)
      .map((h) => {
        const todayIndex = diffDays(h.startDate, today);
        const isTodayDone = todayIndex >= 0 && todayIndex < h.progress.length
          ? h.progress[todayIndex]
          : true;
        return { habitId: h.id, habitName: h.name, notificationTime: h.notificationTime, isTodayDone };
      });
    reg.active.postMessage({ type: 'SCHEDULE_NOTIFICATIONS', habits: habitsToSchedule });
  });
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

  // Sheet: element selector
  document.getElementById('sheet-swatches').addEventListener('click', (e) => {
    const btn = e.target.closest('.element-btn');
    if (!btn || !sheetCurrentHabitId) return;
    const elementId = btn.dataset.element;
    const habit = habits.find((h) => h.id === sheetCurrentHabitId);
    if (habit) {
      habit.element = elementId;
      saveHabits();
      renderSVGOnly();
      document.querySelectorAll('#sheet-swatches .element-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.element === elementId);
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

  // Las hojas de `createSheet` atienden Escape en captura y detienen la
  // propagación, así que aquí sólo llega cuando ninguna está abierta.
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const sheetEl = document.getElementById('habit-sheet');
    if (!sheetEl.classList.contains('hidden')) {
      closeSheet();
    }
  });

  // iOS keyboard adjustment
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', adjustSheetForKeyboard);
  }

  // Notification toggle
  document.getElementById('sheet-notif-toggle').addEventListener('change', async (e) => {
    const notifDenied = document.getElementById('sheet-notif-denied');
    const notifTimeRow = document.getElementById('sheet-notif-time-row');
    notifDenied.classList.add('notif-hidden');

    if (e.target.checked) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          e.target.checked = false;
          notifDenied.classList.remove('notif-hidden');
          return;
        }
      }
      notifTimeRow.classList.remove('notif-hidden');
      saveNotifTime();
    } else {
      notifTimeRow.classList.add('notif-hidden');
      const habit = habits.find((h) => h.id === sheetCurrentHabitId);
      if (habit) {
        habit.notificationTime = null;
        saveHabits();
        scheduleNotifications();
      }
    }
  });

  document.getElementById('sheet-notif-time').addEventListener('change', () => {
    saveNotifTime();
  });
}

// ── Init ─────────────────────────────────────────────────────

/**
 * `?fx=0..3` fija el nivel de efectos. Sin esto no hay forma de verificar
 * los cuatro niveles en un dispositivo real, donde no existen los overrides
 * de DevTools. Es diagnóstico: gana sobre la preferencia del usuario, no la
 * sobrescribe, y el gobernador no lo toca.
 */
function urlTierOverride() {
  const raw = new URLSearchParams(location.search).get('fx');
  if (raw === null) return null;
  const forced = Number(raw);
  if (!Number.isInteger(forced) || forced < 1 || forced > 5) return null;
  return forced;
}

/** Prioridad: anulación por URL, preferencia guardada, semilla del dispositivo. */
export function applyStoredTier() {
  const url = urlTierOverride();
  if (url !== null) { tier.set(url, SOURCES.DIAGNOSTIC); return; }

  let pref = readPreference();
  if (pref === NONE) {
    // Primer arranque: la detección siembra una vez y su resultado queda
    // ya como elección del usuario. No se vuelve a detectar después.
    pref = detectTier();
    writePreference(pref);
  }
  tier.set(pref, SOURCES.PREFERENCE);
}

/** Aplica y guarda la elección del usuario. */
function chooseTier(value) {
  writePreference(value);
  tier.set(Number(value), SOURCES.PREFERENCE);
}

/**
 * Muestra con el nivel ya aplicado, no simulado: simularlo duplicaría la
 * lógica de presupuesto y podría divergir de lo que luego pasa de verdad.
 */
function previewTier() {
  const c = view.centerPx();
  const element = habits.length ? habits[0].element : ELEMENTS[0].id;
  burstElement(c.x, c.y, element, 20, { base: 26, scale: 1.1, spread: 1.3 });
  haptics.tap();
}

let dial = null;

function setupDial() {
  const btn = document.getElementById('fx-toggle');
  dial = createDial({
    host: document.getElementById('svg-container'),
    getChoice: readPreference,
    onChoose: chooseTier,
    onPreview: previewTier,
    // Cerrar por backdrop o Escape no pasa por el botón, así que el estado
    // lo comunica la propia rueda.
    onOpenChange: (abierta) => btn.setAttribute('aria-expanded', String(abierta)),
  });
  btn.addEventListener('click', () => dial.toggle());
}

function init() {
  initTheme();
  applyStoredTier();
  loadHabits();
  setupEventListeners();
  setupInfoSheet();
  initFxCanvas();
  setupDial();
  render();
  window.addEventListener('resize', () => setUnitScale(view.centerPx().scale));
  scheduleNotifications();
}

init();
