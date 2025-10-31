/**
 * SM4 分组密码算法实现
 * 
 * 参考标准：
 * - GM/T 0002-2012: SM4 分组密码算法
 * - 官方网站：http://www.oscca.gov.cn/
 * 
 * SM4 是中国国家密码管理局发布的分组密码算法，用于对称加密，
 * 主要用于商用密码应用中的数据加密。
 * 
 * 算法特点：
 * - 分组长度：128 位（16 字节）
 * - 密钥长度：128 位（16 字节）
 * - 轮数：32 轮
 * - 支持多种工作模式：ECB、CBC、CTR、CFB、OFB、GCM
 */

import { 
  normalizeInput, 
  bytesToHex,
  bytesToBase64,
  hexToBytes,
  base64ToBytes,
  xor,
  bytes4ToUint32BE,
  uint32ToBytes4BE,
  isHexString,
  isBase64String 
} from '../../core/utils';
import { PaddingMode, CipherMode, OutputFormat, type PaddingModeType, type CipherModeType, type OutputFormatType } from '../../types/constants';

// SM4 S盒（置换盒）- 用于非线性变换
const SBOX: number[] = [
  0xd6, 0x90, 0xe9, 0xfe, 0xcc, 0xe1, 0x3d, 0xb7, 0x16, 0xb6, 0x14, 0xc2, 0x28, 0xfb, 0x2c, 0x05,
  0x2b, 0x67, 0x9a, 0x76, 0x2a, 0xbe, 0x04, 0xc3, 0xaa, 0x44, 0x13, 0x26, 0x49, 0x86, 0x06, 0x99,
  0x9c, 0x42, 0x50, 0xf4, 0x91, 0xef, 0x98, 0x7a, 0x33, 0x54, 0x0b, 0x43, 0xed, 0xcf, 0xac, 0x62,
  0xe4, 0xb3, 0x1c, 0xa9, 0xc9, 0x08, 0xe8, 0x95, 0x80, 0xdf, 0x94, 0xfa, 0x75, 0x8f, 0x3f, 0xa6,
  0x47, 0x07, 0xa7, 0xfc, 0xf3, 0x73, 0x17, 0xba, 0x83, 0x59, 0x3c, 0x19, 0xe6, 0x85, 0x4f, 0xa8,
  0x68, 0x6b, 0x81, 0xb2, 0x71, 0x64, 0xda, 0x8b, 0xf8, 0xeb, 0x0f, 0x4b, 0x70, 0x56, 0x9d, 0x35,
  0x1e, 0x24, 0x0e, 0x5e, 0x63, 0x58, 0xd1, 0xa2, 0x25, 0x22, 0x7c, 0x3b, 0x01, 0x21, 0x78, 0x87,
  0xd4, 0x00, 0x46, 0x57, 0x9f, 0xd3, 0x27, 0x52, 0x4c, 0x36, 0x02, 0xe7, 0xa0, 0xc4, 0xc8, 0x9e,
  0xea, 0xbf, 0x8a, 0xd2, 0x40, 0xc7, 0x38, 0xb5, 0xa3, 0xf7, 0xf2, 0xce, 0xf9, 0x61, 0x15, 0xa1,
  0xe0, 0xae, 0x5d, 0xa4, 0x9b, 0x34, 0x1a, 0x55, 0xad, 0x93, 0x32, 0x30, 0xf5, 0x8c, 0xb1, 0xe3,
  0x1d, 0xf6, 0xe2, 0x2e, 0x82, 0x66, 0xca, 0x60, 0xc0, 0x29, 0x23, 0xab, 0x0d, 0x53, 0x4e, 0x6f,
  0xd5, 0xdb, 0x37, 0x45, 0xde, 0xfd, 0x8e, 0x2f, 0x03, 0xff, 0x6a, 0x72, 0x6d, 0x6c, 0x5b, 0x51,
  0x8d, 0x1b, 0xaf, 0x92, 0xbb, 0xdd, 0xbc, 0x7f, 0x11, 0xd9, 0x5c, 0x41, 0x1f, 0x10, 0x5a, 0xd8,
  0x0a, 0xc1, 0x31, 0x88, 0xa5, 0xcd, 0x7b, 0xbd, 0x2d, 0x74, 0xd0, 0x12, 0xb8, 0xe5, 0xb4, 0xb0,
  0x89, 0x69, 0x97, 0x4a, 0x0c, 0x96, 0x77, 0x7e, 0x65, 0xb9, 0xf1, 0x09, 0xc5, 0x6e, 0xc6, 0x84,
  0x18, 0xf0, 0x7d, 0xec, 0x3a, 0xdc, 0x4d, 0x20, 0x79, 0xee, 0x5f, 0x3e, 0xd7, 0xcb, 0x39, 0x48,
];

