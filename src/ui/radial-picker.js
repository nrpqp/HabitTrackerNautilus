/* ============================================================
   Selector radial gestual del núcleo.

   Máquina de estados Reposo -> Despliegue -> Apuntado ->
   Confirmación/Cancelación sobre Pointer Events. Vive aparte de
   `svg.js`/`main.js`: sólo conoce `view` (para geometría y el
   propio núcleo) y los callbacks que le pasan — no sabe nada de
   racha, cometa ni cierre de día, eso lo resuelve quien la conecta.
   ============================================================ */

import { habitsActiveToday, isDoneToday } from '../store.js';
import { ELEMENTS, innerRadius } from '../constants.js';
import { annularSectorPath, polarToCartesian } from '../utils/svg.js';
import { elementColor } from '../utils/color.js';
import { haptics } from '../fx/engine.js';

const NS = 'http://www.w3.org/2000/svg';

const LONG_PRESS_MS = 320;
const MOVE_CANCEL_PX = 10;
const SECTOR_OFFSET = -90; // primer sector alineado al eje superior

function pendingHabits() {
  return habitsActiveToday().filter((h) => !isDoneToday(h));
}

/**
 * Engancha el gesto al núcleo (`view.core`). Devuelve una función para
 * desmontar los listeners si algún día hace falta.
 *
 * `onAim(habit|null)` — cambia el hábito apuntado (o null si no hay ninguno).
 * `onConfirm(habit)` — el usuario soltó sobre un sector válido.
 * `onCancel()` — la interacción terminó sin confirmar.
 * `onSimpleTap()` — pulsación simple (sin desplegar): vía accesible.
 */
