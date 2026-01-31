import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.usdtwallet.app',
  appName: 'USDT Wallet',
  webDir: 'dist',
  
  // iOS Configuration
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#0B0E11',
    allowsLinkPreview: false,
  },
  
  // Android Configuration
  android: {
    backgroundColor: '#0B0E11',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  
  // Plugins Configuration
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0B0E11',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0B0E11',
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  
  // Server Configuration (for development)
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    // Allow navigation to all paths (required for BrowserRouter)
    allowNavigation: ['*'],
  },
};

export default config;
