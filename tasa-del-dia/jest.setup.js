import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Reanimated 4: usar el mock oficial en tests (los animadores reales no corren bajo jest)
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// AccessibilityInfo: listener inerte para que useReduceMotion no deje handles abiertos
jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => ({
  __esModule: true,
  default: {
    isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
    addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  },
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
    Soft: 'soft',
    Rigid: 'rigid',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

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

// Mock expo-linear-gradient (evita timers/handles del módulo nativo en tests)
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, style, colors, ...props }) =>
      React.createElement(View, { style, ...props }, children),
  };
});

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

// Mock expo-intent-launcher (usado por autoUpdate para abrir el instalador)
jest.mock('expo-intent-launcher', () => ({
  startActivityAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock expo-file-system: autoUpdate.js usa la API moderna (File/Paths) desde 1.4.3
class MockFile {
  // Los tests pueden simular una descarga que avanza cambiando sizeFn
  static sizeFn = () => 0;

  constructor(...parts) {
    this.uri = parts.join('/').replace(/\/+/g, '/');
    this.contentUri = 'content://mock/app.apk';
  }

  get exists() {
    return true;
  }

  get size() {
    return MockFile.sizeFn();
  }
}
MockFile.downloadFileAsync = jest
  .fn()
  .mockResolvedValue(new MockFile('/mock/cache/app.apk'));

const mockExpoFileSystem = {
  File: MockFile,
  Paths: { cache: '/mock/cache/', document: '/mock/docs/' },
};

// Mock expo-file-system/legacy (sin uso desde 1.4.3, se mantiene por compat)
const mockExpoFileSystemLegacy = {
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
jest.mock('expo-file-system/legacy', () => mockExpoFileSystemLegacy);

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