// 系统参数 FK
const FK: number[] = [0xa3b1bac6, 0x56aa3350, 0x677d9197, 0xb27022dc];

// 固定参数 CK - 用于密钥扩展
const CK: number[] = [];
for (let i = 0; i < 32; i++) {
  CK[i] =
    ((4 * i + 0) << 24) |
    ((4 * i + 1) << 16) |
    ((4 * i + 2) << 8) |
    (4 * i + 3);
}

/**
 * 循环左移
 */
function rotl(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

/**
 * GCM模式：Galois field multiplication in GF(2^128)
 * 伽罗瓦域乘法 GF(2^128)
 */
function ghash(h: Uint8Array, data: Uint8Array): Uint8Array {
  const result = new Uint8Array(16);
  
  // Process data in 16-byte blocks
  for (let i = 0; i < data.length; i += 16) {
    const block = data.slice(i, i + 16);
    
    // XOR with previous result
    for (let j = 0; j < 16 && j < block.length; j++) {
      result[j] ^= block[j];
    }
    
    // Galois field multiplication
    result.set(gfMul(result, h));
  }
  
  return result;
}

/**
 * Galois field multiplication for GCM
 * 伽罗瓦域乘法（用于GCM模式）
 */
function gfMul(x: Uint8Array, y: Uint8Array): Uint8Array {
  const result = new Uint8Array(16);
  const v = new Uint8Array(y);
  
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 8; j++) {
      if (x[i] & (1 << (7 - j))) {
        for (let k = 0; k < 16; k++) {
          result[k] ^= v[k];
        }
      }
      
      // Check if LSB is 1
      const lsb = v[15] & 1;
      
      // Right shift v by 1 bit
      for (let k = 15; k > 0; k--) {
        v[k] = (v[k] >> 1) | ((v[k - 1] & 1) << 7);
      }
      v[0] >>= 1;
      
      // If LSB was 1, XOR with R
      if (lsb) {
        v[0] ^= 0xe1;
      }
    }
  }
  
  return result;
}

/**
 * Increment counter for GCM mode (32-bit counter in rightmost 4 bytes)
 * GCM模式的计数器递增（最右边4字节的32位计数器）
 */
function incrementGCMCounter(counter: Uint8Array): void {
  // Increment the rightmost 32 bits (big-endian)
  for (let i = 15; i >= 12; i--) {
    if (++counter[i] !== 0) break;
  }
}

/**
 * 非线性变换 τ - 使用 S盒进行字节替换
 */
function tau(a: number): number {
  return (
    (SBOX[(a >>> 24) & 0xff] << 24) |
    (SBOX[(a >>> 16) & 0xff] << 16) |
    (SBOX[(a >>> 8) & 0xff] << 8) |
    SBOX[a & 0xff]
  ) >>> 0;
}

/**
 * 线性变换 L - 用于加密变换
 */
function l(b: number): number {
  return (b ^ rotl(b, 2) ^ rotl(b, 10) ^ rotl(b, 18) ^ rotl(b, 24)) >>> 0;
}

/**
 * 线性变换 L' - 用于密钥扩展
 */
function lPrime(b: number): number {
  return (b ^ rotl(b, 13) ^ rotl(b, 23)) >>> 0;
}

/**
 * 合成置换 T - 加密轮函数
 */
function t(a: number): number {
  return l(tau(a));
}

/**
 * 合成置换 T' - 密钥扩展函数
 */
function tPrime(a: number): number {
  return lPrime(tau(a));
}

/**
 * 密钥扩展 - 从主密钥生成轮密钥
 */
function expandKey(key: Uint8Array): number[] {
  const mk: number[] = [];
  for (let i = 0; i < 4; i++) {
    mk[i] = bytes4ToUint32BE(key, i * 4);
  }

  const k: number[] = new Array(36);
  k[0] = (mk[0] ^ FK[0]) >>> 0;
  k[1] = (mk[1] ^ FK[1]) >>> 0;
  k[2] = (mk[2] ^ FK[2]) >>> 0;
  k[3] = (mk[3] ^ FK[3]) >>> 0;

  const rk: number[] = new Array(32);
  for (let i = 0; i < 32; i++) {
    k[i + 4] = (k[i] ^ tPrime(k[i + 1] ^ k[i + 2] ^ k[i + 3] ^ CK[i])) >>> 0;
    rk[i] = k[i + 4];
  }

  return rk;
}

/**
 * 加密单个数据块（128 位）
 */
function encryptBlock(input: Uint8Array, roundKeys: number[]): Uint8Array {
  const x: number[] = [];
  for (let i = 0; i < 4; i++) {
    x[i] = bytes4ToUint32BE(input, i * 4);
  }

  for (let i = 0; i < 32; i++) {
    x[i + 4] = (x[i] ^ t(x[i + 1] ^ x[i + 2] ^ x[i + 3] ^ roundKeys[i])) >>> 0;
  }

  const output = new Uint8Array(16);
  for (let i = 0; i < 4; i++) {
    const bytes = uint32ToBytes4BE(x[35 - i]);
    output.set(bytes, i * 4);
  }

  return output;
}

