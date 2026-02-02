/**
 * 🔐 Crypto Utilities - Enterprise-grade encryption for sensitive data
 * Used for OTP hashing, sensitive data encryption, and secure token generation
 */

import * as crypto from 'crypto';

// Configuration from environment or defaults
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-char-key-change-this!';
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const HASH_ITERATIONS = 100000;
const HASH_KEY_LENGTH = 64;

/**
 * Generate a cryptographically secure random string
 */
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a secure numeric OTP
 */
export const generateOtp = (length: number = 6): string => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const randomNum = crypto.randomInt(min, max + 1);
  return randomNum.toString().padStart(length, '0');
};

/**
 * Hash OTP using PBKDF2 with salt
 * Returns: salt:hash format
 */
export const hashOtp = (otp: string): string => {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.pbkdf2Sync(
    otp,
    salt,
    HASH_ITERATIONS,
    HASH_KEY_LENGTH,
    'sha512'
  ).toString('hex');
  
  return `${salt}:${hash}`;
};

/**
 * Verify OTP against stored hash
 */
export const verifyOtp = (otp: string, storedHash: string): boolean => {
  try {
    const [salt, originalHash] = storedHash.split(':');
    if (!salt || !originalHash) return false;
    
    const hash = crypto.pbkdf2Sync(
      otp,
      salt,
      HASH_ITERATIONS,
      HASH_KEY_LENGTH,
      'sha512'
    ).toString('hex');
    
    // Timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(originalHash, 'hex')
    );
  } catch {
    return false;
  }
};

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export const encrypt = (plaintext: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt data encrypted with encrypt()
 */
export const decrypt = (encryptedData: string): string => {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    if (!ivHex || !authTagHex || !encrypted) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed - data may be corrupted or tampered');
  }
};

/**
 * Hash password using bcrypt-like approach with PBKDF2
 */
export const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    HASH_ITERATIONS,
    HASH_KEY_LENGTH,
    'sha512'
  ).toString('hex');
  
  return `${salt}:${hash}`;
};

/**
 * Verify password against stored hash
 */
export const verifyPassword = (password: string, storedHash: string): boolean => {
  return verifyOtp(password, storedHash); // Same algorithm
};

/**
 * Generate HMAC signature for data integrity
 */
export const generateHmac = (data: string, secret?: string): string => {
  const key = secret || ENCRYPTION_KEY;
  return crypto.createHmac('sha256', key).update(data).digest('hex');
};

/**
 * Verify HMAC signature
 */
export const verifyHmac = (data: string, signature: string, secret?: string): boolean => {
  const expectedSignature = generateHmac(data, secret);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
};

/**
 * Generate a unique request/transaction ID
 */
export const generateTransactionId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `TXN_${timestamp}_${random}`.toUpperCase();
};

/**
 * Mask sensitive data for logging (e.g., phone numbers, addresses)
 */
export const maskSensitiveData = (data: string, visibleChars: number = 4): string => {
  if (!data || data.length <= visibleChars * 2) return '****';
  const start = data.slice(0, visibleChars);
  const end = data.slice(-visibleChars);
  return `${start}****${end}`;
};

export default {
  generateSecureToken,
  generateOtp,
  hashOtp,
  verifyOtp,
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  generateHmac,
  verifyHmac,
  generateTransactionId,
  maskSensitiveData,
};
