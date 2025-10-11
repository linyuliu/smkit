/**
 * SMKit 库的常量定义
 */

/**
 * 填充模式
 */
export const PaddingMode = {
  PKCS7: 'pkcs7',
  NONE: 'none',
} as const;

export type PaddingModeType = typeof PaddingMode[keyof typeof PaddingMode];

/**
 * 加密模式
 */
export const CipherMode = {
  ECB: 'ecb',
  CBC: 'cbc',
} as const;

export type CipherModeType = typeof CipherMode[keyof typeof CipherMode];

/**
 * SM2 密文排列模式
 */
export const SM2CipherMode = {
  C1C3C2: 'C1C3C2',
  C1C2C3: 'C1C2C3',
} as const;

export type SM2CipherModeType = typeof SM2CipherMode[keyof typeof SM2CipherMode];

/**
 * SM 算法的 OID（对象标识符）常量
 * 基于 GM/T 0006-2012 标准
 */
export const OID = {
  // SM2 算法 OID: 1.2.156.10197.1.301
  SM2: '1.2.156.10197.1.301',
  // SM2 with SM3 签名 OID: 1.2.156.10197.1.501
  SM2_SM3: '1.2.156.10197.1.501',
  // SM3 哈希算法 OID: 1.2.156.10197.1.401
  SM3: '1.2.156.10197.1.401',
  // SM4 密码算法 OID: 1.2.156.10197.1.104
  SM4: '1.2.156.10197.1.104',
} as const;

/**
 * SM2 签名的默认用户 ID（GM/T 0009-2012 标准中规定）
 */
export const DEFAULT_USER_ID = '1234567812345678';
