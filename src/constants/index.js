import Constants from 'expo-constants';
import { darkTheme, lightTheme } from './themes';
export { darkTheme, lightTheme };

// Default export for backward compatibility (dark theme)
export const COLORS = { ...darkTheme };

const apiKeyFromConfig = Constants.expoConfig?.extra?.apiKey;

if (!apiKeyFromConfig) {
  console.warn('⚠️  COTIZAVE_API_KEY no definida en .env — usando fallback');
}

export const API_CONFIG = {
  BASE_URL: 'https://api.cotizave.com',
  API_KEY: apiKeyFromConfig || 'ctz_live_64Nym3Qa8PZixs5TsZ1UahDDJWMkG6hpVt4oka',
  REFRESH_INTERVAL: 20 * 60 * 1000, // 20 minutes — auto-refresh optimizado
};

