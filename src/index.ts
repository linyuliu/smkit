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

// Export ASN.1 utilities
export {
  encodeInteger,
  decodeInteger,
  encodeSequence,
  decodeSequence,
  encodeSignature,
  decodeSignature,
  rawToDer,
  derToRaw,
  ASN1Tag,
} from './asn1';

// Export elliptic curve utilities
export {
  SM2_CURVE,
  isInfinity,
  decompressPublicKey,
  compressPublicKey,
  isPointOnCurve,
  isValidPublicKey,
  parsePublicKey,
  formatPublicKey,
  pointAdd,
  pointDouble,
  pointMultiply,
  getBasePoint,
  computePublicKey,
  type Point,
} from './ec-utils';

// Export OOP classes - named as SM2, SM3, SM4 to match Java conventions
export { SM2 } from './sm2-class';
export { SM3 } from './sm3-class';
export { SM4 } from './sm4-class';

// Export utility functions namespace
import * as Utils from './utils';
import * as ASN1 from './asn1';
import * as ECUtils from './ec-utils';
export { Utils, ASN1, ECUtils };
