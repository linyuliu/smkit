/**
 * SM2 椭圆曲线公钥密码算法实现
 * 基于 GM/T 0003-2012 标准
 * 
 * 使用 @noble/curves 进行高效的椭圆曲线运算
 */

import { digest as sm3Digest } from '../sm3';
import { normalizeInput, hexToBytes, bytesToHex } from '../../core/utils';
import { SM2CipherMode, type SM2CipherModeType, DEFAULT_USER_ID } from '../../types/constants';
import { sm2, SM2_CURVE_PARAMS } from './curve';
import { encodeSignature, decodeSignature } from '../../core/asn1';

/**
 * SM2 曲线参数接口（用于自定义曲线）
 */
export interface SM2CurveParams {
  p?: string;    // 素数模数
  a?: string;    // 系数 a
  b?: string;    // 系数 b
  Gx?: string;   // 基点 x 坐标
  Gy?: string;   // 基点 y 坐标
  n?: string;    // 阶 n
}

/**
 * 密钥对接口
 */
export interface KeyPair {
  publicKey: string;   // 公钥（十六进制字符串，04 开头的非压缩格式）
  privateKey: string;  // 私钥（十六进制字符串，32 字节）
}

/**
 * 验证字符串是否为有效的十六进制字符串（不使用正则表达式）
 */
function isValidHexString(str: string): boolean {
  if (str.length === 0) {
    return false;
  }
  
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    // 检查是否为 0-9, a-f, A-F
    const isDigit = c >= 48 && c <= 57;  // 0-9
    const isLowerHex = c >= 97 && c <= 102;  // a-f
    const isUpperHex = c >= 65 && c <= 70;  // A-F
    
    if (!isDigit && !isLowerHex && !isUpperHex) {
      return false;
    }
  }
  
  return true;
}

/**
 * 自动识别并规范化私钥输入
 * 支持：hex字符串（带或不带0x前缀）
 */
function normalizePrivateKeyInput(privateKey: string): string {
  let cleaned = privateKey.trim();
  
  // 移除 0x 前缀
  if (cleaned.startsWith('0x') || cleaned.startsWith('0X')) {
    cleaned = cleaned.slice(2);
  }
  
  // 验证是否为有效的十六进制字符串
  if (!isValidHexString(cleaned)) {
    throw new Error('Invalid private key: must be a hexadecimal string');
  }
  
  // 确保长度为64个字符（32字节）
  if (cleaned.length !== 64) {
    // 如果太短，左侧填充0
    if (cleaned.length < 64) {
      cleaned = cleaned.padStart(64, '0');
    } else {
      throw new Error('Invalid private key: must be 32 bytes (64 hex characters)');
    }
  }
  
  return cleaned.toLowerCase();
}

/**
 * 自动识别并规范化公钥输入
 * 支持：压缩格式（02/03开头）和非压缩格式（04开头）
 */
function normalizePublicKeyInput(publicKey: string): string {
  let cleaned = publicKey.trim();
  
  // 移除 0x 前缀
  if (cleaned.startsWith('0x') || cleaned.startsWith('0X')) {
    cleaned = cleaned.slice(2);
  }
  
  // 验证是否为有效的十六进制字符串
  if (!isValidHexString(cleaned)) {
    throw new Error('Invalid public key: must be a hexadecimal string');
  }
  
  cleaned = cleaned.toLowerCase();
  
  // 检查格式
  const prefix = cleaned.slice(0, 2);
  
  if (prefix === '04') {
    // 非压缩格式：130个字符（65字节）
    if (cleaned.length !== 130) {
      throw new Error('Invalid uncompressed public key: must be 65 bytes (130 hex characters)');
    }
    return cleaned;
  } else if (prefix === '02' || prefix === '03') {
    // 压缩格式：66个字符（33字节）- 需要解压
    if (cleaned.length !== 66) {
      throw new Error('Invalid compressed public key: must be 33 bytes (66 hex characters)');
    }
    // 使用 @noble/curves 解压公钥
    const point = sm2.Point.fromHex(cleaned);
    const uncompressedBytes = point.toBytes(false); // false = 非压缩格式
    return bytesToHex(uncompressedBytes);
  } else {
    throw new Error('Invalid public key prefix: must be 02, 03, or 04');
  }
}

