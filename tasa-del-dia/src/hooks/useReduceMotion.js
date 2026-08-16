import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Lee la preferencia de accesibilidad "reducir movimiento" del sistema.
 * Útil para desactivar springs y animaciones decorativas en usuarios que
 * lo prefieren (accesibilidad, tendencia 2026).
 */
export default function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduceMotion;
}
