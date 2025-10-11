import {
  normalizeInput,
  bytesToHex,
  rotl,
  bytes4ToUint32BE,
  uint32ToBytes4BE,
} from '../../core/utils';

// SM3 常量 - 初始值 IV
const IV: number[] = [
  0x7380166f, 0x4914b2b9, 0x172442d7, 0xda8a0600,
  0xa96f30bc, 0x163138aa, 0xe38dee4d, 0xb0fb0e4e,
];

/**
 * 布尔函数 FF - 用于压缩函数
 * @param x 输入 x
 * @param y 输入 y
 * @param z 输入 z
 * @param j 轮数
 */
function ff(x: number, y: number, z: number, j: number): number {
  if (j < 16) {
    return x ^ y ^ z;  // 前 16 轮
  }
  return (x & y) | (x & z) | (y & z);  // 后 48 轮
}

/**
 * 布尔函数 GG - 用于压缩函数
 * @param x 输入 x
 * @param y 输入 y
 * @param z 输入 z
 * @param j 轮数
 */
function gg(x: number, y: number, z: number, j: number): number {
  if (j < 16) {
    return x ^ y ^ z;  // 前 16 轮
  }
  return (x & y) | (~x & z);  // 后 48 轮
}

/**
 * 置换函数 P0
 */
function p0(x: number): number {
  return x ^ rotl(x, 9) ^ rotl(x, 17);
}

/**
 * 置换函数 P1
 */
function p1(x: number): number {
  return x ^ rotl(x, 15) ^ rotl(x, 23);
}

function pad(data: Uint8Array): Uint8Array {
  const msgLen = data.length;
  const bitLen = msgLen * 8;
  
  // Calculate padding length
  const k = (448 - ((bitLen + 1) % 512) + 512) % 512;
  const paddingLen = (k + 1) / 8;
  const totalLen = msgLen + paddingLen + 8;
  
  const padded = new Uint8Array(totalLen);
  padded.set(data);
  padded[msgLen] = 0x80;
  
  // Append length as 64-bit big-endian
  const view = new DataView(padded.buffer, padded.byteOffset, padded.byteLength);
  view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(totalLen - 4, bitLen >>> 0, false);
  
  return padded;
}

function cf(v: number[], b: Uint8Array): number[] {
  const w: number[] = new Array(68);
  const wPrime: number[] = new Array(64);
  
  // Expand message
  for (let i = 0; i < 16; i++) {
    w[i] = bytes4ToUint32BE(b, i * 4);
  }
  
  for (let i = 16; i < 68; i++) {
    w[i] = p1(w[i - 16] ^ w[i - 9] ^ rotl(w[i - 3], 15)) ^ rotl(w[i - 13], 7) ^ w[i - 6];
    w[i] = w[i] >>> 0;
  }
  
  for (let i = 0; i < 64; i++) {
    wPrime[i] = (w[i] ^ w[i + 4]) >>> 0;
  }
  
  // Initialize working variables
  let [a, b2, c, d, e, f, g, h] = v;
  
  // Main loop
  for (let j = 0; j < 64; j++) {
    const t = j < 16 ? 0x79cc4519 : 0x7a879d8a;
    const ss1 = rotl((rotl(a, 12) + e + rotl(t, j % 32)) >>> 0, 7);
    const ss2 = (ss1 ^ rotl(a, 12)) >>> 0;
    const tt1 = (ff(a, b2, c, j) + d + ss2 + wPrime[j]) >>> 0;
    const tt2 = (gg(e, f, g, j) + h + ss1 + w[j]) >>> 0;
    
    d = c;
    c = rotl(b2, 9);
    b2 = a;
    a = tt1;
    h = g;
    g = rotl(f, 19);
    f = e;
    e = p0(tt2);
  }
  
  return [
    (a ^ v[0]) >>> 0,
    (b2 ^ v[1]) >>> 0,
    (c ^ v[2]) >>> 0,
    (d ^ v[3]) >>> 0,
    (e ^ v[4]) >>> 0,
    (f ^ v[5]) >>> 0,
    (g ^ v[6]) >>> 0,
    (h ^ v[7]) >>> 0,
  ];
}

/**
 * Compute SM3 hash digest
 * @param data - Input data (string or Uint8Array)
 * @returns Lowercase hex string of the hash digest (64 characters)
 */
export function digest(data: string | Uint8Array): string {
  const bytes = normalizeInput(data);
  const padded = pad(bytes);
  
  let v = [...IV];
  
  // Process each 512-bit block
  for (let i = 0; i < padded.length; i += 64) {
    const block = padded.slice(i, i + 64);
    v = cf(v, block);
  }
  
  // Convert result to bytes
  const result = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    const bytes = uint32ToBytes4BE(v[i]);
    result.set(bytes, i * 4);
  }
  
  return bytesToHex(result);
}

/**
 * Compute SM3-HMAC
 * @param key - Key (string or Uint8Array)
 * @param data - Data to authenticate (string or Uint8Array)
 * @returns Lowercase hex string of the HMAC (64 characters)
 */
export function hmac(key: string | Uint8Array, data: string | Uint8Array): string {
  let keyBytes = normalizeInput(key);
  const dataBytes = normalizeInput(data);
  
  const blockSize = 64; // SM3 block size in bytes
  
  // If key is longer than block size, hash it
  if (keyBytes.length > blockSize) {
    keyBytes = new Uint8Array(hexToBytes(digest(keyBytes)));
  }
  
  // Pad key to block size
  const paddedKey = new Uint8Array(blockSize);
  paddedKey.set(keyBytes);
  
  // Create ipad and opad
  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);
  
  for (let i = 0; i < blockSize; i++) {
    ipad[i] = paddedKey[i] ^ 0x36;
    opad[i] = paddedKey[i] ^ 0x5c;
  }
  
  // Inner hash: H(ipad || data)
  const innerData = new Uint8Array(blockSize + dataBytes.length);
  innerData.set(ipad);
  innerData.set(dataBytes, blockSize);
  const innerHash = digest(innerData);
  
  // Outer hash: H(opad || innerHash)
  const outerData = new Uint8Array(blockSize + 32);
  outerData.set(opad);
  outerData.set(hexToBytes(innerHash), blockSize);
  
  return digest(outerData);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
