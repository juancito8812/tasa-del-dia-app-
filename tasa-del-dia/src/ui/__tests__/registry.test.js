import { getUiPackage, UI_STYLES } from '../index';

// Varios componentes se exportan envueltos en React.memo (objeto con $$typeof),
// así que validamos "tipo de componente React válido", no solo función.
const isReactComponent = (component) =>
  typeof component === 'function' ||
  (typeof component === 'object' && component !== null && Boolean(component.$$typeof));

describe('registro de estilos de UI', () => {
  it('declara exactamente los 3 estilos', () => {
    expect([...UI_STYLES]).toEqual(['original', 'terminal', 'editorial']);
  });

  it.each(UI_STYLES)('resuelve el paquete completo para %s', (style) => {
    const pkg = getUiPackage(style);
    expect(isReactComponent(pkg.Screens.rates)).toBe(true);
    expect(isReactComponent(pkg.Screens.converter)).toBe(true);
    expect(isReactComponent(pkg.Screens.history)).toBe(true);
    expect(isReactComponent(pkg.TabBar)).toBe(true);
    expect(isReactComponent(pkg.ScreenContainer)).toBe(true);
    expect(isReactComponent(pkg.UpdateModal)).toBe(true);
  });

  it('cae al paquete original ante un estilo desconocido', () => {
    const fallback = getUiPackage(/** @type {any} */ ('no-existe'));
    const original = getUiPackage('original');
    expect(fallback.Screens.rates).toBe(original.Screens.rates);
    expect(fallback.TabBar).toBe(original.TabBar);
  });
});
