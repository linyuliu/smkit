/**
 * SM2 类，提供面向对象的 API
 */

import {
  generateKeyPair as generateKeyPairFunc,
  getPublicKeyFromPrivateKey as getPublicKeyFromPrivateKeyFunc,
  encrypt as encryptFunc,
  decrypt as decryptFunc,
  sign as signFunc,
  verify as verifyFunc,
  type KeyPair,
  type SignOptions as FuncSignOptions,
  type VerifyOptions as FuncVerifyOptions,
  type SM2CurveParams,
} from './index';
import { SM2CipherMode, type SM2CipherModeType } from '../../types/constants';

/**
 * SM2 类，提供椭圆曲线密码学的面向对象 API
 */
export class SM2 {
  private publicKey?: string;
  private privateKey?: string;
  private curveParams?: SM2CurveParams;

  /**
   * 创建新的 SM2 实例
   * @param keyPair - 可选的密钥对（公钥和/或私钥）
   * @param curveParams - 可选的自定义椭圆曲线参数
   */
  constructor(keyPair?: Partial<KeyPair>, curveParams?: SM2CurveParams) {
    this.publicKey = keyPair?.publicKey;
    this.privateKey = keyPair?.privateKey;
    this.curveParams = curveParams;
  }

  /**
   * 生成新的密钥对
   * @param curveParams - 可选的自定义椭圆曲线参数
   * @returns 带有生成的密钥对的新 SM2 实例
   */
  static generateKeyPair(curveParams?: SM2CurveParams): SM2 {
    const keyPair = generateKeyPairFunc();
    return new SM2(keyPair, curveParams);
  }

  /**
   * 从私钥创建 SM2 实例
   * @param privateKey - 私钥（十六进制字符串）
   * @param curveParams - 可选的自定义椭圆曲线参数
   * @returns 新的 SM2 实例
   */
  static fromPrivateKey(privateKey: string, curveParams?: SM2CurveParams): SM2 {
    const publicKey = getPublicKeyFromPrivateKeyFunc(privateKey);
    return new SM2({ privateKey, publicKey }, curveParams);
  }

  /**
   * 从公钥创建 SM2 实例
   * @param publicKey - 公钥（十六进制字符串）
   * @param curveParams - 可选的自定义椭圆曲线参数
   * @returns 新的 SM2 实例
   */
  static fromPublicKey(publicKey: string, curveParams?: SM2CurveParams): SM2 {
    return new SM2({ publicKey }, curveParams);
  }

  /**
   * 获取公钥
   */
  getPublicKey(): string {
    if (!this.publicKey) {
      throw new Error('公钥未设置');
    }
    return this.publicKey;
  }

  /**
   * 获取私钥
   */
  getPrivateKey(): string {
    if (!this.privateKey) {
      throw new Error('私钥未设置');
    }
    return this.privateKey;
  }

  /**
   * 加密数据
   * @param data - 要加密的数据
   * @param mode - 密文模式（默认：C1C3C2）
   * @returns 加密后的数据（十六进制字符串）
   */
  encrypt(data: string | Uint8Array, mode: SM2CipherModeType = SM2CipherMode.C1C3C2): string {
    const publicKey = this.getPublicKey();
    return encryptFunc(publicKey, data, mode);
  }

  /**
   * 解密数据
   * @param encryptedData - 加密的数据（十六进制字符串）
   * @param mode - 密文模式（默认：C1C3C2）
   * @returns 解密后的数据（字符串）
   */
  decrypt(encryptedData: string, mode: SM2CipherModeType = SM2CipherMode.C1C3C2): string {
    const privateKey = this.getPrivateKey();
    return decryptFunc(privateKey, encryptedData, mode);
  }

  /**
   * 签名数据
   * @param data - 要签名的数据
   * @param options - 签名选项
   * @returns 签名（十六进制字符串）
   */
  sign(data: string | Uint8Array, options?: Omit<FuncSignOptions, 'curveParams'>): string {
    const privateKey = this.getPrivateKey();
    return signFunc(privateKey, data, { ...options, curveParams: this.curveParams });
  }

  /**
   * 验证签名
   * @param data - 原始数据
   * @param signature - 签名（十六进制字符串）
   * @param options - 验签选项
   * @returns 签名是否有效
   */
  verify(data: string | Uint8Array, signature: string, options?: Omit<FuncVerifyOptions, 'curveParams'>): boolean {
    const publicKey = this.getPublicKey();
    return verifyFunc(publicKey, data, signature, { ...options, curveParams: this.curveParams });
  }

  /**
   * 设置自定义曲线参数
   * @param curveParams - 自定义椭圆曲线参数
   */
  setCurveParams(curveParams: SM2CurveParams): void {
    this.curveParams = curveParams;
  }

  /**
   * 获取曲线参数
   */
  getCurveParams(): SM2CurveParams | undefined {
    return this.curveParams;
  }
}
