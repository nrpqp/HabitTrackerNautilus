import {
  TOTAL_DAYS, ELEMENTS,
  startAngle, sweepAngle, innerRadius, cellThickness, gapBetweenRings,
} from '../constants.js';
import { addDays, formatDateFull } from '../utils/date.js';
import { elementColor } from '../utils/color.js';
import { computeSvgMetrics, polarToCartesian, annularSectorPath } from '../utils/svg.js';
import { getThemeColors } from '../theme.js';
import { habits, saveHabits, cellState, isDoneToday } from '../store.js';

const NS = 'http://www.w3.org/2000/svg';

// Gap bisector angle (midpoint of the 60° gap between arc end ~210° and arc start ~270°)
const GAP_BISECTOR = 240;

// El hueco del label mide siempre 60°, pero cada anillo tiene un radio
// distinto -> distinta longitud de arco disponible. Sin ajustar la fuente,
// un nombre en el anillo interno (arco más corto) se sale del trazo curvo
// y sigue en línea recta más allá de sus extremos: pierde la curvatura.
const LABEL_ARC_DEGREES = 60;
const LABEL_ARC_MARGIN = 0.88; // deja aire en las puntas del arco
const LABEL_MIN_FONT = 7;

// Mezcla del núcleo. Cada hábito es una partícula —mancha de color más el
// icono de su elemento, juntos— en una órbita común alrededor del centro.
//
// El radio de la órbita es el equilibrio entre dos exigencias opuestas:
// cuanto más chico, más se solapan las manchas y más se mezcla el color;
// cuanto más grande, más aire tienen los iconos para leerse. Con 22 y
// siete hábitos quedan ~19px entre iconos vecinos (legibles) y las manchas
// enfrentadas siguen cubriendo el centro (44px de separación contra 28 de
// radio cada una), que es donde nace el color nuevo.
const CORE_BLEND_RADIUS = 28;
const CORE_BLEND_ORBIT = 22;
const CORE_BLEND_ICON_SIZE = 12;

/** Encoge la fuente del label lo justo para que el nombre completo entre
    en el arco de su anillo, midiendo el largo real del texto renderizado
    en vez de estimarlo por cantidad de caracteres. */
function fitLabelFont(label, arcLabelR, maxFontSize) {
  label.setAttribute('font-size', maxFontSize);
  const maxLen = arcLabelR * (LABEL_ARC_DEGREES * Math.PI / 180) * LABEL_ARC_MARGIN;
  const len = label.getComputedTextLength();
  if (len > maxLen && len > 0) {
    label.setAttribute('font-size', Math.max(LABEL_MIN_FONT, maxFontSize * (maxLen / len)));
  }
}

// ── Estado del árbol construido ──────────────────────────────
// El SVG se construye una sola vez y después sólo se mutan atributos.
// Reconstruir sólo cuando cambia el número de anillos o su orden.
let container = null;
let svgEl = null;
let defsEl = null;
let overlayEl = null;
let centerCircle = null;
let guideCircle = null;
let dayNumbers = [];
let gauges = [];        // [{ arc, length }] — un segmento por hábito
let coreBlend = [];     // [{ habitId, wedge }] — mezcla elemental del núcleo
let rings = [];          // [{ habitId, rIn, rOut, rMid, cells:[path], indicator, label, textPath, hit }]
let metrics = null;
let dayAngles = [];
let builtSignature = '';
const rebuildListeners = [];

let onCellClick = null;
let onLabelClick = null;

function sortedHabits() {
  return [...habits].sort(
    (a, b) => a.name.length - b.name.length || habits.indexOf(a) - habits.indexOf(b)
  );
}

// Firma del orden: cambia si se añade, elimina o reordena un anillo.
function orderSignature(list) {
  return list.map((h) => h.id).join('|');
}

function computeDayAngles() {
  const angleStep = sweepAngle / TOTAL_DAYS;
  const cellAngle = angleStep - Math.max(0.0001, angleStep * 0.08);
  const arcGap = angleStep - cellAngle;
  return Array.from({ length: TOTAL_DAYS }, (_, d) => {
    const a0 = startAngle + d * angleStep + arcGap / 2;
    const a1 = a0 + cellAngle;
    return { a0, a1, mid: (a0 + a1) / 2, day: d + 1 };
  });
}

