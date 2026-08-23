import React, { createContext, useContext, useMemo } from 'react';
import Constants from 'expo-constants';

const DistributionContext = createContext({
  isGalaxyStore: false,
  isDirectInstall: true,
});

/**
 * Detects the distribution channel based on the installer package name.
 * Galaxy Store installs report "com.sec.android.app.samsungapps" as installer.
 * Direct APK installs report null or unknown installer.
 */
function getDistributionChannel() {
  try {
    const androidConfig = Constants.expoConfig?.android;
    const manifestAndroid = Constants.manifest?.android;
    const installerPackageName = (androidConfig && androidConfig['installerPackageName'])
      || (manifestAndroid && manifestAndroid['installerPackageName'])
      || null;

    const isGalaxyStore = installerPackageName === 'com.sec.android.app.samsungapps';

    return {
      isGalaxyStore,
      isDirectInstall: !isGalaxyStore,
    };
  } catch {
    return { isGalaxyStore: false, isDirectInstall: true };
  }
}

export function DistributionProvider({ children }) {
  const value = useMemo(() => getDistributionChannel(), []);

  return (
    <DistributionContext.Provider value={value}>
      {children}
    </DistributionContext.Provider>
  );
}

export function useDistribution() {
  return useContext(DistributionContext);
}
