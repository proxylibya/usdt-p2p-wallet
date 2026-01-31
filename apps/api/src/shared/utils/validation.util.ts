/**
 * Validation Utilities - Common validation helpers
 */

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+[1-9]\d{6,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate positive number
 */
export function isPositiveNumber(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}

/**
 * Validate wallet address format (basic check)
 */
export function isValidWalletAddress(address: string, network: string): boolean {
  const patterns: Record<string, RegExp> = {
    TRC20: /^T[A-Za-z1-9]{33}$/,
    ERC20: /^0x[a-fA-F0-9]{40}$/,
    BEP20: /^0x[a-fA-F0-9]{40}$/,
    SOL: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  };
  
  const pattern = patterns[network.toUpperCase()];
  return pattern ? pattern.test(address) : address.length >= 20;
}

/**
 * Sanitize string input - remove potential XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

/**
 * Validate pagination params
 */
export function validatePagination(page?: number, limit?: number): { page: number; limit: number } {
  const validPage = Math.max(1, Math.floor(page || 1));
  const validLimit = Math.min(100, Math.max(1, Math.floor(limit || 20)));
  return { page: validPage, limit: validLimit };
}

/**
 * Validate amount within range
 */
export function validateAmount(
  amount: number,
  min: number = 0.00000001,
  max: number = 1000000000
): { valid: boolean; message?: string } {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, message: 'Invalid amount' };
  }
  if (amount < min) {
    return { valid: false, message: `Amount must be at least ${min}` };
  }
  if (amount > max) {
    return { valid: false, message: `Amount cannot exceed ${max}` };
  }
  return { valid: true };
}

/**
 * Validate asset symbol
 */
export function isValidAssetSymbol(symbol: string): boolean {
  const validSymbols = ['USDT', 'USDC', 'BTC', 'ETH', 'BNB', 'SOL', 'TRX'];
  return validSymbols.includes(symbol.toUpperCase());
}

/**
 * Validate fiat currency
 */
export function isValidFiatCurrency(currency: string): boolean {
  const validCurrencies = ['USD', 'EUR', 'GBP', 'SAR', 'AED', 'EGP', 'LYD', 'TND', 'TRY'];
  return validCurrencies.includes(currency.toUpperCase());
}

/**
 * Parse and validate date string
 */
export function parseDate(dateString: string): Date | null {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Check if date is in future
 */
export function isFutureDate(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }
  const start = data.slice(0, visibleChars);
  const end = data.slice(-visibleChars);
  return `${start}${'*'.repeat(data.length - visibleChars * 2)}${end}`;
}
