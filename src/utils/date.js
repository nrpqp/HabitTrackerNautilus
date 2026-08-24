export function toLocalISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO() {
  return toLocalISO(new Date());
}

export function addDays(isoStr, n) {
  const d = new Date(isoStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toLocalISO(d);
}

export function formatDateShort(isoStr) {
  const months = [
    'Ene','Feb','Mar','Abr','May','Jun',
    'Jul','Ago','Sep','Oct','Nov','Dic',
  ];
  const parts = isoStr.split('-');
  const day = parseInt(parts[2], 10);
  const mon = months[parseInt(parts[1], 10) - 1];
  return `${String(day).padStart(2, '0')} ${mon}`;
}

export function formatDateFull(isoStr) {
  return `${formatDateShort(isoStr)} ${isoStr.split('-')[0]}`;
}

export function diffDays(a, b) {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db - da) / 86400000);
}
