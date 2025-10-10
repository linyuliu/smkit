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
} from './sm2';
import { SM2CipherMode, type SM2CipherModeType } from './constants';

/**
 * SM2 class providing object-oriented API for elliptic curve cryptography
 */
export class SM2 {
  private publicKey?: string;
  private privateKey?: string;
  private curveParams?: SM2CurveParams;

  /**
   * Create a new SM2 instance
   * @param keyPair - Optional key pair (publicKey and/or privateKey)
   * @param curveParams - Optional custom elliptic curve parameters
   */
  constructor(keyPair?: Partial<KeyPair>, curveParams?: SM2CurveParams) {
    this.publicKey = keyPair?.publicKey;
    this.privateKey = keyPair?.privateKey;
    this.curveParams = curveParams;
  }

  /**
   * Generate a new key pair
   * @returns New SM2 instance with generated key pair
   */
  static generateKeyPair(curveParams?: SM2CurveParams): SM2 {
    const keyPair = generateKeyPairFunc();
    return new SM2(keyPair, curveParams);
  }

  /**
   * Create SM2 instance from private key
   * @param privateKey - Private key as hex string
   * @param curveParams - Optional custom elliptic curve parameters
   * @returns New SM2 instance
   */
  static fromPrivateKey(privateKey: string, curveParams?: SM2CurveParams): SM2 {
    const publicKey = getPublicKeyFromPrivateKeyFunc(privateKey);
    return new SM2({ privateKey, publicKey }, curveParams);
  }

  /**
   * Create SM2 instance from public key
   * @param publicKey - Public key as hex string
   * @param curveParams - Optional custom elliptic curve parameters
   * @returns New SM2 instance
   */
  static fromPublicKey(publicKey: string, curveParams?: SM2CurveParams): SM2 {
    return new SM2({ publicKey }, curveParams);
  }

  /**
   * Get public key
   */
  getPublicKey(): string {
    if (!this.publicKey) {
      if (this.privateKey) {
        this.publicKey = getPublicKeyFromPrivateKeyFunc(this.privateKey);
      } else {
        throw new Error('No public key or private key available');
      }
    }
    return this.publicKey;
  }

  /**
   * Get private key
   */
  getPrivateKey(): string {
    if (!this.privateKey) {
      throw new Error('No private key available');
    }
    return this.privateKey;
  }

  /**
   * Encrypt data
   * @param data - Data to encrypt
   * @param mode - Cipher mode (default: C1C3C2)
   * @returns Encrypted data as hex string
   */
  encrypt(data: string | Uint8Array, mode: SM2CipherModeType = SM2CipherMode.C1C3C2): string {
    const publicKey = this.getPublicKey();
    return encryptFunc(publicKey, data, mode);
  }

  /**
   * Decrypt data
   * @param encryptedData - Encrypted data as hex string
   * @param mode - Cipher mode (default: C1C3C2)
   * @returns Decrypted data as string
   */
  decrypt(encryptedData: string, mode: SM2CipherModeType = SM2CipherMode.C1C3C2): string {
    const privateKey = this.getPrivateKey();
    return decryptFunc(privateKey, encryptedData, mode);
  }

  /**
   * Sign data
   * @param data - Data to sign
   * @param options - Sign options
   * @returns Signature as hex string
   */
  sign(data: string | Uint8Array, options?: Omit<FuncSignOptions, 'curveParams'>): string {
    const privateKey = this.getPrivateKey();
    return signFunc(privateKey, data, { ...options, curveParams: this.curveParams });
  }

  /**
   * Verify signature
   * @param data - Original data
   * @param signature - Signature as hex string
   * @param options - Verify options
   * @returns true if signature is valid
   */
  verify(data: string | Uint8Array, signature: string, options?: Omit<FuncVerifyOptions, 'curveParams'>): boolean {
    const publicKey = this.getPublicKey();
    return verifyFunc(publicKey, data, signature, { ...options, curveParams: this.curveParams });
  }

  /**
   * Set custom curve parameters
   * @param curveParams - Custom elliptic curve parameters
   */
  setCurveParams(curveParams: SM2CurveParams): void {
    this.curveParams = curveParams;
  }

  /**
   * Get curve parameters
   */
  getCurveParams(): SM2CurveParams | undefined {
    return this.curveParams;
  }
}
