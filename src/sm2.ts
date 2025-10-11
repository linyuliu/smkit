/**
 * SM2 module - re-exports from crypto/sm2
 * This file maintains backward compatibility
 */

export type {
  SM2CurveParams,
  KeyPair,
  SignOptions,
  VerifyOptions,
} from './crypto/sm2';

export {
  generateKeyPair,
  getPublicKeyFromPrivateKey,
  encrypt,
  decrypt,
  sign,
  verify,
} from './crypto/sm2';