/**
 * 解密单个数据块（128 位）
 */
function decryptBlock(input: Uint8Array, roundKeys: number[]): Uint8Array {
  const reversedKeys = roundKeys.slice().reverse();
  return encryptBlock(input, reversedKeys);
}

/**
 * PKCS7 填充
 * PKCS#7 padding - 填充值等于填充字节数
 * Padding value equals the number of padding bytes added
 * 
 * @param data - 要填充的数据 (Data to pad)
 * @param blockSize - 块大小，通常为16字节 (Block size, typically 16 bytes)
 * @returns 填充后的数据 (Padded data)
 */
function pkcs7Pad(data: Uint8Array, blockSize: number): Uint8Array {
  const padding = blockSize - (data.length % blockSize);
  const padded = new Uint8Array(data.length + padding);
  padded.set(data);
  for (let i = data.length; i < padded.length; i++) {
    padded[i] = padding;
  }
  return padded;
}

/**
 * 去除 PKCS7 填充
 * Remove PKCS#7 padding
 * 
 * @param data - 要去除填充的数据 (Data to unpad)
 * @returns 去除填充后的数据 (Unpadded data)
 */
function pkcs7Unpad(data: Uint8Array): Uint8Array {
  const padding = data[data.length - 1];
  if (padding < 1 || padding > 16) {
    throw new Error('Invalid padding');
  }
  for (let i = data.length - padding; i < data.length; i++) {
    if (data[i] !== padding) {
      throw new Error('Invalid padding');
    }
  }
  return data.slice(0, data.length - padding);
}

/**
 * 零填充
 * Zero padding - 用零字节填充到块大小的倍数
 * Pad with zero bytes to multiple of block size
 * 
 * @param data - 要填充的数据 (Data to pad)
 * @param blockSize - 块大小，通常为16字节 (Block size, typically 16 bytes)
 * @returns 填充后的数据 (Padded data)
 */
function zeroPad(data: Uint8Array, blockSize: number): Uint8Array {
  const padding = blockSize - (data.length % blockSize);
  if (padding === blockSize) {
    // 数据已经是块大小的倍数，无需填充
    // Data is already a multiple of block size, no padding needed
    return data;
  }
  const padded = new Uint8Array(data.length + padding);
  padded.set(data);
  // 剩余字节自动为0，无需显式设置
  // Remaining bytes are automatically 0, no need to set explicitly
  return padded;
}

/**
 * 去除零填充
 * Remove zero padding - 移除尾部的零字节
 * Remove trailing zero bytes
 * 
 * @param data - 要去除填充的数据 (Data to unpad)
 * @returns 去除填充后的数据 (Unpadded data)
 */
function zeroUnpad(data: Uint8Array): Uint8Array {
  let length = data.length;
  // 从尾部开始查找第一个非零字节
  // Find first non-zero byte from the end
  while (length > 0 && data[length - 1] === 0) {
    length--;
  }
  return data.slice(0, length);
}

/**
 * SM4 加密选项
 * SM4 encryption options
 */
export interface SM4Options {
  /**
   * 加密模式 (Cipher mode)
   * - ECB: 电码本模式，不需要IV (Electronic Codebook, no IV required)
   * - CBC: 分组链接模式，需要IV (Cipher Block Chaining, IV required)
   * - CTR: 计数器模式，需要IV，无需填充 (Counter mode, IV required, no padding)
   * - CFB: 密文反馈模式，需要IV，无需填充 (Cipher Feedback, IV required, no padding)
   * - OFB: 输出反馈模式，需要IV，无需填充 (Output Feedback, IV required, no padding)
   * - GCM: 伽罗瓦/计数器模式，需要IV，无需填充，提供认证 (Galois/Counter Mode, IV required, no padding, provides authentication)
   * 
   * 默认: ECB (Default: ECB)
   */
  mode?: CipherModeType;
  
  /**
   * 填充模式 (Padding mode)
   * - PKCS7: PKCS#7 填充，填充值为填充字节数 (PKCS#7 padding, padding value equals padding length)
   *   注意：JavaScript 中的 PKCS7 等同于 Java 中的 PKCS5（PKCS5 是 PKCS7 针对 8 字节块的特例）
   *   Note: PKCS7 in JavaScript is equivalent to PKCS5 in Java (PKCS5 is PKCS7 for 8-byte blocks)
   * - NONE: 无填充，数据长度必须是块大小倍数 (No padding, data length must be multiple of block size)
   * - ZERO: 零填充，用零字节填充 (Zero padding, pad with zero bytes)
   * 
   * 注意：流密码模式（CTR/CFB/OFB/GCM）不使用填充
   * Note: Stream cipher modes (CTR/CFB/OFB/GCM) don't use padding
   * 
   * 默认: PKCS7 (Default: PKCS7)
   */
  padding?: PaddingModeType;
  
