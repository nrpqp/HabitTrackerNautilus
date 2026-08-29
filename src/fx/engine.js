import { ELEMENTS } from '../constants.js';
import { elementRGB } from '../utils/color.js';

/* ============================================================
   Motor de efectos.

   Tres responsabilidades: decidir cuánto efecto puede permitirse
   este dispositivo, ser el único dueño del canvas de efectos, y
   emitir partículas. Todo lo demás vive en effects.js.
   ============================================================ */

// ── Capacidades del dispositivo ──────────────────────────────

const mm = (q) => (window.matchMedia ? window.matchMedia(q).matches : false);

export const caps = {
  reducedMotion: mm('(prefers-reduced-motion: reduce)'),
  coarsePointer: mm('(pointer: coarse)'),
  cores: navigator.hardwareConcurrency || null,
  memory: navigator.deviceMemory || null,
  saveData: !!(navigator.connection && navigator.connection.saveData),
  // iOS Safari no expone vibrate; ahí el refuerzo es sólo visual.
  vibrate: typeof navigator.vibrate === 'function',
};

/**
 * La escala arranca en 1 y el número del nivel es también su índice en
 * estas tablas. El hueco del índice 0 es deliberado: restar uno para
 * indexar reintroduciría en cada frontera —CSS, URL, almacenamiento y
 * mensajes— la conversión que numerar desde 1 elimina.
 */
export const TIER_NAMES = [null, 'Calma', 'Lite', 'Suave', 'Estándar', 'Máximo'];

/* Nivel 1 Calma    — sin movimiento
   Nivel 2 Lite     — sólo transform/opacity, sin partículas ni filtros
   Nivel 3 Suave    — canvas y partículas con presupuesto corto, sin
                      blending aditivo ni halo: el peldaño que faltaba
                      entre no dibujar nada y dibujarlo todo
   Nivel 4 Estándar — blending aditivo, halo y filtros, presupuesto medio
   Nivel 5 Máximo   — presupuestos altos y capas extra                    */

/**
 * Semilla del primer arranque, no un modo permanente: su resultado se
 * guarda como preferencia del usuario y a partir de ahí manda esa.
 *
 * `prefers-reduced-motion` ya no entra aquí. Sujetar el nivel por
 * movimiento reducido es un techo que debe seguir aplicándose sobre
 * cualquier elección posterior, no una estimación que la primera
 * elección del usuario pueda dejar atrás. Vive en `effectiveTier`.
 */
export function detectTier() {
  if (caps.saveData) return MIN_TIER;

  let score = 4;   // Estándar

  // Evidencia positiva fuerte. Si el navegador no declara memoria —Safari y
  // Firefox nunca lo hacen— basta con los núcleos: no declararla no es
  // síntoma de debilidad.
  if (caps.cores !== null && caps.cores >= 8 && (caps.memory === null || caps.memory >= 8)) {
    score += 1;
  }

  // Evidencia negativa fuerte: sólo valores declarados y bajos de verdad.
  // Cae a Suave, no a Lite: con la escala de cinco niveles estos aparatos
  // ya no se quedan sin una sola partícula, y si no lo sostienen el
  // gobernador los devuelve a Lite midiendo, no estimando.
  if ((caps.memory !== null && caps.memory <= 2) || (caps.cores !== null && caps.cores <= 2)) {
    score -= 1;
  }

  // Un puntero fino significa escritorio o portátil, y eso aguanta el nivel
  // estándar. Los navegadores centrados en privacidad falsean núcleos y
  // memoria a la baja, y sin este suelo acababan sin partículas.
  if (!caps.coarsePointer) score = Math.max(4, score);

  return Math.max(2, Math.min(MAX_TIER, score));
}

// Índice 0 sin uso; los niveles 1 y 2 no llegan al canvas de partículas.
const BUDGET = [0, 0, 0, 0.5, 1, 1.8];

export const MIN_TIER = 1;
export const MAX_TIER = 5;

/**
 * Origen del nivel activo. No basta un booleano: "el usuario quiere el
 * máximo" y "estoy midiendo el nivel 3 y no quiero que se mueva" piden
 * respuestas opuestas del gobernador.
 *
 *   preference      — lo eligió el usuario; el rendimiento aún puede rebajarlo
 *   diagnostic      — anulación por URL; intocable mientras se observa
 *   reduced-motion  — techo del sistema operativo; gana a todo lo demás
 */
