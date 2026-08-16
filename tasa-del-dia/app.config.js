module.exports = {
  expo: {
    name: "Tasa del Día",
    slug: "tasa-del-dia",
    version: "1.3.1",
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
