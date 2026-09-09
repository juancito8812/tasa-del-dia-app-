import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDocument } from '../constants/documentTypes';
import { formatBankDisplay } from '../constants/banks';

const STORAGE_KEY = '@bank_accounts';

/** Genera un ID único simple. */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/** Sanitiza un ID para usarlo como key de AsyncStorage. */
function sanitizeId(id) {
  return String(id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

/** Obtiene todas las cuentas bancarias guardadas. */
export async function getAccounts() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

/** Guarda una cuenta bancaria (crea o actualiza). */
export async function saveAccount(account) {
  const accounts = await getAccounts();
  const safeAccount = { ...account };

  if (safeAccount.id) {
    safeAccount.id = sanitizeId(safeAccount.id);
    const index = accounts.findIndex((a) => a.id === safeAccount.id);
    if (index !== -1) {
      accounts[index] = { ...accounts[index], ...safeAccount };
    } else {
      accounts.push(safeAccount);
    }
  } else {
    safeAccount.id = generateId();
    accounts.push(safeAccount);
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  return safeAccount;
}

/** Elimina una cuenta por su ID. */
export async function deleteAccount(id) {
  try {
    const accounts = await getAccounts();
    const filtered = accounts.filter((a) => a.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

/** Extrae solo dígitos del número de teléfono. */
function digitsOnly(tel) {
  return String(tel || '').replace(/[^0-9]/g, '');
}

/** Nombre corto del banco (solo nombre, sin código entre paréntesis). */
function bankShortName(code) {
  return formatBankDisplay(code)
    .replace(/^Banco\s+/i, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim();
}

/** Formatea todos los datos de una cuenta para copiar/compartir (con labels). */
export function formatAccountText(account) {
  const sections = [];

  sections.push(`Cédula: ${account.numeroDocumento || ''}`);

  if (account.banco && account.telefono) {
    sections.push(`Teléfono: ${digitsOnly(account.telefono)}`);
    sections.push(`Banco: ${bankShortName(account.banco)} (${account.banco})`);
  }

  if (account.banco && account.numeroCuenta) {
    sections.push(`Cuenta: ${account.numeroCuenta}`);
    sections.push(`Banco: ${bankShortName(account.banco)} (${account.banco})`);
    sections.push(`Tipo: ${account.tipoCuenta === 'corriente' ? 'Corriente' : 'Ahorro'}`);
  }

  if (account.email) {
    sections.push(`Zelle: ${account.email}`);
  }

  if (account.emailPayPal) {
    sections.push(`PayPal: ${account.emailPayPal}`);
  }

  if (account.binanceWallet || account.binanceEmail || account.binanceId) {
    if (account.binanceWallet) sections.push(`Binance Wallet: ${account.binanceWallet}`);
    if (account.binanceEmail) sections.push(`Binance Email: ${account.binanceEmail}`);
    if (account.binanceId) sections.push(`Binance ID: ${account.binanceId}`);
  }

  if (account.facebankEmail || account.facebankAccount) {
    if (account.facebankEmail) sections.push(`Facebank: ${account.facebankEmail}`);
    if (account.facebankAccount) sections.push(`Facebank Cuenta: ${account.facebankAccount}`);
  }

  if (account.zinliEmail) {
    sections.push(`Zinli: ${account.zinliEmail}`);
  }

  if (account.wallyEmail) {
    sections.push(`Wally: ${account.wallyEmail}`);
  }

  return sections.filter((l) => l.trim() !== '').join('\n');
}

/** Formatea una sección específica de la cuenta para copiar (sin labels, compacto). */
export function formatSectionText(account, section) {
  const lines = [];

  if (section === 'pago_movil' && account.banco && account.telefono) {
    lines.push(account.numeroDocumento || '');
    lines.push(digitsOnly(account.telefono));
    lines.push(`${bankShortName(account.banco)} ${account.banco}`);
  }

  if (section === 'transferencia' && account.banco && account.numeroCuenta) {
    lines.push(account.numeroCuenta);
    lines.push(`${bankShortName(account.banco)} ${account.banco}`);
    lines.push(account.tipoCuenta === 'corriente' ? 'Corriente' : 'Ahorro');
  }

  if (section === 'zelle' && account.email) {
    lines.push(account.email);
  }

  if (section === 'paypal' && account.emailPayPal) {
    lines.push(account.emailPayPal);
  }

  if (section === 'binance' && (account.binanceWallet || account.binanceEmail || account.binanceId)) {
    if (account.binanceWallet) lines.push(account.binanceWallet);
    if (account.binanceEmail) lines.push(account.binanceEmail);
    if (account.binanceId) lines.push(account.binanceId);
  }

  if (section === 'facebank' && (account.facebankEmail || account.facebankAccount)) {
    if (account.facebankEmail) lines.push(account.facebankEmail);
    if (account.facebankAccount) lines.push(account.facebankAccount);
  }

  if (section === 'zinli' && account.zinliEmail) {
    lines.push(account.zinliEmail);
  }

  if (section === 'wally' && account.wallyEmail) {
    lines.push(account.wallyEmail);
  }

  return lines.filter((l) => l.trim() !== '').join('\n');
}

/** Verifica si una cuenta tiene datos de pago móvil. */
export function hasPagoMovil(account) {
  return !!(account.banco && account.telefono);
}

/** Verifica si una cuenta tiene datos de transferencia. */
export function hasTransferencia(account) {
  return !!(account.banco && account.numeroCuenta);
}

/** Verifica si una cuenta tiene datos de Zelle. */
export function hasZelle(account) {
  return !!(account.email);
}

/** Verifica si una cuenta tiene datos de PayPal. */
export function hasPayPal(account) {
  return !!(account.emailPayPal);
}

/** Verifica si una cuenta tiene datos de Binance. */
export function hasBinance(account) {
  return !!(account.binanceWallet || account.binanceEmail || account.binanceId);
}

/** Verifica si una cuenta tiene datos de Facebank. */
export function hasFacebank(account) {
  return !!(account.facebankEmail || account.facebankAccount);
}

/** Verifica si una cuenta tiene datos de Zinli. */
export function hasZinli(account) {
  return !!(account.zinliEmail);
}

/** Verifica si una cuenta tiene datos de Wally. */
export function hasWally(account) {
  return !!(account.wallyEmail);
}

/** Verifica si una cuenta tiene datos digitales (legacy). */
export function hasDigital(account) {
  return !!(account.email || account.emailPayPal || account.binanceWallet || account.facebankEmail || account.zinliEmail || account.wallyEmail);
}
