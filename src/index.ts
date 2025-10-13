/**
 * SMKit - 中国国密算法库
 * 纯 TypeScript 实现的 SM2、SM3、SM4 算法
 */

// SM2 椭圆曲线密码算法
export {
  generateKeyPair,
  getPublicKeyFromPrivateKey,
  compressPublicKey,
  decompressPublicKey,
  encrypt as sm2Encrypt,
  decrypt as sm2Decrypt,
  sign,
  verify,
  keyExchange,
  type KeyPair,
  type SignOptions,
  type VerifyOptions,
  type SM2CurveParams,
  type SM2KeyExchangeParams,
  type SM2KeyExchangeResult,
} from './crypto/sm2';

export { SM2 } from './crypto/sm2/class';

// SM3 哈希算法
export {
  digest,
  hmac,
} from './crypto/sm3';

export { SM3 } from './crypto/sm3/class';

// SM4 分组密码算法
export {
  encrypt as sm4Encrypt,
  decrypt as sm4Decrypt,
  type SM4Options,
  type SM4GCMResult,
} from './crypto/sm4';

export { SM4 } from './crypto/sm4/class';

// 常量
export {
  CipherMode,
  PaddingMode,
  SM2CipherMode,
  OID,
  DEFAULT_USER_ID,
  type CipherModeType,
  type PaddingModeType,
  type SM2CipherModeType,
} from './types/constants';

// 工具函数
export {
  hexToBytes,
  bytesToHex,
  stringToBytes,
  bytesToString,
  normalizeInput,
  xor,
  rotl,
} from './core/utils';

// ASN.1 工具
export {
  encodeSignature,
  decodeSignature,
  rawToDer,
  derToRaw,
  asn1ToXml,
  signatureToXml,
} from './core/asn1';