/**
 * 常量时间比较两个 Uint8Array（防止时序攻击）
 */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  
  return result === 0;
}

/**
 * 计算 Z 值（用于签名）
 * Z = SM3(ENTL || ID || a || b || xG || yG || xA || yA)
 */
function computeZ(userId: string, publicKey: string): Uint8Array {
  const userIdBytes = normalizeInput(userId);
  const entl = new Uint8Array(2);
  const bitLength = userIdBytes.length * 8;
  entl[0] = (bitLength >> 8) & 0xff;
  entl[1] = bitLength & 0xff;
  
  const publicKeyBytes = hexToBytes(publicKey);
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);
  
  // 使用常量的曲线参数
  const a = hexToBytes(SM2_CURVE_PARAMS.a);
  const b = hexToBytes(SM2_CURVE_PARAMS.b);
  const xG = hexToBytes(SM2_CURVE_PARAMS.Gx);
  const yG = hexToBytes(SM2_CURVE_PARAMS.Gy);
  
  // 连接所有部分
  const totalLength = entl.length + userIdBytes.length + a.length + b.length + 
                      xG.length + yG.length + x.length + y.length;
  const data = new Uint8Array(totalLength);
  let offset = 0;
  
  data.set(entl, offset); offset += entl.length;
  data.set(userIdBytes, offset); offset += userIdBytes.length;
  data.set(a, offset); offset += a.length;
  data.set(b, offset); offset += b.length;
  data.set(xG, offset); offset += xG.length;
  data.set(yG, offset); offset += yG.length;
  data.set(x, offset); offset += x.length;
  data.set(y, offset);
  
  // sm3Digest 返回 hex 字符串，需要转换为 Uint8Array
  const zHex = sm3Digest(data);
  return hexToBytes(zHex);
}

/**
 * 签名选项
 */
export interface SignOptions {
  der?: boolean;              // 是否使用 DER 编码
  userId?: string;            // 用户 ID（默认：'1234567812345678'）
  curveParams?: SM2CurveParams;  // 自定义曲线参数
  skipZComputation?: boolean;  // 是否跳过 Z 值计算（如果为 true，则直接对数据进行签名，不计算 SM3(Z || M)）
}

/**
 * 验签选项
 */
export interface VerifyOptions {
  der?: boolean;              // 是否使用 DER 编码
  userId?: string;            // 用户 ID（默认：'1234567812345678'）
  curveParams?: SM2CurveParams;  // 自定义曲线参数
  skipZComputation?: boolean;  // 是否跳过 Z 值计算（必须与签名时保持一致）
}

/**
 * 生成 SM2 密钥对
 * @param compressed - 是否返回压缩格式的公钥（默认 false，返回非压缩格式）
 * @returns 包含公钥和私钥的对象
 */
export function generateKeyPair(compressed: boolean = false): KeyPair {
  // 使用 @noble/curves 的 keygen
  const privateKey = sm2.keygen().secretKey;
  
  // 从私钥导出公钥，确保格式正确
  const publicKeyBytes = sm2.getPublicKey(privateKey, compressed);
  
  return {
    publicKey: bytesToHex(publicKeyBytes),
    privateKey: bytesToHex(privateKey),
  };
}

/**
 * 从私钥导出公钥
 * @param privateKey - 私钥（十六进制字符串）
 * @param compressed - 是否返回压缩格式（默认 false，返回非压缩格式）
 * @returns 公钥（十六进制字符串，压缩格式：02/03 + x，非压缩格式：04 + x + y）
 */
