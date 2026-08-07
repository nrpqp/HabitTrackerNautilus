import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for PWA (works offline)
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

const MAX_HABITS = 7;
const TOTAL_DAYS = 21;
let habits = [];

// ── SVG Configuration ───────────────────────────────────────
const startAngle = -90;
const sweepAngle = 300;
const innerRadius = 60;
const cellThickness = 24;
const gapBetweenRings = 3;
const svgPadding = 40;
const DEG = Math.PI / 180;

/** Compute dynamic SVG dimensions based on number of visible rings */
function computeSvgMetrics(ringCount) {
  const n = Math.max(1, ringCount); // at least 1 ring so it's never empty
  const outerR = innerRadius + n * cellThickness + (n - 1) * gapBetweenRings;
  const total = (outerR + svgPadding) * 2;
  return { outerRadius: outerR, size: total, cx: total / 2, cy: total / 2 };
}

// ── Default colour palette ──────────────────────────────────
const DEFAULT_COLORS = [
  '#e74c3c',
  '#3498db',
  '#2ecc71',
  '#f39c12',
  '#9b59b6',
  '#1abc9c',
  '#e84393',
];

// ── Date helpers ────────────────────────────────────────────

/** Return "YYYY-MM-DD" in local timezone */
function toLocalISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today as "YYYY-MM-DD" */
function todayISO() {
  return toLocalISO(new Date());
}

/** Add N calendar days to an ISO date string and return new ISO string */
function addDays(isoStr, n) {
  const d = new Date(isoStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toLocalISO(d);
}

/** Format "YYYY-MM-DD" → "07 Ago" (short, human-readable, in Spanish) */
function formatDateShort(isoStr) {
  const months = [
    'Ene','Feb','Mar','Abr','May','Jun',
    'Jul','Ago','Sep','Oct','Nov','Dic',
  ];
  const parts = isoStr.split('-');
  const day = parseInt(parts[2], 10);
  const mon = months[parseInt(parts[1], 10) - 1];
  return `${String(day).padStart(2, '0')} ${mon}`;
}

/** Format "YYYY-MM-DD" → "07 Ago 2026" */
function formatDateFull(isoStr) {
  return `${formatDateShort(isoStr)} ${isoStr.split('-')[0]}`;
}

/** Difference in calendar days between two ISO strings (b - a) */
function diffDays(a, b) {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / 86400000);
}

// ── Colour helpers ──────────────────────────────────────────

