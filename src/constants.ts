/**
 * Constants for SMKit library
 */

/**
 * Padding modes
 */
export const PaddingMode = {
  PKCS7: 'PKCS7',
  NONE: 'NONE',
} as const;

export type PaddingModeType = typeof PaddingMode[keyof typeof PaddingMode];

/**
 * Cipher modes
 */
export const CipherMode = {
  ECB: 'ECB',
  CBC: 'CBC',
} as const;

export type CipherModeType = typeof CipherMode[keyof typeof CipherMode];

/**
 * SM2 cipher text ordering modes
 */
export const SM2CipherMode = {
  C1C3C2: 'C1C3C2',
  C1C2C3: 'C1C2C3',
} as const;

export type SM2CipherModeType = typeof SM2CipherMode[keyof typeof SM2CipherMode];

/**
 * OID (Object Identifier) constants for SM algorithms
 * Based on GMT 0006-2012 standard
 */
export const OID = {
  // SM2 algorithm OID: 1.2.156.10197.1.301
  SM2: '1.2.156.10197.1.301',
  // SM2 with SM3 signature OID: 1.2.156.10197.1.501
  SM2_SM3: '1.2.156.10197.1.501',
  // SM3 hash algorithm OID: 1.2.156.10197.1.401
  SM3: '1.2.156.10197.1.401',
  // SM4 cipher algorithm OID: 1.2.156.10197.1.104
  SM4: '1.2.156.10197.1.104',
} as const;

/**
 * Default user ID for SM2 signature (specified in GM/T 0009-2012)
 */
export const DEFAULT_USER_ID = '1234567812345678';
