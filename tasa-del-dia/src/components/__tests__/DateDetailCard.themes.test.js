// Tests por estilo (Q1) del DateDetailCard compartido: se conservan solo los
// deltas visuales deliberados de cada copia por tema, y la accesibilidad del
// base (las copias editorial/fintech la habían perdido).
import React from 'react';
import TestRenderer from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import DateDetailCard, { THEME_STYLES } from '../DateDetailCard';
import { useTheme } from '../../context/ThemeContext';
import { FONT } from '../../ui/fintech/fonts';
import { darkTheme as darkThemeOriginal } from '../../constants/themes';
import { darkThemeEditorial } from '../../ui/editorial/palette';
import { darkThemeFintech } from '../../ui/fintech/palette';
import { darkThemeTerminal } from '../../ui/terminal/palette';

jest.mock('../../context/ThemeContext', () => ({ useTheme: jest.fn() }));

// El hook real devuelve FONT solo dentro del provider; aquí lo forzamos para
// poder verificar las familias tipográficas de fintech.
jest.mock('../../ui/fintech/fonts', () => {
  const actual = jest.requireActual('../../ui/fintech/fonts');
  return { ...actual, useFintechFonts: () => actual.FONT };
});

const mockData = {
  dateKey: '2026-06-21', bcv: 80.5, paralelo: 95.2,
  binance_p2p: 92.0, euro: 85.3, fetchedAt: '2026-06-21T12:00:00Z',
};

function render(uiStyle, C, props = {}) {
  useTheme.mockReturnValue({ uiStyle, colors: C });
  let renderer;
  TestRenderer.act(() => {
    renderer = TestRenderer.create(
      <DateDetailCard
        selectedData={mockData}
        C={C}
        copiedField={null}
        handleCopy={() => {}}
        handleCopyAll={() => {}}
        onClose={() => {}}
        {...props}
      />
    );
  });
  return renderer;
}

const flatten = (node) => StyleSheet.flatten(node.props.style) || {};
const allViews = (r) => r.root.findAllByType('View');
const allTexts = (r) => r.root.findAllByType('Text');

/** Sube por el árbol hasta el primer nodo con onPress (TouchableOpacity). */
function touchableOf(node) {
  let n = node;
  while (n && typeof n.props.onPress !== 'function') n = n.parent;
  return n;
}

const textByChildren = (r, value) => allTexts(r).find((t) => t.props.children === value);