function lightenColor(hex, amount = 0.4) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.min(255, Math.round(r + (255 - r) * amount));
  g = Math.min(255, Math.round(g + (255 - g) * amount));
  b = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function darkenColor(hex, amount = 0.25) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.round(r * (1 - amount)));
  g = Math.max(0, Math.round(g * (1 - amount)));
  b = Math.max(0, Math.round(b * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// ── SVG math ────────────────────────────────────────────────

function polarToCartesian(cx, cy, r, angleDeg) {
  const a = angleDeg * DEG;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function annularSectorPath(cx, cy, rInner, rOuter, a0, a1) {
  const largeArc = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  const p0o = polarToCartesian(cx, cy, rOuter, a0);
  const p1o = polarToCartesian(cx, cy, rOuter, a1);
  const p1i = polarToCartesian(cx, cy, rInner, a1);
  const p0i = polarToCartesian(cx, cy, rInner, a0);
  return [
    `M ${p0o.x} ${p0o.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} ${sweep} ${p1o.x} ${p1o.y}`,
    `L ${p1i.x} ${p1i.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} ${sweep ^ 1} ${p0i.x} ${p0i.y}`,
    'Z',
  ].join(' ');
}

// ── DOM refs ────────────────────────────────────────────────
const svgContainer = document.getElementById('svg-container');
const legendContainer = document.getElementById('habits-legend');
const addHabitBtn = document.getElementById('add-habit-btn');
const newHabitInput = document.getElementById('new-habit-input');
const addHabitContainer = document.getElementById('add-habit-container');
const tooltip = document.getElementById('cell-tooltip');
const themeToggle = document.getElementById('theme-toggle');
const infoToggle = document.getElementById('info-btn');

// ── Theme ───────────────────────────────────────────────────

/** Read current CSS variable values (respects active theme) */
function getThemeColors() {
  const s = getComputedStyle(document.documentElement);
  const v = (name) => s.getPropertyValue(name).trim();
  return {
    emptyCellFill:   v('--empty-cell-fill'),
    emptyCellStroke: v('--empty-cell-stroke'),
    lockedFill:      v('--locked-cell-fill'),
    lockedStroke:    v('--locked-cell-stroke'),
    centerFill:      v('--center-fill'),
    centerStroke:    v('--center-stroke'),
    guideStroke:     v('--guide-stroke'),
    dayLabelFill:    v('--day-label-fill'),
  };
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  renderSVG(); // re-render SVG with new colours
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    applyTheme(saved);
  } else {
    // Respect OS preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
}

// ── Init ────────────────────────────────────────────────────
function init() {
  initTheme();
  loadHabits();
  setupEventListeners();
  render();
}

// ── Persistence ─────────────────────────────────────────────
function loadHabits() {
  const stored = localStorage.getItem('habits21');
  if (stored) {
    habits = JSON.parse(stored);
    // Migrate old entries that lack startDate or color
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

function saveHabits() {
  localStorage.setItem('habits21', JSON.stringify(habits));
}

// ── Cell state logic ────────────────────────────────────────

/**
 * For a given habit and day index (0-20), return the state:
 *   'locked'   → future day, cannot interact
 *   'today'    → this is today's cell, should be highlighted
 *   'unlocked' → past day, can still be toggled
 */
function cellState(habit, dayIndex) {
  const cellDate = addDays(habit.startDate, dayIndex);
  const today = todayISO();
  if (cellDate === today) return 'today';
  if (cellDate < today) return 'unlocked';
  return 'locked';
}

// ── Render ──────────────────────────────────────────────────
function render() {
  renderLegend();
  renderSVG();
  checkLimit();
}

function renderLegend() {
  legendContainer.innerHTML = '';
  const today = todayISO();

  habits.forEach((habit) => {
    const endDate = addDays(habit.startDate, TOTAL_DAYS - 1);
    const dayNum = diffDays(habit.startDate, today) + 1; // 1-based day number
    const clampedDay = Math.min(Math.max(dayNum, 0), TOTAL_DAYS);
    const isFinished = dayNum > TOTAL_DAYS;
    const completedCount = habit.progress.filter(Boolean).length;

    const item = document.createElement('div');
    item.className = 'legend-item';

    // Top row: colour, name, actions
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

  // Colour picker events
  document.querySelectorAll('.color-picker-native').forEach((picker) => {
    picker.addEventListener('input', (e) => {
      const id = e.target.dataset.id;
      const habit = habits.find((h) => h.id === id);
      if (habit) {
        habit.color = e.target.value;
        e.target.previousElementSibling.style.background = e.target.value;
        saveHabits();
        renderSVG();
      }
    });
  });

  // Reset events
  document.querySelectorAll('.reset-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm('¿Reiniciar este hábito? Se borrará todo el avance y empezará hoy.')) {
        const habit = habits.find((h) => h.id === id);
        if (habit) {
          habit.progress = new Array(TOTAL_DAYS).fill(false);
          habit.startDate = todayISO();
          saveHabits();
          render();
        }
      }
    });
  });

  // Edit name events
  function startEditing(habitId) {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const nameEl = document.querySelector(`.habit-name[data-id="${habitId}"]`);
    if (!nameEl || nameEl.querySelector('input')) return; // already editing

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
      renderLegend(); // re-render to exit editing mode
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

  // Delete events
  document.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      if (confirm('¿Eliminar este hábito?')) {
        habits = habits.filter((h) => h.id !== id);
        saveHabits();
        render();
      }
    });
  });
}

