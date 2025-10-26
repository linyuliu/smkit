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
import { hexToBytes, bytesToHex, stringToBytes } from '../../core/utils';

/**
 * Encrypt data using ZUC-128 stream cipher
 * @param key 128-bit key (16 bytes or 32 hex chars)
 * @param iv 128-bit IV (16 bytes or 32 hex chars)
 * @param plaintext Data to encrypt (string or Uint8Array)
 * @returns Encrypted data as hex string
 */
export function encrypt(
  key: string | Uint8Array,
  iv: string | Uint8Array,
  plaintext: string | Uint8Array
): string {
  return process(key, iv, plaintext);
}

/**
 * Decrypt data using ZUC-128 stream cipher
 * @param key 128-bit key (16 bytes or 32 hex chars)
 * @param iv 128-bit IV (16 bytes or 32 hex chars)
 * @param ciphertext Encrypted data as hex string
 * @returns Decrypted data as string
 */
export function decrypt(
  key: string | Uint8Array,
  iv: string | Uint8Array,
  ciphertext: string
): string {
  const ciphertextBytes = hexToBytes(ciphertext);
  const resultHex = process(key, iv, ciphertextBytes);
  const resultBytes = hexToBytes(resultHex);
  return new TextDecoder().decode(resultBytes);
}

/**
 * Generate ZUC-128 keystream
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
  const bytes = new Uint8Array(keystream.length * 4);
  for (let i = 0; i < keystream.length; i++) {
    bytes[i * 4] = (keystream[i] >>> 24) & 0xFF;
    bytes[i * 4 + 1] = (keystream[i] >>> 16) & 0xFF;
    bytes[i * 4 + 2] = (keystream[i] >>> 8) & 0xFF;
    bytes[i * 4 + 3] = keystream[i] & 0xFF;
  }
  return bytesToHex(bytes);
}

/**
 * Generate EEA3 integrity key (for LTE encryption)
 * EEA3 is the confidentiality algorithm based on ZUC-128
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
  const iv = new Uint8Array(16);
  iv[0] = (count >>> 24) & 0xFF;
  iv[1] = (count >>> 16) & 0xFF;
  iv[2] = (count >>> 8) & 0xFF;
  iv[3] = count & 0xFF;
  iv[4] = (((bearer & 0x1F) << 3) | ((direction & 0x1) << 2)) & 0xFF;
  // iv[5-7] are already 0
  iv[8] = (count >>> 24) & 0xFF;
  iv[9] = (count >>> 16) & 0xFF;
  iv[10] = (count >>> 8) & 0xFF;
  iv[11] = count & 0xFF;
  iv[12] = (((bearer & 0x1F) << 3) | ((direction & 0x1) << 2)) & 0xFF;
  // iv[13-15] are already 0

  // Generate keystream
  const numWords = Math.ceil((bitLength + 64) / 32);
  const keystream = generateKeystream(key, iv, numWords);

  // Compute MAC
  let t = 0;
  const l = bitLength;

  // Process message
  for (let i = 0; i < messageBytes.length; i++) {
    const z = keystream[Math.floor((i * 8) / 32)];
    const shift = 24 - ((i * 8) % 32);
    const keyByte = (z >>> shift) & 0xFF;
    t ^= messageBytes[i] ^ keyByte;
  }

  // Process length
  t ^= getBitFromKeystream(keystream, bitLength) ? (l >>> 0) : 0;

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
