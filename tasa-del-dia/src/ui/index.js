// Registro de paquetes de UI por estilo de diseño.
// Cada paquete expone las pantallas, la tab bar y los modales de SU diseño;
// la lógica de negocio (hooks/servicios/utils) se comparte entre los tres.

import RatesScreenOriginal from '../screens/RatesScreen';
import ConverterScreenOriginal from '../screens/ConverterScreen';
import BankDataScreenOriginal from '../screens/BankDataScreen';
import PayPalCalculatorScreenOriginal from '../screens/PayPalCalculatorScreen';
import HistoryScreenOriginal from '../screens/HistoryScreen';
import CustomTabBarOriginal from '../components/CustomTabBar';
import ScreenContainerOriginal from '../components/ScreenContainer';
import UpdateModalOriginal from '../components/UpdateModal';

import RatesScreenTerminal from './terminal/RatesScreen';
import ConverterScreenTerminal from './terminal/ConverterScreen';
import HistoryScreenTerminal from './terminal/HistoryScreen';
import CustomTabBarTerminal from './terminal/CustomTabBar';
import ScreenContainerTerminal from './terminal/ScreenContainer';
import UpdateModalTerminal from './terminal/UpdateModal';

// Editorial reutiliza la CustomTabBar original (no la reescribió):
// se re-estila sola vía tokens.
import RatesScreenEditorial from './editorial/RatesScreen';
import ConverterScreenEditorial from './editorial/ConverterScreen';
import HistoryScreenEditorial from './editorial/HistoryScreen';
import ScreenContainerEditorial from './editorial/ScreenContainer';
import UpdateModalEditorial from './editorial/UpdateModal';

export const UI_STYLES = /** @type {const} */ (['original', 'terminal', 'editorial']);

const PACKAGES = {
  original: {
    Screens: {
      rates: RatesScreenOriginal,
      converter: ConverterScreenOriginal,
      bankData: BankDataScreenOriginal,
      paypalCalc: PayPalCalculatorScreenOriginal,
      history: HistoryScreenOriginal,
    },
    TabBar: CustomTabBarOriginal,
    ScreenContainer: ScreenContainerOriginal,
    UpdateModal: UpdateModalOriginal,
  },
  terminal: {
    Screens: {
      rates: RatesScreenTerminal,
      converter: ConverterScreenTerminal,
      bankData: BankDataScreenOriginal,
      paypalCalc: PayPalCalculatorScreenOriginal,
      history: HistoryScreenTerminal,
    },
    TabBar: CustomTabBarTerminal,
    ScreenContainer: ScreenContainerTerminal,
    UpdateModal: UpdateModalTerminal,
  },
  editorial: {
    Screens: {
      rates: RatesScreenEditorial,
      converter: ConverterScreenEditorial,
      bankData: BankDataScreenOriginal,
      paypalCalc: PayPalCalculatorScreenOriginal,
      history: HistoryScreenEditorial,
    },
    TabBar: CustomTabBarOriginal,
    ScreenContainer: ScreenContainerEditorial,
    UpdateModal: UpdateModalEditorial,
  },
};

/**
 * Devuelve el paquete de componentes del estilo indicado.
 * @param {'original'|'terminal'|'editorial'} uiStyle
 */
export function getUiPackage(uiStyle) {
  return PACKAGES[uiStyle] ?? PACKAGES.original;
}
