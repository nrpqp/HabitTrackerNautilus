import { registerSW } from 'virtual:pwa-register';

import { MAX_HABITS, TOTAL_DAYS, ELEMENTS, MAX_NAME_LENGTH } from './constants.js';
import { todayISO, addDays, formatDateShort, diffDays } from './utils/date.js';
import {
  habits, loadHabits, saveHabits,
  todayIndexOf, isDoneToday, habitsActiveToday, habitStreak,
  bestStreak, effectiveness,
} from './store.js';
import { initTheme, applyTheme } from './theme.js';
import { renderSVG, view, onRebuild } from './render/svg.js';
import { attachRadialPicker } from './ui/radial-picker.js';
import {
  tier, detectTier, haptics, initFxCanvas, burstElement, setUnitScale, SOURCES,
} from './fx/engine.js';
import { readPreference, writePreference, NONE } from './fx/preference.js';
import { createSheet } from './ui/sheet.js';
import { createSettings } from './ui/settings.js';
import {
  streakComet, arrivalBurst, extinguishCell, chargeToCore, setCoreCharge, setCoreBlend, supernova,
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
  const active = habitsActiveToday();
  const done = active.filter(isDoneToday).length;
  document.getElementById('stat-streak').textContent = `${bestStreak()}d`;
  document.getElementById('stat-effectiveness').textContent = `${effectiveness()}%`;
  document.getElementById('stat-active').textContent = `${done}/${active.length}`;
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

/**
 * Estado en reposo del centro: la mezcla elemental de los hábitos ya
 * cerrados hoy. El anillo de arcos y el brillo (`setCoreCharge`) siguen
 * dando la lectura exacta en paralelo; la mezcla es el lenguaje visual,
 * no reemplaza esa cuenta, sólo el número que antes ocupaba el centro.
 */
function refreshDayCore() {
  const core = document.getElementById('day-core');
  if (!core) return;

  const active = habitsActiveToday();
  const doneHabits = active.filter(isDoneToday);
  setCoreCharge(active.length ? doneHabits.length / active.length : 0);
  setCoreBlend(doneHabits.map((h) => h.id));

  if (coreShowingTransient) return;
  if (!active.length) {
    setCoreLabel('—', 'sin retos', false);
    return;
  }
  setCoreLabel('', '', false);
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

/**
 * El selector radial también toma prestado el centro, igual que la racha:
 * mientras apunta muestra el hábito enfocado, y `endRadialAim` se lo
 * devuelve a `refreshDayCore` al cancelar o confirmar. No es un segundo
 * mecanismo — es el mismo `coreShowingTransient` que ya gobierna quién
 * ocupa el centro.
 */
function showRadialAim(habit) {
  coreShowingTransient = true;
  clearTimeout(coreTransientTimer);
  if (habit) {
    const el = ELEMENTS.find((e) => e.id === habit.element);
    setCoreLabel(el ? el.icon : '🎯', habit.name, false);
  } else {
    setCoreLabel('◎', 'elige', false);
  }
}

function endRadialAim() {
  coreShowingTransient = false;
  clearTimeout(coreTransientTimer);
  refreshDayCore();
}

/** Confirmación del gesto radial: mismo camino de datos que el toggle de celda. */
function confirmRadialMark(habit) {
  coreShowingTransient = false;
  clearTimeout(coreTransientTimer);
  const dayIndex = todayIndexOf(habit);
  if (dayIndex === -1) return;
  const prevState = habit.progress[dayIndex];
  if (prevState) return; // el gesto radial nunca desmarca
  habit.progress[dayIndex] = true;
  saveHabits();
  onCellToggled(null, habit.id, dayIndex, prevState);
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
  const etiqueta = addBtn.lastChild;   // el nodo de texto tras el «+»
  const lleno = habits.length >= MAX_HABITS;
  addBtn.disabled = lleno;
  addBtn.title = lleno ? `Límite de ${MAX_HABITS} hábitos alcanzado` : 'Añadir hábito';
  // El motivo va en la propia etiqueta y no sólo en el title: un botón
  // deshabilitado no recibe hover, así que su tooltip nunca aparecería.
  etiqueta.textContent = lleno ? `Límite de ${MAX_HABITS} hábitos` : 'Nuevo hábito';
}

// ── Add habit ────────────────────────────────────────────────

function addHabit(name, elementId = null) {
  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
  if (trimmed && habits.length < MAX_HABITS) {
    const usedElements = habits.map((h) => h.element);
    const fallback = ELEMENTS[habits.length % ELEMENTS.length].id;
    const chosen = elementId && !usedElements.includes(elementId) ? elementId : fallback;
    habits.push({
      id: Date.now().toString(),
      name: trimmed,
      element: chosen,
      startDate: todayISO(),
      progress: new Array(TOTAL_DAYS).fill(false),
    });
    saveHabits();
    render();
  }
}

/* Vía compartida por el botón de confirmación y por Enter en modo creación:
   ambos deben producir exactamente el mismo resultado. */
function confirmCreateHabit() {
  const nameInput = document.getElementById('sheet-name-input');
  const name = nameInput.value.trim().slice(0, MAX_NAME_LENGTH);
  if (!name) return;
  addHabit(name, sheetSelectedElementId);
  closeSheet();
}

// ── Selector radial ──────────────────────────────────────────

let radialSheet = null;
let detachRadialPicker = null;

/* Vía accesible del gesto radial: mismo patrón de hoja que `info-sheet`.
   Vive aparte de #habit-sheet por la misma razón que `info-sheet` — no
   comparte estado ni modo con el panel de edición de hábito. */
function setupRadialPickerSheet() {
  radialSheet = createSheet({ root: document.getElementById('radial-sheet') });
  document.getElementById('radial-sheet-close').addEventListener('click', () => radialSheet.close());
}

function openRadialPickerSheet() {
  const pending = habitsActiveToday().filter((h) => !isDoneToday(h));
  const listEl = document.getElementById('radial-sheet-list');
  if (!pending.length) {
    listEl.innerHTML = '<p class="radial-sheet-empty">No queda ningún hábito pendiente hoy.</p>';
  } else {
    listEl.innerHTML = pending.map((h) => {
      const el = ELEMENTS.find((e) => e.id === h.element);
      return `
      <button type="button" class="radial-sheet-item" data-habit-id="${h.id}">
        <span class="radial-sheet-item-icon">${el ? el.icon : '•'}</span>
        <span class="radial-sheet-item-name">${h.name}</span>
      </button>`;
    }).join('');
    listEl.querySelectorAll('.radial-sheet-item').forEach((btn) => {
      btn.addEventListener('click', () => {
        const habit = habits.find((h) => h.id === btn.dataset.habitId);
        radialSheet.close();
        if (habit) confirmRadialMark(habit);
      });
    });
  }
  radialSheet.open();
}

/* El núcleo se reconstruye entero cuando cambia el número o el orden de
   anillos (`build()` en svg.js) — el listener del gesto vive en el círculo
   viejo, que queda desmontado. `onRebuild` es el gancho que ya usa el
   proyecto para este caso exacto: reenganchar sobre el núcleo nuevo. */
function setupRadialPicker() {
  if (detachRadialPicker) detachRadialPicker();
  detachRadialPicker = attachRadialPicker(view, {
    onAim: showRadialAim,
    onConfirm: confirmRadialMark,
    onCancel: endRadialAim,
    onSimpleTap: openRadialPickerSheet,
  });
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
  document.getElementById('info-sheet-version').textContent = `Versión ${__APP_VERSION__}`;
}

/* Borra la caché de assets y desregistra el service worker para forzar una
   descarga limpia. No toca localStorage: los hábitos del usuario no son
   caché, son datos. */
async function clearAppCache() {
  if (!confirm('¿Borrar la caché de la app? Se recargará para descargar los archivos más recientes. Tus hábitos guardados no se ven afectados.')) return;
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));
    }
  } finally {
    window.location.reload();
  }
}