  /**
   * 初始化向量 (Initialization Vector)
   * - CBC/CTR/CFB/OFB: 16字节 (32个十六进制字符) (16 bytes / 32 hex chars)
   * - GCM: 12字节 (24个十六进制字符) (12 bytes / 24 hex chars)
   * - ECB: 不需要IV (Not required for ECB)
   */
  iv?: string;
  
  /**
   * 附加认证数据，用于GCM模式 (Additional Authenticated Data for GCM mode)
   * 可以是字符串或Uint8Array (Can be string or Uint8Array)
   */
  aad?: string | Uint8Array;
  
  /**
   * 认证标签长度，用于GCM模式 (Authentication tag length for GCM mode)
   * 范围: 12-16字节 (Range: 12-16 bytes)
   * 默认: 16字节 (Default: 16 bytes)
   */
  tagLength?: number;
  
  /**
   * 输出格式 (Output format)
   * - hex: 十六进制字符串（默认，保持向后兼容）(Hex string, default for backward compatibility)
   * - base64: Base64 编码字符串 (Base64 encoded string)
   * 
   * 默认: hex (Default: hex)
   */
  outputFormat?: OutputFormatType;
}

/**
 * SM4 GCM模式加密结果
 * SM4 GCM mode encryption result
 */
export interface SM4GCMResult {
  /**
   * 密文（十六进制字符串）
   * Ciphertext (hex string)
   */
  ciphertext: string;
  
  /**
   * 认证标签（十六进制字符串）
   * Authentication tag (hex string)
   */
  tag: string;
}

/**
 * 使用 SM4 加密数据
 * Encrypt data using SM4 block cipher
 * 
 * 支持的模式 (Supported modes):
 * - ECB: 电码本模式 (Electronic Codebook) - 不推荐用于生产环境 (Not recommended for production)
 * - CBC: 分组链接模式 (Cipher Block Chaining) - 需要IV (Requires IV)
 * - CTR: 计数器模式 (Counter mode) - 流密码模式，需要IV (Stream mode, requires IV)
 * - CFB: 密文反馈模式 (Cipher Feedback) - 流密码模式，需要IV (Stream mode, requires IV)
 * - OFB: 输出反馈模式 (Output Feedback) - 流密码模式，需要IV (Stream mode, requires IV)
 * - GCM: 伽罗瓦/计数器模式 (Galois/Counter Mode) - 认证加密，需要IV (AEAD mode, requires IV)
 * 
 * 支持的填充模式 (Supported padding modes):
 * - PKCS7: PKCS#7 填充 (PKCS#7 padding) - 默认 (Default)
 * - NONE: 无填充 (No padding) - 数据长度必须是16字节的倍数 (Data length must be multiple of 16 bytes)
 * - ZERO: 零填充 (Zero padding) - 用零字节填充 (Pad with zero bytes)
 * 
 * @param key - 加密密钥（十六进制字符串，32 个字符 = 16 字节）
 *              Encryption key (hex string, 32 chars = 16 bytes)
 * @param data - 要加密的数据（字符串或 Uint8Array）
 *               Data to encrypt (string or Uint8Array)
 * @param options - 加密选项（模式、填充、IV）
 *                  Encryption options (mode, padding, IV)
 * @returns 小写十六进制字符串形式的加密数据，或GCM模式下返回包含密文和标签的对象
 *          Encrypted data as lowercase hex string, or object with ciphertext and tag for GCM mode
 * 
 * @example
 * // ECB mode
 * const encrypted = encrypt(key, 'Hello', { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
 * 
 * @example
 * // GCM mode with authentication
 * const result = encrypt(key, 'Secret', { mode: CipherMode.GCM, iv: '000000000000000000000000', aad: 'metadata' });
 * console.log(result.ciphertext, result.tag);
 */
