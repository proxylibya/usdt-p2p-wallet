import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';
import { Browser } from '@capacitor/browser';
import { Clipboard } from '@capacitor/clipboard';
import { Share } from '@capacitor/share';

// Check if running on native platform
export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

// ========== HAPTICS ==========
export const haptics = {
  light: async () => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  },
  medium: async () => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
  },
  heavy: async () => {
    if (isNative) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  },
  success: async () => {
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Success });
    }
  },
  warning: async () => {
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Warning });
    }
  },
  error: async () => {
    if (isNative) {
      await Haptics.notification({ type: NotificationType.Error });
    }
  },
  vibrate: async () => {
    if (isNative) {
      await Haptics.vibrate();
    }
  },
};

// ========== STATUS BAR ==========
export const statusBar = {
  setDark: async () => {
    if (isNative) {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0B0E11' });
    }
  },
  setLight: async () => {
    if (isNative) {
      await StatusBar.setStyle({ style: Style.Light });
    }
  },
  hide: async () => {
    if (isNative) {
      await StatusBar.hide();
    }
  },
  show: async () => {
    if (isNative) {
      await StatusBar.show();
    }
  },
};

// ========== SPLASH SCREEN ==========
export const splashScreen = {
  hide: async () => {
    if (isNative) {
      await SplashScreen.hide();
    }
  },
  show: async () => {
    if (isNative) {
      await SplashScreen.show({
        autoHide: false,
      });
    }
  },
};

// ========== KEYBOARD ==========
export const keyboard = {
  hide: async () => {
    if (isNative) {
      await Keyboard.hide();
    }
  },
  show: async () => {
    if (isNative) {
      await Keyboard.show();
    }
  },
  addListeners: () => {
    if (isNative) {
      Keyboard.addListener('keyboardWillShow', (info) => {
        document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
      });
      Keyboard.addListener('keyboardWillHide', () => {
        document.body.style.setProperty('--keyboard-height', '0px');
      });
    }
  },
};

// ========== CAMERA ==========
export const camera = {
  takePicture: async () => {
    if (!isNative) return null;
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });
      return image.base64String;
    } catch {
      return null;
    }
  },
  pickFromGallery: async () => {
    if (!isNative) return null;
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });
      return image.base64String;
    } catch {
      return null;
    }
  },
};

// ========== PUSH NOTIFICATIONS ==========
export const pushNotifications = {
  register: async () => {
    if (!isNative) return;
    
    let permStatus = await PushNotifications.checkPermissions();
    
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
    
    if (permStatus.receive !== 'granted') {
      return;
    }
    
    await PushNotifications.register();
  },
  addListeners: (
    onRegistration: (token: string) => void,
    onNotification: (notification: any) => void,
    onAction: (notification: any) => void
  ) => {
    if (!isNative) return;
    
    PushNotifications.addListener('registration', (token) => {
      onRegistration(token.value);
    });
    
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      onNotification(notification);
    });
    
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      onAction(notification);
    });
  },
};

// ========== BROWSER ==========
export const browser = {
  open: async (url: string) => {
    await Browser.open({ url });
  },
  close: async () => {
    if (isNative) {
      await Browser.close();
    }
  },
};

// ========== CLIPBOARD ==========
export const clipboard = {
  write: async (text: string) => {
    await Clipboard.write({ string: text });
    if (isNative) {
      await haptics.success();
    }
  },
  read: async (): Promise<string | null> => {
    const result = await Clipboard.read();
    return result.value || null;
  },
};

// ========== SHARE ==========
export const share = {
  share: async (title: string, text: string, url?: string) => {
    await Share.share({
      title,
      text,
      url,
      dialogTitle: title,
    });
  },
};

// ========== APP ==========
export const app = {
  addBackButtonListener: (callback: () => void) => {
    if (isNative) {
      App.addListener('backButton', callback);
    }
  },
  addStateChangeListener: (callback: (isActive: boolean) => void) => {
    if (isNative) {
      App.addListener('appStateChange', ({ isActive }) => {
        callback(isActive);
      });
    }
  },
  exitApp: () => {
    if (isNative) {
      App.exitApp();
    }
  },
  getInfo: async () => {
    if (isNative) {
      return await App.getInfo();
    }
    return null;
  },
};

// ========== INITIALIZATION ==========
export const initializeCapacitor = async () => {
  if (!isNative) {
    return;
  }
  
  // Set status bar style
  await statusBar.setDark();
  
  // Initialize keyboard listeners
  keyboard.addListeners();
  
  // Hide splash screen after app is ready
  setTimeout(async () => {
    await splashScreen.hide();
  }, 500);
};
