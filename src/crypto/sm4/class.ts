import {
  encrypt as encryptFunc,
  decrypt as decryptFunc,
  type SM4Options as FuncSM4Options,
  type SM4GCMResult,
} from './index';
import { CipherMode, PaddingMode, type CipherModeType, type PaddingModeType } from '../../types/constants';

/**
 * SM4 class providing object-oriented API for block cipher operations
 * SM4 类，提供面向对象的分组密码操作API
 *
 * 支持的加密模式 (Supported cipher modes):
 * - ECB: 电码本模式 (Electronic Codebook)
 * - CBC: 分组链接模式 (Cipher Block Chaining)
 * - CTR: 计数器模式 (Counter mode)
 * - CFB: 密文反馈模式 (Cipher Feedback)
 * - OFB: 输出反馈模式 (Output Feedback)
 * - GCM: 伽罗瓦/计数器模式 (Galois/Counter Mode) - 认证加密 (AEAD)
 *
 * 支持的填充模式 (Supported padding modes):
 * - PKCS7: PKCS#7 填充 (PKCS#7 padding)
 * - NONE: 无填充 (No padding)
 * - ZERO: 零填充 (Zero padding)
 */
export class SM4 {
  private key: string;
  private mode: CipherModeType;
  private padding: PaddingModeType;
  private iv?: string;

  /**
   * Create a new SM4 instance
   * 创建新的 SM4 实例
   *
   * @param key - Encryption key as hex string (32 hex chars = 16 bytes)
   *              加密密钥，十六进制字符串（32个字符 = 16字节）
   * @param options - Cipher options
   *                  加密选项
   * @param options.mode - Cipher mode (default: ECB)
   *                       加密模式（默认：ECB）
   * @param options.padding - Padding mode (default: PKCS7)
   *                          填充模式（默认：PKCS7）
   * @param options.iv - Initialization vector (required for CBC/CTR/CFB/OFB/GCM)
   *                     初始化向量（CBC/CTR/CFB/OFB/GCM模式需要）
   */
  constructor(key: string, options?: {
    mode?: CipherModeType;
    padding?: PaddingModeType;
    iv?: string;
  }) {
    this.key = key;
    this.mode = options?.mode || CipherMode.ECB;
    this.padding = options?.padding || PaddingMode.PKCS7;
    this.iv = options?.iv;
  }

  /**
   * Set initialization vector for CBC/CTR/CFB/OFB/GCM modes
   * @param iv - IV as hex string (32 hex chars = 16 bytes for most modes, 24 hex chars = 12 bytes for GCM)
   */
  setIV(iv: string): void {
    this.iv = iv;
  }

  /**
   * Get initialization vector
   */
  getIV(): string | undefined {
    return this.iv;
  }

  /**
   * Set cipher mode
   * @param mode - Cipher mode (ECB, CBC, CTR, CFB, OFB, GCM)
   */
  setMode(mode: CipherModeType): void {
    this.mode = mode;
  }

  /**
   * Get cipher mode
   */
  getMode(): CipherModeType {
    return this.mode;
  }

  /**
   * Set padding mode
   * 设置填充模式
   *
   * @param padding - Padding mode (PKCS7, NONE, or ZERO)
   *                  填充模式（PKCS7、NONE 或 ZERO）
   */
  setPadding(padding: PaddingModeType): void {
    this.padding = padding;
  }

  /**
   * Get padding mode
   */
  getPadding(): PaddingModeType {
    return this.padding;
  }

  /**
   * Encrypt data
   * @param data - Data to encrypt
   * @returns Encrypted data as hex string or SM4GCMResult for GCM mode
   */
  encrypt(data: string | Uint8Array): string | SM4GCMResult {
    const options: FuncSM4Options = {
      mode: this.mode,
      padding: this.padding,
      iv: this.iv,
    };
    return encryptFunc(this.key, data, options);
  }

  /**
   * Decrypt data
   * @param encryptedData - Encrypted data as hex string or SM4GCMResult for GCM mode
   * @returns Decrypted data as string
   */
  decrypt(encryptedData: string | SM4GCMResult): string {
    const options: FuncSM4Options = {
      mode: this.mode,
      padding: this.padding,
      iv: this.iv,
    };
    return decryptFunc(this.key, encryptedData, options);
  }

  /**
   * Create SM4 instance with ECB mode
   * @param key - Encryption key as hex string
   * @param padding - Padding mode (default: PKCS7)
   */
  static ECB(key: string, padding: PaddingModeType = PaddingMode.PKCS7): SM4 {
    return new SM4(key, { mode: CipherMode.ECB, padding });
  }

  /**
   * Create SM4 instance with CBC mode
   * @param key - Encryption key as hex string
   * @param iv - Initialization vector as hex string
   * @param padding - Padding mode (default: PKCS7)
   */
  static CBC(key: string, iv: string, padding: PaddingModeType = PaddingMode.PKCS7): SM4 {
    return new SM4(key, { mode: CipherMode.CBC, padding, iv });
  }

  /**
   * Create SM4 instance with CTR mode
   * @param key - Encryption key as hex string
   * @param iv - Counter/nonce as hex string
   */
  static CTR(key: string, iv: string): SM4 {
    return new SM4(key, { mode: CipherMode.CTR, padding: PaddingMode.NONE, iv });
  }

  /**
   * Create SM4 instance with CFB mode
   * @param key - Encryption key as hex string
   * @param iv - Initialization vector as hex string
   */
  static CFB(key: string, iv: string): SM4 {
    return new SM4(key, { mode: CipherMode.CFB, padding: PaddingMode.NONE, iv });
  }

  /**
   * Create SM4 instance with OFB mode
   * @param key - Encryption key as hex string
   * @param iv - Initialization vector as hex string
   */
  static OFB(key: string, iv: string): SM4 {
    return new SM4(key, { mode: CipherMode.OFB, padding: PaddingMode.NONE, iv });
  }

  /**
   * Create SM4 instance with GCM mode
   * @param key - Encryption key as hex string
   * @param iv - Initialization vector as hex string (24 hex chars = 12 bytes)
   */
  static GCM(key: string, iv: string): SM4 {
    return new SM4(key, { mode: CipherMode.GCM, padding: PaddingMode.NONE, iv });
  }
}
