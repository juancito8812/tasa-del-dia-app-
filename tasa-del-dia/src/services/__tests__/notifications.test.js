import * as Notifications from 'expo-notifications';
import {
  scheduleFridayReminder,
  cancelFridayReminder,
  ensureReminderScheduled,
  requestNotificationPermissions,
} from '../notifications';

jest.mock('../api', () => ({
  getReminderEnabled: jest.fn().mockResolvedValue(true),
}));

describe('notifications service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestNotificationPermissions', () => {
    it('requests permissions and returns true when granted', async () => {
      Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });

      const result = await requestNotificationPermissions();

      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    });

    it('returns false when permissions denied', async () => {
      Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

      const result = await requestNotificationPermissions();

      expect(result).toBe(false);
    });
  });

  describe('scheduleFridayReminder', () => {
    it('returns false when permissions not granted', async () => {
      Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

      const result = await scheduleFridayReminder();

      expect(result).toBe(false);
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('schedules a repeating weekly reminder for Friday at 6 PM', async () => {
      Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValueOnce([]);

      const result = await scheduleFridayReminder();

      expect(result).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'bcv-lunes-friday-reminder',
          content: expect.objectContaining({
            title: 'BCV (Lunes)',
          }),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: 6, // viernes (1 = domingo)
            hour: 18,
            minute: 0,
          },
        })
      );
    });

    it('cancels existing reminder before scheduling new one', async () => {
      Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
      // Simulate that a reminder already exists
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValueOnce([
        { identifier: 'bcv-lunes-friday-reminder' },
      ]);

      await scheduleFridayReminder();

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        'bcv-lunes-friday-reminder'
      );
    });
  });

  describe('cancelFridayReminder', () => {
    it('cancels the scheduled notification', async () => {
      await cancelFridayReminder();

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        'bcv-lunes-friday-reminder'
      );
    });

    it('does not throw on error', async () => {
      Notifications.cancelScheduledNotificationAsync.mockRejectedValueOnce(new Error('fail'));

      // Should not throw
      await expect(cancelFridayReminder()).resolves.toBeUndefined();
    });
  });

  describe('ensureReminderScheduled', () => {
    it('reschedules reminder if not found but preference is active', async () => {
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValueOnce([]);

      await ensureReminderScheduled();

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('does not reschedule if reminder already exists', async () => {
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValueOnce([
        { identifier: 'bcv-lunes-friday-reminder' },
      ]);

      await ensureReminderScheduled();

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });
});
