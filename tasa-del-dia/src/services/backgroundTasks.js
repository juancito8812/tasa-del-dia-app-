import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { fetchAllData, saveHistoricalRate, getTodayKey } from './api';

const BACKGROUND_FETCH_TASK = 'background-fetch-rates';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const data = await fetchAllData();
    if (data && (data.tasaBCV !== null || data.tasaParalelo !== null)) {
      const todayKey = getTodayKey();
      await saveHistoricalRate(todayKey, {
        bcv: data.tasaBCV,
        paralelo: data.tasaParalelo,
        binance_p2p: data.tasaBinanceP2P,
        euro: data.tasaEuro,
        fetchedAt: data.usdFetchedAt,
      });
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    if (__DEV__) console.warn('[BackgroundFetch] Task failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetchAsync() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isRegistered) return;
    return await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 60 * 60 * 4, // 4 hours
      stopOnTerminate: false, 
      startOnBoot: true,
    });
  } catch (err) {
    if (__DEV__) console.warn('[BackgroundFetch] Register failed:', err);
  }
}

export async function unregisterBackgroundFetchAsync() {
  try {
    return await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
  } catch (_err) {}
}