export function getPublicKeyFromPrivateKey(privateKey: string, compressed: boolean = false): string {
  // 自动识别输入格式
  const cleanPrivateKey = normalizePrivateKeyInput(privateKey);
  
  // 使用 @noble/curves 从私钥计算公钥
  const privateKeyBytes = hexToBytes(cleanPrivateKey);
  const publicKeyBytes = sm2.getPublicKey(privateKeyBytes, compressed);
  
  return bytesToHex(publicKeyBytes);
}

/**
 * 压缩公钥（从非压缩格式转换为压缩格式）
 * @param publicKey - 非压缩格式的公钥（十六进制字符串，04 + x + y）
 * @returns 压缩格式的公钥（十六进制字符串，02/03 + x）
 */
export function compressPublicKey(publicKey: string): string {
  // 规范化输入
  const cleanPublicKey = normalizePublicKeyInput(publicKey);
  
  // 使用 @noble/curves 压缩公钥
  const point = sm2.Point.fromHex(cleanPublicKey);
  const compressedBytes = point.toBytes(true); // true = 压缩格式
  
  return bytesToHex(compressedBytes);
}

/**
 * 解压公钥（从压缩格式转换为非压缩格式）
 * @param publicKey - 压缩格式的公钥（十六进制字符串，02/03 + x）
 * @returns 非压缩格式的公钥（十六进制字符串，04 + x + y）
 */
export function decompressPublicKey(publicKey: string): string {
  let cleaned = publicKey.trim();
  
  // 移除 0x 前缀
  if (cleaned.startsWith('0x') || cleaned.startsWith('0X')) {
    cleaned = cleaned.slice(2);
  }
  
  // 验证是否为有效的十六进制字符串
  if (!isValidHexString(cleaned)) {
    throw new Error('Invalid public key: must be a hexadecimal string');
  }
  
  cleaned = cleaned.toLowerCase();
  
  const prefix = cleaned.slice(0, 2);
  
  if (prefix === '04') {
    // 已经是非压缩格式
    return cleaned;
  } else if (prefix === '02' || prefix === '03') {
    // 压缩格式，需要解压
    const point = sm2.Point.fromHex(cleaned);
    const uncompressedBytes = point.toBytes(false); // false = 非压缩格式
    return bytesToHex(uncompressedBytes);
  } else {
    throw new Error('Invalid public key prefix: must be 02, 03, or 04');
  }
}

/**
 * KDF（密钥派生函数）
 * 使用 SM3 作为哈希函数
 */
function kdf(z: Uint8Array, klen: number): Uint8Array {
  const ct = new Uint8Array(4);
  const k = new Uint8Array(klen);
  let offset = 0;
  
  for (let i = 1; offset < klen; i++) {
    // 将计数器转换为 32 位大端字节
    ct[0] = (i >> 24) & 0xff;
    ct[1] = (i >> 16) & 0xff;
    ct[2] = (i >> 8) & 0xff;
    ct[3] = i & 0xff;
    
    // 计算 SM3(Z || ct)
    const input = new Uint8Array(z.length + ct.length);
    input.set(z, 0);
    input.set(ct, z.length);
    const hashHex = sm3Digest(input);
    const hash = hexToBytes(hashHex);
    
    // 将哈希结果追加到密钥流
    const toCopy = Math.min(hash.length, klen - offset);
    k.set(hash.slice(0, toCopy), offset);
    offset += toCopy;
  }
  
  // 验证派生的密钥不全为零
  let isZero = true;
  for (let i = 0; i < k.length; i++) {
    if (k[i] !== 0) {
      isZero = false;
      break;
    }
  }
  
  if (isZero) {
    throw new Error('KDF derived key is all zeros - invalid point multiplication result');
  }
  
  return k;
}

/**
 * 使用 SM2 加密数据
 * @param publicKey - 公钥（十六进制字符串）
 * @param data - 要加密的数据（字符串或 Uint8Array）
 * @param mode - 密文模式：'C1C3C2'（默认）或 'C1C2C3'
 * @returns 加密后的数据（十六进制字符串）
 */
