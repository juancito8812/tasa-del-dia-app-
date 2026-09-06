/**
 * Lista de bancos en Venezuela con sus códigos Sudeban oficiales.
 * Fuente: SUDEBAN (Superintendencia de las Instituciones del Sector Bancario)
 * https://www.sudeban.gob.ve
 */
export const BANKS = [
  { code: '0102', name: 'Banco de Venezuela', type: 'universal' },
  { code: '0104', name: 'Venezolano de Crédito', type: 'universal' },
  { code: '0105', name: 'Banco Mercantil', type: 'universal' },
  { code: '0108', name: 'BBVA Provincial', type: 'universal' },
  { code: '0114', name: 'Bancaribe', type: 'universal' },
  { code: '0115', name: 'Banco Exterior', type: 'universal' },
  { code: '0128', name: 'Banco Caroní', type: 'universal' },
  { code: '0134', name: 'Banesco', type: 'universal' },
  { code: '0137', name: 'Sofitasa', type: 'universal' },
  { code: '0138', name: 'Mibanco', type: 'comercial' },
  { code: '0146', name: 'Bangente', type: 'microfinanzas' },
  { code: '0151', name: 'BFC Banco Fondo Común', type: 'universal' },
  { code: '0156', name: 'Del Sur Banco Universal', type: 'universal' },
  { code: '0157', name: 'Helm Bank de Venezuela', type: 'comercial' },
  { code: '0163', name: 'Banco del Tesoro', type: 'universal' },
  { code: '0166', name: 'Banco Agrícola de Venezuela', type: 'especial' },
  { code: '0168', name: 'Bancrecer', type: 'microfinanzas' },
  { code: '0169', name: 'Mi Banco', type: 'microfinanzas' },
  { code: '0171', name: 'Banco Activo', type: 'universal' },
  { code: '0172', name: 'Bancamiga', type: 'universal' },
  { code: '0174', name: 'Banplus', type: 'universal' },
  { code: '0175', name: 'Bicentenario', type: 'universal' },
  { code: '0177', name: 'SOFITASA', type: 'universal' },
  { code: '0178', name: 'IMCP', type: 'municipal' },
  { code: '0180', name: 'Banco Agrícola de Venezuela', type: 'especial' },
  { code: '0190', name: 'Citibank', type: 'universal' },
  { code: '0191', name: 'BNC Nacional de Crédito', type: 'universal' },
  { code: '0601', name: 'INAPYMI', type: 'especial' },
];

/**
 * Obtiene el nombre de un banco por su código Sudeban.
 * @param {string} code - Código de 4 dígitos
 * @returns {string} Nombre del banco o el código si no se encuentra
 */
export function getBankName(code) {
  return BANKS.find((b) => b.code === code)?.name ?? code;
}

/**
 * Obtiene un banco completo por su código.
 * @param {string} code
 * @returns {{ code: string, name: string, type: string } | undefined}
 */
export function getBankByCode(code) {
  return BANKS.find((b) => b.code === code);
}

/**
 * Formatea un banco para mostrar: "Banesco (0134)"
 * @param {string} code
 * @returns {string}
 */
export function formatBankDisplay(code) {
  const bank = getBankByCode(code);
  if (!bank) return code;
  return `${bank.name} (${bank.code})`;
}
