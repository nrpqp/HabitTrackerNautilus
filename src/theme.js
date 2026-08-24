export function getThemeColors() {
  const s = getComputedStyle(document.documentElement);
  const v = (name) => s.getPropertyValue(name).trim();
  return {
    emptyCellFill:   v('--empty-cell-fill'),
    emptyCellStroke: v('--empty-cell-stroke'),
    lockedFill:      v('--locked-cell-fill'),
    lockedStroke:    v('--locked-cell-stroke'),
    centerFill:      v('--center-fill'),
    centerStroke:    v('--center-stroke'),
    guideStroke:     v('--guide-stroke'),
    dayLabelFill:    v('--day-label-fill'),
  };
}

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

export function toggleTheme(onToggle) {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  if (onToggle) onToggle();
}

export function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    applyTheme(saved);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
}
