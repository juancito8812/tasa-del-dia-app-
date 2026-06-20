import Constants from 'expo-constants';
import { darkTheme, lightTheme } from './themes';
export { darkTheme, lightTheme };

// Default export for backward compatibility (dark theme)
export const COLORS = { ...darkTheme };

const apiKeyFromConfig = Constants.expoConfig?.extra?.apiKey;

if (!apiKeyFromConfig) {
  console.warn('⚠️  COTIZAVE_API_KEY no definida — crea un archivo .env con COTIZAVE_API_KEY=tu_api_key (ver .env.example)');
}

export const API_CONFIG = {
  BASE_URL: 'https://api.cotizave.com',
  API_KEY: apiKeyFromConfig, // ← debe estar en .env, ver .env.example
  REFRESH_INTERVAL: 20 * 60 * 1000, // 20 minutes
};

