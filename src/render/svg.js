import {
  TOTAL_DAYS,
  startAngle, sweepAngle, innerRadius, cellThickness, gapBetweenRings,
} from '../constants.js';
import { addDays, formatDateFull } from '../utils/date.js';
import { lightenColor, darkenColor } from '../utils/color.js';
import { computeSvgMetrics, polarToCartesian, annularSectorPath } from '../utils/svg.js';
import { getThemeColors } from '../theme.js';
import { habits, saveHabits, cellState } from '../store.js';

// Gap bisector angle (midpoint of the 60° gap between arc end ~210° and arc start ~270°)
const GAP_BISECTOR = 240;

export function renderSVG(onCellClick, onLabelClick) {
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

  // Sort habits by name length (shortest = innermost ring), stable by insertion order
  const sortedHabits = [...habits].sort(
    (a, b) => a.name.length - b.name.length || habits.indexOf(a) - habits.indexOf(b)
  );

  // Font size for labels, proportional to innerRadius
  const labelFontSize = Math.max(9, Math.floor(innerRadius * 0.2));

  let defsHTML = '<defs>';
  sortedHabits.forEach((habit) => {
    const light = lightenColor(habit.color, 0.4);
    defsHTML += `
      <linearGradient id="grad-${habit.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="${habit.color}" />
        <stop offset="100%" stop-color="${light}" />
      </linearGradient>
    `;
  });
  // label arc paths are added in the main loop below; defsHTML is closed after it

  let pathsHTML = '';
  let todayIndicators = '';
  let labelsHTML = '';

  sortedHabits.forEach((habit, r) => {
    const rOut = innerRadius + (r + 1) * cellThickness + r * gapBetweenRings;
    const rIn = rOut - cellThickness;
    const rMid = rIn + cellThickness / 2;

    // Arc path for the curved label in the gap (210°→270°, clockwise, sweep=1)
    const arcLabelR = rIn + 2;
    const arcStart = polarToCartesian(dynCx, dynCy, arcLabelR, 210);
    const arcEnd = polarToCartesian(dynCx, dynCy, arcLabelR, 270);
    defsHTML += `<path id="label-arc-${habit.id}" d="M ${arcStart.x} ${arcStart.y} A ${arcLabelR} ${arcLabelR} 0 0 1 ${arcEnd.x} ${arcEnd.y}" fill="none" />`;

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
      } else if (state === 'old') {
        if (isCompleted) {
          fill = `url(#grad-${habit.id})`;
          stroke = darkenColor(habit.color, 0.2);
          strokeW = 1.5;
        } else {
          fill = tc.oldCellFill;
          stroke = tc.oldCellStroke;
          strokeW = 0.6;
        }
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
        state === 'locked' || state === 'old'
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

    // Label in the gap: curved text following the arc of each ring
    const anchorPos = polarToCartesian(dynCx, dynCy, arcLabelR, GAP_BISECTOR);
    const hitW = Math.max(44, Math.ceil(habit.name.length * labelFontSize * 0.65) + 8);
    const hitH = Math.max(44, cellThickness + 4);
    // Tangent direction for CW arc at GAP_BISECTOR: GAP_BISECTOR + 90
    const hitRotAngle = GAP_BISECTOR + 90;

    labelsHTML += `
      <text
        font-size="${labelFontSize}"
        font-weight="600"
        font-family="Outfit"
        fill="${habit.color}"
        pointer-events="none"
      ><textPath href="#label-arc-${habit.id}" startOffset="50%" text-anchor="middle">${habit.name}</textPath></text>
      <rect
        class="habit-label-hit"
        x="${anchorPos.x - hitW / 2}"
        y="${anchorPos.y - hitH / 2}"
        width="${hitW}"
        height="${hitH}"
        fill="transparent"
        data-habit-id="${habit.id}"
        transform="rotate(${hitRotAngle}, ${anchorPos.x}, ${anchorPos.y})"
        style="cursor: pointer;"
      />
    `;
  });

  defsHTML += '</defs>';

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
      ${labelsHTML}
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
      }
    });
  });

  document.querySelectorAll('.habit-label-hit').forEach((rect) => {
    rect.addEventListener('click', (e) => {
      const habitId = e.currentTarget.getAttribute('data-habit-id');
      if (onLabelClick) onLabelClick(habitId, e);
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
      else if (state === 'old' && !isCompleted) label += ' · ❌ Perdido';
      else if (state === 'today' && !isCompleted) label += ' · ⭐ ¡Hoy!';
      else if (state === 'yesterday' && !isCompleted) label += ' · ⏰ Ayer';
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