export function encrypt(
  publicKey: string,
  data: string | Uint8Array,
  mode: SM2CipherModeType = SM2CipherMode.C1C3C2
): string {
  // 自动识别并规范化公钥输入
  const cleanPublicKey = normalizePublicKeyInput(publicKey);
  const plainBytes = normalizeInput(data);
  
  // 解析公钥点
  const publicKeyPoint = sm2.Point.fromHex(cleanPublicKey);
  
  // 生成随机数 k
  const k = sm2.keygen().secretKey;
  
  // 计算 C1 = k·G（椭圆曲线点乘）
  const c1Point = sm2.Point.BASE.multiply(BigInt('0x' + bytesToHex(k)));
  const c1Bytes = c1Point.toBytes(false); // 非压缩格式
  
  // 计算 S = h·Pb（其中 h=1）
  // 计算 [k]PB
  const kPbPoint = publicKeyPoint.multiply(BigInt('0x' + bytesToHex(k)));
  const kPbBytes = kPbPoint.toBytes(false);
  
  // x2, y2 是 [k]PB 的坐标
  const x2 = kPbBytes.slice(1, 33);
  const y2 = kPbBytes.slice(33, 65);
  
  // 计算 t = KDF(x2 || y2, klen)
  const kdfInput = new Uint8Array(x2.length + y2.length);
  kdfInput.set(x2, 0);
  kdfInput.set(y2, x2.length);
  const t = kdf(kdfInput, plainBytes.length);
  
  // 计算 C2 = M ⊕ t
  const c2 = new Uint8Array(plainBytes.length);
  for (let i = 0; i < plainBytes.length; i++) {
    c2[i] = plainBytes[i] ^ t[i];
  }
  
  // 计算 C3 = SM3(x2 || M || y2)
  const c3Input = new Uint8Array(x2.length + plainBytes.length + y2.length);
  c3Input.set(x2, 0);
  c3Input.set(plainBytes, x2.length);
  c3Input.set(y2, x2.length + plainBytes.length);
  const c3Hex = sm3Digest(c3Input);
  const c3 = hexToBytes(c3Hex);
  
  // 根据模式组合密文
  if (mode === SM2CipherMode.C1C2C3) {
    // C1 || C2 || C3
    const ciphertext = new Uint8Array(c1Bytes.length + c2.length + c3.length);
    ciphertext.set(c1Bytes, 0);
    ciphertext.set(c2, c1Bytes.length);
    ciphertext.set(c3, c1Bytes.length + c2.length);
    return bytesToHex(ciphertext);
  } else {
    // C1 || C3 || C2（默认）
    const ciphertext = new Uint8Array(c1Bytes.length + c3.length + c2.length);
    ciphertext.set(c1Bytes, 0);
    ciphertext.set(c3, c1Bytes.length);
    ciphertext.set(c2, c1Bytes.length + c3.length);
    return bytesToHex(ciphertext);
  }
}

/**
 * 使用 SM2 解密数据
 * @param privateKey - 私钥（十六进制字符串）
 * @param encryptedData - 加密的数据（十六进制字符串）
 * @param mode - 密文模式：'C1C3C2'（默认）或 'C1C2C3'
 * @returns 解密后的数据（UTF-8 字符串）
 */