// ── Sheet ────────────────────────────────────────────────────

let sheetCurrentHabitId = null;
let sheetMode = 'edit'; // 'edit' | 'create'
let sheetOriginalName = '';
let sheetSelectedElementId = null; // elemento elegido a mano en modo creación

/* En modo creación, los íconos de elemento permanecen bloqueados hasta que
   hay un nombre — elegir elemento antes de nombrar el hábito no tiene
   sentido y confundía qué estaba realmente disponible. */
function renderElementSwatches(habit) {
  const swatchesEl = document.getElementById('sheet-swatches');
  const nameInput = document.getElementById('sheet-name-input');
  const usedElements = habits
    .filter((h) => !(habit && h.id === habit.id))
    .map((h) => h.element);
  const lockedByEmptyName = sheetMode === 'create' && !nameInput.value.trim();
  swatchesEl.innerHTML = ELEMENTS.map((el) => {
    const taken = usedElements.includes(el.id);
    const active = !lockedByEmptyName
      && (habit ? habit.element === el.id : sheetSelectedElementId === el.id);
    const shouldDisable = (taken && !active) || lockedByEmptyName;
    const title = lockedByEmptyName
      ? 'Escribe un nombre para elegir elemento'
      : (taken && !active ? 'Ya asignado a otro hábito' : el.name);
    return `
    <button
      class="element-btn${active ? ' active' : ''}${taken && !active ? ' taken' : ''}${lockedByEmptyName ? ' pending' : ''}"
      data-element="${el.id}"
      aria-label="${el.name}"
      ${shouldDisable ? 'disabled' : ''}
      title="${title}"
    >
      <span class="element-icon">${el.icon}</span>
      <span class="element-name">${el.name}</span>
    </button>`;
  }).join('');
}

