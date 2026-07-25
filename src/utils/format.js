export function money(v) {
  const n = Number(v) || 0;
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
}

export function fecha(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fechaCorta(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-CO');
}

export function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

export function haceMinutos(d) {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d).getTime()) / 60000);
}
