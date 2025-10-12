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
  CTR: 'ctr',
  CFB: 'cfb',
  OFB: 'ofb',
  GCM: 'gcm',
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
 * 
 * 说明：
 * - 1.2.156 是中国国家密码管理局的注册号
 * - 10197 是商用密码标识
 * - SM2 椭圆曲线基于 ECC，但使用中国自主注册的 OID 和参数
 * - 这些 OID 与国际标准的 ECC OID 不同，确保了商密算法的独立性
 * - SM2 曲线参数：素数域 p = 2^256 - 2^224 - 2^96 + 2^64 - 1
 */
export const OID = {
  // SM2 算法 OID: 1.2.156.10197.1.301
  // SM2 椭圆曲线公钥密码算法，兼容 ECC 但使用中国标准参数
  SM2: '1.2.156.10197.1.301',
  // SM2 with SM3 签名 OID: 1.2.156.10197.1.501
  // 结合 SM2 签名和 SM3 哈希的完整签名方案
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
