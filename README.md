# 🇻🇪 Tasa del Día — App Android

Aplicación Android para consultar las tasas de cambio del Bolívar Venezolano: **BCV oficial**, **Euro (BCV)** y **Binance P2P**. Incluye conversor de Bs ↔ USD.

## ✨ Funcionalidades

- **📊 Tasas en vivo**: BCV (oficial), Euro (BCV) y Binance P2P
- **🔄 Actualización automática**: cada 25 minutos + pull-to-refresh
- **💱 Conversor**: convierte entre Bolívares y Dólares usando cualquiera de las 3 tasas
- **📱 Diseño moderno**: UI oscura, cards con íconos, animaciones suaves

## 🚀 Requisitos

- [Node.js](https://nodejs.org/) (v18 o superior)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/download/win) (opcional)
- Un teléfono Android con [Expo Go](https://expo.dev/go) para pruebas

## 📦 Instalación

```bash
# 1. Instalar Expo CLI globalmente
npm install -g expo-cli

# 2. Navegar al proyecto
cd tasa-del-dia

# 3. Instalar dependencias
npm install

# 4. Iniciar el servidor de desarrollo
npx expo start
```

## 📱 Probar en Android

1. Instala **Expo Go** desde Google Play Store
2. Escanea el código QR que aparece en la terminal
3. ¡Listo! La app se cargará en tu teléfono

## 🔨 Build para producción (APK)

```bash
# Generar APK para Android
npx expo build:android
```

O usando EAS Build (recomendado):

```bash
npm install -g eas-cli
eas build --platform android --profile preview
```

## 🔐 API Key

La API Key de CotizaVE ya está incluida en el código. Si necesitas cambiarla en el futuro, edita el archivo:

```
src/constants/index.js → API_CONFIG.API_KEY
```

## 📁 Estructura del proyecto

```
tasa-del-dia/
├── App.js                    # Punto de entrada + navegación
├── app.json                  # Configuración Expo
├── package.json              # Dependencias
├── src/
│   ├── constants/
│   │   └── index.js          # Colores + configuración API
│   ├── services/
│   │   └── api.js            # Llamadas a CotizaVE API
│   ├── components/
│   │   └── RateCard.js       # Componente de tarjeta de tasa
│   └── screens/
│       ├── RatesScreen.js    # Pantalla de tasas
│       └── ConverterScreen.js # Pantalla de conversión
└── README.md
```

## 🧰 Stack técnico

- **React Native** (Expo SDK 52)
- **React Navigation** (Bottom Tabs)
- **CotizaVE API** (BCV, Euro, Binance P2P)
- **Ionicons** para íconos

## 📄 Licencia

Uso personal.
