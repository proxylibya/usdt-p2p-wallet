/**
 * 📊 Logger Service - Centralized logging for the application
 * 
 * Features:
 * - Environment-aware logging (silent in production for non-errors)
 * - Structured log format
 * - Error tracking ready (can integrate with Sentry, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: string;
}

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

// 🎯 Color codes for console
const COLORS = {
  debug: '#6B7280',
  info: '#3B82F6',
  warn: '#F59E0B',
  error: '#EF4444',
};

const formatLog = (entry: LogEntry): string => {
  const prefix = entry.context ? `[${entry.context}]` : '';
  return `${entry.timestamp} ${prefix} ${entry.message}`;
};

/**
 * 📊 Logger - Use this instead of console.log/error
 */
export const logger = {
  /**
   * Debug level - only shown in development
   */
  debug: (message: string, data?: unknown, context?: string) => {
    if (!isDevelopment) return;
    
    const entry: LogEntry = {
      level: 'debug',
      message,
      context,
      data,
      timestamp: new Date().toISOString(),
    };
    
    console.log(
      `%c${formatLog(entry)}`,
      `color: ${COLORS.debug}`,
      data !== undefined ? data : ''
    );
  },

  /**
   * Info level - general information
   */
  info: (message: string, data?: unknown, context?: string) => {
    if (!isDevelopment) return;
    
    const entry: LogEntry = {
      level: 'info',
      message,
      context,
      data,
      timestamp: new Date().toISOString(),
    };
    
    console.info(
      `%c${formatLog(entry)}`,
      `color: ${COLORS.info}`,
      data !== undefined ? data : ''
    );
  },

  /**
   * Warning level - potential issues
   */
  warn: (message: string, data?: unknown, context?: string) => {
    const entry: LogEntry = {
      level: 'warn',
      message,
      context,
      data,
      timestamp: new Date().toISOString(),
    };
    
    // Warnings shown in development only
    if (isDevelopment) {
      console.warn(
        `%c${formatLog(entry)}`,
        `color: ${COLORS.warn}`,
        data !== undefined ? data : ''
      );
    }
  },

  /**
   * Error level - errors that need attention
   * Always logged, even in production (for error tracking)
   */
  error: (message: string, error?: unknown, context?: string) => {
    const entry: LogEntry = {
      level: 'error',
      message,
      context,
      data: error,
      timestamp: new Date().toISOString(),
    };
    
    // Always log errors
    console.error(formatLog(entry), error);
    
    // 🔮 TODO: Send to error tracking service (Sentry, etc.)
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error);
    // }
  },

  /**
   * API Error - specific handler for API errors
   */
  apiError: (endpoint: string, error: unknown, context?: string) => {
    logger.error(`API Error: ${endpoint}`, error, context || 'API');
  },

  /**
   * Network Error - for connection issues
   */
  networkError: (message: string, error?: unknown) => {
    // Don't spam logs with network errors in production
    if (isDevelopment) {
      logger.warn(`Network: ${message}`, error, 'Network');
    }
  },
};

export default logger;
