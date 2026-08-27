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

/**
 * El mismo color interpolado que `elementColor`, pero en componentes RGB.
 * El canvas necesita el color descompuesto para poder componerlo de forma
 * aditiva y para cachear el sprite de glow por color.
 */
export function elementRGB(elementId, dayIndex) {
  const el = ELEMENTS.find((e) => e.id === elementId);
  if (!el) return [136, 136, 136];
  const t = dayIndex / 20;
  const h = (el.h0 + (el.h1 - el.h0) * t) / 360;
  const s = (el.s0 + (el.s1 - el.s0) * t) / 100;
  const l = (el.l0 + (el.l1 - el.l0) * t) / 100;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (tc) => {
    tc = (tc + 1) % 1;
    if (tc < 1 / 6) return p + (q - p) * 6 * tc;
    if (tc < 1 / 2) return q;
    if (tc < 2 / 3) return p + (q - p) * (2 / 3 - tc) * 6;
    return p;
  };
  return [
    Math.round(channel(h + 1 / 3) * 255),
    Math.round(channel(h) * 255),
    Math.round(channel(h - 1 / 3) * 255),
  ];
}
