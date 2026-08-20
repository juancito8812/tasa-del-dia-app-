export const QUICK_USD = [100, 500, 1000, 5000, 10000, 50000];
export const QUICK_BS = [100, 500, 1000, 5000, 10000, 50000];

export function extractRawDigits(text) {
  if (!text) return '';
  const cleaned = text.includes(',') ? text.replace(/\./g, '') : text;
  let result = '';
  let seenSep = false;
  for (const ch of cleaned) {
    if (ch >= '0' && ch <= '9') {
      result += ch;
    } else if ((ch === '.' || ch === ',') && !seenSep) {
      result += ch;
      seenSep = true;
    }
  }
  return result;
}

export function formatRawDisplay(raw) {
  if (!raw) return '';
  const dotIdx = raw.indexOf('.');
  const commaIdx = raw.indexOf(',');
  const sepIdx = dotIdx !== -1 ? dotIdx : commaIdx;
  if (sepIdx !== -1) {
    const intPart = raw.slice(0, sepIdx);
    const decPart = raw.slice(sepIdx + 1);
    const intNum = parseInt(intPart, 10);
    const formattedInt = isNaN(intNum) ? (intPart === '' ? '0' : intPart) : intNum.toLocaleString('es-VE');
    return decPart === '' ? `${formattedInt},` : `${formattedInt},${decPart}`;
  }
  const num = parseInt(raw, 10);
  if (isNaN(num)) return raw;
  return num.toLocaleString('es-VE');
}

export function formatCurrency(v) {
  if (v == null) return '—';
  return Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Formato adaptativo: 2 decimales para montos ≥ 1, y hasta 6 decimales
 * para montos < 1 (ej. 1,5 Bs → 0,0017 USD) para no engañar al usuario
 * con un "0,00" cuando la conversión es válida pero pequeña.
 */
export function formatCurrencySmart(v) {
  if (v == null) return '—';
  const n = Number(v);
  if (n !== 0 && Math.abs(n) < 1) {
    return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  }
  return n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function getRateTypes(C) {
  return [
    { key: 'bcv', label: 'BCV (Oficial)', color: C.success },
    { key: 'paralelo', label: 'Paralelo', color: C.highlight },
    { key: 'binance_p2p', label: 'Binance P2P', color: C.warning },
    { key: 'euro', label: 'Euro (BCV)', color: C.info },
    { key: 'bcv_lunes', label: 'BCV (Lunes)', color: C.bcvLunes },
  ];
}

export function getWeekDay(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][date.getDay()];
}

export function getMonthAbbr(dateKey) {
  const [, m] = dateKey.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return months[parseInt(m, 10) - 1] || m;
}

export function getDay(dateKey) {
  return dateKey.split('-')[2];
}
