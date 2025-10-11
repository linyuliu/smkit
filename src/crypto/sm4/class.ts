import { 
  encrypt as encryptFunc, 
  decrypt as decryptFunc,
  type SM4Options as FuncSM4Options,
} from './index';
import { CipherMode, PaddingMode, type CipherModeType, type PaddingModeType } from '../../types/constants';

/**
 * SM4 class providing object-oriented API for block cipher operations
 */
export class SM4 {
  private key: string;
  private mode: CipherModeType;
  private padding: PaddingModeType;
  private iv?: string;

  /**
   * Create a new SM4 instance
   * @param key - Encryption key as hex string (32 hex chars = 16 bytes)
   * @param options - Cipher options
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
   * Set initialization vector for CBC mode
   * @param iv - IV as hex string (32 hex chars = 16 bytes)
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
   * @param mode - Cipher mode (ECB or CBC)
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
   * @param padding - Padding mode (PKCS7 or NONE)
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
   * @returns Encrypted data as hex string
   */
  encrypt(data: string | Uint8Array): string {
    const options: FuncSM4Options = {
      mode: this.mode,
      padding: this.padding,
      iv: this.iv,
    };
    return encryptFunc(this.key, data, options);
  }

  /**
   * Decrypt data
   * @param encryptedData - Encrypted data as hex string
   * @returns Decrypted data as string
   */
  decrypt(encryptedData: string): string {
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
}