export function encrypt(
  key: string,
  data: string | Uint8Array,
  options?: SM4Options
): string | SM4GCMResult {
  const mode = (options?.mode || CipherMode.ECB).toLowerCase();
  const padding = (options?.padding || PaddingMode.PKCS7).toLowerCase();
  
  const keyBytes = hexToBytes(key);
  if (keyBytes.length !== 16) {
    throw new Error('SM4 key must be 16 bytes (32 hex characters)');
  }

  let dataBytes = normalizeInput(data);
  
  // Stream cipher modes (CTR, CFB, OFB, GCM) don't require padding
  // 流密码模式（CTR、CFB、OFB、GCM）不需要填充
  const isStreamMode = mode === 'ctr' || mode === 'cfb' || mode === 'ofb' || mode === 'gcm';
  
  // 应用填充 (Apply padding)
  if (!isStreamMode) {
    if (padding === 'pkcs7') {
      // PKCS#7 填充
      dataBytes = pkcs7Pad(dataBytes, 16);
    } else if (padding === 'zero') {
      // 零填充
      dataBytes = zeroPad(dataBytes, 16);
    } else if (padding === 'none') {
      // 无填充，数据长度必须是16字节的倍数
      if (dataBytes.length % 16 !== 0) {
        throw new Error('Data length must be multiple of 16 bytes when padding is None');
      }
    } else {
      throw new Error(`Unsupported padding mode: ${padding}`);
    }
  }

  const roundKeys = expandKey(keyBytes);
  const result = new Uint8Array(dataBytes.length);

  if (mode === 'ecb') {
    for (let i = 0; i < dataBytes.length; i += 16) {
      const block = dataBytes.slice(i, i + 16);
      const encrypted = encryptBlock(block, roundKeys);
      result.set(encrypted, i);
    }
  } else if (mode === 'cbc') {
    if (!options?.iv) {
      throw new Error('IV is required for CBC mode');
    }
    let ivBytes = hexToBytes(options.iv);
    if (ivBytes.length !== 16) {
      throw new Error('IV must be 16 bytes (32 hex characters)');
    }

    for (let i = 0; i < dataBytes.length; i += 16) {
      const block = dataBytes.slice(i, i + 16);
      const xored = xor(block, ivBytes);
      const encrypted = encryptBlock(xored, roundKeys);
      result.set(encrypted, i);
      ivBytes = encrypted;
    }
  } else if (mode === 'ctr') {
    if (!options?.iv) {
      throw new Error('IV (nonce/counter) is required for CTR mode');
    }
    const counter = hexToBytes(options.iv);
    if (counter.length !== 16) {
      throw new Error('IV must be 16 bytes (32 hex characters)');
    }

    const counterBlock = new Uint8Array(counter);
    for (let i = 0; i < dataBytes.length; i += 16) {
      const keystream = encryptBlock(counterBlock, roundKeys);
      const blockSize = Math.min(16, dataBytes.length - i);
      for (let j = 0; j < blockSize; j++) {
        result[i + j] = dataBytes[i + j] ^ keystream[j];
      }
      // Increment counter (big-endian)
      for (let j = 15; j >= 0; j--) {
        if (++counterBlock[j] !== 0) break;
      }
    }
  } else if (mode === 'cfb') {
    if (!options?.iv) {
      throw new Error('IV is required for CFB mode');
    }
    let shift = hexToBytes(options.iv);
    if (shift.length !== 16) {
      throw new Error('IV must be 16 bytes (32 hex characters)');
    }

    for (let i = 0; i < dataBytes.length; i += 16) {
      const keystream = encryptBlock(shift, roundKeys);
      const blockSize = Math.min(16, dataBytes.length - i);
      const cipherBlock = new Uint8Array(16);
      for (let j = 0; j < blockSize; j++) {
        cipherBlock[j] = dataBytes[i + j] ^ keystream[j];
        result[i + j] = cipherBlock[j];
      }
      shift = cipherBlock;
    }
  } else if (mode === 'ofb') {
    if (!options?.iv) {
      throw new Error('IV is required for OFB mode');
    }
    let shift = hexToBytes(options.iv);
    if (shift.length !== 16) {
      throw new Error('IV must be 16 bytes (32 hex characters)');
    }

    for (let i = 0; i < dataBytes.length; i += 16) {
      shift = encryptBlock(shift, roundKeys);
      const blockSize = Math.min(16, dataBytes.length - i);
      for (let j = 0; j < blockSize; j++) {
        result[i + j] = dataBytes[i + j] ^ shift[j];
      }
    }
  } else if (mode === 'gcm') {
    // GCM mode: Galois/Counter Mode with authenticated encryption
    if (!options?.iv) {
      throw new Error('IV is required for GCM mode');
    }
    const ivBytes = hexToBytes(options.iv);
    if (ivBytes.length !== 12) {
      throw new Error('IV must be 12 bytes (24 hex characters) for GCM mode');
    }

    const tagLength = options.tagLength || 16; // Default 128-bit tag
    if (tagLength < 12 || tagLength > 16) {
      throw new Error('Tag length must be between 12 and 16 bytes');
    }

    // Compute H = E(K, 0^128)
    const h = encryptBlock(new Uint8Array(16), roundKeys);

    // Construct initial counter block: IV || 0^31 || 1
    const j0 = new Uint8Array(16);
    j0.set(ivBytes, 0);
    j0[15] = 1;

    // Encrypt the initial counter to get the pre-counter block
    const preCounterBlock = encryptBlock(j0, roundKeys);

    // Prepare counter for CTR mode encryption
    const counterBlock = new Uint8Array(j0);
    incrementGCMCounter(counterBlock);

    // Encrypt plaintext using CTR mode
    for (let i = 0; i < dataBytes.length; i += 16) {
      const keystream = encryptBlock(counterBlock, roundKeys);
      const blockSize = Math.min(16, dataBytes.length - i);
      for (let j = 0; j < blockSize; j++) {
        result[i + j] = dataBytes[i + j] ^ keystream[j];
      }
      incrementGCMCounter(counterBlock);
    }

    // Process Additional Authenticated Data (AAD)
    let aadBytes: Uint8Array = new Uint8Array(0);
    if (options.aad) {
      aadBytes = typeof options.aad === 'string' ? normalizeInput(options.aad) : new Uint8Array(options.aad);
    }

    // Pad AAD and ciphertext to 16-byte blocks for GHASH
    const aadLen = aadBytes.length;
    const cLen = result.length;
    const aadPadded = new Uint8Array(Math.ceil(aadLen / 16) * 16);
    aadPadded.set(aadBytes);
    const cPadded = new Uint8Array(Math.ceil(cLen / 16) * 16);
    cPadded.set(result);

    // Construct the data for GHASH: AAD || C || len(AAD) || len(C)
    const ghashData = new Uint8Array(aadPadded.length + cPadded.length + 16);
    ghashData.set(aadPadded, 0);
    ghashData.set(cPadded, aadPadded.length);
    
    // Append lengths in bits (64-bit big-endian)
    const view = new DataView(ghashData.buffer, ghashData.byteOffset, ghashData.byteLength);
    view.setUint32(ghashData.length - 16, Math.floor((aadLen * 8) / 0x100000000), false);
    view.setUint32(ghashData.length - 12, (aadLen * 8) >>> 0, false);
    view.setUint32(ghashData.length - 8, Math.floor((cLen * 8) / 0x100000000), false);
    view.setUint32(ghashData.length - 4, (cLen * 8) >>> 0, false);

    // Compute GHASH
    const ghashResult = ghash(h, ghashData);

    // Compute authentication tag: GHASH(H, A, C) XOR E(K, J0)
    const tag = new Uint8Array(tagLength);
    for (let i = 0; i < tagLength; i++) {
      tag[i] = ghashResult[i] ^ preCounterBlock[i];
    }

    const outputFormat = options?.outputFormat || OutputFormat.HEX;
    return {
      ciphertext: outputFormat === OutputFormat.BASE64 ? bytesToBase64(result) : bytesToHex(result),
      tag: outputFormat === OutputFormat.BASE64 ? bytesToBase64(tag) : bytesToHex(tag)
    };
  } else {
    throw new Error(`Unsupported cipher mode: ${mode}`);
  }

  const outputFormat = options?.outputFormat || OutputFormat.HEX;
  return outputFormat === OutputFormat.BASE64 ? bytesToBase64(result) : bytesToHex(result);
}

