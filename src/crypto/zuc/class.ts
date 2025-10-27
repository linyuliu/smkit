import { 
  encrypt as encryptFunc, 
  decrypt as decryptFunc,
  getKeystream as getKeystreamFunc,
  eea3 as eea3Func,
  eia3 as eia3Func,
} from './index';

/**
 * ZUC class providing object-oriented API for stream cipher operations
 * ZUC 类，提供面向对象的流密码操作API
 * 
 * ZUC-128 is a stream cipher algorithm used in Chinese cryptographic standards
 * and 3GPP LTE encryption (EEA3) and integrity protection (EIA3).
 * 
 * ZUC-128 是中国密码标准和 3GPP LTE 加密（EEA3）和完整性保护（EIA3）中使用的流密码算法
 */
export class ZUC {
  private key: string | Uint8Array;
  private iv: string | Uint8Array;

  /**
   * Create a new ZUC instance
   * 创建新的 ZUC 实例
   * 
   * @param key - Encryption key (16 bytes or 32 hex chars for ZUC-128)
   *              加密密钥（ZUC-128 需要 16 字节或 32 个十六进制字符）
   * @param iv - Initialization vector (16 bytes or 32 hex chars for ZUC-128)
   *             初始化向量（ZUC-128 需要 16 字节或 32 个十六进制字符）
   */
  constructor(key: string | Uint8Array, iv: string | Uint8Array) {
    this.key = key;
    this.iv = iv;
  }

  /**
   * Set initialization vector
   * 设置初始化向量
   * @param iv - IV as hex string (32 hex chars = 16 bytes for ZUC-128)
   */
  setIV(iv: string | Uint8Array): void {
    this.iv = iv;
  }

  /**
   * Get initialization vector
   * 获取初始化向量
   */
  getIV(): string | Uint8Array {
    return this.iv;
  }

  /**
   * Encrypt data using ZUC stream cipher
   * 使用 ZUC 流密码加密数据
   * @param plaintext - Data to encrypt (string or Uint8Array)
   * @returns Encrypted data as hex string
   */
  encrypt(plaintext: string | Uint8Array): string {
    return encryptFunc(this.key, this.iv, plaintext);
  }

  /**
   * Decrypt data using ZUC stream cipher
   * 使用 ZUC 流密码解密数据
   * @param ciphertext - Encrypted data as hex string
   * @returns Decrypted data as string
   */
  decrypt(ciphertext: string): string {
    return decryptFunc(this.key, this.iv, ciphertext);
  }

  /**
   * Generate ZUC keystream
   * 生成 ZUC 密钥流
   * @param length - Number of 32-bit words to generate
   * @returns Keystream as hex string
   */
  keystream(length: number): string {
    return getKeystreamFunc(this.key, this.iv, length);
  }

  /**
   * Generate EEA3 keystream for LTE encryption
   * 为 LTE 加密生成 EEA3 密钥流
   * @param count - 32-bit count value
   * @param bearer - 5-bit bearer identity
   * @param direction - 1-bit direction (0 for uplink, 1 for downlink)
   * @param length - Bit length of the keystream to generate
   * @returns Keystream for EEA3
   */
  static eea3(
    key: string | Uint8Array,
    count: number,
    bearer: number,
    direction: number,
    length: number
  ): string {
    return eea3Func(key, count, bearer, direction, length);
  }

  /**
   * Generate EIA3 integrity tag for LTE authentication
   * 为 LTE 认证生成 EIA3 完整性标签
   * @param count - 32-bit count value
   * @param bearer - 5-bit bearer identity
   * @param direction - 1-bit direction (0 for uplink, 1 for downlink)
   * @param message - Message to authenticate
   * @returns 32-bit MAC-I as hex string
   */
  static eia3(
    key: string | Uint8Array,
    count: number,
    bearer: number,
    direction: number,
    message: string | Uint8Array
  ): string {
    return eia3Func(key, count, bearer, direction, message);
  }

  /**
   * Create ZUC instance for ZUC-128
   * 创建 ZUC-128 实例
   * @param key - 128-bit key (16 bytes or 32 hex chars)
   * @param iv - 128-bit IV (16 bytes or 32 hex chars)
   */
  static ZUC128(key: string | Uint8Array, iv: string | Uint8Array): ZUC {
    return new ZUC(key, iv);
  }
}