export function attachRadialPicker(view, { onAim, onConfirm, onCancel, onSimpleTap } = {}) {
  const core = view.core;
  if (!core) return () => {};

  let pointerId = null;
  let phase = 'idle'; // idle | pending | deployed
  let timer = null;
  let startX = 0;
  let startY = 0;
  let startedAt = 0;
  let pending = [];
  let aimedIndex = -1;
  let overlayGroup = null;

  function clientToViewBox(clientX, clientY) {
    const svgEl = view.svg;
    const metrics = view.metrics;
    if (!svgEl || !metrics) return null;
    const rect = svgEl.getBoundingClientRect();
    const scale = Math.min(rect.width / metrics.size, rect.height / metrics.size);
    if (!scale) return null;
    const offX = rect.left + (rect.width - metrics.size * scale) / 2;
    const offY = rect.top + (rect.height - metrics.size * scale) / 2;
    return { x: (clientX - offX) / scale, y: (clientY - offY) / scale };
  }

  function ringGeometry() {
    const metrics = view.metrics;
    const rInner = Math.max(1, innerRadius - 4);
    const rOuter = Math.max(rInner + 20, Math.min(metrics.outerRadius - 4, innerRadius + 76));
    return { rInner, rOuter, cx: metrics.cx, cy: metrics.cy };
  }

  function sectorAt(clientX, clientY) {
    const p = clientToViewBox(clientX, clientY);
    if (!p || !pending.length) return { index: -1, r: 0 };
    const { rInner, cx, cy } = ringGeometry();
    const dx = p.x - cx;
    const dy = p.y - cy;
    const r = Math.hypot(dx, dy);
    if (r < rInner) return { index: -1, r };
    let theta = Math.atan2(dy, dx) * (180 / Math.PI);
    theta = (((theta - SECTOR_OFFSET) % 360) + 360) % 360;
    const step = 360 / pending.length;
    const index = Math.min(pending.length - 1, Math.floor(theta / step));
    return { index, r };
  }

  function buildOverlay() {
    const svgEl = view.svg;
    if (!svgEl || !pending.length) return;
    const { rInner, rOuter, cx, cy } = ringGeometry();
    const step = 360 / pending.length;

    overlayGroup = document.createElementNS(NS, 'g');
    overlayGroup.setAttribute('class', 'radial-picker');
    overlayGroup.style.pointerEvents = 'none';

    pending.forEach((habit, i) => {
      const a0 = SECTOR_OFFSET + i * step;
      const a1 = SECTOR_OFFSET + (i + 1) * step;

      const wedge = document.createElementNS(NS, 'path');
      wedge.setAttribute('d', annularSectorPath(cx, cy, rInner, rOuter, a0, a1));
      wedge.setAttribute('class', 'radial-picker-wedge');
      wedge.setAttribute('fill', elementColor(habit.element, 12));
      wedge.setAttribute('stroke', elementColor(habit.element, 4, -10));
      wedge.dataset.index = String(i);
      overlayGroup.appendChild(wedge);

      const el = ELEMENTS.find((e) => e.id === habit.element) || ELEMENTS[0];
      const mid = polarToCartesian(cx, cy, (rInner + rOuter) / 2, (a0 + a1) / 2);
      const icon = document.createElementNS(NS, 'text');
      icon.setAttribute('class', 'radial-picker-icon');
      icon.setAttribute('x', mid.x);
      icon.setAttribute('y', mid.y);
      icon.setAttribute('text-anchor', 'middle');
      icon.setAttribute('dominant-baseline', 'central');
      icon.textContent = el.icon;
      overlayGroup.appendChild(icon);
    });

    svgEl.appendChild(overlayGroup);
    // Reflow forzado antes de añadir la clase que anima la entrada.
    void overlayGroup.getBoundingClientRect();
    overlayGroup.classList.add('open');
  }

  function updateOverlayHighlight() {
    if (!overlayGroup) return;
    overlayGroup.querySelectorAll('.radial-picker-wedge').forEach((w) => {
      w.classList.toggle('aimed', Number(w.dataset.index) === aimedIndex);
    });
  }

  function removeOverlay() {
    if (!overlayGroup) return;
    const el = overlayGroup;
    overlayGroup = null;
    el.classList.remove('open');
    // Se retira tras la transición de plegado en vez de al instante, para
    // que la cancelación/confirmación también se vea (no sólo el despliegue).
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 180);
  }

  function clearTimer() {
    if (timer) { clearTimeout(timer); timer = null; }
  }

  function removeCoreListeners() {
    core.removeEventListener('pointermove', onMove);
    core.removeEventListener('pointerup', onUp);
    core.removeEventListener('pointercancel', onPointerCancel);
  }

  function teardown() {
    clearTimer();
    removeCoreListeners();
    removeOverlay();
    if (pointerId !== null && core.hasPointerCapture && core.hasPointerCapture(pointerId)) {
      try { core.releasePointerCapture(pointerId); } catch (_) { /* ya liberado */ }
    }
    pointerId = null;
    phase = 'idle';
    pending = [];
    aimedIndex = -1;
  }

  /**
   * Sin captura todavía en esta fase (design.md: la captura llega recién en
   * el despliegue, para no robarle el scroll a un gesto que no es éste).
   * Si el puntero se mueve más de lo tolerado, se desmonta ya mismo: sin
   * captura, un `pointerup` que ocurra fuera del núcleo nunca llegaría a
   * este listener, así que esperar a soltarlo dejaría el gesto colgado.
   */
  function cancelPending() {
    if (phase !== 'pending') return;
    teardown();
  }

  function deploy() {
    timer = null;
    pending = pendingHabits();
    if (!pending.length) return; // nada que marcar: no se despliega nada
    phase = 'deployed';
    aimedIndex = -1;
    buildOverlay();
    try { core.setPointerCapture(pointerId); } catch (_) { /* puntero ya liberado */ }
    haptics.open();
    if (onAim) onAim(null);
  }

  function onMove(e) {
    if (e.pointerId !== pointerId) return;
    if (phase === 'pending') {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) cancelPending();
      return;
    }
    if (phase !== 'deployed') return;
    const { index, r } = sectorAt(e.clientX, e.clientY);
    const { rInner } = ringGeometry();
    const next = r >= rInner ? index : -1;
    if (next !== aimedIndex) {
      aimedIndex = next;
      updateOverlayHighlight();
      haptics.aim();
      if (onAim) onAim(next >= 0 ? pending[next] : null);
    }
  }

  function onUp(e) {
    if (e.pointerId !== pointerId) return;

    if (phase === 'pending') {
      // Si seguimos en 'pending' al soltar, es porque nunca se superó el
      // umbral de movimiento ni disparó el timer: por construcción, sólo
      // puede ser una pulsación corta y quieta.
      const elapsed = performance.now() - startedAt;
      const wasSimpleTap = elapsed < LONG_PRESS_MS;
      teardown();
      if (wasSimpleTap && onSimpleTap) onSimpleTap();
      return;
    }

    if (phase !== 'deployed') { teardown(); return; }

    const { index, r } = sectorAt(e.clientX, e.clientY);
    const { rInner } = ringGeometry();
    const confirmed = r >= rInner && index >= 0 && index < pending.length;
    const habit = confirmed ? pending[index] : null;
    teardown();
    if (confirmed) {
      if (onConfirm) onConfirm(habit);
    } else if (onCancel) {
      onCancel();
    }
  }

  function onPointerCancel(e) {
    if (e.pointerId !== pointerId) return;
    teardown();
    if (onCancel) onCancel();
  }

  function onDown(e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (pointerId !== null) {
      // Un segundo puntero mientras ya hay un gesto en curso: cancelación
      // segura, nunca dos gestos superpuestos.
      teardown();
      if (onCancel) onCancel();
      return;
    }
    pointerId = e.pointerId;
    phase = 'pending';
    startX = e.clientX;
    startY = e.clientY;
    startedAt = performance.now();

    core.addEventListener('pointermove', onMove);
    core.addEventListener('pointerup', onUp);
    core.addEventListener('pointercancel', onPointerCancel);
    timer = setTimeout(deploy, LONG_PRESS_MS);
  }

  core.addEventListener('pointerdown', onDown);

  return function detach() {
    core.removeEventListener('pointerdown', onDown);
    teardown();
  };
}
