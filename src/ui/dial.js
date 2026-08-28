import { polarToCartesian } from '../utils/svg.js';
import { tier, SOURCES, TIER_NAMES, MIN_TIER, MAX_TIER } from '../fx/engine.js';

/* ============================================================
   Rueda de intensidad.

   Control radial transitorio, dibujado alrededor del nautilus.
   El centro NO es suyo: ahí siguen el medidor del día y su cuenta,
   así que el estado y los avisos van fuera del círculo de opciones.
   ============================================================ */

const DESCRIPCIONES = [
  null,
  'Sin movimiento',
  'Movimiento sobrio, sin partículas',
  'Partículas ligeras, sin halo',
  'Partículas y celebraciones',
  'Todo, sin recortes',
];

const OPTIONS = [];
for (let n = MIN_TIER; n <= MAX_TIER; n++) {
  OPTIONS.push({ value: n, label: String(n), nombre: TIER_NAMES[n], descripcion: DESCRIPCIONES[n] });
}

// Cinco posiciones repartidas desde arriba, en sentido horario.
const STEP = 360 / OPTIONS.length;
const START = -90;

export function createDial({ host, getChoice, onChoose, onPreview, onOpenChange }) {
  let root = null;
  let ring = null;
  let note = null;
  let buttons = [];
  let open = false;

  function build() {
    root = document.createElement('div');
    root.className = 'fx-dial hidden';
    root.id = 'fx-dial';

    const backdrop = document.createElement('div');
    backdrop.className = 'fx-dial-backdrop';
    backdrop.addEventListener('click', close);
    root.appendChild(backdrop);

    ring = document.createElement('div');
    ring.className = 'fx-dial-ring';
    ring.setAttribute('role', 'radiogroup');
    ring.setAttribute('aria-label', 'Intensidad de efectos');

    buttons = OPTIONS.map((opt, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'fx-opt';
      b.dataset.value = opt.value;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', `Nivel ${opt.value}, ${opt.nombre}. ${opt.descripcion}`);
      b.textContent = opt.label;

      // Mismo helper polar que dibuja el anillo de días.
      const p = polarToCartesian(50, 50, 40, START + i * STEP);
      b.style.left = `${p.x}%`;
      b.style.top = `${p.y}%`;

      b.addEventListener('click', () => pick(opt.value));
      b.addEventListener('keydown', (e) => onKeyNav(e, i));
      ring.appendChild(b);
      return b;
    });

    root.appendChild(ring);

    note = document.createElement('p');
    note.className = 'fx-dial-note';
    note.setAttribute('aria-live', 'polite');
    root.appendChild(note);

    host.appendChild(root);
  }

  /** Flechas para recorrer el círculo sin puntero. */
  function onKeyNav(e, i) {
    const next = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!next) return;
    e.preventDefault();
    buttons[(i + next + buttons.length) % buttons.length].focus();
  }

  function pick(value) {
    onChoose(value);
    sync();
    onPreview();
  }

  /**
   * El anillo se dimensiona en JS con el lado menor del contenedor: el
   * contenedor no es cuadrado y en CSS no hay forma directa de referirse
   * a su dimensión menor sin containment.
   */
  function resize() {
    if (!open) return;
    const r = host.getBoundingClientRect();
    const side = Math.min(r.width, r.height) * 0.92;
    ring.style.width = `${side}px`;
    ring.style.height = `${side}px`;
  }

  /** Marca la elección y avisa cuando el nivel activo no es el elegido. */
  function sync() {
    const choice = getChoice();
    buttons.forEach((b) => {
      const on = Number(b.dataset.value) === choice;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });

    const activo = `${TIER_NAMES[tier.value]}`;
    if (tier.source === SOURCES.REDUCED_MOTION) {
      note.textContent = `Tu sistema pide movimiento reducido: el nivel activo es ${activo}. Tu elección se conserva.`;
      note.classList.add('warn');
    } else if (tier.source === SOURCES.DIAGNOSTIC) {
      note.textContent = `El nivel lo fija ?fx= en la dirección: ${activo}. Tu elección se conserva.`;
      note.classList.add('warn');
    } else if (choice !== tier.value) {
      note.textContent = `Tu dispositivo no sostiene ese nivel; ahora va en ${activo}.`;
      note.classList.add('warn');
    } else {
      note.textContent = `Nivel ${tier.value} · ${activo}`;
      note.classList.remove('warn');
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape' && open) { e.stopPropagation(); close(); }
  }

  function toggle() { open ? close() : show(); }

  function announce() { if (onOpenChange) onOpenChange(open); }

  function show() {
    if (!root) build();
    open = true;
    root.classList.remove('hidden');
    resize();
    sync();
    // Un reflow forzado en vez de requestAnimationFrame: rAF no dispara
    // mientras la pestaña no es visible y la rueda se quedaría abierta
    // pero transparente.
    void root.offsetWidth;
    root.classList.add('open');
    const marked = buttons.find((b) => b.classList.contains('on')) || buttons[0];
    marked.focus();
    document.addEventListener('keydown', onKeydown, true);
    window.addEventListener('resize', resize);
    announce();
  }

  function close() {
    if (!open) return;
    open = false;
    root.classList.remove('open');
    setTimeout(() => root && root.classList.add('hidden'), 200);
    document.removeEventListener('keydown', onKeydown, true);
    window.removeEventListener('resize', resize);
    announce();
  }

  // El gobernador puede degradar mientras la rueda está abierta.
  tier.onChange(() => { if (open) sync(); });

  return { toggle, show, close, get isOpen() { return open; } };
}
