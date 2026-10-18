// Registro de paquetes de UI por estilo de diseño.
// Cada paquete expone las pantallas, la tab bar y los modales de SU diseño;
// la lógica de negocio (hooks/servicios/utils) se comparte entre todos.
//
// Desde el refactor Q1 los componentes son ÚNICOS: el mismo archivo sirve los
// 4 estilos resolviendo sus diferencias visuales con un mapa `THEME_STYLES`
// indexado por `useTheme().uiStyle`. Ya no hay una copia por tema.

import RatesScreen from '../screens/RatesScreen';
import ConverterScreen from '../screens/ConverterScreen';
import BankDataScreen from '../screens/BankDataScreen';
import PayPalCalculatorScreen from '../screens/PayPalCalculatorScreen';
import HistoryScreen from '../screens/HistoryScreen';
import CustomTabBarOriginal from '../components/CustomTabBar';
import ScreenContainer from '../components/ScreenContainer';
import UpdateModal from '../components/UpdateModal';

// Terminal sí tiene su propia tab bar (se re-estila vía tokens, pero el
// componente sigue siendo específico del estilo).
import CustomTabBarTerminal from './terminal/CustomTabBar';

export const UI_STYLES = /** @type {const} */ (['original', 'terminal', 'editorial', 'fintech']);

const PACKAGES = {
  original: {
    Screens: {
      rates: RatesScreen,
      converter: ConverterScreen,
      bankData: BankDataScreen,
      paypalCalc: PayPalCalculatorScreen,
      history: HistoryScreen,
    },
    TabBar: CustomTabBarOriginal,
    ScreenContainer,
    UpdateModal,
  },
  terminal: {
    Screens: {
      rates: RatesScreen,
      converter: ConverterScreen,
      bankData: BankDataScreen,
      paypalCalc: PayPalCalculatorScreen,
      history: HistoryScreen,
    },
    TabBar: CustomTabBarTerminal,
    ScreenContainer,
    UpdateModal,
  },
  editorial: {
    Screens: {
      rates: RatesScreen,
      converter: ConverterScreen,
      bankData: BankDataScreen,
      paypalCalc: PayPalCalculatorScreen,
      history: HistoryScreen,
    },
    // Editorial y fintech reutilizan la CustomTabBar original (se re-estila vía tokens).
    TabBar: CustomTabBarOriginal,
    ScreenContainer,
    UpdateModal,
  },
  fintech: {
    Screens: {
      rates: RatesScreen,
      converter: ConverterScreen,
      bankData: BankDataScreen,
      paypalCalc: PayPalCalculatorScreen,
      history: HistoryScreen,
    },
    TabBar: CustomTabBarOriginal,
    ScreenContainer,
    UpdateModal,
  },
};

/**
 * Devuelve el paquete de componentes del estilo indicado.
 * @param {'original'|'terminal'|'editorial'|'fintech'} uiStyle
 */
export function getUiPackage(uiStyle) {
  return PACKAGES[uiStyle] ?? PACKAGES.original;
}