// ── Construcción ─────────────────────────────────────────────

function build(list) {
  container = document.getElementById('svg-container');
  metrics = computeSvgMetrics(list.length);
  dayAngles = computeDayAngles();
  const { size, cx, cy, outerRadius } = metrics;
  const labelFontSize = Math.max(9, Math.floor(innerRadius * 0.2));

  // Sacar el SVG anterior sin tocar el canvas overlay ni la etiqueta del núcleo,
  // que son hermanos suyos dentro del contenedor.
  if (svgEl) svgEl.remove();

  svgEl = document.createElementNS(NS, 'svg');
  svgEl.setAttribute('viewBox', `0 0 ${size} ${size}`);

  defsEl = document.createElementNS(NS, 'defs');
  svgEl.appendChild(defsEl);

  guideCircle = document.createElementNS(NS, 'circle');
  guideCircle.setAttribute('cx', cx);
  guideCircle.setAttribute('cy', cy);
  guideCircle.setAttribute('r', innerRadius - 12);
  guideCircle.setAttribute('fill', 'none');
  guideCircle.setAttribute('stroke-width', '1');
  svgEl.appendChild(guideCircle);

  centerCircle = document.createElementNS(NS, 'circle');
  centerCircle.setAttribute('cx', cx);
  centerCircle.setAttribute('cy', cy);
  centerCircle.setAttribute('r', innerRadius - 8);
  centerCircle.setAttribute('stroke-width', '1.2');
  centerCircle.setAttribute('class', 'nautilus-core');
  svgEl.appendChild(centerCircle);

  // Mezcla elemental del núcleo: una mancha por hábito guardado, igual que
  // el medidor de arcos (gauges) más abajo — no sólo los activos hoy, para
  // no depender de un signature de rebuild aparte. La mancha de un hábito
  // sin reto en curso simplemente nunca se enciende.
  //
  // Nunca se dibuja nada por lo pendiente: una mancha apagada es opacidad
  // cero, sin contorno ni hueco que insinúe una tarea sin hacer. Ver
  // design.md — el layout de cuñas anterior se leía como un checklist a
  // medio llenar, que es justo lo que este centro no debe comunicar.
  // Todo el conjunto vive dentro de un grupo que rota: la órbita es del
  // sistema entero, no de cada partícula por separado, así ninguna se
  // acerca a otra al girar y la separación calculada acá se conserva.
  const orbitGroup = document.createElementNS(NS, 'g');
  orbitGroup.setAttribute('class', 'core-orbit');
  orbitGroup.style.transformBox = 'view-box';
  orbitGroup.style.transformOrigin = `${cx}px ${cy}px`;

  const blendGroup = document.createElementNS(NS, 'g');
  blendGroup.setAttribute('class', 'core-blend');
  // Los iconos van en su propio grupo, por encima y sin modo de fusión: el
  // `screen`/`multiply` de las manchas lavaría el color de los emojis.
  const iconGroup = document.createElementNS(NS, 'g');
  iconGroup.setAttribute('class', 'core-blend-icons');
  iconGroup.setAttribute('pointer-events', 'none');

  // Reparto angular uniforme por índice, no sembrado por id: es lo único
  // que garantiza que dos partículas nunca queden pegadas — con ángulos
  // al azar, siete hábitos podían caer casi encimados. Que lo apagado no
  // dibuje nada evita que este orden regular se lea como casilleros.
  const step = 360 / Math.max(1, list.length);
  coreBlend = list.map((habit, i) => {
    const angle = -90 + i * step;
    const p = polarToCartesian(cx, cy, CORE_BLEND_ORBIT, angle);

    // Degradado radial en vez de `filter: blur()`: da el mismo borde
    // difuso sin el coste de repintado de un filtro, sin recorte del área
    // filtrada y escalando con el viewBox. Es además la misma técnica que
    // ya usa `glowSprite` en fx/engine.js para las partículas.
    const grad = document.createElementNS(NS, 'radialGradient');
    grad.setAttribute('id', `core-blend-grad-${habit.id}`);
    const inner = document.createElementNS(NS, 'stop');
    inner.setAttribute('offset', '0%');
    const mid = document.createElementNS(NS, 'stop');
    mid.setAttribute('offset', '45%');
    const outer = document.createElementNS(NS, 'stop');
    outer.setAttribute('offset', '100%');
    outer.setAttribute('stop-opacity', '0');
    grad.appendChild(inner);
    grad.appendChild(mid);
    grad.appendChild(outer);
    defsEl.appendChild(grad);

    const blob = document.createElementNS(NS, 'circle');
    blob.setAttribute('cx', p.x);
    blob.setAttribute('cy', p.y);
    blob.setAttribute('r', CORE_BLEND_RADIUS);
    blob.setAttribute('fill', `url(#core-blend-grad-${habit.id})`);
    blob.setAttribute('class', 'core-blend-blob');
    blob.style.transformBox = 'fill-box';
    blob.style.transformOrigin = 'center';
    blendGroup.appendChild(blob);

    // El icono viaja con su mancha, en el mismo punto de la órbita. Va
    // dentro de un grupo que gira al revés que la órbita y sobre el propio
    // icono: sin eso el emoji daría vueltas de cabeza mientras orbita.
    const spin = document.createElementNS(NS, 'g');
    spin.setAttribute('class', 'core-icon-spin');
    spin.style.transformBox = 'view-box';
    spin.style.transformOrigin = `${p.x}px ${p.y}px`;

    const icon = document.createElementNS(NS, 'text');
    icon.setAttribute('x', p.x);
    icon.setAttribute('y', p.y);
    icon.setAttribute('text-anchor', 'middle');
    icon.setAttribute('dominant-baseline', 'central');
    icon.setAttribute('font-size', CORE_BLEND_ICON_SIZE);
    icon.setAttribute('class', 'core-blend-icon');
    icon.style.transformBox = 'fill-box';
    icon.style.transformOrigin = 'center';
    spin.appendChild(icon);
    iconGroup.appendChild(spin);

    return { habitId: habit.id, blob, icon, stops: [inner, mid, outer] };
  });
  orbitGroup.appendChild(blendGroup);
  orbitGroup.appendChild(iconGroup);
  svgEl.appendChild(orbitGroup);

  rings = list.map((habit, r) => {
    const rOut = innerRadius + (r + 1) * cellThickness + r * gapBetweenRings;
    const rIn = rOut - cellThickness;
    const rMid = rIn + cellThickness / 2;

    const group = document.createElementNS(NS, 'g');
    group.setAttribute('class', 'habit-ring');

    const cells = dayAngles.map(({ a0, a1 }, d) => {
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', annularSectorPath(cx, cy, rIn, rOut, a0, a1));
      path.setAttribute('data-habit-id', habit.id);
      path.setAttribute('data-day', d);
      path.style.transformBox = 'fill-box';
      path.style.transformOrigin = 'center';
      group.appendChild(path);
      return path;
    });

    // El indicador de "hoy" es uno por anillo: sólo un día puede serlo.
    const indicator = document.createElementNS(NS, 'path');
    indicator.setAttribute('class', 'today-indicator');
    indicator.style.display = 'none';
    group.appendChild(indicator);

    svgEl.appendChild(group);

    // Etiqueta curva en el hueco de 60° (210°→270°, sentido horario)
    const arcLabelR = rIn + 2;
    const arcStart = polarToCartesian(cx, cy, arcLabelR, 210);
    const arcEnd = polarToCartesian(cx, cy, arcLabelR, 270);
    const arcPath = document.createElementNS(NS, 'path');
    arcPath.setAttribute('id', `label-arc-${habit.id}`);
    arcPath.setAttribute('d', `M ${arcStart.x} ${arcStart.y} A ${arcLabelR} ${arcLabelR} 0 0 1 ${arcEnd.x} ${arcEnd.y}`);
    arcPath.setAttribute('fill', 'none');
    defsEl.appendChild(arcPath);

    const label = document.createElementNS(NS, 'text');
    label.setAttribute('font-size', labelFontSize);
    label.setAttribute('font-weight', '600');
    label.setAttribute('font-family', 'Outfit');
    label.setAttribute('pointer-events', 'none');
    const textPath = document.createElementNS(NS, 'textPath');
    textPath.setAttribute('href', `#label-arc-${habit.id}`);
    textPath.setAttribute('startOffset', '50%');
    textPath.setAttribute('text-anchor', 'middle');
    label.appendChild(textPath);
    svgEl.appendChild(label);

    const anchorPos = polarToCartesian(cx, cy, arcLabelR, GAP_BISECTOR);
    const hit = document.createElementNS(NS, 'rect');
    hit.setAttribute('class', 'habit-label-hit');
    hit.setAttribute('fill', 'transparent');
    hit.setAttribute('data-habit-id', habit.id);
    hit.setAttribute('transform', `rotate(${GAP_BISECTOR + 90}, ${anchorPos.x}, ${anchorPos.y})`);
    hit.dataset.anchorX = anchorPos.x;
    hit.dataset.anchorY = anchorPos.y;
    svgEl.appendChild(hit);

    return { habitId: habit.id, rIn, rOut, rMid, cells, indicator, label, textPath, hit };
  });

  // Medidor del día alrededor del núcleo: un segmento por hábito.
  const gaugeR = innerRadius - 20;
  const seg = 360 / Math.max(1, list.length);
  const segPad = list.length > 1 ? 7 : 2;
  gauges = list.map((habit, i) => {
    const a0 = -90 + i * seg + segPad / 2;
    const a1 = -90 + (i + 1) * seg - segPad / 2;
    const p0 = polarToCartesian(cx, cy, gaugeR, a0);
    const p1 = polarToCartesian(cx, cy, gaugeR, a1);
    const large = a1 - a0 > 180 ? 1 : 0;
    const d = `M ${p0.x} ${p0.y} A ${gaugeR} ${gaugeR} 0 ${large} 1 ${p1.x} ${p1.y}`;
    const length = gaugeR * (a1 - a0) * (Math.PI / 180);

    const track = document.createElementNS(NS, 'path');
    track.setAttribute('class', 'gauge-track');
    track.setAttribute('d', d);
    svgEl.appendChild(track);

    const arc = document.createElementNS(NS, 'path');
    arc.setAttribute('class', 'gauge-arc');
    arc.setAttribute('d', d);
    arc.setAttribute('stroke-dasharray', length);
    arc.setAttribute('stroke-dashoffset', length);
    svgEl.appendChild(arc);

    return { habitId: habit.id, arc, track, length };
  });

  // Capa por encima de las celdas para lo que dibujen los efectos dentro del SVG.
  overlayEl = document.createElementNS(NS, 'g');
  overlayEl.setAttribute('class', 'fx-overlay');
  overlayEl.setAttribute('pointer-events', 'none');
  svgEl.appendChild(overlayEl);

  const labelR = outerRadius + 16;
  dayNumbers = dayAngles.map(({ mid, day }) => {
    const p = polarToCartesian(cx, cy, labelR, mid);
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', p.x);
    t.setAttribute('y', p.y);
    t.setAttribute('font-size', '13');
    t.setAttribute('font-weight', '700');
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'middle');
    t.setAttribute('font-family', 'Outfit');
    t.textContent = day;
    svgEl.appendChild(t);
    return t;
  });

  attachListeners();
  // El SVG va delante para que el canvas overlay quede por encima.
  container.insertBefore(svgEl, container.firstChild);
  rebuildListeners.forEach((fn) => fn());
}

