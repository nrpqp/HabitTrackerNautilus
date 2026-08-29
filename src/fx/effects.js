import { TOTAL_DAYS, startAngle, sweepAngle } from '../constants.js';
import { elementRGB } from '../utils/color.js';
import { view } from '../render/svg.js';
import {
  tier, addEffect, glowSprite, burstColor, burstElement, pxScale,
} from './engine.js';

/* ============================================================
   Catálogo de efectos.

   Cada efecto declara el nivel mínimo que necesita y sale sin
   hacer nada por debajo de él. Ninguno pide frames ni limpia el
   canvas: eso es del bucle único de engine.js.
   ============================================================ */

const GOLD = [255, 214, 120];

// ── Encendido de una celda ───────────────────────────────────
// Reutilizado por el cometa, por su variante sin canvas y por el
// feedback de marcado.

export function igniteCell(habitId, dayIndex, strength = 1, delay = 0) {
  if (tier.value === 1) return;
  const cell = view.cell(habitId, dayIndex);
  if (!cell) return;

  const frames = [
    { transform: 'scale(1)', filter: 'brightness(1)' },
    {
      transform: `scale(${(1 + 0.13 * strength).toFixed(3)})`,
      filter: `brightness(${(1 + 0.9 * strength).toFixed(2)})`,
      offset: 0.25,
    },
    { transform: 'scale(1)', filter: 'brightness(1)' },
  ];
  // `filter` obliga a repintar la capa; `transform` se resuelve en el
  // compositor. Es lo primero que se sacrifica y lo que menos se echa en falta.
  if (tier.value < 4) frames.forEach((f) => delete f.filter);

  cell.animate(frames, {
    duration: 400 + 120 * strength,
    delay,
    easing: 'cubic-bezier(.2,1,.3,1)',
  });
}

/** Apagado: la celda pierde color y las posteriores parpadean en cascada. */
export function extinguishCell(habitId, dayIndex) {
  if (tier.value === 1) return;
  const cell = view.cell(habitId, dayIndex);
  if (cell) {
    const frames = [
      { filter: 'brightness(1) saturate(1)' },
      { filter: 'brightness(.55) saturate(.15)', offset: 0.45 },
      { filter: 'brightness(1) saturate(1)' },
    ];
    if (tier.value < 4) {
      cell.animate(
        [{ opacity: 1 }, { opacity: 0.35, offset: 0.45 }, { opacity: 1 }],
        { duration: 440, easing: 'ease-out' }
      );
    } else {
      cell.animate(frames, { duration: 440, easing: 'ease-out' });
    }
  }
  for (let d = dayIndex + 1; d < TOTAL_DAYS; d++) {
    const next = view.cell(habitId, d);
    if (!next) break;
    next.animate(
      [{ opacity: 1 }, { opacity: 0.3, offset: 0.4 }, { opacity: 1 }],
      { duration: 380, delay: (d - dayIndex) * 26, easing: 'ease-out' }
    );
  }
}

// ── Cometa de racha ──────────────────────────────────────────

let activeComet = null;

/**
 * Recorre el arco desde el primer día de la racha hasta el día marcado,
 * encendiendo cada celda a su paso. La celda alcanzada se deduce del
 * ángulo actual, no de una lista precalculada, para que siga siendo
 * correcta con cualquier número de anillos.
 */
export function streakComet(habitId, fromDay, toDay, elementId, onArrive) {
  if (tier.value < 3) {
    // Variante sin canvas: el mismo recorrido en encendidos escalonados.
    for (let d = fromDay; d <= toDay; d++) {
      igniteCell(habitId, d, d === toDay ? 1.4 : 0.55, (d - fromDay) * 55);
    }
    setTimeout(onArrive, (toDay - fromDay) * 55 + 80);
    return;
  }

  const metrics = view.metrics;
  const rMid = view.ringRadius(habitId);
  if (!metrics || !rMid) { onArrive(); return; }

  const a0 = view.dayAngle(fromDay);
  const a1 = view.dayAngle(toDay);
  const span = Math.abs(toDay - fromDay) + 1;
  // Tope de duración: una racha de 21 días no puede hacer esperar.
  const duration = Math.min(1250, 130 + span * 78);
  const rgb = elementRGB(elementId, toDay);
  const sprite = glowSprite(rgb);
  // La spec pide que la densidad crezca con el nivel, no que salte una vez.
  const trailMax = [0, 0, 0, 12, 18, 26][tier.value];
  const trail = [];
  const passed = new Set();
  const angleStep = sweepAngle / TOTAL_DAYS;

  const me = { cancelled: false };
  if (activeComet) activeComet.cancelled = true;
  activeComet = me;

  const start = performance.now();
  let arrived = false;

  addEffect({
    draw(ctx, now) {
      if (me.cancelled) return false;
      const k = pxScale();
      const u = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - u, 2.2);
      const angle = a0 + (a1 - a0) * eased;

      const point = polar(metrics.cx, metrics.cy, rMid, angle);
      const px = view.toPx(point.x, point.y);
      trail.push(px);
      if (trail.length > trailMax) trail.shift();

      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < trail.length; i++) {
        const f = (i + 1) / trail.length;
        const s = (4 + 13 * f) * k * 0.55;
        ctx.globalAlpha = Math.pow(f, 1.6) * 0.9 * (arrived ? 1 - (now - start - duration) / 320 : 1);
        ctx.drawImage(sprite, trail[i].x - s, trail[i].y - s, s * 2, s * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      // Celda alcanzada, deducida del ángulo.
      const reached = Math.round((angle - startAngle) / angleStep - 0.5);
      if (!passed.has(reached) && reached >= fromDay && reached < toDay) {
        passed.add(reached);
        igniteCell(habitId, reached, 0.5);
      }

      if (u >= 1 && !arrived) {
        arrived = true;
        onArrive();
      }
      // Un poco de vida extra para que el rastro se apague en vez de cortarse.
      return now - start < duration + 320;
    },
  });
}

