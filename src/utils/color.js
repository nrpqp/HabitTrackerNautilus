import { ELEMENTS } from '../constants.js';

export function elementColor(elementId, dayIndex, lightnessOffset = 0) {
  const el = ELEMENTS.find((e) => e.id === elementId);
  if (!el) return '#888888';
  const t = dayIndex / 20;
  const h = el.h0 + (el.h1 - el.h0) * t;
  const s = el.s0 + (el.s1 - el.s0) * t;
  const l = Math.max(0, Math.min(100, (el.l0 + (el.l1 - el.l0) * t) + lightnessOffset));
  return `hsl(${h.toFixed(1)},${s.toFixed(1)}%,${l.toFixed(1)}%)`;
}

export function lightenColor(hex, amount = 0.4) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.min(255, Math.round(r + (255 - r) * amount));
  g = Math.min(255, Math.round(g + (255 - g) * amount));
  b = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function darkenColor(hex, amount = 0.25) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.round(r * (1 - amount)));
  g = Math.max(0, Math.round(g * (1 - amount)));
  b = Math.max(0, Math.round(b * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
