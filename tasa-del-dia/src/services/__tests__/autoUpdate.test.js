import { compareVersions, isUpdateAvailable, getCurrentVersion } from '../autoUpdate';

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
