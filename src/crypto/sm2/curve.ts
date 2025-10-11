/**
 * SM2 椭圆曲线参数和工具函数
 * 基于 GM/T 0003-2012 标准
 * 
 * 使用 @noble/curves 进行高效的椭圆曲线运算
 */

import { weierstrass, ecdsa } from '@noble/curves/abstract/weierstrass.js';
import { Field } from '@noble/curves/abstract/modular.js';
import { sha256 } from '@noble/hashes/sha2.js';

/**
 * SM2 推荐曲线参数 (GM/T 0003-2012)
 * 素数域 p = 2^256 - 2^224 - 2^96 + 2^64 - 1
 */
export const SM2_CURVE_PARAMS = {
  // 素数模数 p
  p: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFF',
  // 系数 a
  a: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFC',
  // 系数 b  
  b: '28E9FA9E9D9F5E344D5A9E4BCF6509A7F39789F515AB8F92DDBCBD414D940E93',
  // 基点 x 坐标
  Gx: '32C4AE2C1F1981195F9904466A39C9948FE30BBFF2660BE1715A4589334C74C7',
  // 基点 y 坐标
  Gy: 'BC3736A2F4F6779C59BDCEE36B692153D0A9877CC62A474002DF32E52139F0A0',
  // 阶 n
  n: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFF7203DF6B21C6052B53BBF40939D54123',
  // 余因子
  h: 1,
} as const;

/**
 * 从十六进制字符串创建 bigint
 */
export function hexToBigInt(hex: string): bigint {
  if (hex.startsWith('0x')) {
    return BigInt(hex);
  }
  return BigInt('0x' + hex);
}

/**
 * 将 bigint 转换为十六进制字符串（固定长度）
 */
export function bigIntToHex(value: bigint, length: number = 64): string {
  return value.toString(16).padStart(length, '0');
}

/**
 * 生成随机字节的跨平台函数
 * 优雅地处理 Node.js 和浏览器环境
 * 
 * 在 Node.js 环境中，通过 test/setup.ts 中的 polyfill 提供 crypto.getRandomValues
 * 在浏览器环境中，直接使用 Web Crypto API
 */
function getRandomBytes(bytesLength: number = 32): Uint8Array {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(new Uint8Array(bytesLength));
  }
  
  throw new Error('crypto.getRandomValues is not available. Please ensure crypto is available in your environment.');
}

// SM2 曲线参数（BigInt格式）
const sm2CurveConfig = {
  p: hexToBigInt(SM2_CURVE_PARAMS.p),
  a: hexToBigInt(SM2_CURVE_PARAMS.a),
  b: hexToBigInt(SM2_CURVE_PARAMS.b),
  Gx: hexToBigInt(SM2_CURVE_PARAMS.Gx),
  Gy: hexToBigInt(SM2_CURVE_PARAMS.Gy),
  n: hexToBigInt(SM2_CURVE_PARAMS.n),
  h: BigInt(SM2_CURVE_PARAMS.h),
};

// 创建有限域
const Fp = Field(sm2CurveConfig.p);

// 创建椭圆曲线点
const sm2Point = weierstrass(sm2CurveConfig, {
  Fp,
});

/**
 * SM2 椭圆曲线实例（带签名/验签功能）
 * 使用 @noble/curves 的 ecdsa 包装器
 */
export const sm2 = ecdsa(sm2Point, sha256, {
  randomBytes: getRandomBytes,
});
