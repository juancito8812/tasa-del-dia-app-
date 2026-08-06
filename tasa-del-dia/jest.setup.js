import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock expo-constants for API_CONFIG
jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '1.0.1',
    extra: {
      apiKey: 'MOCK_API_KEY_FOR_TESTS',
    },
  },
  manifest: {},
  linkingUri: '',
  executionEnvironment: 'storeClient',
  statusBarHeight: 0,
  deviceName: 'test',
  deviceYearClass: 2024,
  getWebViewUserAgentAsync: () => 'test',
  isDevice: true,
  platform: { android: { versionCode: 1 } },
  systemFonts: [],
}));

// Mock @expo/vector-icons
const MockIonicons = (props) => {
  const React = require('react');
  const { View } = require('react-native');
  return React.createElement(View, props);
};

jest.mock('@expo/vector-icons', () => ({
  Ionicons: MockIonicons,
}));

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue(undefined),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  SchedulableTriggerInputTypes: {
    WEEKLY: 'weekly',
    DAILY: 'daily',
  },
  AndroidImportance: {
    HIGH: 'high',
    DEFAULT: 'default',
    LOW: 'low',
  },
}));

// Mock expo-background-fetch
jest.mock('expo-background-fetch', () => ({
  registerTaskAsync: jest.fn().mockResolvedValue(undefined),
  unregisterTaskAsync: jest.fn().mockResolvedValue(undefined),
  BackgroundFetchResult: {
    NewData: 'NewData',
    NoData: 'NoData',
    Failed: 'Failed',
  },
  BackgroundFetchStatus: {
    Available: 1,
    Denied: 2,
    Restricted: 3,
  },
}));

// Mock expo-task-manager
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn().mockResolvedValue(false),
  registerTaskAsync: jest.fn().mockResolvedValue(undefined),
  unregisterTaskAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  getStringAsync: jest.fn().mockResolvedValue(''),
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-linking
jest.mock('expo-linking', () => ({
  openURL: jest.fn().mockResolvedValue(undefined),
  createURL: jest.fn().mockReturnValue('test-url'),
  useURL: jest.fn().mockReturnValue(null),
  useLatestURL: jest.fn().mockReturnValue(null),
}));

// Mock expo-file-system (y su subpath /legacy, usado por autoUpdate.js)
const mockExpoFileSystem = {
  cacheDirectory: '/mock/cache/',
  documentDirectory: '/mock/docs/',
  createDownloadResumable: jest.fn().mockReturnValue({
    downloadAsync: jest.fn().mockResolvedValue({ uri: '/mock/cache/app.apk' }),
  }),
  getContentUriAsync: jest.fn().mockResolvedValue('content://mock/app.apk'),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  StorageAccessFramework: {
    requestDirectoryPermissionsAsync: jest.fn(),
  },
};

jest.mock('expo-file-system', () => mockExpoFileSystem);
jest.mock('expo-file-system/legacy', () => mockExpoFileSystem);

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => insets,
    initialWindowMetrics: {
      insets,
      frame: { x: 0, y: 0, width: 390, height: 844 },
    },
  };
});
