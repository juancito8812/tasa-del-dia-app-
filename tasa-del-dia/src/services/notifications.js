import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getReminderEnabled } from './api';

const REMINDER_NOTIFICATION_ID = 'bcv-lunes-friday-reminder';

// Configurar cómo se muestran las notificaciones en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Solicita permisos de notificación.
 */
export async function requestNotificationPermissions() {
  if (Platform.OS === 'android') {
    // Android requiere un canal de notificación
    await Notifications.setNotificationChannelAsync('bcv-lunes', {
      name: 'BCV Lunes',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Programa un recordatorio SEMANAL recurrente los viernes a las 6:00 PM.
 * Usa el trigger WEEKLY (weekday 1-7, 1 = domingo) para que se repita solo
 * cada semana sin depender de que el usuario vuelva a abrir la app.
 */
export async function scheduleFridayReminder() {
  const granted = await requestNotificationPermissions();
  if (!granted) return false;

  // Solo cancelar la existente si vamos a crear una nueva
  // (evita error innecesario si no hay notificación previa)
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const hasExisting = scheduled.some(n => n.identifier === REMINDER_NOTIFICATION_ID);
    if (hasExisting) {
      await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
    }
  } catch {}

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_NOTIFICATION_ID,
    content: {
      title: 'BCV (Lunes)',
      body: 'El BCV ya publicó la tasa del lunes. ¡Ingrésala en la app!',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 6, // viernes (1 = domingo, 7 = sábado)
      hour: 18,
      minute: 0,
    },
  });

  return true;
}

/**
 * Verifica si el recordatorio semanal está programado. Si no lo está pero
 * la preferencia está activa, lo re-agenda. Útil para llamar al cargar la app
 * después de haber saltado una semana.
 */
export async function ensureReminderScheduled() {
  try {
    const enabled = await getReminderEnabled();
    if (!enabled) return;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const hasReminder = scheduled.some(n => n.identifier === REMINDER_NOTIFICATION_ID);
    if (!hasReminder) await scheduleFridayReminder();
  } catch {}
}

/**
 * Cancela el recordatorio de los viernes.
 */
export async function cancelFridayReminder() {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
  } catch {}
}