describe('DateDetailCard · deltas por estilo (Q1)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('original usa el CTA blanco literal y radio 20', () => {
    const C = darkThemeOriginal;
    const r = render('original', C);
    const copyAll = touchableOf(textByChildren(r, 'Copiar todo'));
    expect(flatten(copyAll).backgroundColor).toBe(C.info);
    expect(flatten(copyAll).borderRadius).toBe(12);
    const card = flatten(allViews(r)[0]);
    expect(card.borderRadius).toBe(20);
    expect(textByChildren(r, 'Copiar todo').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: '#fff' })])
    );
  });

  it('editorial pinta el CTA con C.onAccent (delta deliberado)', () => {
    const C = darkThemeEditorial;
    const r = render('editorial', C);
    const copyAll = touchableOf(textByChildren(r, 'Copiar todo'));
    expect(flatten(copyAll).backgroundColor).toBe(C.info);
    expect(textByChildren(r, 'Copiar todo').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: C.onAccent })])
    );
    expect(THEME_STYLES.editorial.copyAllAccentIdle).toBe('onAccent');
  });

  it('conserva la accesibilidad del base en TODOS los estilos (las copias la habían perdido)', () => {
    for (const [uiStyle, C] of [
      ['original', darkThemeOriginal],
      ['editorial', darkThemeEditorial],
      ['fintech', darkThemeFintech],
      ['terminal', darkThemeTerminal],
    ]) {
      const r = render(uiStyle, C);
      const close = r.root.findAll(
        (n) => n.props.accessibilityLabel === 'Cerrar detalle' && typeof n.props.onPress === 'function'
      );
      expect(close.length).toBeGreaterThanOrEqual(1);
      expect(close[0].props.accessibilityRole).toBe('button');
      // …y la copia editorial/fintech ya no existe como archivo aparte.
      expect(THEME_STYLES[uiStyle]).toBeDefined();
    }
  });

  it('fintech: radios pastilla, glow verde, tinte 0D, CTA highlight y fuentes geométricas', () => {
    const C = darkThemeFintech;
    const r = render('fintech', C);
    const card = allViews(r).map(flatten)[0];
    expect(card.borderRadius).toBe(16);
    // glow: barra superior de 3px con el color semántico success
    const glow = allViews(r).map(flatten).find((s) => s.position === 'absolute' && s.height === 3);
    expect(glow.backgroundColor).toBe(C.success);
    expect(glow.opacity).toBe(0.6);
    // filas tintadas con alpha 0D (base: 08)
    const row = allViews(r).map(flatten).find((s) => s.borderRadius === 13 && s.paddingVertical === 10);
    expect(row.backgroundColor).toBe(C.success + '0D');
    // CTA en highlight con acento del tema
    const copyAll = touchableOf(textByChildren(r, 'Copiar todo'));
    expect(flatten(copyAll).backgroundColor).toBe(C.highlight);
    expect(flatten(copyAll).borderRadius).toBe(13);
    // tipografías geométricas
    const date = textByChildren(r, '21/06/2026');
    expect(flatten(date).fontFamily).toBe(FONT.sansSemiBold);
    const value = allTexts(r).find((t) => t.props.children === 'Bs. 80,50');
    expect(flatten(value).fontFamily).toBe(FONT.monoSemiBold);
    const copyAllText = textByChildren(r, 'Copiar todo');
    expect(flatten(copyAllText).fontFamily).toBe(FONT.sansSemiBold);
    expect(flatten(copyAllText).fontWeight).toBe('600');
    // pastilla del día
    const badge = allViews(r).map(flatten).find((s) => s.borderRadius === 999 && s.paddingVertical === 4);
    expect(badge).toBeTruthy();
  });

  it('terminal: sin glow, sin dots, labels en mayúsculas, filas con borde y monospace', () => {
    const C = darkThemeTerminal;
    const r = render('terminal', C);
    expect(allViews(r).map(flatten).find((s) => s.position === 'absolute' && s.height === 3)).toBeUndefined();
    expect(allViews(r).map(flatten).find((s) => s.width === 8 && s.borderRadius === 4)).toBeUndefined();
    // labels en mayúsculas vía texto (la copia hacía label.toUpperCase())
    expect(textByChildren(r, 'BCV (OFICIAL)')).toBeTruthy();
    expect(textByChildren(r, 'BCV (Oficial)')).toBeUndefined();
    // fila con borde inferior en lugar de tinte
    const row = allViews(r).map(flatten).find((s) => s.borderBottomWidth === 1 && s.paddingVertical === 9);
    expect(row.borderBottomColor).toBe(C.cardBorder);
    expect(row.backgroundColor).toBeUndefined();
    // valor monocromo
    expect(flatten(textByChildren(r, 'Bs. 80,50')).color).toBe(C.textPrimary);
    // CTA outline: fondo secondary y borde primary
    const copyAll = touchableOf(textByChildren(r, 'Copiar todo'));
    expect(flatten(copyAll).backgroundColor).toBe(C.secondary);
    expect(flatten(copyAll).borderColor).toBe(C.textPrimary);
    expect(flatten(copyAll).borderWidth).toBe(1);
    // el día se muestra como texto separado por '·' (sin pastilla)
    expect(allTexts(r).filter((t) => t.props.children === '·').length).toBe(1);
    expect(textByChildren(r, 'Dom').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: C.dimmed })])
    );
    // abrir el estado "copiado" mantiene el acento del tema
    const copied = render('terminal', C, { copiedField: 'all' });
    const copiedAll = touchableOf(textByChildren(copied, '¡Copiado al portapapeles!'));
    expect(flatten(copiedAll).backgroundColor).toBe(C.textPrimary);
    expect(textByChildren(copied, '¡Copiado al portapapeles!').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: C.onAccent })])
    );
  });
});
