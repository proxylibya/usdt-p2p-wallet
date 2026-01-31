
import { useCallback } from 'react';

export const useHaptic = () => {
  const triggerHaptic = useCallback((type: 'success' | 'warning' | 'error' | 'selection' = 'selection') => {
    if (!navigator.vibrate) return;

    switch (type) {
      case 'selection':
        navigator.vibrate(10); // Light tap
        break;
      case 'success':
        navigator.vibrate([10, 30, 10]); // Double tap
        break;
      case 'warning':
        navigator.vibrate(30); // Medium tap
        break;
      case 'error':
        navigator.vibrate([50, 30, 50, 30, 50]); // Triple heavy tap
        break;
      default:
        navigator.vibrate(10);
    }
  }, []);

  return { triggerHaptic };
};
