/**
 * SMKit - Pure TypeScript implementation of Chinese national cryptographic algorithms
 * 
 * This library provides implementations of:
 * - SM2: Elliptic curve public key cryptography
 * - SM3: Cryptographic hash function
 * - SM4: Block cipher
 */

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

// Namespace exports for convenience
import * as SM2 from './sm2';
import * as SM3 from './sm3';
import * as SM4 from './sm4';
import * as Utils from './utils';

export { SM2, SM3, SM4, Utils };
