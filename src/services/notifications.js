import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_NOTIFICATION_ID = 'bcv-lunes-friday-reminder';

// Configurar cómo se muestran las notificaciones en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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
 * Determina si la tasa fue ingresada hoy.
 */
function wasEnteredToday(updatedAt) {
  if (!updatedAt) return false;
  const now = new Date();
  const updated = new Date(updatedAt);
  return now.toDateString() === updated.toDateString();
}

/**
 * Programa un recordatorio semanal los viernes a las 6:00 PM.
 * Si hoy es viernes y la tasa ya fue ingresada hoy, agenda para el próximo viernes.
 *
 * @param {string|null} bcvLunesUpdatedAt - ISO timestamp de cuándo se ingresó la última tasa
 */
export async function scheduleFridayReminder(bcvLunesUpdatedAt) {
  await cancelFridayReminder();

  const granted = await requestNotificationPermissions();
  if (!granted) return false;

  const now = new Date();
  const isFriday = now.getDay() === 5;
  const alreadyEntered = isFriday && wasEnteredToday(bcvLunesUpdatedAt);

  // Si hoy es viernes y ya ingresó la tasa, el weekly trigger se disparará el próximo viernes automáticamente
  // (Expo WEEKLY usa: 1=Dom, 2=Lun, 3=Mar, 4=Mie, 5=Jue, 6=Vie, 7=Sáb)

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_NOTIFICATION_ID,
    content: {
      title: '📅 BCV (Lunes)',
      body: alreadyEntered
        ? '¿Ya viste la nueva tasa del BCV para el lunes? Recuerda revisarla en la app.'
        : 'El BCV ya publicó la tasa del lunes. ¡Ingrésala en la app!',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 6, // 6 = Viernes (Expo: 1=Dom, 7=Sáb)
      hour: 18,
      minute: 0,
      repeats: true,
    },
  });

  return true;
}

/**
 * Reagenda el recordatorio saltando esta semana si la tasa ya fue ingresada hoy.
 * Útil para llamar después de guardar la tasa un viernes.
 * Cancela la notificación para que NO dispare hoy; se re-agendará automáticamente
 * la próxima vez que se abra la app.
 */
export async function rescheduleIfEnteredToday(updatedAt) {
  const isFriday = new Date().getDay() === 5;
  if (isFriday && wasEnteredToday(updatedAt)) {
    await cancelFridayReminder();
    // La notificación se re-agendará vía ensureReminderScheduled al abrir la app
  }
}

/**
 * Verifica si el recordatorio semanal está programado. Si no lo está pero
 * la preferencia está activa, lo re-agenda. Útil para llamar al cargar la app
 * después de haber saltado una semana.
 */
export async function ensureReminderScheduled() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const hasReminder = scheduled.some(n => n.identifier === REMINDER_NOTIFICATION_ID);
    if (!hasReminder) {
      // El reminder está activo en preferencias pero no hay notif. programada → re-agendar
      await scheduleFridayReminder(null);
    }
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