function renderSVG() {
  // Dynamic metrics based on current habit count
  const { outerRadius: dynOuter, size: dynSize, cx: dynCx, cy: dynCy } =
    computeSvgMetrics(habits.length);

  const angleStep = sweepAngle / TOTAL_DAYS;
  const cellAngle = angleStep - Math.max(0.0001, angleStep * 0.08);
  const arcGap = angleStep - cellAngle;

  const dayAngles = Array.from({ length: TOTAL_DAYS }, (_, d) => {
    const a0 = startAngle + d * angleStep + arcGap / 2;
    const a1 = a0 + cellAngle;
    return { a0, a1, day: d + 1 };
  });

  // Read theme-aware colours from CSS variables
  const tc = getThemeColors();

  // Build per-habit gradients
  let defsHTML = '<defs>';
  habits.forEach((habit) => {
    const light = lightenColor(habit.color, 0.4);
    defsHTML += `
      <linearGradient id="grad-${habit.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="${habit.color}" />
        <stop offset="100%" stop-color="${light}" />
      </linearGradient>
    `;
  });
  defsHTML += '</defs>';

  let pathsHTML = '';
  let todayIndicators = '';

  habits.forEach((habit, r) => {
    const rOut = innerRadius + (r + 1) * cellThickness + r * gapBetweenRings;
    const rIn = rOut - cellThickness;

    dayAngles.forEach(({ a0, a1 }, d) => {
      const state = cellState(habit, d);
      const isCompleted = habit.progress[d];
      const pathData = annularSectorPath(dynCx, dynCy, rIn, rOut, a0, a1);

      let fill, stroke, strokeW;
      const cellDate = addDays(habit.startDate, d);

      if (state === 'locked') {
        fill = tc.lockedFill;
        stroke = tc.lockedStroke;
        strokeW = 0.6;
      } else if (isCompleted) {
        fill = `url(#grad-${habit.id})`;
        stroke = darkenColor(habit.color, 0.2);
        strokeW = 1.5;
      } else {
        fill = tc.emptyCellFill;
        stroke = tc.emptyCellStroke;
        strokeW = 0.8;
      }

      const cssClass =
        state === 'locked'
          ? 'day-cell locked'
          : state === 'today'
          ? 'day-cell unlocked is-today'
          : 'day-cell unlocked';

      pathsHTML += `
        <path
          class="${cssClass}"
          d="${pathData}"
          fill="${fill}"
          stroke="${stroke}"
          stroke-width="${strokeW}"
          data-habit-id="${habit.id}"
          data-day="${d}"
          data-state="${state}"
          data-date="${cellDate}"
        />
      `;

      if (state === 'today' && !isCompleted) {
        todayIndicators += `
          <path
            class="today-indicator"
            d="${pathData}"
            stroke="${habit.color}"
          />
        `;
      }
    });
  });

  // Day number labels — positioned just outside the outermost ring
  let textHTML = '';
  const labelR = dynOuter + 16;

  dayAngles.forEach(({ a0, a1, day }) => {
    const aMid = (a0 + a1) / 2;
    const p = polarToCartesian(dynCx, dynCy, labelR, aMid);
    textHTML += `
      <text
        x="${p.x}"
        y="${p.y}"
        font-size="13"
        font-weight="700"
        text-anchor="middle"
        dominant-baseline="middle"
        fill="${tc.dayLabelFill}"
        font-family="Outfit"
      >${day}</text>
    `;
  });

  const svgHTML = `
    <svg viewBox="0 0 ${dynSize} ${dynSize}">
      ${defsHTML}
      <circle cx="${dynCx}" cy="${dynCy}" r="${innerRadius - 12}" fill="none" stroke="${tc.guideStroke}" stroke-width="1" />
      <circle cx="${dynCx}" cy="${dynCy}" r="${innerRadius - 8}" fill="${tc.centerFill}" stroke="${tc.centerStroke}" stroke-width="1.2" />
      ${pathsHTML}
      ${todayIndicators}
      ${textHTML}
    </svg>
  `;

  svgContainer.innerHTML = svgHTML;

  // Click events — only unlocked / today cells
  document.querySelectorAll('.day-cell.unlocked').forEach((cell) => {
    cell.addEventListener('click', (e) => {
      const habitId = e.target.getAttribute('data-habit-id');
      const dayIndex = parseInt(e.target.getAttribute('data-day'), 10);

      const habit = habits.find((h) => h.id === habitId);
      if (habit) {
        habit.progress[dayIndex] = !habit.progress[dayIndex];
        saveHabits();
        renderSVG();
        renderLegend(); // update day counter
      }
    });
  });

  // Tooltip on hover
  document.querySelectorAll('.day-cell').forEach((cell) => {
    cell.addEventListener('mouseenter', (e) => {
      const state = e.target.getAttribute('data-state');
      const date = e.target.getAttribute('data-date');
      const dayIndex = parseInt(e.target.getAttribute('data-day'), 10);
      const habitId = e.target.getAttribute('data-habit-id');
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      const isCompleted = habit.progress[dayIndex];
      let label = `Día ${dayIndex + 1} · ${formatDateFull(date)}`;
      if (state === 'locked') label += ' · 🔒 Bloqueado';
      else if (state === 'today' && !isCompleted) label += ' · ⭐ ¡Hoy!';
      else if (isCompleted) label += ' · ✅';

      tooltip.textContent = label;
      tooltip.classList.add('visible');
    });

    cell.addEventListener('mousemove', (e) => {
      tooltip.style.left = e.clientX + 14 + 'px';
      tooltip.style.top = e.clientY + 14 + 'px';
    });

    cell.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });
  });
}

function checkLimit() {
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

// ── Actions ─────────────────────────────────────────────────
function addHabit() {
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
  addHabitBtn.addEventListener('click', addHabit);
  newHabitInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addHabit();
  });
  themeToggle.addEventListener('click', toggleTheme);
  infoToggle.addEventListener('click', () => {
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

// ── Start ───────────────────────────────────────────────────
init();
