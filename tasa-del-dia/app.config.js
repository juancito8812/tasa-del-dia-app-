// Versión semver única. El release workflow (release-automatic.yml) la bumpa
// vía sed sobre esta línea (formato: const VERSION = 'x.y.z').
const VERSION = '1.4.2';

// versionCode Android derivado de la versión: 1.4.2 → 10402.
// Debe CRECER en cada release para poder publicar en Play Store.
// (Antes EAS auto-generaba el mismo código para todas las versiones, lo que
// bloqueaba subir builds nuevos a Google Play.)
const ANDROID_VERSION_CODE = (() => {
  const [major, minor, patch] = VERSION.split('.').map(Number);
  return major * 10000 + minor * 100 + patch;
})();

module.exports = {
  expo: {
    name: "Tasa del Día",
    slug: "tasa-del-dia",
    version: VERSION,
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      backgroundColor: "#1a1a2e",
    },
    assetBundlePatterns: [
      "**/*",
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.tasadeldia.app",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      icon: "./assets/icon.png",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon-foreground.png",
        backgroundColor: "#1a1a2e",
      },
      package: "com.tasadeldia.app",
      versionCode: ANDROID_VERSION_CODE,
      permissions: ['POST_NOTIFICATIONS', 'REQUEST_INSTALL_PACKAGES'],
    },
    plugins: [
      "expo-asset",
      "expo-font",
      "@react-native-community/datetimepicker",
      [
        "expo-build-properties",
        {
          android: {
            newArchEnabled: true,
            hermesEnabled: true,
            compileSdkVersion: 36,
            targetSdkVersion: 36,
            minSdkVersion: 24,
            usesCleartextTraffic: false,
          },
          ios: {
            newArchEnabled: true,
          },
        },
      ],
    ],
    extra: {
      eas: {
        projectId: "375b5dea-0adb-4c9b-85c6-a932ef737bf2",
      },
    },
  },
};