export const SOURCES = {
  PREFERENCE: 'preference',
  DIAGNOSTIC: 'diagnostic',
  REDUCED_MOTION: 'reduced-motion',
};

/* Consulta viva, no la instantánea de `caps`: el usuario puede activar el
   movimiento reducido con la aplicación ya abierta. */
const reducedMotionQuery = window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : { matches: false };

export const tier = {
  value: 4,
  source: SOURCES.PREFERENCE,

  /**
   * Lo que se ha elegido, sin techo aplicado. Se guarda aparte del nivel
   * activo para que el movimiento reducido pueda sujetar uno sin borrar
   * el otro: al desactivarlo, la elección sigue ahí.
   */
  choice: 4,
  choiceSource: SOURCES.PREFERENCE,
  _subs: [],

  set(v, source = SOURCES.PREFERENCE) {
    this.choice = Math.max(MIN_TIER, Math.min(MAX_TIER, v));
    this.choiceSource = source;
    this._apply();
  },

  /** Resuelve elección + techo y publica el resultado si ha cambiado. */
  _apply() {
    // El techo gana también a la anulación de diagnóstico: una preferencia
    // de accesibilidad del sistema no se salta para poder mirar un efecto.
    const capped = this.capped;
    const next = capped ? MIN_TIER : this.choice;
    const source = capped ? SOURCES.REDUCED_MOTION : this.choiceSource;
    if (next === this.value && source === this.source) return;
    this.value = next;
    this.source = source;
    document.documentElement.dataset.tier = String(next);
    this._subs.forEach((fn) => fn(next, source));
  },

  /** ¿Está el sistema operativo sujetando el nivel? */
  get capped() { return !!reducedMotionQuery.matches; },

  /** El rendimiento manda sobre el deseo, pero no sobre una medición en
      curso ni sobre un techo de accesibilidad. */
  get degradable() { return this.source === SOURCES.PREFERENCE; },

  onChange(fn) { this._subs.push(fn); },

  /** ¿Alcanza este dispositivo el nivel mínimo que pide un efecto? */
  atLeast(min) { return this.value >= min; },

  /** Cantidad escalada al nivel activo. */
  budget(base) { return Math.round(base * BUDGET[this.value]); },
};

/* Activar o desactivar el movimiento reducido se refleja sin recargar.
   Safari sólo expuso addEventListener sobre MediaQueryList a partir de
   la 14, y esta app se instala en iPhones más viejos. */
const onReducedMotionChange = () => tier._apply();
if (reducedMotionQuery.addEventListener) {
  reducedMotionQuery.addEventListener('change', onReducedMotionChange);
} else if (reducedMotionQuery.addListener) {
  reducedMotionQuery.addListener(onReducedMotionChange);
}

// El techo debe valer ya en el primer render, antes de que nadie elija.
tier._apply();

// ── Háptica ──────────────────────────────────────────────────
// No-op silencioso donde no existe: así ningún punto de llamada
// necesita ramificar por soporte.

export const haptics = {
  tap()       { this._go(12); },
  success()   { this._go([14, 40, 26]); },
  milestone() { this._go([18, 50, 18, 50, 60]); },
  denied()    { this._go([8, 30, 8]); },
  /** Despliegue del selector radial: impacto medio, más largo que `tap`. */
  open()      { this._go(20); },
  /** Cambio de sector apuntado en el selector radial: sólo un tick corto. */
  aim()       { this._go(6); },
  _go(pattern) {
    if (!caps.vibrate || tier.value === 1) return;
    try { navigator.vibrate(pattern); } catch (_) { /* sin consecuencias */ }
  },
};

// ── Canvas de efectos ────────────────────────────────────────

let canvasEl = null;
let ctx = null;
let cw = 0;
let ch = 0;

export function initFxCanvas() {
  canvasEl = document.getElementById('effect-overlay');
  if (!canvasEl) return;
  ctx = canvasEl.getContext('2d');
  fitFxCanvas();
  window.addEventListener('resize', fitFxCanvas);
  tier.onChange(fitFxCanvas);
}

