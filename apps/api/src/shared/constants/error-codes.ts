/**
 * Error Codes - Standardized error codes for API responses
 */

export const ErrorCodes = {
  // Authentication Errors (1xxx)
  AUTH_INVALID_CREDENTIALS: { code: 1001, message: 'Invalid credentials' },
  AUTH_TOKEN_EXPIRED: { code: 1002, message: 'Token expired' },
  AUTH_TOKEN_INVALID: { code: 1003, message: 'Invalid token' },
  AUTH_UNAUTHORIZED: { code: 1004, message: 'Unauthorized access' },
  AUTH_OTP_INVALID: { code: 1005, message: 'Invalid OTP code' },
  AUTH_OTP_EXPIRED: { code: 1006, message: 'OTP code expired' },
  AUTH_USER_BANNED: { code: 1007, message: 'Account is banned' },
  AUTH_2FA_REQUIRED: { code: 1008, message: '2FA verification required' },

  // User Errors (2xxx)
  USER_NOT_FOUND: { code: 2001, message: 'User not found' },
  USER_ALREADY_EXISTS: { code: 2002, message: 'User already exists' },
  USER_KYC_REQUIRED: { code: 2003, message: 'KYC verification required' },
  USER_KYC_PENDING: { code: 2004, message: 'KYC verification pending' },
  USER_PROFILE_INCOMPLETE: { code: 2005, message: 'Profile is incomplete' },

  // Wallet Errors (3xxx)
  WALLET_NOT_FOUND: { code: 3001, message: 'Wallet not found' },
  WALLET_INSUFFICIENT_BALANCE: { code: 3002, message: 'Insufficient balance' },
  WALLET_INVALID_ADDRESS: { code: 3003, message: 'Invalid wallet address' },
  WALLET_WITHDRAWAL_LIMIT: { code: 3004, message: 'Withdrawal limit exceeded' },
  WALLET_DEPOSIT_MIN: { code: 3005, message: 'Amount below minimum deposit' },
  WALLET_TRANSFER_FAILED: { code: 3006, message: 'Transfer failed' },

  // P2P Errors (4xxx)
  P2P_OFFER_NOT_FOUND: { code: 4001, message: 'Offer not found' },
  P2P_OFFER_INACTIVE: { code: 4002, message: 'Offer is inactive' },
  P2P_OFFER_LIMIT_EXCEEDED: { code: 4003, message: 'Amount exceeds offer limit' },
  P2P_OFFER_LIMIT_BELOW: { code: 4004, message: 'Amount below minimum limit' },
  P2P_TRADE_NOT_FOUND: { code: 4005, message: 'Trade not found' },
  P2P_TRADE_EXPIRED: { code: 4006, message: 'Trade has expired' },
  P2P_TRADE_COMPLETED: { code: 4007, message: 'Trade already completed' },
  P2P_TRADE_CANCELLED: { code: 4008, message: 'Trade was cancelled' },
  P2P_CANNOT_TRADE_SELF: { code: 4009, message: 'Cannot trade with yourself' },
  P2P_DISPUTE_EXISTS: { code: 4010, message: 'Dispute already exists' },

  // Market Errors (5xxx)
  MARKET_ASSET_NOT_FOUND: { code: 5001, message: 'Asset not found' },
  MARKET_PAIR_NOT_SUPPORTED: { code: 5002, message: 'Trading pair not supported' },
  MARKET_PRICE_UNAVAILABLE: { code: 5003, message: 'Price data unavailable' },

  // Swap Errors (6xxx)
  SWAP_QUOTE_EXPIRED: { code: 6001, message: 'Quote has expired' },
  SWAP_QUOTE_NOT_FOUND: { code: 6002, message: 'Quote not found' },
  SWAP_PAIR_NOT_SUPPORTED: { code: 6003, message: 'Swap pair not supported' },
  SWAP_AMOUNT_TOO_LOW: { code: 6004, message: 'Amount too low for swap' },
  SWAP_AMOUNT_TOO_HIGH: { code: 6005, message: 'Amount exceeds maximum' },

  // Validation Errors (7xxx)
  VALIDATION_FAILED: { code: 7001, message: 'Validation failed' },
  VALIDATION_PHONE_INVALID: { code: 7002, message: 'Invalid phone number' },
  VALIDATION_EMAIL_INVALID: { code: 7003, message: 'Invalid email address' },
  VALIDATION_AMOUNT_INVALID: { code: 7004, message: 'Invalid amount' },
  VALIDATION_REQUIRED_FIELD: { code: 7005, message: 'Required field missing' },

  // Rate Limit Errors (8xxx)
  RATE_LIMIT_EXCEEDED: { code: 8001, message: 'Too many requests' },
  RATE_LIMIT_OTP: { code: 8002, message: 'OTP request limit exceeded' },

  // System Errors (9xxx)
  SYSTEM_ERROR: { code: 9001, message: 'Internal server error' },
  SYSTEM_MAINTENANCE: { code: 9002, message: 'System under maintenance' },
  SYSTEM_UNAVAILABLE: { code: 9003, message: 'Service temporarily unavailable' },
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

/**
 * Get error by code
 */
export function getErrorByCode(code: number): { code: number; message: string } | undefined {
  return Object.values(ErrorCodes).find(e => e.code === code);
}
