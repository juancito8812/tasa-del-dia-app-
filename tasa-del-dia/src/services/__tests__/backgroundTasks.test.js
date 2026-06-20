import * as BackgroundFetch from 'expo-background-fetch';
import {
  registerBackgroundFetchAsync,
  unregisterBackgroundFetchAsync,
} from '../backgroundTasks';

describe('backgroundTasks service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerBackgroundFetchAsync', () => {
    it('registers the background fetch task', async () => {
      await registerBackgroundFetchAsync();

      expect(BackgroundFetch.registerTaskAsync).toHaveBeenCalledWith(
        'background-fetch-rates',
        expect.objectContaining({
          minimumInterval: expect.any(Number),
          stopOnTerminate: false,
          startOnBoot: true,
        })
      );
    });

    it('uses 4 hour minimum interval', async () => {
      await registerBackgroundFetchAsync();

      expect(BackgroundFetch.registerTaskAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          minimumInterval: 60 * 60 * 4,
        })
      );
    });

    it('handles registration errors gracefully', async () => {
      BackgroundFetch.registerTaskAsync.mockRejectedValueOnce(new Error('register failed'));

      // Should not throw, just return undefined
      const result = await registerBackgroundFetchAsync();
      expect(result).toBeUndefined();
    });

    it('handles non-Error rejections gracefully', async () => {
      BackgroundFetch.registerTaskAsync.mockRejectedValueOnce('string error');

      const result = await registerBackgroundFetchAsync();
      expect(result).toBeUndefined();
    });
  });

  describe('unregisterBackgroundFetchAsync', () => {
    it('unregisters the background fetch task', async () => {
      await unregisterBackgroundFetchAsync();

      expect(BackgroundFetch.unregisterTaskAsync).toHaveBeenCalledWith(
        'background-fetch-rates'
      );
    });

    it('handles unregistration errors gracefully', async () => {
      BackgroundFetch.unregisterTaskAsync.mockRejectedValueOnce(new Error('unregister failed'));

      const result = await unregisterBackgroundFetchAsync();
      expect(result).toBeUndefined();
    });
  });
});
