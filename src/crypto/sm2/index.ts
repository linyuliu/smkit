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
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
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
  if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
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
}

/**
 * 验签选项
 */
export interface VerifyOptions {
  der?: boolean;              // 是否使用 DER 编码
  userId?: string;            // 用户 ID（默认：'1234567812345678'）
  curveParams?: SM2CurveParams;  // 自定义曲线参数
}

/**
 * 生成 SM2 密钥对
 * @returns 包含公钥和私钥的对象
 */
export function generateKeyPair(): KeyPair {
  // 使用 @noble/curves 的 keygen
  const keyPair = sm2.keygen();
  
  return {
    publicKey: bytesToHex(keyPair.publicKey),
    privateKey: bytesToHex(keyPair.secretKey),
  };
}

/**
 * 从私钥导出公钥
 * @param privateKey - 私钥（十六进制字符串）
 * @returns 公钥（十六进制字符串，非压缩格式：04 + x + y）
 */
export function getPublicKeyFromPrivateKey(privateKey: string): string {
  // 自动识别输入格式
  const cleanPrivateKey = normalizePrivateKeyInput(privateKey);
  
  // 使用 @noble/curves 从私钥计算公钥
  const privateKeyBytes = hexToBytes(cleanPrivateKey);
  const publicKeyBytes = sm2.getPublicKey(privateKeyBytes, false); // false = 非压缩格式
  
  return bytesToHex(publicKeyBytes);
}

/**
 * 使用 SM2 加密数据
 * @param publicKey - 公钥（十六进制字符串）
 * @param data - 要加密的数据（字符串或 Uint8Array）
 * @param mode - 密文模式：'C1C3C2'（默认）或 'C1C2C3'
 * @returns 加密后的数据（十六进制字符串）
 */
export function encrypt(
  _publicKey: string,
  data: string | Uint8Array,
  mode: SM2CipherModeType = SM2CipherMode.C1C3C2
): string {
  const plainBytes = normalizeInput(data);
  
  // 占位实现：使用 SM3 哈希作为示例
  const hash = sm3Digest(plainBytes);
  return mode + hash;
}

/**
 * 使用 SM2 解密数据
 * @param privateKey - 私钥（十六进制字符串）
 * @param encryptedData - 加密的数据（十六进制字符串）
 * @param mode - 密文模式：'C1C3C2'（默认）或 'C1C2C3'
 * @returns 解密后的数据（UTF-8 字符串）
 */
export function decrypt(
  _privateKey: string,
  _encryptedData: string,
  _mode: SM2CipherModeType = SM2CipherMode.C1C3C2
): string {
  // 占位实现：返回固定字符串
  return 'decrypted data';
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
  
  // 从私钥获取公钥
  const publicKey = getPublicKeyFromPrivateKey(cleanPrivateKey);
  
  // 计算 Z 值
  const z = computeZ(userId, publicKey);
  
  // 计算消息摘要 e = SM3(Z || M)
  const dataBytes = normalizeInput(data);
  const hashInput = new Uint8Array(z.length + dataBytes.length);
  hashInput.set(z, 0);
  hashInput.set(dataBytes, z.length);
  const eHex = sm3Digest(hashInput);
  const e = hexToBytes(eHex);
  
  // 使用 @noble/curves 进行签名
  const privateKeyBytes = hexToBytes(cleanPrivateKey);
  
  // prehash: false 因为我们已经计算了 SM3(Z || M)
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
    
    // 计算 Z 值
    const z = computeZ(userId, cleanPublicKey);
    
    // 计算消息摘要 e = SM3(Z || M)
    const dataBytes = normalizeInput(data);
    const hashInput = new Uint8Array(z.length + dataBytes.length);
    hashInput.set(z, 0);
    hashInput.set(dataBytes, z.length);
    const eHex = sm3Digest(hashInput);
    const e = hexToBytes(eHex);
    
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
    
    // prehash: false 因为我们已经计算了 SM3(Z || M)
    return sm2.verify(signatureBytes, e, publicKeyBytes, { prehash: false });
  } catch (error) {
    // 验证失败
    return false;
  }
}
