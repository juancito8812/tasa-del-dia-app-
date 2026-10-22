export const ACCOUNT_TYPES = [
  { key: 'ahorro', label: 'Ahorro' },
  { key: 'corriente', label: 'Corriente' },
];

export const INITIAL_FORM = {
  tipoDocumento: 'V',
  numeroDocumento: '',
  titular: '',
  banco: '0134',
  bancoTransferencia: '',
  telefono: '',
  tipoCuenta: 'ahorro',
  numeroCuenta: '',
  email: '',
  emailPayPal: '',
  walletAddress: '',
  emailBinance: '',
  binanceId: '',
  facebankEmail: '',
  facebankAccount: '',
  zinliEmail: '',
  wallyEmail: '',
};

/**
 * Devuelve el mensaje de error de un campo numérico, o null si está bien.
 * Los teclados numéricos no impiden pegar letras ni guiones, así que se
 * valida igual un teléfono, una cédula o una cuenta.
 * @param {string} value valor del campo
 * @param {{min:number, max:number, message:string, lettersMessage:string}} rules
 */
function digitsError(value, { min, max, message, lettersMessage = 'Solo números' }) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/[^0-9\s-]/.test(trimmed)) return lettersMessage;
  const digits = trimmed.replace(/[^0-9]/g, '');
  if (digits.length < min || digits.length > max) return message;
  return null;
}

// La cédula venezolana va de 6 a 9 dígitos. Un teléfono tiene 11 dígitos
// (04141234567) o 10 (fijo); se admiten 12 por el prefijo internacional 58.
const DOC_RULES = { min: 6, max: 9, message: 'Cédula inválida (6 a 9 dígitos, sin letras)' };
const PHONE_RULES = { min: 10, max: 12, message: 'Número inválido (10 a 11 dígitos)' };
const ACCOUNT_RULES = { min: 10, max: 30, message: 'Número inválido (mínimo 10 dígitos)' };

// Un correo mal escrito ("luis@correo") hacía pasar la validación y el
// destinatario nunca recibía el pago: solo los correos bien formados
// cuentan como método digital.
const EMAIL_FIELDS = ['email', 'emailPayPal', 'emailBinance', 'facebankEmail', 'zinliEmail', 'wallyEmail'];
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(value.trim());

/**
 * Valida el formulario de cuenta bancaria.
 * @returns {Object} errores por campo ({} si todo es válido)
 */
export function validateAccountForm(form) {
  const newErrors = {};

  if (!form.numeroDocumento.trim()) {
    newErrors.numeroDocumento = 'Requerido';
  } else {
    const docError = digitsError(form.numeroDocumento, {
      ...DOC_RULES,
      lettersMessage: DOC_RULES.message,
    });
    if (docError) newErrors.numeroDocumento = docError;
  }

  if (!form.titular.trim()) {
    newErrors.titular = 'Requerido';
  }

  // Un teléfono o una cuenta con letras no sirven para Pago Móvil ni para
  // transferencia, así que además del error no cuentan como método de pago.
  const phoneError = digitsError(form.telefono, PHONE_RULES);
  if (phoneError) newErrors.telefono = phoneError;

  const accountError = digitsError(form.numeroCuenta, ACCOUNT_RULES);
  if (accountError) newErrors.numeroCuenta = accountError;

  const hasPagoMovil = Boolean(form.banco && form.telefono && !phoneError);
  const hasTransferencia = Boolean(form.bancoTransferencia && form.numeroCuenta && !accountError);

  EMAIL_FIELDS.forEach((field) => {
    if (form[field].trim() && !isValidEmail(form[field])) {
      newErrors[field] = 'Correo inválido';
    }
  });

  const hasDigital =
    EMAIL_FIELDS.some((field) => form[field].trim() && isValidEmail(form[field])) ||
    form.walletAddress ||
    form.binanceId ||
    form.facebankAccount;

  if (!hasPagoMovil && !hasTransferencia && !hasDigital) {
    newErrors.general = 'Agrega al menos un método de pago';
  }

  return newErrors;
}
