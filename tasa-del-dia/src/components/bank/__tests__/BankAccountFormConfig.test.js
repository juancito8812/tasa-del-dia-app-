import { INITIAL_FORM, validateAccountForm } from '../BankAccountFormConfig';

const validPagoMovil = {
  ...INITIAL_FORM,
  numeroDocumento: '12345678',
  titular: 'Luis Romero',
  telefono: '04141234567',
};

describe('validateAccountForm', () => {
  it('rejects a phone number that contains letters and no longer counts it as a payment method', () => {
    const errors = validateAccountForm({ ...validPagoMovil, telefono: '0414ABC4567' });

    expect(errors.telefono).toBeTruthy();
    expect(errors.general).toBe('Agrega al menos un método de pago');
  });

  it('rejects a phone number that is too short to be a real number', () => {
    const errors = validateAccountForm({ ...validPagoMovil, telefono: '0414123' });

    expect(errors.telefono).toBeTruthy();
    expect(errors.general).toBe('Agrega al menos un método de pago');
  });

  it('accepts a digit-only phone of 11 digits and 10 digits (no errors)', () => {
    expect(validateAccountForm({ ...validPagoMovil, telefono: '04141234567' })).toEqual({});
    expect(validateAccountForm({ ...validPagoMovil, telefono: '0212123456' })).toEqual({});
  });

  it('rejects a document number that has letters', () => {
    const errors = validateAccountForm({ ...validPagoMovil, numeroDocumento: 'V12345678' });

    expect(errors.numeroDocumento).toBeTruthy();
  });

  it('rejects a document number that is too short', () => {
    const errors = validateAccountForm({ ...validPagoMovil, numeroDocumento: '123' });

    expect(errors.numeroDocumento).toBeTruthy();
  });

  it('rejects a malformed email used as the only digital method', () => {
    const errors = validateAccountForm({
      ...INITIAL_FORM,
      numeroDocumento: '12345678',
      titular: 'Luis Romero',
      banco: '',
      telefono: '',
      emailPayPal: 'luis@correo',
    });

    expect(errors.emailPayPal).toBeTruthy();
    expect(errors.general).toBe('Agrega al menos un método de pago');
  });

  it('accepts a valid email as the only digital method', () => {
    const errors = validateAccountForm({
      ...INITIAL_FORM,
      numeroDocumento: '12345678',
      titular: 'Luis Romero',
      banco: '',
      telefono: '',
      emailPayPal: 'luis@correo.com',
    });

    expect(errors).toEqual({});
  });

  it('rejects account numbers that contain letters', () => {
    const errors = validateAccountForm({
      ...INITIAL_FORM,
      numeroDocumento: '12345678',
      titular: 'Luis Romero',
      banco: '',
      telefono: '',
      bancoTransferencia: '0102',
      numeroCuenta: 'ABC-123456',
    });

    expect(errors.numeroCuenta).toBe('Solo números');
    expect(errors.general).toBe('Agrega al menos un método de pago');
  });

  it('accepts an account number with dashes and enough digits', () => {
    const errors = validateAccountForm({
      ...INITIAL_FORM,
      numeroDocumento: '12345678',
      titular: 'Luis Romero',
      banco: '',
      telefono: '',
      bancoTransferencia: '0102',
      numeroCuenta: '0102-1234-56-1234567890',
    });

    expect(errors.numeroCuenta).toBeUndefined();
    expect(errors.general).toBeUndefined();
  });
});
