import React, { createContext, useContext } from 'react';
import useRatesData from '../hooks/useRatesData';

// Un ÚNICO useRatesData para toda la app. Antes, cada pantalla que lo usaba
// (Tasas y Calculadora PayPal) montaba su propia instancia, duplicando el
// auto-guardado del historial y el bucle de reintento offline.
const RatesContext = createContext(null);

export function RatesProvider({ children }) {
  const rates = useRatesData();
  return <RatesContext.Provider value={rates}>{children}</RatesContext.Provider>;
}

export function useRates() {
  const ctx = useContext(RatesContext);
  if (!ctx) throw new Error('useRates() debe usarse dentro de <RatesProvider>');
  return ctx;
}