export function decrypt(
  privateKey: string,
  encryptedData: string,
  mode: SM2CipherModeType = SM2CipherMode.C1C3C2
): string {
  // 自动识别并规范化私钥输入
  const cleanPrivateKey = normalizePrivateKeyInput(privateKey);
  const cipherBytes = hexToBytes(encryptedData);
  
  // 解析密文：C1（65字节，非压缩格式）|| C3（32字节）|| C2（剩余）或 C1 || C2 || C3
  const c1Length = 65; // 非压缩格式的椭圆曲线点
  const c3Length = 32; // SM3 哈希长度
  
  if (cipherBytes.length < c1Length + c3Length) {
    throw new Error('Invalid ciphertext: too short');
  }
  
  // 提取 C1
  const c1Bytes = cipherBytes.slice(0, c1Length);
  const c1Point = sm2.Point.fromHex(bytesToHex(c1Bytes));
  
  // 根据模式提取 C2 和 C3
  let c2: Uint8Array;
  let c3: Uint8Array;
  
  if (mode === SM2CipherMode.C1C2C3) {
    // C1 || C2 || C3
    c2 = cipherBytes.slice(c1Length, cipherBytes.length - c3Length);
    c3 = cipherBytes.slice(cipherBytes.length - c3Length);
  } else {
    // C1 || C3 || C2（默认）
    c3 = cipherBytes.slice(c1Length, c1Length + c3Length);
    c2 = cipherBytes.slice(c1Length + c3Length);
  }
  
  // 计算 [dB]C1
  const privateKeyBigInt = BigInt('0x' + cleanPrivateKey);
  const s = c1Point.multiply(privateKeyBigInt);
  const sBytes = s.toBytes(false);
  
  // x2, y2 是 [dB]C1 的坐标
  const x2 = sBytes.slice(1, 33);
  const y2 = sBytes.slice(33, 65);
  
  // 计算 t = KDF(x2 || y2, klen)
  const kdfInput = new Uint8Array(x2.length + y2.length);
  kdfInput.set(x2, 0);
  kdfInput.set(y2, x2.length);
  const t = kdf(kdfInput, c2.length);
  
  // 计算 M' = C2 ⊕ t
  const plainBytes = new Uint8Array(c2.length);
  for (let i = 0; i < c2.length; i++) {
    plainBytes[i] = c2[i] ^ t[i];
  }
  
  // 计算 u = SM3(x2 || M' || y2) 并验证 u === C3
  const c3VerifyInput = new Uint8Array(x2.length + plainBytes.length + y2.length);
  c3VerifyInput.set(x2, 0);
  c3VerifyInput.set(plainBytes, x2.length);
  c3VerifyInput.set(y2, x2.length + plainBytes.length);
  const c3VerifyHex = sm3Digest(c3VerifyInput);
  const c3Verify = hexToBytes(c3VerifyHex);
  
  // 验证 C3（使用常量时间比较防止时序攻击）
  if (!constantTimeEqual(c3, c3Verify)) {
    throw new Error('Decryption failed: C3 verification failed');
  }
  
  // 将字节转换为 UTF-8 字符串
  return new TextDecoder().decode(plainBytes);
}

/**
 * 使用 SM2 签名数据
 * @param privateKey - 私钥（十六进制字符串）
 * @param data - 要签名的数据（字符串或 Uint8Array）
 * @param options - 签名选项
 * @returns 签名（十六进制字符串，默认 r || s 格式，如果 der=true 则为 DER 编码）
 */
export function sign(
  privateKey: string,
  data: string | Uint8Array,
  options?: SignOptions
): string {
  // 自动识别并规范化私钥输入
  const cleanPrivateKey = normalizePrivateKeyInput(privateKey);
  const userId = options?.userId || DEFAULT_USER_ID;
  const useDer = options?.der || false;
  const skipZ = options?.skipZComputation || false;
  
  // 使用 @noble/curves 进行签名
  const privateKeyBytes = hexToBytes(cleanPrivateKey);
  
  let e: Uint8Array;
  
  if (skipZ) {
    // 跳过 Z 值计算，直接对数据进行 SM3 哈希
    const dataBytes = normalizeInput(data);
    const eHex = sm3Digest(dataBytes);
    e = hexToBytes(eHex);
  } else {
    // 标准流程：计算 Z 值并与数据一起哈希
    // 从私钥获取公钥
    const publicKey = getPublicKeyFromPrivateKey(cleanPrivateKey);
    
    // 计算 Z 值（使用本库实现的 SM3）
    const z = computeZ(userId, publicKey);
    
    // 计算消息摘要 e = SM3(Z || M)（使用本库实现的 SM3）
    const dataBytes = normalizeInput(data);
    const hashInput = new Uint8Array(z.length + dataBytes.length);
    hashInput.set(z, 0);
    hashInput.set(dataBytes, z.length);
    const eHex = sm3Digest(hashInput);
    e = hexToBytes(eHex);
  }
  
  // prehash: false 因为我们已经计算了 SM3 哈希
  const signatureBytes = sm2.sign(e, privateKeyBytes, { prehash: false });
  
  // 解析签名（compact 格式：r || s，各32字节）
  const r = bytesToHex(signatureBytes.slice(0, 32));
  const s = bytesToHex(signatureBytes.slice(32, 64));
  
  // 根据选项返回 DER 编码或原始格式
  if (useDer) {
    const derBytes = encodeSignature(r, s);
    return bytesToHex(derBytes);
  }
  
  return r + s;
}

