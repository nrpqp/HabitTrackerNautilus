import { registerSW } from 'virtual:pwa-register';

import { MAX_HABITS, TOTAL_DAYS, ELEMENTS, MAX_NAME_LENGTH } from './constants.js';
import { todayISO, addDays, formatDateShort, diffDays } from './utils/date.js';
import { habits, loadHabits, saveHabits } from './store.js';
import { initTheme, toggleTheme } from './theme.js';
import { renderSVG } from './render/svg.js';

if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

// ── Particles ────────────────────────────────────────────────

let particles = [];
let particleRafId = null;
let pCtx = null;

function initParticleCanvas() {
  const canvas = document.getElementById('effect-overlay');
  if (!canvas) return;
  pCtx = canvas.getContext('2d');
  resizeParticleCanvas();
  window.addEventListener('resize', resizeParticleCanvas);
}

function resizeParticleCanvas() {
  const canvas = document.getElementById('effect-overlay');
  if (!canvas) return;
  const container = document.getElementById('svg-container');
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}

function spawnParticles(x, y, elementId, isMilestone) {
  const el = ELEMENTS.find((e) => e.id === elementId);
  if (!el || !pCtx) return;

  const count = isMilestone ? 20 : 6;
  const baseSpeed = isMilestone ? el.speed * 1.8 : el.speed;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
    let vx, vy;
    if (el.upward) {
      vx = Math.cos(angle) * baseSpeed * 0.7;
      vy = -baseSpeed * (0.6 + Math.random() * 0.9);
    } else {
      vx = Math.cos(angle) * baseSpeed * (0.7 + Math.random() * 0.6);
      vy = Math.sin(angle) * baseSpeed * (0.7 + Math.random() * 0.6);
    }
    particles.push({
      x, y, vx, vy,
      size: isMilestone ? 4 + Math.random() * 6 : 2.5 + Math.random() * 3.5,
      opacity: 1,
      rgb: el.rgb,
      life: 0,
      maxLife: isMilestone ? 55 + Math.random() * 30 : 32 + Math.random() * 18,
      particleType: el.particleType,
      rot: Math.random() * Math.PI * 2,
      gravity: el.gravity,
    });
  }

  if (!particleRafId) particleRafId = requestAnimationFrame(animParticles);
}

function animParticles() {
  if (!pCtx) return;
  const canvas = document.getElementById('effect-overlay');
  pCtx.clearRect(0, 0, canvas.width, canvas.height);

  particles = particles.filter((p) => p.life < p.maxLife);

  for (const p of particles) {
    p.life++;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.rot += 0.08;
    p.opacity = Math.pow(1 - p.life / p.maxLife, 0.7);

    pCtx.save();
    pCtx.globalAlpha = p.opacity * 0.9;
    pCtx.translate(p.x, p.y);
    pCtx.rotate(p.rot);
    pCtx.fillStyle = `rgb(${p.rgb[0]},${p.rgb[1]},${p.rgb[2]})`;
    pCtx.strokeStyle = `rgb(${p.rgb[0]},${p.rgb[1]},${p.rgb[2]})`;
    drawParticleShape(pCtx, p);
    pCtx.restore();
  }

  if (particles.length > 0) {
    particleRafId = requestAnimationFrame(animParticles);
  } else {
    particleRafId = null;
    pCtx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function drawParticleShape(ctx, p) {
  const s = p.size;
  const progress = p.life / p.maxLife;
  switch (p.particleType) {
    case 'spark':
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.5, s * 0.28, s, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'ripple':
      ctx.beginPath();
      ctx.arc(0, 0, s * (0.4 + progress * 0.8), 0, Math.PI * 2);
      ctx.lineWidth = 1.5 * (1 - progress);
      ctx.globalAlpha *= 0.6;
      ctx.stroke();
      break;
    case 'leaf':
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.7, -s * 0.4, s * 0.6, s * 0.6, 0, s * 0.3);
      ctx.bezierCurveTo(-s * 0.6, s * 0.6, -s * 0.7, -s * 0.4, 0, -s);
      ctx.fill();
      break;
    case 'bolt':
      ctx.beginPath();
      ctx.rect(-s * 0.18, -s, s * 0.36, s * 2);
      ctx.fill();
      break;
    case 'crystal':
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
        i === 0
          ? ctx.moveTo(Math.cos(a) * s, Math.sin(a) * s)
          : ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      }
      ctx.closePath();
      ctx.lineWidth = 1;
      ctx.globalAlpha *= 0.8;
      ctx.stroke();
      break;
    case 'chunk':
      ctx.beginPath();
      ctx.rect(-s * 0.55, -s * 0.55, s * 1.1, s * 1.1);
      ctx.fill();
      break;
    case 'swirl':
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.7, 0, Math.PI * 1.3);
      ctx.lineWidth = 1.5;
      ctx.globalAlpha *= 0.5;
      ctx.stroke();
      break;
    default:
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
      ctx.fill();
  }
}

// ── Render ───────────────────────────────────────────────────

function renderSVGOnly() {
  renderSVG(
    (e, habitId, dayIndex, prevState) => {
      if (e) {
        const habit = habits.find((h) => h.id === habitId);
        if (habit) {
          const container = document.getElementById('svg-container');
          const rect = container.getBoundingClientRect();
          spawnParticles(e.clientX - rect.left, e.clientY - rect.top, habit.element, false);
          if (!prevState && habit.progress[dayIndex]) {
            checkMilestone(dayIndex, habit);
          }
        }
      }
      renderSVGOnly();
      scheduleNotifications();
    },
    (habitId, event) => openHabitSheet(habitId, 'edit', event)
  );
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

  const container = document.getElementById('svg-container');
  const rect = container.getBoundingClientRect();
  spawnParticles(rect.width / 2, rect.height / 2, habit.element, true);
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

  // Populate element selector
  swatchesEl.innerHTML = ELEMENTS.map((el) => `
    <button
      class="element-btn${habit && habit.element === el.id ? ' active' : ''}"
      data-element="${el.id}"
      aria-label="${el.name}"
    >
      <span class="element-icon">${el.icon}</span>
      <span class="element-name">${el.name}</span>
    </button>
  `).join('');

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

function init() {
  initTheme();
  loadHabits();
  setupEventListeners();
  initParticleCanvas();
  render();
  scheduleNotifications();
}

init();
