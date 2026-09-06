import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDocument } from '../constants/documentTypes';
import { formatBankDisplay } from '../constants/banks';

const STORAGE_KEY = '@bank_accounts';

/**
 * Genera un ID único simple.
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/**
 * Sanitiza un ID para usarlo como key de AsyncStorage.
 * @param {string} id
 * @returns {string}
 */
function sanitizeId(id) {
  return String(id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

/**
 * Obtiene todas las cuentas bancarias guardadas.
 * @returns {Promise<Array>}
 */
export async function getAccounts() {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

/**
 * Guarda una cuenta bancaria (crea o actualiza).
 * Si tiene `id`, actualiza; si no, crea una nueva.
 * @param {Object} account
 * @returns {Promise<Object>} La cuenta guardada con ID
 */
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

/**
 * Elimina una cuenta por su ID.
 * @param {string} id
 * @returns {Promise<boolean>}
 */
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

/**
 * Formatea todos los datos de una cuenta para copiar/compartir.
 * @param {Object} account
 * @returns {string}
 */
export function formatAccountText(account) {
  const lines = [];

  lines.push(account.titular || '');
  lines.push(formatDocument(account.tipoDocumento, account.numeroDocumento));

  if (account.banco) {
    if (account.telefono) {
      lines.push('');
      lines.push('📱 Pago Móvil');
      lines.push(`Banco: ${formatBankDisplay(account.banco)}`);
      lines.push(`Tel: ${account.telefono}`);
    }

    if (account.numeroCuenta) {
      lines.push('');
      lines.push('🏦 Transferencia');
      lines.push(`Banco: ${formatBankDisplay(account.banco)}`);
      lines.push(`Cta: ${account.numeroCuenta}`);
      lines.push(`Tipo: ${account.tipoCuenta === 'corriente' ? 'Corriente' : 'Ahorro'}`);
    }
  }

  if (account.email) {
    lines.push('');
    lines.push('📧 Zelle');
    lines.push(`Email: ${account.email}`);
  }

  if (account.emailPayPal) {
    lines.push('');
    lines.push('💳 PayPal');
    lines.push(`Email: ${account.emailPayPal}`);
  }

  if (account.binanceWallet || account.binanceEmail || account.binanceId) {
    lines.push('');
    lines.push('🟡 Binance');
    if (account.binanceWallet) lines.push(`Wallet: ${account.binanceWallet}`);
    if (account.binanceEmail) lines.push(`Email: ${account.binanceEmail}`);
    if (account.binanceId) lines.push(`ID: ${account.binanceId}`);
  }

  return lines.filter((l) => l !== '').join('\n');
}

/**
 * Formatea una sección específica de la cuenta para copiar.
 * @param {Object} account
 * @param {'pago_movil'|'transferencia'|'zelle'|'paypal'|'binance'} section
 * @returns {string}
 */
export function formatSectionText(account, section) {
  const lines = [];

  lines.push(account.titular || '');
  lines.push(formatDocument(account.tipoDocumento, account.numeroDocumento));

  if (section === 'pago_movil' && account.banco && account.telefono) {
    lines.push('');
    lines.push('📱 Pago Móvil');
    lines.push(`Banco: ${formatBankDisplay(account.banco)}`);
    lines.push(`Tel: ${account.telefono}`);
  }

  if (section === 'transferencia' && account.banco && account.numeroCuenta) {
    lines.push('');
    lines.push('🏦 Transferencia');
    lines.push(`Banco: ${formatBankDisplay(account.banco)}`);
    lines.push(`Cta: ${account.numeroCuenta}`);
    lines.push(`Tipo: ${account.tipoCuenta === 'corriente' ? 'Corriente' : 'Ahorro'}`);
  }

  if (section === 'zelle' && account.email) {
    lines.push('');
    lines.push('📧 Zelle');
    lines.push(`Email: ${account.email}`);
  }

  if (section === 'paypal' && account.emailPayPal) {
    lines.push('');
    lines.push('💳 PayPal');
    lines.push(`Email: ${account.emailPayPal}`);
  }

  if (section === 'binance' && (account.binanceWallet || account.binanceEmail || account.binanceId)) {
    lines.push('');
    lines.push('🟡 Binance');
    if (account.binanceWallet) lines.push(`Wallet: ${account.binanceWallet}`);
    if (account.binanceEmail) lines.push(`Email: ${account.binanceEmail}`);
    if (account.binanceId) lines.push(`ID: ${account.binanceId}`);
  }

  return lines.filter((l) => l !== '').join('\n');
}

/**
 * Verifica si una cuenta tiene datos de pago móvil.
 * @param {Object} account
 * @returns {boolean}
 */
export function hasPagoMovil(account) {
  return !!(account.banco && account.telefono);
}

/**
 * Verifica si una cuenta tiene datos de transferencia.
 * @param {Object} account
 * @returns {boolean}
 */
export function hasTransferencia(account) {
  return !!(account.banco && account.numeroCuenta);
}

/**
 * Verifica si una cuenta tiene datos de Zelle.
 * @param {Object} account
 * @returns {boolean}
 */
export function hasZelle(account) {
  return !!(account.email);
}

/**
 * Verifica si una cuenta tiene datos de PayPal.
 * @param {Object} account
 * @returns {boolean}
 */
export function hasPayPal(account) {
  return !!(account.emailPayPal);
}

/**
 * Verifica si una cuenta tiene datos de Binance.
 * @param {Object} account
 * @returns {boolean}
 */
export function hasBinance(account) {
  return !!(account.binanceWallet || account.binanceEmail || account.binanceId);
}

/**
 * Verifica si una cuenta tiene datos digitales (legacy).
 * @param {Object} account
 * @returns {boolean}
 */
export function hasDigital(account) {
  return !!(account.email || account.emailPayPal || account.binanceWallet);
}
