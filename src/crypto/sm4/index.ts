import { normalizeInput, bytesToHex, hexToBytes, xor } from '../../core/utils';
import { PaddingMode, CipherMode, type PaddingModeType, type CipherModeType } from '../../types/constants';

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
 * 将 4 个字节转换为 32 位大端整数
 */
function bytes4ToUint32BE(bytes: Uint8Array, offset: number = 0): number {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  ) >>> 0;
}

/**
 * 将 32 位大端整数转换为 4 个字节
 */
function uint32ToBytes4BE(value: number): Uint8Array {
  return new Uint8Array([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ]);
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

export interface SM4Options {
  mode?: CipherModeType;
  padding?: PaddingModeType;
  iv?: string;
}

/**
 * 使用 SM4 加密数据
 * @param key - 加密密钥（十六进制字符串，32 个字符 = 16 字节）
 * @param data - 要加密的数据（字符串或 Uint8Array）
 * @param options - 加密选项（模式、填充、IV）
 * @returns 小写十六进制字符串形式的加密数据
 */
export function encrypt(
  key: string,
  data: string | Uint8Array,
  options?: SM4Options
): string {
  const mode = (options?.mode || CipherMode.ECB).toLowerCase();
  const padding = (options?.padding || PaddingMode.PKCS7).toLowerCase();
  
  const keyBytes = hexToBytes(key);
  if (keyBytes.length !== 16) {
    throw new Error('SM4 key must be 16 bytes (32 hex characters)');
  }

  let dataBytes = normalizeInput(data);
  
  // 应用填充（为了向后兼容，同时支持 'pkcs7' 和 'PKCS7'）
  if (padding === 'pkcs7') {
    dataBytes = pkcs7Pad(dataBytes, 16);
  } else if (dataBytes.length % 16 !== 0) {
    throw new Error('Data length must be multiple of 16 bytes when padding is None');
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
  }

  return bytesToHex(result);
}

/**
 * 使用 SM4 解密数据
 * @param key - 解密密钥（十六进制字符串，32 个字符 = 16 字节）
 * @param encryptedData - 加密的数据（十六进制字符串）
 * @param options - 解密选项（模式、填充、IV）
 * @returns 解密后的数据（UTF-8 字符串）
 */
export function decrypt(
  key: string,
  encryptedData: string,
  options?: SM4Options
): string {
  const mode = (options?.mode || CipherMode.ECB).toLowerCase();
  const padding = (options?.padding || PaddingMode.PKCS7).toLowerCase();
  
  const keyBytes = hexToBytes(key);
  if (keyBytes.length !== 16) {
    throw new Error('SM4 key must be 16 bytes (32 hex characters)');
  }

  const dataBytes = hexToBytes(encryptedData);
  if (dataBytes.length % 16 !== 0) {
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
  }

  // 去除填充（为了向后兼容，同时支持 'pkcs7' 和 'PKCS7'）
  const unpadded = padding === 'pkcs7' ? pkcs7Unpad(result) : result;
  
  return new TextDecoder().decode(unpadded);
}