function openHabitSheet(habitId, mode = 'edit', event = null) {
  sheetCurrentHabitId = habitId;
  sheetMode = mode;
  sheetSelectedElementId = null;

  const sheetEl = document.getElementById('habit-sheet');
  const nameInput = document.getElementById('sheet-name-input');
  const swatchesEl = document.getElementById('sheet-swatches');
  const progressEl = document.getElementById('sheet-progress');
  const actionsEl = document.getElementById('sheet-actions');
  const confirmBtn = document.getElementById('sheet-confirm-btn');
  const resetBtn = document.getElementById('sheet-reset-btn');
  const deleteBtn = document.getElementById('sheet-delete-btn');
  const panel = sheetEl.querySelector('.habit-sheet-panel');

  const habit = habitId ? habits.find((h) => h.id === habitId) : null;

  // Populate name
  sheetOriginalName = habit ? habit.name : '';
  nameInput.value = sheetOriginalName;
  nameInput.maxLength = MAX_NAME_LENGTH;

  // El botón de guardar nombre sólo existe en modo edición, y arranca
  // bloqueado: recién se desbloquea si el usuario cambia el nombre.
  const nameSaveBtn = document.getElementById('sheet-name-save-btn');
  nameSaveBtn.style.display = mode === 'edit' ? '' : 'none';
  nameSaveBtn.disabled = true;
  nameSaveBtn.classList.remove('dirty');

  // Populate element selector — disable elements already used by other habits
  renderElementSwatches(habit);

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

  // El botón de confirmación explícito sólo existe en modo creación; en
  // edición el nombre se confirma con blur/Enter como hasta ahora.
  confirmBtn.style.display = mode === 'create' ? '' : 'none';
  confirmBtn.disabled = mode === 'create' && !nameInput.value.trim();

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
  syncSheetToVisualViewport();
}

