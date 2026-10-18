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
 * Valida el formulario de cuenta bancaria.
 * @returns {Object} errores por campo ({} si todo es válido)
 */
export function validateAccountForm(form) {
  const newErrors = {};

  if (!form.numeroDocumento.trim()) {
    newErrors.numeroDocumento = 'Requerido';
  }
  if (!form.titular.trim()) {
    newErrors.titular = 'Requerido';
  }

  const hasPagoMovil = form.banco && form.telefono;
  const hasTransferencia = form.bancoTransferencia && form.numeroCuenta;
  const hasDigital = form.email || form.emailPayPal || form.walletAddress || form.emailBinance || form.binanceId || form.facebankEmail || form.facebankAccount || form.zinliEmail || form.wallyEmail;

  if (!hasPagoMovil && !hasTransferencia && !hasDigital) {
    newErrors.general = 'Agrega al menos un método de pago';
  }

  return newErrors;
}
