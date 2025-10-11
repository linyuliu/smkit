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
