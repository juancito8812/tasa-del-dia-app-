// 🔤 Tipografías del estilo FINTECH — sans + mono geométricas:
//   --font-sans: "Space Grotesk"  ·  --font-mono: "JetBrains Mono"
// Se cargan UNA sola vez en FintechFontsProvider (envuelve las pantallas vía
// ScreenContainer) y se reparten por contexto. Antes cada componente llamaba
// useFonts por su cuenta (9 suscripciones).
import React, { createContext, useContext } from 'react';
import { useFonts } from 'expo-font';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

/** Familias listas para `fontFamily: F.monoSemiBold`. */
export const FONT = {
  sans: 'SpaceGrotesk_400Regular',
  sansMedium: 'SpaceGrotesk_500Medium',
  sansSemiBold: 'SpaceGrotesk_600SemiBold',
  sansBold: 'SpaceGrotesk_700Bold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoSemiBold: 'JetBrainsMono_600SemiBold',
  monoBold: 'JetBrainsMono_700Bold',
};

// Referencia estable: mientras cargan las fuentes devolvemos esto (→ sistema).
const SYSTEM_FALLBACK = /** @type {Record<string, string|undefined>} */ ({});

const FintechFontsContext = createContext(null);

/**
 * Carga las tipografías fintech una sola vez y las comparte por contexto.
 */
export function FintechFontsProvider({ children }) {
  const [loaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
  });
  const value = loaded ? FONT : SYSTEM_FALLBACK;
  return (
    <FintechFontsContext.Provider value={value}>
      {children}
    </FintechFontsContext.Provider>
  );
}

/**
 * Devuelve FONT cuando las tipografías están listas; un objeto vacío
 * (→ fuente del sistema) fuera del provider o mientras cargan.
 */
export function useFintechFonts() {
  return useContext(FintechFontsContext) ?? SYSTEM_FALLBACK;
}