/**
 * 使用 SM2 验证签名
 * @param publicKey - 公钥（十六进制字符串）
 * @param data - 原始数据（字符串或 Uint8Array）
 * @param signature - 签名（十六进制字符串，r || s 格式或 DER 编码）
 * @param options - 验签选项
 * @returns 签名是否有效
 */
export function verify(
  publicKey: string,
  data: string | Uint8Array,
  signature: string,
  options?: VerifyOptions
): boolean {
  try {
    // 自动识别并规范化公钥输入
    const cleanPublicKey = normalizePublicKeyInput(publicKey);
    const userId = options?.userId || DEFAULT_USER_ID;
    const isDer = options?.der || false;
    const skipZ = options?.skipZComputation || false;
    
    let e: Uint8Array;
    
    if (skipZ) {
      // 跳过 Z 值计算，直接对数据进行 SM3 哈希（使用本库实现的 SM3）
      const dataBytes = normalizeInput(data);
      const eHex = sm3Digest(dataBytes);
      e = hexToBytes(eHex);
    } else {
      // 标准流程：计算 Z 值并与数据一起哈希
      // 计算 Z 值（使用本库实现的 SM3）
      const z = computeZ(userId, cleanPublicKey);
      
      // 计算消息摘要 e = SM3(Z || M)（使用本库实现的 SM3）
      const dataBytes = normalizeInput(data);
      const hashInput = new Uint8Array(z.length + dataBytes.length);
      hashInput.set(z, 0);
      hashInput.set(dataBytes, z.length);
      const eHex = sm3Digest(hashInput);
      e = hexToBytes(eHex);
    }
    
    // 解析签名
    let r: string, s: string;
    
    if (isDer) {
      // 自动识别：如果以 30 开头，可能是 DER 编码
      const sigBytes = hexToBytes(signature);
      const decoded = decodeSignature(sigBytes);
      r = decoded.r;
      s = decoded.s;
    } else {
      // 尝试自动识别格式
      if (signature.length === 128) {
        // 原始格式 r || s
        r = signature.slice(0, 64);
        s = signature.slice(64, 128);
      } else if (signature.startsWith('30')) {
        // 可能是 DER 编码
        const sigBytes = hexToBytes(signature);
        const decoded = decodeSignature(sigBytes);
        r = decoded.r;
        s = decoded.s;
      } else {
        throw new Error('Invalid signature format');
      }
    }
    
    // 使用 @noble/curves 验证签名
    const publicKeyBytes = hexToBytes(cleanPublicKey);
    
    // 构造签名字节（compact 格式：r || s）
    const rBytes = hexToBytes(r.padStart(64, '0'));
    const sBytes = hexToBytes(s.padStart(64, '0'));
    const signatureBytes = new Uint8Array(64);
    signatureBytes.set(rBytes, 0);
    signatureBytes.set(sBytes, 32);
    
    // prehash: false 因为我们已经计算了 SM3 哈希
    return sm2.verify(signatureBytes, e, publicKeyBytes, { prehash: false });
  } catch (error) {
    // 验证失败
    return false;
  }
}
