/**
 * ZUC Stream Cipher - Public API
 *
 * ZUC (祖冲之算法) is a stream cipher algorithm used in Chinese cryptographic standards.
 * It provides both encryption/decryption and message authentication.
 *
 * Standards:
 * - GM/T 0001-2012: ZUC-128 Stream Cipher Algorithm
 * - GM/T 0001.1-2023: ZUC-256 Stream Cipher Algorithm
 */

import { ZUCState, generateKeystream, process } from './core';
import { hexToBytes, bytesToHex, bytesToBase64, base64ToBytes, stringToBytes } from '../../core/utils';
import { OutputFormat, type OutputFormatType } from '../../types/constants';

/**
 * ZUC 加密选项
 * ZUC encryption options
 */
export interface ZUCOptions {
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
 * Encrypt data using ZUC-128 stream cipher
 * 使用 ZUC-128 流密码加密数据
 * @param key 128-bit key (16 bytes or 32 hex chars) / 128 位密钥
 * @param iv 128-bit IV (16 bytes or 32 hex chars) / 128 位初始向量
 * @param plaintext Data to encrypt (string or Uint8Array) / 要加密的数据
 * @param options Encryption options / 加密选项
 * @returns Encrypted data (default hex string) / 加密后的数据（默认十六进制字符串）
 * 
 * @example
 * // 默认 hex 格式（向后兼容）
 * const encrypted = encrypt(key, iv, 'data');
 * 
 * @example
 * // Base64 格式
 * const encrypted = encrypt(key, iv, 'data', { outputFormat: OutputFormat.BASE64 });
 */
export function encrypt(
  key: string | Uint8Array,
  iv: string | Uint8Array,
  plaintext: string | Uint8Array,
  options?: ZUCOptions
): string {
  const resultHex = process(key, iv, plaintext);
  const outputFormat = options?.outputFormat || OutputFormat.HEX;
  
  if (outputFormat === OutputFormat.BASE64) {
    const resultBytes = hexToBytes(resultHex);
    return bytesToBase64(resultBytes);
  }
  
  return resultHex;
}

/**
 * Decrypt data using ZUC-128 stream cipher
 * 使用 ZUC-128 流密码解密数据
 * @param key 128-bit key (16 bytes or 32 hex chars) / 128 位密钥
 * @param iv 128-bit IV (16 bytes or 32 hex chars) / 128 位初始向量
 * @param ciphertext Encrypted data (hex or base64 string, auto-detected) / 加密的数据（十六进制或 base64，自动检测）
 * @returns Decrypted data as string / 解密后的数据
 * 
 * @example
 * // 自动检测输入格式
 * const decrypted = decrypt(key, iv, encrypted);
 */
export function decrypt(
  key: string | Uint8Array,
  iv: string | Uint8Array,
  ciphertext: string
): string {
  // 自动检测输入格式（hex 或 base64）
  const detectAndDecode = (str: string): Uint8Array => {
    if (/^[0-9a-fA-F]+$/.test(str)) {
      return hexToBytes(str);
    } else if (/^[A-Za-z0-9+/]+=*$/.test(str)) {
      return base64ToBytes(str);
    }
    // 默认尝试 hex
    return hexToBytes(str);
  };
  
  const ciphertextBytes = detectAndDecode(ciphertext);
  const resultHex = process(key, iv, ciphertextBytes);
  const resultBytes = hexToBytes(resultHex);
  return new TextDecoder().decode(resultBytes);
}

/**
 * Generate ZUC-128 keystream
 * Optimized: Use Uint32Array view for efficient byte extraction
 * @param key 128-bit key (16 bytes or 32 hex chars)
 * @param iv 128-bit IV (16 bytes or 32 hex chars)
 * @param length Number of 32-bit words to generate
 * @returns Keystream as hex string
 */
export function getKeystream(
  key: string | Uint8Array,
  iv: string | Uint8Array,
  length: number
): string {
  const keystream = generateKeystream(key, iv, length);
  // Optimized: Pre-allocate exact size needed
  const bytes = new Uint8Array(length * 4);
  
  // Optimized: Process words more efficiently
  for (let i = 0; i < length; i++) {
    const word = keystream[i];
    const offset = i * 4;
    bytes[offset] = (word >>> 24) & 0xFF;
    bytes[offset + 1] = (word >>> 16) & 0xFF;
    bytes[offset + 2] = (word >>> 8) & 0xFF;
    bytes[offset + 3] = word & 0xFF;
  }
  
  return bytesToHex(bytes);
}

/**
 * Generate EEA3 integrity key (for LTE encryption)
 * EEA3 is the confidentiality algorithm based on ZUC-128
 * Optimized: Pre-allocate IV buffer
 * @param key 128-bit confidentiality key
 * @param count 32-bit count value
 * @param bearer 5-bit bearer identity
 * @param direction 1-bit direction (0 for uplink, 1 for downlink)
 * @param length Bit length of the keystream to generate
 * @returns Keystream for EEA3
 */
export function eea3(
  key: string | Uint8Array,
  count: number,
  bearer: number,
  direction: number,
  length: number
): string {
  // Construct IV according to EEA3 specification
  // Optimized: Single buffer allocation
  const iv = new Uint8Array(16);
  iv[0] = (count >>> 24) & 0xFF;
  iv[1] = (count >>> 16) & 0xFF;
  iv[2] = (count >>> 8) & 0xFF;
  iv[3] = count & 0xFF;
  iv[4] = ((bearer << 3) | (direction << 2)) & 0xFF;
  // iv[5-15] are already 0

  // Generate keystream
  const numWords = Math.ceil(length / 32);
  return getKeystream(key, iv, numWords);
}

/**
 * Generate EIA3 integrity tag (for LTE authentication)
 * EIA3 is the integrity algorithm based on ZUC-128
 * Optimized: Reduce array allocations and improve bit operations
 * @param key 128-bit integrity key
 * @param count 32-bit count value
 * @param bearer 5-bit bearer identity
 * @param direction 1-bit direction (0 for uplink, 1 for downlink)
 * @param message Message to authenticate
 * @returns 32-bit MAC-I as hex string
 */
export function eia3(
  key: string | Uint8Array,
  count: number,
  bearer: number,
  direction: number,
  message: string | Uint8Array
): string {
  const messageBytes = typeof message === 'string' ? stringToBytes(message) : message;
  const bitLength = messageBytes.length * 8;

  // Construct IV according to EIA3 specification
  // Optimized: Single buffer allocation
  const iv = new Uint8Array(16);
  const countAndBearer = [
    (count >>> 24) & 0xFF,
    (count >>> 16) & 0xFF,
    (count >>> 8) & 0xFF,
    count & 0xFF,
    (((bearer & 0x1F) << 3) | ((direction & 0x1) << 2)) & 0xFF
  ];
  
  iv[0] = countAndBearer[0];
  iv[1] = countAndBearer[1];
  iv[2] = countAndBearer[2];
  iv[3] = countAndBearer[3];
  iv[4] = countAndBearer[4];
  // iv[5-7] are already 0
  iv[8] = countAndBearer[0];
  iv[9] = countAndBearer[1];
  iv[10] = countAndBearer[2];
  iv[11] = countAndBearer[3];
  iv[12] = countAndBearer[4];
  // iv[13-15] are already 0

  // Generate keystream
  const numWords = Math.ceil((bitLength + 64) / 32);
  const keystream = generateKeystream(key, iv, numWords);

  // Compute MAC
  // Optimized: Compute XOR in a more efficient way
  let t = 0;
  const l = bitLength;

  // Process message bytes
  for (let i = 0; i < messageBytes.length; i++) {
    const wordIndex = Math.floor((i * 8) / 32);
    const shift = 24 - ((i * 8) % 32);
    const keyByte = (keystream[wordIndex] >>> shift) & 0xFF;
    t ^= messageBytes[i] ^ keyByte;
  }

  // Process length
  const bitSet = getBitFromKeystream(keystream, bitLength);
  if (bitSet) {
    t ^= l >>> 0;
  }

  // Final XOR with keystream
  const finalZ = keystream[Math.floor(bitLength / 32)];
  const mac = (t ^ finalZ) >>> 0;

  // Return as 8 hex chars (32 bits)
  return (mac >>> 0).toString(16).padStart(8, '0');
}

/**
 * Helper function to get a specific bit from keystream
 */
function getBitFromKeystream(keystream: Uint32Array, bitPosition: number): boolean {
  const wordIndex = Math.floor(bitPosition / 32);
  const bitIndex = 31 - (bitPosition % 32);
  return ((keystream[wordIndex] >>> bitIndex) & 1) === 1;
}

// Export core components for advanced usage
export { ZUCState, generateKeystream };

// Export ZUC class for OOP API
export { ZUC } from './class';
