/**
 * 将十六进制字符串转换为 Uint8Array
 * @param hex - 十六进制字符串（可带或不带 0x 前缀）
 * @returns 十六进制字符串的 Uint8Array 表示
 */
export function hexToBytes(hex: string): Uint8Array {
  // 如果存在 0x 前缀则移除
  if (hex.startsWith('0x') || hex.startsWith('0X')) {
    hex = hex.slice(2);
  }
  
  // 确保长度为偶数
  if (hex.length % 2 !== 0) {
    hex = '0' + hex;
  }
  
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (isNaN(byte)) {
      throw new Error(`Invalid hex string: ${hex}`);
    }
    bytes[i] = byte;
  }
  
  return bytes;
}

/**
 * 将 Uint8Array 转换为小写十六进制字符串
 * @param bytes - 要转换的 Uint8Array
 * @returns 小写十六进制字符串
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 将 UTF-8 字符串转换为 Uint8Array
 * @param str - 要转换的字符串
 * @returns 字符串的 Uint8Array 表示
 */
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * 将 Uint8Array 转换为 UTF-8 字符串
 * @param bytes - 要转换的 Uint8Array
 * @returns UTF-8 字符串
 */
export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * 将输入规范化为 Uint8Array
 * @param data - 字符串或 Uint8Array 输入
 * @returns Uint8Array
 */
export function normalizeInput(data: string | Uint8Array): Uint8Array {
  return typeof data === 'string' ? stringToBytes(data) : data;
}

/**
 * 对两个 Uint8Array 进行异或运算
 * @param a - 第一个数组
 * @param b - 第二个数组
 * @returns 异或结果
 */
export function xor(a: Uint8Array, b: Uint8Array): Uint8Array {
  if (a.length !== b.length) {
    throw new Error('Arrays must have the same length');
  }
  const result = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) {
    result[i] = a[i] ^ b[i];
  }
  return result;
}

/**
 * 对 32 位值进行循环左移
 * @param value - 32 位值
 * @param shift - 要移动的位数
 * @returns 移位后的值
 */
export function rotl(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

/**
 * 将 4 个字节转换为 32 位大端整数
 */
export function bytes4ToUint32BE(bytes: Uint8Array, offset: number = 0): number {
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
export function uint32ToBytes4BE(value: number): Uint8Array {
  return new Uint8Array([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ]);
}

/**
 * Base64 编码表（标准 Base64 字符集）
 */
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * 将 Uint8Array 转换为 Base64 字符串
 * @param bytes - 要转换的 Uint8Array
 * @returns Base64 编码的字符串
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  let i = 0;
  const len = bytes.length;
  
  // 每次处理 3 个字节（24 位）转换为 4 个 Base64 字符
  while (i < len) {
    const byte1 = bytes[i++];
    const byte2 = i < len ? bytes[i++] : 0;
    const byte3 = i < len ? bytes[i++] : 0;
    
    const chunk = (byte1 << 16) | (byte2 << 8) | byte3;
    
    result += BASE64_CHARS[(chunk >> 18) & 0x3f];
    result += BASE64_CHARS[(chunk >> 12) & 0x3f];
    result += BASE64_CHARS[(chunk >> 6) & 0x3f];
    result += BASE64_CHARS[chunk & 0x3f];
  }
  
  // 处理填充
  const padding = (3 - (len % 3)) % 3;
  if (padding > 0) {
    result = result.slice(0, -padding) + '='.repeat(padding);
  }
  
  return result;
}

/**
 * 将 Base64 字符串转换为 Uint8Array
 * @param base64 - Base64 编码的字符串
 * @returns Uint8Array
 */
export function base64ToBytes(base64: string): Uint8Array {
  // 移除空白字符
  base64 = base64.replace(/\s/g, '');
  
  // 创建反向查找表
  const lookup: { [key: string]: number } = {};
  for (let i = 0; i < BASE64_CHARS.length; i++) {
    lookup[BASE64_CHARS[i]] = i;
  }
  
  // 计算输出长度
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  const len = base64.length;
  const outputLen = (len * 3) / 4 - padding;
  
  const bytes = new Uint8Array(outputLen);
  let byteIndex = 0;
  
  // 每次处理 4 个 Base64 字符（24 位）转换为 3 个字节
  for (let i = 0; i < len; i += 4) {
    const char1 = lookup[base64[i]] || 0;
    const char2 = lookup[base64[i + 1]] || 0;
    const char3 = lookup[base64[i + 2]] || 0;
    const char4 = lookup[base64[i + 3]] || 0;
    
    const chunk = (char1 << 18) | (char2 << 12) | (char3 << 6) | char4;
    
    if (byteIndex < outputLen) bytes[byteIndex++] = (chunk >> 16) & 0xff;
    if (byteIndex < outputLen) bytes[byteIndex++] = (chunk >> 8) & 0xff;
    if (byteIndex < outputLen) bytes[byteIndex++] = chunk & 0xff;
  }
  
  return bytes;
}
