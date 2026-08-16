import { Platform } from 'react-native';
import {
  compareVersions,
  isUpdateAvailable,
  getCurrentVersion,
  downloadAndInstall,
} from '../autoUpdate';

describe('autoUpdate - Pure Functions', () => {
  describe('compareVersions', () => {
    it('should return 0 for equal versions', () => {
      expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
      expect(compareVersions('2.5.3', '2.5.3')).toBe(0);
      expect(compareVersions('0.0.0', '0.0.0')).toBe(0);
    });

    it('should return -1 when first version is lower', () => {
      expect(compareVersions('1.0.0', '1.0.1')).toBe(-1);
      expect(compareVersions('1.0.0', '1.1.0')).toBe(-1);
      expect(compareVersions('1.0.0', '2.0.0')).toBe(-1);
      expect(compareVersions('0.9.9', '1.0.0')).toBe(-1);
    });

    it('should return 1 when first version is higher', () => {
      expect(compareVersions('1.0.1', '1.0.0')).toBe(1);
      expect(compareVersions('1.1.0', '1.0.0')).toBe(1);
      expect(compareVersions('2.0.0', '1.9.9')).toBe(1);
    });

    it('should handle versions with different segment lengths', () => {
      expect(compareVersions('1.0', '1.0.0')).toBe(0);
      expect(compareVersions('1.0', '1.0.1')).toBe(-1);
      expect(compareVersions('1.0.1', '1.0')).toBe(1);
      expect(compareVersions('2', '1.9.9')).toBe(1);
    });

    it('should treat missing segments as 0', () => {
      expect(compareVersions('1.0.0', '1.0')).toBe(0);
      expect(compareVersions('1.0.1', '1.0')).toBe(1);
      expect(compareVersions('1.0', '1.0.1')).toBe(-1);
    });

    it('should treat empty strings as all-zero segments', () => {
      expect(compareVersions('', '')).toBe(0);
      expect(compareVersions('', '0.0.0')).toBe(0);
      expect(compareVersions('0.0.0', '')).toBe(0);
    });
  });

  describe('isUpdateAvailable', () => {
    it('should return true when current is lower than latest', () => {
      expect(isUpdateAvailable('1.0.0', '1.0.1')).toBe(true);
      expect(isUpdateAvailable('0.9.0', '1.0.0')).toBe(true);
    });

    it('should return false when versions are equal', () => {
      expect(isUpdateAvailable('1.0.0', '1.0.0')).toBe(false);
    });

    it('should return false when current is higher than latest', () => {
      expect(isUpdateAvailable('1.0.1', '1.0.0')).toBe(false);
    });

    it('should return false when inputs are null or undefined', () => {
      expect(isUpdateAvailable(null, '1.0.0')).toBe(false);
      expect(isUpdateAvailable('1.0.0', null)).toBe(false);
      expect(isUpdateAvailable(undefined, '1.0.0')).toBe(false);
      expect(isUpdateAvailable('1.0.0', undefined)).toBe(false);
      expect(isUpdateAvailable('', '1.0.0')).toBe(false);
      expect(isUpdateAvailable('1.0.0', '')).toBe(false);
    });
  });

  describe('getCurrentVersion', () => {
    it('should return the version from expo-constants', () => {
      const version = getCurrentVersion();
      expect(version).toBe('1.0.1');
      expect(typeof version).toBe('string');
    });

    it('should match the expected semver format', () => {
      const version = getCurrentVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});

describe('downloadAndInstall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { File } = require('expo-file-system');
    File.downloadFileAsync.mockResolvedValue(new File('/mock/cache/app.apk'));
    File.sizeFn = () => 0; // por defecto la descarga no avanza
  });

  it('abre el instalador con FLAG_GRANT_READ_URI_PERMISSION (flags: 1) usando la API moderna', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const { startActivityAsync } = require('expo-intent-launcher');
    const { File } = require('expo-file-system');

    const ok = await downloadAndInstall('https://example.com/app.apk');

    expect(ok).toBe(true);
    expect(File.downloadFileAsync).toHaveBeenCalledWith(
      'https://example.com/app.apk',
      expect.any(File),
      { idempotent: true },
    );
    expect(startActivityAsync).toHaveBeenCalledWith(
      'android.intent.action.INSTALL_PACKAGE',
      {
        data: 'content://mock/app.apk',
        type: 'application/vnd.android.package-archive',
        flags: 1,
      },
    );
  });

  it('reporta progreso por callback cuando la descarga avanza', async () => {
    jest.useFakeTimers();
    try {
      jest.replaceProperty(Platform, 'OS', 'android');
      const { File } = require('expo-file-system');
      const onProgress = jest.fn();
      File.downloadFileAsync.mockReturnValue(new Promise(() => {}));
      let bytes = 0;
      File.sizeFn = () => (bytes += 1024 * 1024); // crece 1 MB por poll

      const promise = downloadAndInstall('https://example.com/app.apk', onProgress);
      await jest.advanceTimersByTimeAsync(10000);

      expect(onProgress.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(onProgress).toHaveBeenLastCalledWith(expect.any(Number));
      expect(promise).toBeInstanceOf(Promise);
    } finally {
      jest.useRealTimers();
    }
  });

  it('cae al navegador si la descarga falla (reject)', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const { File } = require('expo-file-system');
    const { openURL } = require('expo-linking');
    File.downloadFileAsync.mockRejectedValue(new Error('network error'));

    const ok = await downloadAndInstall('https://example.com/app.apk');

    expect(ok).toBe(true);
    expect(openURL).toHaveBeenCalledWith('https://example.com/app.apk');
  });

  it('cae al navegador si la descarga se cuelga (watchdog anti-stall)', async () => {
    jest.useFakeTimers();
    try {
      jest.replaceProperty(Platform, 'OS', 'android');
      const { File } = require('expo-file-system');
      const { openURL } = require('expo-linking');
      // La descarga nunca resuelve ni avanza: debe disparar el watchdog (45s)
      File.downloadFileAsync.mockReturnValue(new Promise(() => {}));

      const promise = downloadAndInstall('https://example.com/app.apk');
      await jest.advanceTimersByTimeAsync(50000);

      await expect(promise).resolves.toBe(true);
      expect(openURL).toHaveBeenCalledWith('https://example.com/app.apk');
    } finally {
      jest.useRealTimers();
    }
  });

  it('devuelve false sin abrir nada si no hay URL', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    const { startActivityAsync } = require('expo-intent-launcher');

    const ok = await downloadAndInstall(null);

    expect(ok).toBe(false);
    expect(startActivityAsync).not.toHaveBeenCalled();
  });

  it('devuelve false en plataformas que no son Android', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    const { startActivityAsync } = require('expo-intent-launcher');

    const ok = await downloadAndInstall('https://example.com/app.apk');

    expect(ok).toBe(false);
    expect(startActivityAsync).not.toHaveBeenCalled();
  });
});
