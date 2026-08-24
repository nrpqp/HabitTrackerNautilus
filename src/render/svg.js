import {
  TOTAL_DAYS,
  startAngle, sweepAngle, innerRadius, cellThickness, gapBetweenRings,
} from '../constants.js';
import { addDays, formatDateFull } from '../utils/date.js';
import { lightenColor, darkenColor } from '../utils/color.js';
import { computeSvgMetrics, polarToCartesian, annularSectorPath } from '../utils/svg.js';
import { getThemeColors } from '../theme.js';
import { habits, saveHabits, cellState } from '../store.js';

export function renderSVG(onCellClick, onLegendUpdate) {
  const svgContainer = document.getElementById('svg-container');
  const tooltip = document.getElementById('cell-tooltip');

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

  const tc = getThemeColors();

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
      const cellDate = addDays(habit.startDate, d);

      let fill, stroke, strokeW;

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

  svgContainer.innerHTML = `
    <svg viewBox="0 0 ${dynSize} ${dynSize}">
      ${defsHTML}
      <circle cx="${dynCx}" cy="${dynCy}" r="${innerRadius - 12}" fill="none" stroke="${tc.guideStroke}" stroke-width="1" />
      <circle cx="${dynCx}" cy="${dynCy}" r="${innerRadius - 8}" fill="${tc.centerFill}" stroke="${tc.centerStroke}" stroke-width="1.2" />
      ${pathsHTML}
      ${todayIndicators}
      ${textHTML}
    </svg>
  `;

  document.querySelectorAll('.day-cell.unlocked').forEach((cell) => {
    cell.addEventListener('click', (e) => {
      const habitId = e.target.getAttribute('data-habit-id');
      const dayIndex = parseInt(e.target.getAttribute('data-day'), 10);
      const habit = habits.find((h) => h.id === habitId);
      if (habit) {
        habit.progress[dayIndex] = !habit.progress[dayIndex];
        saveHabits();
        if (onCellClick) onCellClick();
        if (onLegendUpdate) onLegendUpdate();
      }
    });
  });

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
