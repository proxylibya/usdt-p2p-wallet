
export const CONFIG = {
  // VAPID Key for Push Notifications (Web Push Protocol)
  // In production, this should be injected via process.env.REACT_APP_VAPID_PUBLIC_KEY
  VAPID_PUBLIC_KEY: (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY || '',
  
  // App Environment
  IS_DEV: (import.meta as any).env?.DEV === true,
  
  // Security Configuration
  PASSWORD_MIN_LENGTH: 8,
  OTP_LENGTH: 6,
  
  // Feature Flags
  ENABLE_BIOMETRICS: true
};
