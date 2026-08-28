import { createSheet } from './sheet.js';
import { tier, SOURCES, TIER_NAMES, MIN_TIER, MAX_TIER } from '../fx/engine.js';

/* ============================================================
   Hoja de ajustes.

   Tema, nivel de efecto visual y el hueco reservado para la
   tipografía. Se ancla abajo en todas las anchuras: es la única
   superficie cuyo contenido actúa sobre lo que hay detrás, y la
   muestra necesita nautilus visible por encima del panel.
   ============================================================ */

const DESCRIPCIONES = [
  null,
  'Sin movimiento',
  'Movimiento sobrio, sin partículas',
  'Partículas ligeras, sin halo',
  'Partículas, halo y celebraciones',
  'Todo, sin recortes',
];

export function createSettings({ getTheme, onTheme, getLevel, onLevel, onPreview }) {
  const root = document.getElementById('settings-sheet');
  const btn = document.getElementById('settings-btn');
  const escala = document.getElementById('fx-scale');
  const nota = document.getElementById('fx-scale-note');
  const temaOpts = Array.from(root.querySelectorAll('.theme-opt'));

  const pasos = [];
  for (let n = MIN_TIER; n <= MAX_TIER; n++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fx-step';
    b.dataset.level = String(n);
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', 'false');
    // El número solo no dice nada a un lector de pantalla: se acompaña
    // del nombre del nivel y de lo que hace.
    b.setAttribute('aria-label', `Nivel ${n}, ${TIER_NAMES[n]}. ${DESCRIPCIONES[n]}`);
    b.textContent = String(n);
    b.addEventListener('click', () => elegirNivel(n));
    b.addEventListener('keydown', (e) => navegar(e, n));
    escala.appendChild(b);
    pasos.push(b);
  }

  /** Flechas para recorrer la escala sin puntero, como en un radiogroup. */
  function navegar(e, n) {
    const paso = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (!paso) return;
    e.preventDefault();
    const siguiente = Math.min(MAX_TIER, Math.max(MIN_TIER, n + paso));
    pasos[siguiente - MIN_TIER].focus();
  }

  function elegirNivel(n) {
    onLevel(n);
    sync();
    onPreview(n);
  }

  function elegirTema(valor) {
    onTheme(valor);
    sync();
  }

  temaOpts.forEach((b) => {
    b.addEventListener('click', () => elegirTema(b.dataset.themeValue));
  });

  /**
   * Marca lo elegido y dice qué nivel está activo de verdad. Un ajuste
   * que se ignora en silencio es un fallo, así que las tres formas de
   * discrepancia —techo del sistema, anulación por URL y degradación por
   * rendimiento— tienen su propio aviso.
   */
  function sync() {
    const nivel = getLevel();
    pasos.forEach((b) => {
      const on = Number(b.dataset.level) === nivel;
      b.classList.toggle('on', on);
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });

    const tema = getTheme();
    temaOpts.forEach((b) => {
      const on = b.dataset.themeValue === tema;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });

    const activo = TIER_NAMES[tier.value];
    if (tier.source === SOURCES.REDUCED_MOTION) {
      nota.textContent = `Tu sistema pide movimiento reducido: el nivel activo es ${activo}. Tu elección se conserva.`;
      nota.classList.add('warn');
    } else if (tier.source === SOURCES.DIAGNOSTIC) {
      nota.textContent = `El nivel lo fija ?fx= en la dirección: ${activo}. Tu elección se conserva.`;
      nota.classList.add('warn');
    } else if (nivel !== tier.value) {
      nota.textContent = `Tu dispositivo no sostiene ese nivel; ahora va en ${activo}.`;
      nota.classList.add('warn');
    } else {
      nota.textContent = `Nivel ${tier.value} · ${activo}. ${DESCRIPCIONES[tier.value]}`;
      nota.classList.remove('warn');
    }
  }

  /**
   * Recorta el canvas justo por encima del panel. El canvas va elevado
   * para que la muestra se vea sobre el velo, y esa misma elevación lo
   * pondría por delante del panel: sin este recorte, las partículas del
   * borde acaban dibujadas sobre el texto de los ajustes.
   */
  /**
   * Borde superior del panel una vez colocado. No se mide con
   * `getBoundingClientRect`: al abrir, la transición acaba de empezar y el
   * panel sigue en `translateY(100%)`, así que devolvería el borde
   * inferior de la ventana. Anclado abajo, su posición final se deduce.
   */
  function panelTop() {
    const p = root.querySelector('[data-sheet-panel]');
    return window.innerHeight - p.offsetHeight;
  }

  function ajustarMascara() {
    const cont = document.getElementById('svg-container');
    if (!cont) return;
    const rect = cont.getBoundingClientRect();
    if (!rect.height) return;
    const borde = panelTop() - rect.top;
    const fade = Math.max(0, Math.min(100, (borde / rect.height) * 100));
    const solid = Math.max(0, fade - 8);
    const raiz = document.documentElement.style;
    raiz.setProperty('--fx-mask-solid', `${solid.toFixed(1)}%`);
    raiz.setProperty('--fx-mask-fade', `${fade.toFixed(1)}%`);
  }

  const hoja = createSheet({
    root,
    softBackdrop: true,
    onOpen: () => {
      sync();
      ajustarMascara();
      btn.setAttribute('aria-expanded', 'true');
    },
    onClose: () => btn.setAttribute('aria-expanded', 'false'),
  });

  // El panel cambia de altura y de sitio al rotar o redimensionar.
  window.addEventListener('resize', () => { if (hoja.isOpen) ajustarMascara(); });

  btn.addEventListener('click', () => hoja.toggle());
  document.getElementById('settings-sheet-close').addEventListener('click', () => hoja.close());

  // El gobernador puede degradar con la hoja abierta, y el techo del
  // sistema puede entrar o salir en cualquier momento.
  tier.onChange(() => { if (hoja.isOpen) sync(); });

  return {
    open: hoja.open,
    close: hoja.close,
    get isOpen() { return hoja.isOpen; },
    sync,
    /** Borde superior del panel colocado: el área libre queda por encima. */
    panelTop,
  };
}
