require('dotenv').config();

module.exports = {
  expo: {
    name: "Tasa del Día",
    slug: "tasa-del-dia",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
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
      permissions: [],
    },
    plugins: [
      "expo-asset",
      "expo-font",
      [
        "expo-build-properties",
        {
          android: {
            newArchEnabled: true,
            hermesEnabled: true,
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            minSdkVersion: 24,
          },
          ios: {
            newArchEnabled: true,
          },
        },
      ],
    ],
    extra: {
      apiKey: process.env.COTIZAVE_API_KEY,
      eas: {
        projectId: "375b5dea-0adb-4c9b-85c6-a932ef737bf2",
      },
    },
  },
};
