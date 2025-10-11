/**
 * Convert hexadecimal string to Uint8Array
 * @param hex - Hexadecimal string (with or without 0x prefix)
 * @returns Uint8Array representation of the hex string
 */
export function hexToBytes(hex: string): Uint8Array {
  // Remove 0x prefix if present
  if (hex.startsWith('0x') || hex.startsWith('0X')) {
    hex = hex.slice(2);
  }
  
  // Ensure even length
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
 * Convert Uint8Array to lowercase hexadecimal string
 * @param bytes - Uint8Array to convert
 * @returns Lowercase hexadecimal string
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert UTF-8 string to Uint8Array
 * @param str - String to convert
 * @returns Uint8Array representation of the string
 */
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert Uint8Array to UTF-8 string
 * @param bytes - Uint8Array to convert
 * @returns UTF-8 string
 */
export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Normalize input to Uint8Array
 * @param data - String or Uint8Array input
 * @returns Uint8Array
 */
export function normalizeInput(data: string | Uint8Array): Uint8Array {
  return typeof data === 'string' ? stringToBytes(data) : data;
}

/**
 * XOR two Uint8Arrays
 * @param a - First array
 * @param b - Second array
 * @returns XOR result
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
 * Left rotate a 32-bit value
 * @param value - 32-bit value
 * @param shift - Number of bits to rotate
 * @returns Rotated value
 */
export function rotl(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

/**
 * Convert 4 bytes to 32-bit big-endian integer
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
 * Convert 32-bit big-endian integer to 4 bytes
 */
export function uint32ToBytes4BE(value: number): Uint8Array {
  return new Uint8Array([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ]);
}