// ── Listeners: se enganchan una sola vez por construcción ────

function attachListeners() {
  const tooltip = document.getElementById('cell-tooltip');

  svgEl.addEventListener('click', (e) => {
    const cell = e.target.closest('path[data-habit-id]');
    if (cell) {
      const habitId = cell.getAttribute('data-habit-id');
      const dayIndex = parseInt(cell.getAttribute('data-day'), 10);
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;
      // La ventana de edición se comprueba aquí, no filtrando por selector:
      // el estado de una celda cambia con el paso de los días.
      const state = cellState(habit, dayIndex);
      if (state !== 'today' && state !== 'yesterday') return;
      const prevState = habit.progress[dayIndex];
      habit.progress[dayIndex] = !prevState;
      saveHabits();
      if (onCellClick) onCellClick(e, habitId, dayIndex, prevState);
      return;
    }
    const hit = e.target.closest('.habit-label-hit');
    if (hit && onLabelClick) onLabelClick(hit.getAttribute('data-habit-id'), e);
  });

  svgEl.addEventListener('mouseover', (e) => {
    const cell = e.target.closest('path[data-habit-id]');
    if (!cell || !tooltip) return;
    const habitId = cell.getAttribute('data-habit-id');
    const dayIndex = parseInt(cell.getAttribute('data-day'), 10);
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const state = cell.getAttribute('data-state');
    const date = cell.getAttribute('data-date');
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

  svgEl.addEventListener('mousemove', (e) => {
    if (!tooltip || !tooltip.classList.contains('visible')) return;
    tooltip.style.left = e.clientX + 14 + 'px';
    tooltip.style.top = e.clientY + 14 + 'px';
  });

  svgEl.addEventListener('mouseout', (e) => {
    if (!tooltip) return;
    if (!e.relatedTarget || !svgEl.contains(e.relatedTarget)) {
      tooltip.classList.remove('visible');
      return;
    }
    if (!e.relatedTarget.closest('path[data-habit-id]')) {
      tooltip.classList.remove('visible');
    }
  });
}

// ── Repintado: sólo muta atributos ───────────────────────────

function paint(list) {
  const tc = getThemeColors();
  const labelFontSize = Math.max(9, Math.floor(innerRadius * 0.2));

  guideCircle.setAttribute('stroke', tc.guideStroke);
  centerCircle.setAttribute('fill', tc.centerFill);
  centerCircle.setAttribute('stroke', tc.centerStroke);

  coreBlend.forEach((cb, i) => {
    const habit = list[i];
    if (!habit) return;
    // El degradado se apaga hacia el borde: el color pleno en el centro de
    // la mancha, transparente en el perímetro. La opacidad final la pone
    // el CSS al encender la mancha; acá sólo va el color.
    const color = elementColor(habit.element, 20);
    cb.stops[0].setAttribute('stop-color', color);
    cb.stops[1].setAttribute('stop-color', color);
    cb.stops[2].setAttribute('stop-color', color);

    const el = ELEMENTS.find((e) => e.id === habit.element);
    const glyph = el ? el.icon : '';
    if (cb.icon.textContent !== glyph) cb.icon.textContent = glyph;
  });

  rings.forEach((ring, r) => {
    const habit = list[r];
    if (!habit) return;

    let todayIndex = -1;

    ring.cells.forEach((cell, d) => {
      const state = cellState(habit, d);
      const isCompleted = habit.progress[d];
      const cellDate = addDays(habit.startDate, d);
      const phase = d < 7 ? 'phase-1' : d < 14 ? 'phase-2' : 'phase-3';

      let fill, stroke, strokeW;
      if (state === 'locked') {
        fill = tc.lockedFill; stroke = tc.lockedStroke; strokeW = 0.6;
      } else if (state === 'old') {
        if (isCompleted) {
          fill = elementColor(habit.element, d);
          stroke = elementColor(habit.element, d, -12);
          strokeW = 1.5;
        } else {
          fill = tc.oldCellFill; stroke = tc.oldCellStroke; strokeW = 0.6;
        }
      } else if (isCompleted) {
        fill = elementColor(habit.element, d);
        stroke = elementColor(habit.element, d, -12);
        strokeW = 1.5;
      } else {
        fill = tc.emptyCellFill; stroke = tc.emptyCellStroke; strokeW = 0.8;
      }

      cell.setAttribute('fill', fill);
      cell.setAttribute('stroke', stroke);
      cell.setAttribute('stroke-width', strokeW);
      cell.setAttribute('data-state', state);
      cell.setAttribute('data-date', cellDate);

      const unlocked = state === 'today' || state === 'yesterday';
      cell.setAttribute(
        'class',
        `day-cell ${unlocked ? 'unlocked' : 'locked'}${state === 'today' ? ' is-today' : ''}` +
        (isCompleted ? ` ${phase}` : '')
      );

      if (state === 'today') todayIndex = d;
    });

    // Indicador de "hoy": sólo cuando el día actual está sin marcar.
    if (todayIndex !== -1 && !habit.progress[todayIndex]) {
      ring.indicator.setAttribute('d', ring.cells[todayIndex].getAttribute('d'));
      ring.indicator.setAttribute('stroke', elementColor(habit.element, todayIndex));
      ring.indicator.style.display = '';
    } else {
      ring.indicator.style.display = 'none';
    }

    ring.label.setAttribute('fill', elementColor(habit.element, 10));
    if (ring.textPath.textContent !== habit.name) {
      ring.textPath.textContent = habit.name;
      fitLabelFont(ring.label, ring.rIn + 2, labelFontSize);
    }

    const hitW = Math.max(44, Math.ceil(habit.name.length * labelFontSize * 0.65) + 8);
    const hitH = Math.max(44, cellThickness + 4);
    const ax = parseFloat(ring.hit.dataset.anchorX);
    const ay = parseFloat(ring.hit.dataset.anchorY);
    ring.hit.setAttribute('x', ax - hitW / 2);
    ring.hit.setAttribute('y', ay - hitH / 2);
    ring.hit.setAttribute('width', hitW);
    ring.hit.setAttribute('height', hitH);
  });

  dayNumbers.forEach((t) => t.setAttribute('fill', tc.dayLabelFill));

  gauges.forEach((g, i) => {
    const habit = list[i];
    if (!habit) return;
    g.arc.setAttribute('stroke', elementColor(habit.element, 20));
    g.arc.setAttribute('stroke-dashoffset', isDoneToday(habit) ? 0 : g.length);
    g.track.setAttribute('stroke', tc.guideStroke);
  });
}

// ── API pública ──────────────────────────────────────────────

export function renderSVG(cellClickHandler, labelClickHandler) {
  onCellClick = cellClickHandler;
  onLabelClick = labelClickHandler;

  const list = sortedHabits();
  const signature = orderSignature(list);
  if (!svgEl || signature !== builtSignature) {
    build(list);
    builtSignature = signature;
  }
  paint(list);
}

/** Se ejecuta cada vez que el árbol SVG se reconstruye desde cero. */
export function onRebuild(fn) {
  rebuildListeners.push(fn);
}

export const view = {
  get svg() { return svgEl; },
  get overlay() { return overlayEl; },
  get core() { return centerCircle; },
  get gauges() { return gauges; },
  get coreBlend() { return coreBlend; },
  get metrics() { return metrics; },
  get ringCount() { return rings.length; },

  /** Índice de anillo de un hábito, o -1 si no está en pantalla. */
  ringIndexOf(habitId) {
    return rings.findIndex((r) => r.habitId === habitId);
  },

  ringAt(index) {
    return rings[index] || null;
  },

  /** Referencia al <path> de una celda. */
  cell(habitId, dayIndex) {
    const ring = rings.find((r) => r.habitId === habitId);
    return ring ? ring.cells[dayIndex] || null : null;
  },

  /** Ángulo medio de un día, en grados. */
  dayAngle(dayIndex) {
    return dayAngles[dayIndex] ? dayAngles[dayIndex].mid : 0;
  },

  /** Centro de una celda en coordenadas del viewBox. */
  cellCenter(habitId, dayIndex) {
    const ring = rings.find((r) => r.habitId === habitId);
    if (!ring || !metrics) return { x: 0, y: 0 };
    return polarToCartesian(metrics.cx, metrics.cy, ring.rMid, this.dayAngle(dayIndex));
  },

  /**
   * Punto del viewBox a píxeles relativos al contenedor.
   * El SVG se encaja con preserveAspectRatio, así que su centro NO coincide
   * con el del contenedor cuando éste no es cuadrado: hay que descontar el
   * letterboxing o los efectos aparecen desplazados.
   */
  toPx(x, y) {
    if (!svgEl || !container || !metrics) return { x: 0, y: 0, scale: 1 };
    const cRect = container.getBoundingClientRect();
    const sRect = svgEl.getBoundingClientRect();
    const scale = Math.min(sRect.width / metrics.size, sRect.height / metrics.size);
    const offX = sRect.left - cRect.left + (sRect.width - metrics.size * scale) / 2;
    const offY = sRect.top - cRect.top + (sRect.height - metrics.size * scale) / 2;
    return { x: offX + x * scale, y: offY + y * scale, scale };
  },

  cellCenterPx(habitId, dayIndex) {
    const c = this.cellCenter(habitId, dayIndex);
    return this.toPx(c.x, c.y);
  },

  centerPx() {
    if (!metrics) return { x: 0, y: 0, scale: 1 };
    return this.toPx(metrics.cx, metrics.cy);
  },

  /** Radio medio del anillo de un hábito, en unidades del viewBox. */
  ringRadius(habitId) {
    const ring = rings.find((r) => r.habitId === habitId);
    return ring ? ring.rMid : 0;
  },
};
