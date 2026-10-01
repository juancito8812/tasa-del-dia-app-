// 🔤 Tipografías del estilo FINTECH — sans + mono geométricas:
//   --font-sans: "Space Grotesk"  ·  --font-mono: "JetBrains Mono"
// Se cargan perezosamente al montar el primer componente del paquete; mientras
// cargan (o si la carga falla) las pantallas caen a la fuente del sistema.
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

/**
 * Devuelve FONT cuando las tipografías están listas; un objeto vacío
 * (→ fuente del sistema) mientras cargan o si la carga falla.
 */
export function useFintechFonts() {
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
  return loaded ? FONT : SYSTEM_FALLBACK;
}
