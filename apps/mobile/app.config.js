const IS_EAS_BUILD = process.env.EAS_BUILD === 'true'
const PROJECT_ID = '0a5e7cbd-b02d-4130-9f00-f8f50bf33adf'

module.exports = {
  expo: {
    name: 'Hagu',
    slug: 'hagu',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    scheme: 'hagu',
    newArchEnabled: false,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0a0a0a',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.hagu.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0a0a0a',
      },
      package: 'com.hagu.app',
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: true,
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-localization',
      'expo-font',
      '@react-native-community/datetimepicker',
    ],
    experiments: {
      typedRoutes: true,
    },
    // Only add runtimeVersion and updates config for EAS builds
    ...(IS_EAS_BUILD && {
      runtimeVersion: {
        policy: 'appVersion',
      },
      updates: {
        url: `https://u.expo.dev/${PROJECT_ID}`,
        enabled: false,
        checkAutomatically: 'ON_ERROR_RECOVERY',
        fallbackToCacheTimeout: 0,
      },
    }),
    extra: {
      router: {},
      eas: {
        projectId: PROJECT_ID,
      },
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
}
