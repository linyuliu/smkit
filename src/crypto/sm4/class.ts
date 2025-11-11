import { 
  encrypt as encryptFunc, 
  decrypt as decryptFunc,
  type SM4Options as FuncSM4Options,
  type SM4GCMResult,
} from './index';
import { CipherMode, PaddingMode, type CipherModeType, type PaddingModeType } from '../../types/constants';

/**
 * SM4 分组密码的面向对象封装
 *
 * 支持的加密模式：
 * - ECB：电码本模式（Electronic Codebook）
 * - CBC：分组链接模式（Cipher Block Chaining）
 * - CTR：计数器模式（Counter Mode）
 * - CFB：密文反馈模式（Cipher Feedback）
 * - OFB：输出反馈模式（Output Feedback）
 * - GCM：伽罗瓦/计数器模式（Galois/Counter Mode，认证加密）
 *
 * 支持的填充模式：
 * - PKCS7：PKCS#7 填充
 * - NONE：无填充
 * - ZERO：零填充
 */
export class SM4 {
  private key: string;
  private mode: CipherModeType;
  private padding: PaddingModeType;
  private iv?: string;

  /**
   * 创建新的 SM4 实例
   *
   * @param key - 加密密钥，十六进制字符串（32 个字符 = 16 字节）
   * @param options - 加密选项
   * @param options.mode - 加密模式（默认：ECB）
   * @param options.padding - 填充模式（默认：PKCS7）
   * @param options.iv - 初始化向量（CBC/CTR/CFB/OFB/GCM 模式必需）
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
   * 设置初始化向量（CBC/CTR/CFB/OFB/GCM 模式专用）
   * @param iv - 十六进制字符串表示的 IV（常规模式 32 个字符，GCM 模式 24 个字符）
   */
  setIV(iv: string): void {
    this.iv = iv;
  }

  /**
   * 获取初始化向量
   */
  getIV(): string | undefined {
    return this.iv;
  }

  /**
   * 设置加密模式
   * @param mode - 加密模式（ECB、CBC、CTR、CFB、OFB、GCM）
   */
  setMode(mode: CipherModeType): void {
    this.mode = mode;
  }

  /**
   * 获取当前加密模式
   */
  getMode(): CipherModeType {
    return this.mode;
  }

  /**
   * 设置填充模式
   *
   * @param padding - 填充模式（PKCS7、NONE 或 ZERO）
   */
  setPadding(padding: PaddingModeType): void {
    this.padding = padding;
  }

  /**
   * 获取当前填充模式
   */
  getPadding(): PaddingModeType {
    return this.padding;
  }

  /**
   * 加密数据
   * @param data - 待加密的数据
   * @returns 十六进制密文；GCM 模式下返回包含密文与标签的对象
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
   * 解密数据
   * @param encryptedData - 十六进制密文或 GCM 模式的密文结果
   * @returns 解密得到的明文字符串
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
   * 以 ECB 模式创建实例
   * @param key - 十六进制密钥
   * @param padding - 填充模式（默认：PKCS7）
   */
  static ECB(key: string, padding: PaddingModeType = PaddingMode.PKCS7): SM4 {
    return new SM4(key, { mode: CipherMode.ECB, padding });
  }

  /**
   * 以 CBC 模式创建实例
   * @param key - 十六进制密钥
   * @param iv - 十六进制初始化向量
   * @param padding - 填充模式（默认：PKCS7）
   */
  static CBC(key: string, iv: string, padding: PaddingModeType = PaddingMode.PKCS7): SM4 {
    return new SM4(key, { mode: CipherMode.CBC, padding, iv });
  }

  /**
   * 以 CTR 模式创建实例
   * @param key - 十六进制密钥
   * @param iv - 十六进制计数器/随机数
   */
  static CTR(key: string, iv: string): SM4 {
    return new SM4(key, { mode: CipherMode.CTR, padding: PaddingMode.NONE, iv });
  }

  /**
   * 以 CFB 模式创建实例
   * @param key - 十六进制密钥
   * @param iv - 十六进制初始化向量
   */
  static CFB(key: string, iv: string): SM4 {
    return new SM4(key, { mode: CipherMode.CFB, padding: PaddingMode.NONE, iv });
  }

  /**
   * 以 OFB 模式创建实例
   * @param key - 十六进制密钥
   * @param iv - 十六进制初始化向量
   */
  static OFB(key: string, iv: string): SM4 {
    return new SM4(key, { mode: CipherMode.OFB, padding: PaddingMode.NONE, iv });
  }

  /**
   * 以 GCM 模式创建实例
   * @param key - 十六进制密钥
   * @param iv - 十六进制初始化向量（24 个字符 = 12 字节）
   */
  static GCM(key: string, iv: string): SM4 {
    return new SM4(key, { mode: CipherMode.GCM, padding: PaddingMode.NONE, iv });
  }
}
