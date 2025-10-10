/**
 * SMKit - Pure TypeScript implementation of Chinese national cryptographic algorithms
 * 
 * This library provides implementations of:
 * - SM2: Elliptic curve public key cryptography
 * - SM3: Cryptographic hash function
 * - SM4: Block cipher
 */

// Export constants
export {
  PaddingMode,
  CipherMode,
  SM2CipherMode,
  OID,
  DEFAULT_USER_ID,
  type PaddingModeType,
  type CipherModeType,
  type SM2CipherModeType,
} from './constants';

// Export SM2 functions
export {
  generateKeyPair,
  getPublicKeyFromPrivateKey,
  encrypt as sm2Encrypt,
  decrypt as sm2Decrypt,
  sign,
  verify,
  type KeyPair,
  type SignOptions,
  type VerifyOptions,
  type SM2CurveParams,
} from './sm2';

// Export SM3 functions
export {
  digest,
  hmac,
} from './sm3';

// Export SM4 functions
export {
  encrypt as sm4Encrypt,
  decrypt as sm4Decrypt,
  type SM4Options,
} from './sm4';

// Export utility functions
export {
  hexToBytes,
  bytesToHex,
  stringToBytes,
  bytesToString,
  normalizeInput,
  xor,
  rotl,
  bytes4ToUint32BE,
  uint32ToBytes4BE,
} from './utils';

// Export OOP classes
export { SM2 as SM2Class } from './sm2-class';
export { SM3 as SM3Class } from './sm3-class';
export { SM4 as SM4Class } from './sm4-class';

// Namespace exports for convenience
import * as SM2Funcs from './sm2';
import * as SM3Funcs from './sm3';
import * as SM4Funcs from './sm4';
import * as Utils from './utils';

export { SM2Funcs as SM2, SM3Funcs as SM3, SM4Funcs as SM4, Utils };