/**
 * 使用 SM4 解密数据
 * Decrypt data using SM4 block cipher
 * 
 * 支持的模式 (Supported modes):
 * - ECB: 电码本模式 (Electronic Codebook)
 * - CBC: 分组链接模式 (Cipher Block Chaining) - 需要IV (Requires IV)
 * - CTR: 计数器模式 (Counter mode) - 流密码模式，需要IV (Stream mode, requires IV)
 * - CFB: 密文反馈模式 (Cipher Feedback) - 流密码模式，需要IV (Stream mode, requires IV)
 * - OFB: 输出反馈模式 (Output Feedback) - 流密码模式，需要IV (Stream mode, requires IV)
 * - GCM: 伽罗瓦/计数器模式 (Galois/Counter Mode) - 认证加密，需要IV和tag (AEAD mode, requires IV and tag)
 * 
 * 支持的填充模式 (Supported padding modes):
 * - PKCS7: PKCS#7 填充 (PKCS#7 padding) - 默认 (Default)
 * - NONE: 无填充 (No padding)
 * - ZERO: 零填充 (Zero padding)
 * 
 * @param key - 解密密钥（十六进制字符串，32 个字符 = 16 字节）
 *              Decryption key (hex string, 32 chars = 16 bytes)
 * @param encryptedData - 加密的数据（十六进制字符串或GCM结果对象）
 *                        Encrypted data (hex string or GCM result object)
 * @param options - 解密选项（模式、填充、IV、tag用于GCM）
 *                  Decryption options (mode, padding, IV, tag for GCM)
 * @returns 解密后的数据（UTF-8 字符串）
 *          Decrypted data (UTF-8 string)
 * 
 * @example
 * // ECB mode
 * const decrypted = decrypt(key, encrypted, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
 * 
 * @example
 * // GCM mode with authentication verification
 * const decrypted = decrypt(key, result, { mode: CipherMode.GCM, iv: '000000000000000000000000', aad: 'metadata' });
 */
