import { darkTheme, lightTheme } from './themes';
export { darkTheme, lightTheme };

// Default export for backward compatibility (dark theme)
export const COLORS = { ...darkTheme };

export const API_CONFIG = {
  BASE_URL: 'https://api.cotizave.com',
  API_KEY: 'ctz_live_64Nym3Qa8PZixs5TsZ1UahDDJWMkG6hpVt4oka',
  REFRESH_INTERVAL: 25 * 60 * 1000, // 25 minutes
};

