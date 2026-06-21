import Constants from 'expo-constants';
import { darkTheme, lightTheme } from './themes';
export { darkTheme, lightTheme };

const apiKeyFromConfig = Constants.expoConfig?.extra?.apiKey;

if (!apiKeyFromConfig || apiKeyFromConfig === 'undefined') {
  throw new Error('COTIZAVE_API_KEY no está configurada en .env');
}

export const API_CONFIG = {
  BASE_URL: 'https://api.cotizave.com',
  API_KEY: apiKeyFromConfig, // ← debe estar en .env, ver .env.example
  REFRESH_INTERVAL: 12 * 60 * 60 * 1000, // 12 horas
};