export function fitFxCanvas() {
  if (!canvasEl || !ctx) return;
  const container = document.getElementById('svg-container');
  const rect = container.getBoundingClientRect();
  // El coste de relleno crece con el cuadrado del DPR y un glow difuso
  // no mejora por encima de 2x, así que se acota.
  const dpr = Math.min(window.devicePixelRatio || 1, tier.value >= 5 ? 2 : 1.5);
  cw = rect.width;
  ch = rect.height;
  canvasEl.width = Math.round(cw * dpr);
  canvasEl.height = Math.round(ch * dpr);
  canvasEl.style.width = `${cw}px`;
  canvasEl.style.height = `${ch}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/**
 * Escala entre unidades del viewBox y píxeles en pantalla.
 * No vale usar el ancho del canvas: el SVG se encaja con
 * preserveAspectRatio y en una ventana ancha y baja el nautilus es
 * bastante más pequeño que el contenedor. Con el ancho, las partículas
 * salen sobredimensionadas y el burst satura a blanco.
 */
let unitScale = 1;

export function setUnitScale(value) {
  if (value > 0) unitScale = value;
}

export function pxScale() {
  return unitScale;
}

// Diagnóstico accesible desde la consola de cualquier navegador: con esto
// se puede saber por qué un dispositivo concreto cayó en el nivel que cayó.
if (typeof window !== 'undefined') {
  window.__nautilusFx = {
    caps,
    get tier() { return tier.value; },
    get origen() { return tier.source; },
    get detectado() { return detectTier(); },
    get fps() { return Math.round(govFps); },
    get avisos() { return govStrikes; },
  };
}

export const fxCanvas = {
  get ctx() { return ctx; },
  get width() { return cw; },
  get height() { return ch; },
  get ready() { return !!ctx; },
};

// ── Bucle único ──────────────────────────────────────────────
// Nadie más limpia el canvas ni pide frames. Con dos efectos
// llamando a clearRect por su cuenta, el segundo borra al primero.

const effects = new Set();
let rafId = null;

/** Por encima de esto no es lentitud, es una pausa: no se mide. */
const MAX_FRAME_SAMPLE_MS = 2000;

// El gobernador mide sólo mientras hay efectos en marcha, que es
// cuando el rendimiento importa — y así la app en reposo no
// mantiene vivo un requestAnimationFrame.
let govFrames = 0;
let govElapsed = 0;
let govStrikes = 0;
let govFps = 0;
let lastFrameAt = 0;

/** Registra un efecto. `draw(ctx, now)` devuelve false cuando ha terminado. */
export function addEffect(effect) {
  effects.add(effect);
  if (!rafId) {
    lastFrameAt = performance.now();
    rafId = requestAnimationFrame(loop);
  }
}

export function clearEffects() {
  effects.clear();
  if (ctx) ctx.clearRect(0, 0, cw, ch);
}

function loop(now) {
  if (!ctx) { rafId = null; return; }

  const dt = now - lastFrameAt;
  lastFrameAt = now;
  // El techo descarta huecos que no miden rendimiento —pestaña en segundo
  // plano, equipo suspendido—, no frames lentos. Con el límite en 500 ms un
  // dispositivo tan ahogado que tarda más que eso por frame dejaba de
  // medirse y no se degradaba nunca: justo el caso que el gobernador existe
  // para atrapar. `document.hidden` cubre el caso que el techo protegía.
  if (!document.hidden && dt > 0 && dt < MAX_FRAME_SAMPLE_MS) {
    govFrames++;
    govElapsed += dt;
    if (govElapsed >= 1000) {
      const fps = (govFrames * 1000) / govElapsed;
      govFps = fps;
      govFrames = 0;
      govElapsed = 0;
      if (fps < 46) govStrikes++; else govStrikes = Math.max(0, govStrikes - 1);
      // Degrada, nunca promociona: subir de nuevo produciría oscilación.
      // Se conserva el origen: un nivel elegido por el usuario que baja
      // sigue siendo suyo, y la preferencia guardada no se toca.
      // Suelo en Lite: degradar hasta Calma dejaría al usuario sin
      // movimiento por una medición, no por una elección suya.
      if (govStrikes >= 3 && tier.degradable && tier.value > 2) {
        tier.set(tier.value - 1, tier.source);
        govStrikes = 0;
      }
    }
  }

  ctx.clearRect(0, 0, cw, ch);
  for (const effect of effects) {
    let alive = false;
    try {
      alive = effect.draw(ctx, now);
    } catch (err) {
      // Un efecto roto se descarta para no tumbar el bucle, pero el error
      // se reporta: tragárselo en silencio esconde defectos reales.
      console.error('[fx] efecto descartado por error', err);
      alive = false;
    }
    if (!alive) effects.delete(effect);
  }

  if (effects.size > 0) {
    rafId = requestAnimationFrame(loop);
  } else {
    rafId = null;
    ctx.clearRect(0, 0, cw, ch);
  }
}

// ── Sprite radial cacheado ───────────────────────────────────
// Un createRadialGradient por partícula y frame sería inviable;
// un sprite por color se genera una vez y drawImage es un blit.

const spriteCache = new Map();

export function glowSprite(rgb) {
  const key = rgb.join(',');
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},.95)`);
  grd.addColorStop(0.6, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},.28)`);
  grd.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  spriteCache.set(key, c);
  return c;
}

// ── Partículas ───────────────────────────────────────────────

const MAX_PARTICLES = 700;
const particles = [];

const particleEffect = {
  draw(c, now) {
    // El aditivo es composición, no dibujo: el nivel Suave pinta plano.
    c.globalCompositeOperation = tier.value >= 4 ? 'lighter' : 'source-over';
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life++;
      stepParticle(p);
      p.t = p.life / p.maxLife;
      if (p.t >= 1) { particles.splice(i, 1); continue; }
      c.save();
      c.translate(p.x, p.y);
      if (p.rot) c.rotate(p.rot);
      drawParticle(c, p);
      c.restore();
    }
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    return particles.length > 0;
  },
};

function stepParticle(p) {
  switch (p.shape) {
    case 'spark':                       // fuego: sube, se afina, titila
      p.vy -= 0.045;
      p.vx += Math.sin(p.life * 0.3 + p.seed) * 0.06;
      p.flicker = 0.75 + Math.random() * 0.25;
      break;
    case 'ripple':                      // agua: se frena y se expande
      p.vy += 0.02;
      break;
    case 'leaf':                        // planta: cae meciéndose
      p.vx += Math.sin(p.life * 0.11 + p.seed) * 0.08;
      p.vy += 0.014;
      break;
    case 'crystal':                     // hielo: deriva lenta girando
      p.vy += 0.012;
      break;
    case 'chunk':                       // tierra: gravedad honesta
      p.vy += 0.22;
      break;
    case 'swirl': {                     // aire: orbita el punto de emisión
      const dx = p.x - p.ox;
      const dy = p.y - p.oy;
      const a = Math.atan2(dy, dx) + 0.1;
      const r = Math.hypot(dx, dy) + 0.9;
      p.x = p.ox + Math.cos(a) * r;
      p.y = p.oy + Math.sin(a) * r - 0.35;
      p.rot += p.spin;
      return;
    }
    default:
      break;
  }
  p.vy += p.gravity;
  p.vx *= p.drag;
  p.vy *= p.drag;
  p.x += p.vx;
  p.y += p.vy;
  p.rot += p.spin;
}

function drawParticle(c, p) {
  const fade = Math.pow(1 - p.t, 0.7);
  c.globalAlpha = fade * p.alpha * (p.flicker || 1);

  // El halo es lo que da el bloom; es también lo primero que se cae.
  if (tier.value >= 4) {
    const g = p.size * p.glow;
    c.drawImage(glowSprite(p.rgb), -g, -g, g * 2, g * 2);
  }

  const s = p.size;
  c.fillStyle = `rgb(${p.rgb[0]},${p.rgb[1]},${p.rgb[2]})`;
  c.strokeStyle = c.fillStyle;

  switch (p.shape) {
    case 'spark':
      c.beginPath();
      c.ellipse(0, 0, s * 0.3, s * (1 + fade * 0.7), 0, 0, Math.PI * 2);
      c.fill();
      break;
    case 'ripple':
      c.globalAlpha *= 0.8;
      c.lineWidth = Math.max(0.6, 2.2 * fade);
      c.beginPath();
      c.arc(0, 0, s * (0.5 + p.t * 2.6), 0, Math.PI * 2);
      c.stroke();
      break;
    case 'leaf':
      c.beginPath();
      c.moveTo(0, -s);
      c.bezierCurveTo(s * 0.75, -s * 0.4, s * 0.6, s * 0.6, 0, s * 0.35);
      c.bezierCurveTo(-s * 0.6, s * 0.6, -s * 0.75, -s * 0.4, 0, -s);
      c.fill();
      break;
    case 'bolt':
      c.lineWidth = Math.max(0.8, s * 0.38);
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(0, -s * 1.6);
      c.lineTo(s * 0.34, -s * 0.2);
      c.lineTo(-s * 0.22, s * 0.3);
      c.lineTo(s * 0.12, s * 1.6);
      c.stroke();
      break;
    case 'crystal':
      c.lineWidth = 1.3;
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        c.moveTo(0, 0);
        c.lineTo(Math.cos(a) * s * 1.3, Math.sin(a) * s * 1.3);
      }
      c.stroke();
      break;
    case 'chunk':
      c.beginPath();
      c.rect(-s * 0.55, -s * 0.55, s * 1.1, s * 1.1);
      c.fill();
      break;
    case 'swirl':
      c.globalAlpha *= 0.7;
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(0, 0, s * 0.9, p.seed, p.seed + Math.PI * 1.35);
      c.stroke();
      break;
    default:
      c.beginPath();
      c.arc(0, 0, s * 0.6, 0, Math.PI * 2);
      c.fill();
  }
}

/** Añade partículas ya construidas al pool compartido. */
export function emitParticles(count, factory) {
  if (!ctx || tier.value < 3) return;
  const room = MAX_PARTICLES - particles.length;
  const n = Math.min(count, Math.max(0, room));
  for (let i = 0; i < n; i++) particles.push(factory(i, n));
  if (n > 0) addEffect(particleEffect);
}

/**
 * Burst con la identidad del elemento.
 * `scale` multiplica el presupuesto base; `spread` la velocidad.
 */
export function burstElement(x, y, elementId, dayIndex, { base = 22, scale = 1, spread = 1 } = {}) {
  const el = ELEMENTS.find((e) => e.id === elementId) || ELEMENTS[0];
  const rgb = elementRGB(elementId, dayIndex);
  const k = unitScale;
  const n = Math.max(2, Math.round(tier.budget(base) * scale));

  emitParticles(n, (i, total) => {
    const angle = (i / total) * Math.PI * 2 + Math.random() * 0.5;
    // Un pequeño radio de salida evita que todas nazcan en el mismo píxel:
    // con blending aditivo eso da un disco blanco en el primer frame.
    const r0 = (1 + Math.random() * 3) * k;
    const speed = el.speed * (0.7 + Math.random() * 0.9) * k * 1.6 * spread;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    if (el.upward) {
      vx *= 0.6;
      vy = -Math.abs(speed) * (0.7 + Math.random() * 0.8);
    }
    if (el.id === 'lightning') { vx *= 2.2; vy *= 2.2; }
    const sx = x + Math.cos(angle) * r0;
    const sy = y + Math.sin(angle) * r0;
    return {
      x: sx, y: sy, ox: sx, oy: sy, vx, vy,
      gravity: el.gravity,
      drag: el.drag,
      life: 0,
      maxLife: el.lifeScale * (40 + Math.random() * 26),
      size: (2 + Math.random() * 3.4) * k * el.sizeScale,
      glow: tier.value >= 5 ? 3.6 : 2.9,
      alpha: 0.82,
      rgb,
      shape: el.particleType,
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.22,
      seed: Math.random() * 6.28,
      flicker: 1,
      t: 0,
    };
  });
}

/** Burst neutro de un color dado, para efectos que no son de un elemento. */
export function burstColor(x, y, rgb, { base = 22, scale = 1, spread = 1, gravity = 0.02 } = {}) {
  const k = unitScale;
  const n = Math.max(2, Math.round(tier.budget(base) * scale));
  emitParticles(n, (i, total) => {
    const angle = (i / total) * Math.PI * 2 + Math.random() * 0.35;
    const speed = (1.6 + Math.random() * 4) * k * spread;
    return {
      x, y, ox: x, oy: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: gravity * k,
      drag: 0.975,
      life: 0,
      maxLife: 45 + Math.random() * 40,
      size: (2.4 + Math.random() * 3.6) * k,
      glow: tier.value >= 5 ? 3.6 : 2.9,
      alpha: 0.82,
      rgb,
      shape: 'dot',
      rot: 0,
      spin: 0,
      seed: 0,
      flicker: 1,
      t: 0,
    };
  });
}
