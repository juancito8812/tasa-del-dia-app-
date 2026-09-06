import { DOCUMENT_TYPES, getDocumentLabel, formatDocument } from '../documentTypes';

describe('documentTypes', () => {
  it('has 6 document types', () => {
    expect(DOCUMENT_TYPES).toHaveLength(6);
  });

  it('has correct keys', () => {
    const keys = DOCUMENT_TYPES.map((d) => d.key);
    expect(keys).toEqual(['V', 'E', 'P', 'J', 'G', 'C']);
  });

  it('getDocumentLabel returns label for valid key', () => {
    expect(getDocumentLabel('V')).toBe('Cédula');
    expect(getDocumentLabel('J')).toBe('Jurídico');
    expect(getDocumentLabel('G')).toBe('Gubernamental');
  });

  it('getDocumentLabel returns key for unknown key', () => {
    expect(getDocumentLabel('X')).toBe('X');
  });

  it('formatDocument returns correct format', () => {
    expect(formatDocument('V', '12345678')).toBe('V-12345678');
    expect(formatDocument('J', '12345678-9')).toBe('J-12345678-9');
  });
});
