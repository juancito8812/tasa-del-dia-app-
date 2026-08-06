import * as Haptics from 'expo-haptics';

/**
 * Feedback táctil ligero — para presses, tabs y micro-interacciones.
 * No lanza errores si el dispositivo no soporta haptics.
 */
export function hapticLight() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

/**
 * Feedback táctil medio — para acciones de confirmación (convertir, copiar).
 */
export function hapticMedium() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
}

/**
 * Feedback de éxito — para operaciones completadas (guardar, copiado).
 */
export function hapticSuccess() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}

/**
 * Selección — para toggles y cambios de modo.
 */
export function hapticSelection() {
  try {
    Haptics.selectionAsync();
  } catch {}
}
