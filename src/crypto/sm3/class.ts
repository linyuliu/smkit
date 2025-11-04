import { digest as digestFunc, hmac as hmacFunc, type SM3Options } from './index';
import { OutputFormat, type OutputFormatType } from '../../types/constants';

/**
 * SM3 哈希算法的面向对象 API
 * SM3 class providing object-oriented API for hash operations
 */
export class SM3 {
  private data: Uint8Array[] = [];
  private outputFormat: OutputFormatType = OutputFormat.HEX;

  constructor(outputFormat?: OutputFormatType) {
    if (outputFormat) {
      this.outputFormat = outputFormat;
    }
  }

  /**
   * 计算 SM3 哈希摘要（静态方法）
   * Compute SM3 hash digest
   * @param data - 要哈希的数据 (Data to hash)
   * @param options - 哈希选项 (Hash options)
   * @returns 哈希摘要（默认为十六进制字符串）(Hash digest as hex string by default)
   */
  static digest(data: string | Uint8Array, options?: SM3Options): string {
    return digestFunc(data, options);
  }

  /**
   * 计算 SM3-HMAC（静态方法）
   * Compute SM3-HMAC
   * @param key - HMAC 密钥 (HMAC key)
   * @param data - 要认证的数据 (Data to authenticate)
   * @param options - 哈希选项 (Hash options)
   * @returns HMAC 值（默认为十六进制字符串）(HMAC as hex string by default)
   */
  static hmac(key: string | Uint8Array, data: string | Uint8Array, options?: SM3Options): string {
    return hmacFunc(key, data, options);
  }

  /**
   * 更新哈希状态（增量哈希）
   * Update the hash with new data
   * @param data - 要添加的数据 (Data to add to hash)
   * @returns 当前实例（支持链式调用）(this for chaining)
   */
  update(data: string | Uint8Array): this {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    this.data.push(bytes);
    return this;
  }

  /**
   * 完成哈希计算并返回摘要
   * Finalize the hash and return the digest
   * @returns 哈希摘要 (Hash digest)
   */
  digest(): string {
    // 拼接所有数据块 (Concatenate all data chunks)
    const totalLength = this.data.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.data) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // 计算哈希后清空数据 (Clear data after digesting)
    this.data = [];

    return digestFunc(combined, { outputFormat: this.outputFormat });
  }

  /**
   * 重置哈希器状态
   * Reset the hasher state
   * @returns 当前实例（支持链式调用）(this for chaining)
   */
  reset(): this {
    this.data = [];
    return this;
  }

  /**
   * 设置输出格式
   * Set output format
   * @param format - 输出格式 (Output format)
   */
  setOutputFormat(format: OutputFormatType): void {
    this.outputFormat = format;
  }

  /**
   * 获取输出格式
   * Get output format
   * @returns 当前输出格式 (Current output format)
   */
  getOutputFormat(): OutputFormatType {
    return this.outputFormat;
  }
}