function polar(cx, cy, r, deg) {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

// ── Traza de carga hacia el núcleo ───────────────────────────

export function chargeToCore(habitId, dayIndex, elementId) {
  if (tier.value < 3) return;
  const from = view.cellCenterPx(habitId, dayIndex);
  const to = view.centerPx();
  const sprite = glowSprite(elementRGB(elementId, dayIndex));
  const start = performance.now();
  const duration = 520;

  addEffect({
    draw(ctx, now) {
      const u = Math.min(1, (now - start) / duration);
      const e = u * u * (3 - 2 * u);              // smoothstep
      const k = pxScale();
      const x = from.x + (to.x - from.x) * e;
      const y = from.y + (to.y - from.y) * e;
      const s = (10 + 8 * (1 - u)) * k * 0.55;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.85 * (1 - u * 0.3);
      ctx.drawImage(sprite, x - s, y - s, s * 2, s * 2);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      return u < 1;
    },
  });

  setTimeout(() => pulseCore(1.14, 480), duration);
}

export function pulseCore(scale = 1.14, duration = 480) {
  if (tier.value === 1) return;
  const core = view.core;
  if (!core) return;
  core.style.transformBox = 'fill-box';
  core.style.transformOrigin = 'center';
  core.animate(
    [
      { transform: 'scale(1)' },
      { transform: `scale(${scale})`, offset: 0.3 },
      { transform: 'scale(1)' },
    ],
    { duration, easing: 'cubic-bezier(.2,1.5,.3,1)' }
  );
}

/** El núcleo brilla más cuanto más cerca está el día de cerrarse. */
export function setCoreCharge(fraction) {
  const core = view.core;
  if (!core) return;
  if (tier.value < 4 || fraction <= 0) {
    core.style.filter = '';
    return;
  }
  const blur = (4 + 16 * fraction).toFixed(1);
  const alpha = (0.22 + 0.5 * fraction).toFixed(2);
  core.style.filter = `drop-shadow(0 0 ${blur}px rgba(240,180,41,${alpha}))`;
}

/**
 * Mezcla elemental del núcleo: enciende la cuña de cada hábito completado
 * hoy y apaga el resto. El color de cada cuña ya lo fija `paint()` en
 * svg.js en cada repintado; esto sólo decide qué se ve.
 */
export function setCoreBlend(doneIds) {
  const doneSet = new Set(doneIds);
  view.coreBlend.forEach(({ habitId, wedge }) => {
    wedge.classList.toggle('lit', doneSet.has(habitId));
  });
}

// ── Supernova: el día completo ───────────────────────────────

export function supernova(elementIds) {
  const flash = document.getElementById('fx-flash');
  if (tier.value === 1) return;

  if (flash) {
    flash.animate(
      [{ opacity: 0 }, { opacity: 0.5, offset: 0.12 }, { opacity: 0 }],
      { duration: 900, easing: 'ease-out' }
    );
  }
  pulseCore(1.5, 1100);

  if (tier.value < 3) return;

  const center = view.centerPx();
  const k = pxScale();

  // Partículas: mezcla de los colores de los hábitos cerrados, más oro.
  const palette = elementIds.map((id) => elementRGB(id, 20));
  burstColor(center.x, center.y, GOLD, { base: 26, scale: 1, spread: 1.7 });
  palette.slice(0, 4).forEach((rgb) => {
    burstColor(center.x, center.y, rgb, { base: 12, scale: 1, spread: 1.4 });
  });

  // Anillos de choque y rayos.
  const start = performance.now();
  const duration = tier.value >= 5 ? 1400 : 1000;
  const rayCount = tier.value >= 5 ? 16 : 8;

  addEffect({
    draw(ctx, now) {
      const u = Math.min(1, (now - start) / duration);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(center.x, center.y);

      for (let i = 0; i < 3; i++) {
        const uu = Math.max(0, Math.min(1, (u - i * 0.13) / (1 - i * 0.13)));
        if (uu <= 0) continue;
        const e = 1 - Math.pow(1 - uu, 3);
        ctx.globalAlpha = Math.pow(1 - uu, 2) * 0.7;
        ctx.strokeStyle = `rgb(${GOLD.join(',')})`;
        ctx.lineWidth = Math.max(0.6, 7 * k * (1 - uu));
        ctx.beginPath();
        ctx.arc(0, 0, 10 * k + 190 * k * e, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (tier.value >= 5 || u < 0.6) {
        ctx.rotate(u * 0.7);
        ctx.globalAlpha = Math.pow(1 - u, 2.4) * 0.55;
        ctx.strokeStyle = '#fff8e0';
        for (let i = 0; i < rayCount; i++) {
          const a = (i / rayCount) * Math.PI * 2;
          const len = (40 + 180 * u) * k;
          ctx.lineWidth = Math.max(0.6, 3.4 * k * (1 - u));
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 24 * k, Math.sin(a) * 24 * k);
          ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
          ctx.stroke();
        }
      }

      ctx.restore();
      return u < 1;
    },
  });
}

/** Estallido de llegada en la celda recién marcada. */
export function arrivalBurst(habitId, dayIndex, elementId) {
  const c = view.cellCenterPx(habitId, dayIndex);
  burstElement(c.x, c.y, elementId, dayIndex, { base: 22, scale: 1.15, spread: 1.15 });
  igniteCell(habitId, dayIndex, 1.4);
}