export function decrypt(
  key: string,
  encryptedData: string | SM4GCMResult,
  options?: SM4Options & { tag?: string }
): string {
  const mode = (options?.mode || CipherMode.ECB).toLowerCase();
  const padding = (options?.padding || PaddingMode.PKCS7).toLowerCase();
  
  const keyBytes = hexToBytes(key);
  if (keyBytes.length !== 16) {
    throw new Error('SM4 key must be 16 bytes (32 hex characters)');
  }

  // 自动检测输入格式（hex 或 base64）
  const detectFormat = (str: string): 'hex' | 'base64' => {
    return isHexString(str) ? 'hex' : 'base64';
  };
  
  const decodeInput = (str: string): Uint8Array => {
    const format = detectFormat(str);
    return format === 'base64' ? base64ToBytes(str) : hexToBytes(str);
  };

  // Handle GCM mode with tag
  let ciphertextStr: string;
  let authTag: Uint8Array | undefined;
  
  if (mode === 'gcm') {
    if (typeof encryptedData === 'object' && 'ciphertext' in encryptedData) {
      ciphertextStr = encryptedData.ciphertext;
      authTag = decodeInput(encryptedData.tag);
    } else if (typeof encryptedData === 'string' && options?.tag) {
      ciphertextStr = encryptedData;
      authTag = decodeInput(options.tag);
    } else {
      throw new Error('GCM mode requires authentication tag');
    }
  } else {
    ciphertextStr = typeof encryptedData === 'string' ? encryptedData : encryptedData.ciphertext;
  }

  const dataBytes = decodeInput(ciphertextStr);
  
  // Stream cipher modes don't require data to be a multiple of block size
  const isStreamMode = mode === 'ctr' || mode === 'cfb' || mode === 'ofb' || mode === 'gcm';
  if (!isStreamMode && dataBytes.length % 16 !== 0) {
    throw new Error('Encrypted data length must be multiple of 16 bytes');
  }

  const roundKeys = expandKey(keyBytes);
  const result = new Uint8Array(dataBytes.length);

  if (mode === 'ecb') {
    for (let i = 0; i < dataBytes.length; i += 16) {
      const block = dataBytes.slice(i, i + 16);
      const decrypted = decryptBlock(block, roundKeys);
      result.set(decrypted, i);
    }
  } else if (mode === 'cbc') {
    if (!options?.iv) {
      throw new Error('IV is required for CBC mode');
    }
    let ivBytes = hexToBytes(options.iv);
    if (ivBytes.length !== 16) {
      throw new Error('IV must be 16 bytes (32 hex characters)');
    }

    for (let i = 0; i < dataBytes.length; i += 16) {
      const block = dataBytes.slice(i, i + 16);
      const decrypted = decryptBlock(block, roundKeys);
      const xored = xor(decrypted, ivBytes);
      result.set(xored, i);
      ivBytes = block;
    }
  } else if (mode === 'ctr') {
    // CTR decryption is identical to encryption (XOR with keystream)
    if (!options?.iv) {
      throw new Error('IV (nonce/counter) is required for CTR mode');
    }
    const counter = hexToBytes(options.iv);
    if (counter.length !== 16) {
      throw new Error('IV must be 16 bytes (32 hex characters)');
    }

    const counterBlock = new Uint8Array(counter);
    for (let i = 0; i < dataBytes.length; i += 16) {
      const keystream = encryptBlock(counterBlock, roundKeys);
      const blockSize = Math.min(16, dataBytes.length - i);
      for (let j = 0; j < blockSize; j++) {
        result[i + j] = dataBytes[i + j] ^ keystream[j];
      }
      // Increment counter (big-endian)
      for (let j = 15; j >= 0; j--) {
        if (++counterBlock[j] !== 0) break;
      }
    }
  } else if (mode === 'cfb') {
    if (!options?.iv) {
      throw new Error('IV is required for CFB mode');
    }
    let shift = hexToBytes(options.iv);
    if (shift.length !== 16) {
      throw new Error('IV must be 16 bytes (32 hex characters)');
    }

    for (let i = 0; i < dataBytes.length; i += 16) {
      const keystream = encryptBlock(shift, roundKeys);
      const blockSize = Math.min(16, dataBytes.length - i);
      const cipherBlock = new Uint8Array(16);
      for (let j = 0; j < blockSize; j++) {
        cipherBlock[j] = dataBytes[i + j];
        result[i + j] = dataBytes[i + j] ^ keystream[j];
      }
      shift = cipherBlock;
    }
  } else if (mode === 'ofb') {
    // OFB decryption is identical to encryption (XOR with keystream)
    if (!options?.iv) {
      throw new Error('IV is required for OFB mode');
    }
    let shift = hexToBytes(options.iv);
    if (shift.length !== 16) {
      throw new Error('IV must be 16 bytes (32 hex characters)');
    }

    for (let i = 0; i < dataBytes.length; i += 16) {
      shift = encryptBlock(shift, roundKeys);
      const blockSize = Math.min(16, dataBytes.length - i);
      for (let j = 0; j < blockSize; j++) {
        result[i + j] = dataBytes[i + j] ^ shift[j];
      }
    }
  } else if (mode === 'gcm') {
    // GCM mode: Galois/Counter Mode with authenticated decryption
    if (!options?.iv) {
      throw new Error('IV is required for GCM mode');
    }
    if (!authTag) {
      throw new Error('Authentication tag is required for GCM mode');
    }

    const ivBytes = hexToBytes(options.iv);
    if (ivBytes.length !== 12) {
      throw new Error('IV must be 12 bytes (24 hex characters) for GCM mode');
    }

    // Compute H = E(K, 0^128)
    const h = encryptBlock(new Uint8Array(16), roundKeys);

    // Construct initial counter block: IV || 0^31 || 1
    const j0 = new Uint8Array(16);
    j0.set(ivBytes, 0);
    j0[15] = 1;

    // Encrypt the initial counter to get the pre-counter block
    const preCounterBlock = encryptBlock(j0, roundKeys);

    // Process Additional Authenticated Data (AAD)
    let aadBytes: Uint8Array = new Uint8Array(0);
    if (options.aad) {
      aadBytes = typeof options.aad === 'string' ? normalizeInput(options.aad) : new Uint8Array(options.aad);
    }

    // Pad AAD and ciphertext to 16-byte blocks for GHASH
    const aadLen = aadBytes.length;
    const cLen = dataBytes.length;
    const aadPadded = new Uint8Array(Math.ceil(aadLen / 16) * 16);
    aadPadded.set(aadBytes);
    const cPadded = new Uint8Array(Math.ceil(cLen / 16) * 16);
    cPadded.set(dataBytes);

    // Construct the data for GHASH: AAD || C || len(AAD) || len(C)
    const ghashData = new Uint8Array(aadPadded.length + cPadded.length + 16);
    ghashData.set(aadPadded, 0);
    ghashData.set(cPadded, aadPadded.length);
    
    // Append lengths in bits (64-bit big-endian)
    const view = new DataView(ghashData.buffer, ghashData.byteOffset, ghashData.byteLength);
    view.setUint32(ghashData.length - 16, Math.floor((aadLen * 8) / 0x100000000), false);
    view.setUint32(ghashData.length - 12, (aadLen * 8) >>> 0, false);
    view.setUint32(ghashData.length - 8, Math.floor((cLen * 8) / 0x100000000), false);
    view.setUint32(ghashData.length - 4, (cLen * 8) >>> 0, false);

    // Compute GHASH
    const ghashResult = ghash(h, ghashData);

    // Compute expected authentication tag: GHASH(H, A, C) XOR E(K, J0)
    const expectedTag = new Uint8Array(authTag.length);
    for (let i = 0; i < authTag.length; i++) {
      expectedTag[i] = ghashResult[i] ^ preCounterBlock[i];
    }

    // Verify authentication tag (constant-time comparison)
    let tagMatch = true;
    for (let i = 0; i < authTag.length; i++) {
      if (authTag[i] !== expectedTag[i]) {
        tagMatch = false;
      }
    }

    if (!tagMatch) {
      throw new Error('Authentication tag verification failed');
    }

    // Decrypt ciphertext using CTR mode
    const counterBlock = new Uint8Array(j0);
    incrementGCMCounter(counterBlock);

    for (let i = 0; i < dataBytes.length; i += 16) {
      const keystream = encryptBlock(counterBlock, roundKeys);
      const blockSize = Math.min(16, dataBytes.length - i);
      for (let j = 0; j < blockSize; j++) {
        result[i + j] = dataBytes[i + j] ^ keystream[j];
      }
      incrementGCMCounter(counterBlock);
    }
  } else {
    throw new Error(`Unsupported cipher mode: ${mode}`);
  }

  // 去除填充 (Remove padding)
  // 流密码模式不使用填充 (Stream cipher modes don't use padding)
  let unpadded: Uint8Array = result;
  if (!isStreamMode) {
    if (padding === 'pkcs7') {
      // 去除 PKCS#7 填充
      // Type assertion needed for TypeScript compatibility with different ArrayBuffer types
      unpadded = pkcs7Unpad(result) as Uint8Array;
    } else if (padding === 'zero') {
      // 去除零填充
      // Type assertion needed for TypeScript compatibility with different ArrayBuffer types
      unpadded = zeroUnpad(result) as Uint8Array;
    }
    // padding === 'none' 时不需要去除填充
    // No unpadding needed when padding === 'none'
  }
  
  return new TextDecoder().decode(unpadded);
}