function closeSheet() {
  const sheetEl = document.getElementById('habit-sheet');
  const nameInput = document.getElementById('sheet-name-input');
  sheetEl.classList.remove('open');
  setTimeout(() => sheetEl.classList.add('hidden'), 200);
  sheetCurrentHabitId = null;
  nameInput.blur();
  resetSheetViewportSync();
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

/* Botón de guardar del nombre en modo edición: gris mientras el campo
   coincide con el nombre guardado, se habilita apenas hay una edición
   real pendiente de confirmar. */
function updateNameSaveButton() {
  const saveBtn = document.getElementById('sheet-name-save-btn');
  if (sheetMode !== 'edit') return;
  const nameInput = document.getElementById('sheet-name-input');
  const trimmed = nameInput.value.trim();
  const dirty = !!trimmed && trimmed !== sheetOriginalName;
  saveBtn.disabled = !dirty;
  saveBtn.classList.toggle('dirty', dirty);
}

function commitSheetName() {
  if (!sheetCurrentHabitId) return;
  const nameInput = document.getElementById('sheet-name-input');
  const newName = nameInput.value.trim().slice(0, MAX_NAME_LENGTH);
  if (!newName) {
    nameInput.value = sheetOriginalName;
    updateNameSaveButton();
    return;
  }
  const habit = habits.find((h) => h.id === sheetCurrentHabitId);
  if (habit && newName !== habit.name) {
    habit.name = newName;
    saveHabits();
    render();
  }
  sheetOriginalName = newName;
  updateNameSaveButton();
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

/* Ancla el sheet al viewport visual real en vez de sólo empujar el borde
   inferior del panel: en iOS Safari el viewport de layout (position:fixed;
   inset:0) y el visual (lo que de verdad se ve con el teclado abierto)
   pueden desalinearse — sobre todo apenas se abre el teclado, mientras
   anima — y ese desfase es el hueco en blanco entre el teclado y el panel.
   Igualar top/left/width/height al visualViewport en cada evento elimina
   la necesidad de calcular un offset a mano. */
function syncSheetToVisualViewport() {
  const vv = window.visualViewport;
  if (!vv) return;
  const sheetEl = document.getElementById('habit-sheet');
  if (!sheetEl || sheetEl.classList.contains('hidden')) return;
  if (window.innerWidth > 768) return; // sólo aplica al bottom sheet móvil
  sheetEl.style.top = `${vv.offsetTop}px`;
  sheetEl.style.left = `${vv.offsetLeft}px`;
  sheetEl.style.width = `${vv.width}px`;
  sheetEl.style.height = `${vv.height}px`;
}

function resetSheetViewportSync() {
  const sheetEl = document.getElementById('habit-sheet');
  if (!sheetEl) return;
  sheetEl.style.top = '';
  sheetEl.style.left = '';
  sheetEl.style.width = '';
  sheetEl.style.height = '';
}

// ── Event listeners ──────────────────────────────────────────

function setupEventListeners() {
  // Header buttons
  document.getElementById('add-habit-btn').addEventListener('click', (e) => {
    openHabitSheet(null, 'create', e);
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
        confirmCreateHabit();
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
  // En modo creación, el nombre gobierna el bloqueo de los íconos de
  // elemento y la habilitación del botón de confirmación. En modo edición,
  // gobierna el desbloqueo del botón de guardar.
  nameInput.addEventListener('input', () => {
    if (sheetMode === 'create') {
      const confirmBtn = document.getElementById('sheet-confirm-btn');
      confirmBtn.disabled = !nameInput.value.trim();
      renderElementSwatches(null);
    } else {
      updateNameSaveButton();
    }
  });

  // Sheet: botón de confirmación (modo creación)
  document.getElementById('sheet-confirm-btn').addEventListener('click', () => {
    if (sheetMode === 'create') confirmCreateHabit();
  });

  // Sheet: botón de guardar nombre (modo edición)
  document.getElementById('sheet-name-save-btn').addEventListener('click', () => {
    if (sheetMode !== 'edit') return;
    commitSheetName();
    nameInput.blur();
  });

  // Sheet: element selector
  document.getElementById('sheet-swatches').addEventListener('click', (e) => {
    const btn = e.target.closest('.element-btn');
    if (!btn) return;
    const elementId = btn.dataset.element;

    // En creación no hay hábito todavía: sólo se recuerda la elección para
    // aplicarla al confirmar.
    if (sheetMode === 'create') {
      sheetSelectedElementId = elementId;
      document.querySelectorAll('#sheet-swatches .element-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.element === elementId);
      });
      return;
    }

    if (!sheetCurrentHabitId) return;
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

  // iOS keyboard adjustment — 'scroll' se dispara cuando el propio iOS
  // desplaza el viewport visual para mantener visible el input enfocado.
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncSheetToVisualViewport);
    window.visualViewport.addEventListener('scroll', syncSheetToVisualViewport);
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

let settings = null;

/* Margen para que la muestra no roce el borde del panel. */
const MARGEN_MUESTRA = 44;

/* Banda libre a partir de la cual el burst cabe entero. Por debajo se
   encoge en proporción, para que en una pantalla corta siga viéndose algo
   en vez de quedar todo bajo la máscara. */
const BANDA_HOLGADA = 170;

/**
 * Origen de la muestra: el centro del área de nautilus que queda libre
 * sobre el panel, no el centro geométrico de la rueda. Con la hoja
 * anclada abajo el centro real puede quedar tapado —y en escritorio el
 * canvas va elevado, así que dibujar ahí pintaría sobre el panel—.
 */
function previewOrigin() {
  const c = view.centerPx();
  if (!settings || !settings.isOpen) return { ...c, banda: Infinity };
  const cont = document.getElementById('svg-container').getBoundingClientRect();
  const topPanel = settings.panelTop() - cont.top;
  if (topPanel <= 0) return { ...c, banda: Infinity };
  if (c.y + MARGEN_MUESTRA < topPanel) return { ...c, banda: topPanel };
  // A la mitad de la banda libre, sin suelo: un suelo fijo empujaría el
  // origen por debajo de la máscara cuando la banda es más estrecha que él.
  return { x: c.x, y: topPanel / 2, scale: c.scale, banda: topPanel };
}

/**
 * Muestra con el nivel ya aplicado, no simulado: simularlo duplicaría la
 * lógica de presupuesto y podría divergir de lo que luego pasa de verdad.
 */
function previewTier() {
  const o = previewOrigin();
  const element = habits.length ? habits[0].element : ELEMENTS[0].id;
  // El burst se encoge con la banda disponible: en una pantalla corta un
  // estallido a tamaño completo se dibujaría casi entero bajo la máscara.
  const k = Math.max(0.4, Math.min(1, o.banda / BANDA_HOLGADA));
  burstElement(o.x, o.y, element, 20, { base: 26, scale: 1.1 * k, spread: 1.3 * k });
  haptics.tap();
}

function setupSettings() {
  settings = createSettings({
    getTheme: () => document.documentElement.getAttribute('data-theme'),
    onTheme: (valor) => { applyTheme(valor); renderSVGOnly(); },
    getLevel: readPreference,
    onLevel: chooseTier,
    onPreview: previewTier,
  });
  document.getElementById('settings-clear-cache-btn').addEventListener('click', clearAppCache);
}

/* Overlay de diagnóstico opt-in (?debug=gesto): registra lo que de verdad
   pasa al tocar el núcleo — qué eventos de puntero llegan, si la hoja se
   abre y hacia dónde se mueve la página. El gesto del núcleo sólo falla en
   dispositivos que no están a mano, y sin estos datos cada intento de
   arreglo es una conjetura; con esto el usuario fotografía el registro real
   del momento del fallo. Hermano de `?debug=viewport`. */
function setupGestureDebugOverlay() {
  if (new URLSearchParams(location.search).get('debug') !== 'gesto') return;
  const el = document.createElement('div');
  el.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:9999',
    'background:rgba(0,0,0,0.86)', 'color:#0f0', 'font:10px/1.35 monospace',
    'padding:5px 7px', 'white-space:pre-wrap', 'pointer-events:none',
    'max-height:45vh', 'overflow:hidden',
  ].join(';');
  document.body.appendChild(el);

  const registro = [];
  const t0 = performance.now();
  const anotar = (txt) => {
    registro.push(`${String(Math.round(performance.now() - t0)).padStart(5)} ${txt}`);
    if (registro.length > 14) registro.shift();
    pintar();
  };

  function pintar() {
    const hoja = document.getElementById('radial-sheet');
    const panel = hoja.querySelector('[data-sheet-panel]');
    const pr = panel.getBoundingClientRect();
    el.textContent = [
      `scrollY:${Math.round(window.scrollY)} innerH:${window.innerHeight}`,
      `hoja:[${hoja.className}]`,
      `panel top:${Math.round(pr.top)} h:${Math.round(pr.height)}`,
      '── eventos ──',
      ...registro,
    ].join('\n');
  }

  const core = view.core;
  if (core) {
    ['pointerdown', 'pointerup', 'pointercancel', 'contextmenu', 'click'].forEach((t) => {
      core.addEventListener(t, (e) => anotar(`nucleo ${t} ${e.pointerType || ''}`), true);
    });
  }
  // El arrastre se escucha en `document`: si acá no llega ningún move, el
  // problema está antes que en el cálculo del sector.
  let moves = 0;
  document.addEventListener('pointermove', () => {
    moves++;
    if (moves % 10 === 1) anotar(`doc pointermove x${moves}`);
  }, true);
  // El scroll de la página es el sospechoso de la "animación hacia arriba".
  window.addEventListener('scroll', () => anotar(`scroll -> ${Math.round(window.scrollY)}`), true);

  // La hoja de abajo: si abre pero el toque en un hábito no llega, se ve acá.
  const hoja = document.getElementById('radial-sheet');
  hoja.addEventListener('transitionstart', () => anotar('hoja: transición'), true);
  ['pointerdown', 'click'].forEach((t) => {
    hoja.addEventListener(t, (e) => {
      const item = e.target.closest ? e.target.closest('.radial-sheet-item') : null;
      anotar(`hoja ${t} -> ${item ? 'HABITO' : (e.target.className || e.target.tagName)}`);
    }, true);
  });

  window.__gestoLog = () => registro.join('\n');
  pintar();
  setInterval(pintar, 400);
}

/* Overlay de diagnóstico opt-in (?debug=viewport): números en vivo del
   viewport de layout vs. el visual mientras el teclado abre/cierra. Sin
   esto, un bug de desfase de viewport en iOS Safari sólo se puede depurar
   a ciegas — con esto el usuario puede fotografiar los números reales del
   dispositivo en el momento del bug y reportarlos. */
function setupViewportDebugOverlay() {
  if (new URLSearchParams(location.search).get('debug') !== 'viewport') return;
  const el = document.createElement('div');
  el.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'z-index:9999',
    'background:rgba(0,0,0,0.82)', 'color:#0f0', 'font:10px/1.4 monospace',
    'padding:6px 8px', 'white-space:pre', 'pointer-events:none',
  ].join(';');
  document.body.appendChild(el);

  function update() {
    const vv = window.visualViewport;
    el.textContent = [
      `innerWidth/Height: ${window.innerWidth} / ${window.innerHeight}`,
      `docEl clientHeight: ${document.documentElement.clientHeight}`,
      vv ? `vv width/height: ${vv.width.toFixed(0)} / ${vv.height.toFixed(0)}` : 'sin visualViewport',
      vv ? `vv offsetTop/Left: ${vv.offsetTop.toFixed(0)} / ${vv.offsetLeft.toFixed(0)}` : '',
      vv ? `vv scale: ${vv.scale.toFixed(2)}` : '',
      `sheet top/left/w/h: ${document.getElementById('habit-sheet').style.top || '—'} / ${document.getElementById('habit-sheet').style.left || '—'} / ${document.getElementById('habit-sheet').style.width || '—'} / ${document.getElementById('habit-sheet').style.height || '—'}`,
    ].filter(Boolean).join('\n');
  }

  update();
  window.addEventListener('resize', update);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
  }
  setInterval(update, 300); // por si algún evento no llega
}

function init() {
  initTheme();
  applyStoredTier();
  loadHabits();
  setupEventListeners();
  setupInfoSheet();
  setupRadialPickerSheet();
  setupSettings();
  initFxCanvas();
  render();
  setupRadialPicker();
  onRebuild(setupRadialPicker);
  window.addEventListener('resize', () => setUnitScale(view.centerPx().scale));
  scheduleNotifications();
  setupViewportDebugOverlay();
  setupGestureDebugOverlay();
}

init();
