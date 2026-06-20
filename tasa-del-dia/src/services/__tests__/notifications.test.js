import * as Notifications from 'expo-notifications';
import {
  scheduleFridayReminder,
  cancelFridayReminder,
  rescheduleIfEnteredToday,
  ensureReminderScheduled,
  requestNotificationPermissions,
} from '../notifications';

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

      const result = await scheduleFridayReminder(null);

      expect(result).toBe(false);
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('schedules weekly notification for Friday at 6 PM', async () => {
      Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValueOnce([]);

      const result = await scheduleFridayReminder(null);

      expect(result).toBe(true);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          identifier: 'bcv-lunes-friday-reminder',
          trigger: expect.objectContaining({
            weekday: 6,
            hour: 18,
            minute: 0,
            repeats: true,
          }),
        })
      );
    });

    it('cancels existing reminder before scheduling new one', async () => {
      Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
      // Simulate that a reminder already exists
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValueOnce([
        { identifier: 'bcv-lunes-friday-reminder' },
      ]);

      await scheduleFridayReminder(null);

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        'bcv-lunes-friday-reminder'
      );
    });

    it('schedules with "already entered" message when entered today on Friday', async () => {
      Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
      Notifications.getAllScheduledNotificationsAsync.mockResolvedValueOnce([]);
      const today = new Date().toISOString();

      // Force today to be Friday for the test
      const originalGetDay = Date.prototype.getDay;
      Date.prototype.getDay = jest.fn().mockReturnValue(5); // Friday

      await scheduleFridayReminder(today);

      Date.prototype.getDay = originalGetDay;

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: '📅 BCV (Lunes)',
          }),
        })
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

  describe('rescheduleIfEnteredToday', () => {
    it('cancels reminder if today is Friday and rate was entered today', async () => {
      const originalGetDay = Date.prototype.getDay;
      Date.prototype.getDay = jest.fn().mockReturnValue(5); // Friday

      await rescheduleIfEnteredToday(new Date().toISOString());

      Date.prototype.getDay = originalGetDay;

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        'bcv-lunes-friday-reminder'
      );
    });

    it('does nothing if today is not Friday', async () => {
      const originalGetDay = Date.prototype.getDay;
      Date.prototype.getDay = jest.fn().mockReturnValue(3); // Wednesday

      await rescheduleIfEnteredToday(new Date().toISOString());

      Date.prototype.getDay = originalGetDay;

      expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    });

    it('does nothing if rate was not entered today', async () => {
      const originalGetDay = Date.prototype.getDay;
      Date.prototype.getDay = jest.fn().mockReturnValue(5); // Friday

      await rescheduleIfEnteredToday('2025-01-01T00:00:00.000Z'); // Yesterday

      Date.prototype.getDay = originalGetDay;

      expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
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
