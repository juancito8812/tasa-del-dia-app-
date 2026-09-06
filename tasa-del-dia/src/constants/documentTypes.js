/**
 * Tipos de documento de identificación en Venezuela.
 * Cada tipo tiene un prefijo que se usa en Pago Móvil, transferencias, etc.
 */
export const DOCUMENT_TYPES = [
  { key: 'V', label: 'Cédula', description: 'Venezolano por nacimiento' },
  { key: 'E', label: 'Cédula Extranjero', description: 'Extranjero residente' },
  { key: 'P', label: 'Pasaporte', description: 'Extranjero sin residencia' },
  { key: 'J', label: 'Jurídico', description: 'Empresa / persona jurídica' },
  { key: 'G', label: 'Gubernamental', description: 'Organismo gubernamental' },
  { key: 'C', label: 'Comuna', description: 'Consejo comunal / comuna' },
];

/**
 * Obtiene el label de un tipo de documento por su key.
 * @param {string} key - V, E, P, J, G, C
 * @returns {string}
 */
export function getDocumentLabel(key) {
  return DOCUMENT_TYPES.find((d) => d.key === key)?.label ?? key;
}

/**
 * Formatea un número de documento con su prefijo.
 * @param {'V'|'E'|'P'|'J'|'G'|'C'} tipo
 * @param {string} numero
 * @returns {string} Ej: "V-12345678"
 */
export function formatDocument(tipo, numero) {
  return `${tipo}-${numero}`;
}
