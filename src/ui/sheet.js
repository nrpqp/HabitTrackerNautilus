/* ============================================================
   Mecánica de hoja inferior.

   La comparten los ajustes y el manual: velo, panel que sube,
   trampa de foco, cierre por fuera y por Escape, devolución del
   foco al origen y exclusión mutua.

   `#habit-sheet` se queda fuera a propósito. Arrastra estado de
   hábito, modo crear/editar y posicionamiento de popover en
   escritorio; absorberlo aquí acoplaría tres cosas que no cambian
   juntas.

   El marcado lo aporta cada hoja. Esta fábrica sólo pide dos
   anclas —`data-sheet-backdrop` y `data-sheet-panel`— para que
   cada hoja conserve sus propias clases y su acento.
   ============================================================ */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Nunca hay dos hojas abiertas: la que se abre cierra a la anterior. */
let abierta = null;

export function createSheet({ root, softBackdrop = false, duration = 250, onOpen, onClose }) {
  const backdrop = root.querySelector('[data-sheet-backdrop]');
  const panel = root.querySelector('[data-sheet-panel]');
  if (!panel) throw new Error('createSheet: falta [data-sheet-panel]');

  let open = false;
  let opener = null;
  let cierre = null;

  // El velo suave deja ver el nautilus: lo necesita la hoja de ajustes,
  // donde elegir un nivel dispara una muestra detrás del panel.
  if (softBackdrop) root.classList.add('sheet-soft');

  function enfocables() {
    return Array.from(panel.querySelectorAll(FOCUSABLE))
      .filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement);
  }

  /** Escape cierra; Tab no sale del panel mientras la hoja está abierta. */
  function onKeydown(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = enfocables();
    if (!items.length) { e.preventDefault(); return; }
    const primero = items[0];
    const ultimo = items[items.length - 1];
    const actual = document.activeElement;
    if (e.shiftKey && (actual === primero || !panel.contains(actual))) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && actual === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }

  function onPointer(e) {
    if (e.target === backdrop || e.target === root) close();
  }

  function show() {
    if (open) return;
    if (abierta && abierta !== api) abierta.close();

    // Quien tuviera el foco lo recupera al cerrar, sin que la hoja
    // necesite saber qué botón la abrió.
    opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    clearTimeout(cierre);
    open = true;
    abierta = api;
    root.classList.remove('hidden');
    // Reflow forzado en vez de requestAnimationFrame: rAF no dispara
    // mientras la pestaña no es visible, y la hoja se quedaría montada
    // pero transparente.
    void root.offsetWidth;
    root.classList.add('open');

    const items = enfocables();
    (items[0] || panel).focus();

    // Eleva el canvas de efectos por encima del velo. Con una clase y no
    // con `:has()`: Safari no lo soportó hasta la 15.4 y ahí la muestra
    // se quedaría detrás sin que nada lo avisara.
    if (softBackdrop) document.body.classList.add('sheet-soft-open');

    document.addEventListener('keydown', onKeydown, true);
    root.addEventListener('click', onPointer);
    if (onOpen) onOpen();
  }

  function close() {
    if (!open) return;
    open = false;
    if (abierta === api) abierta = null;
    root.classList.remove('open');
    cierre = setTimeout(() => root.classList.add('hidden'), duration);

    if (softBackdrop) document.body.classList.remove('sheet-soft-open');

    document.removeEventListener('keydown', onKeydown, true);
    root.removeEventListener('click', onPointer);

    if (opener && document.contains(opener)) opener.focus();
    opener = null;
    if (onClose) onClose();
  }

  const api = {
    open: show,
    close,
    toggle() { open ? close() : show(); },
    get isOpen() { return open; },
  };
  return api;
}

/** ¿Hay alguna hoja abierta? Lo consulta el manejador global de Escape. */
export function haySheetAbierta() {
  return abierta !== null;
}
