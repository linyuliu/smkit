/**
 * Example usage of SMKit
 * Run with: npx tsx examples.ts
 */

import {
  // Functional API
  digest,
  hmac,
  sm4Encrypt,
  sm4Decrypt,
  generateKeyPair,
  sm2Encrypt,
  sm2Decrypt,
  sign,
  verify,
  hexToBytes,
  bytesToHex,
  // Object-Oriented API
  SM2Class,
  SM3Class,
  SM4Class,
  // Constants
  CipherMode,
  PaddingMode,
  SM2CipherMode,
  OID,
  DEFAULT_USER_ID,
} from './src/index';

console.log('=== SMKit Examples ===\n');

// Constants Examples
console.log('--- Constants ---');
console.log('OID.SM2:', OID.SM2);
console.log('OID.SM3:', OID.SM3);
console.log('OID.SM4:', OID.SM4);
console.log('OID.SM2_SM3:', OID.SM2_SM3);
console.log('DEFAULT_USER_ID:', DEFAULT_USER_ID);
console.log();

// SM3 Functional API Examples
console.log('--- SM3 Hash (Functional API) ---');
const hash1 = digest('abc');
console.log('SM3("abc"):', hash1);

const hash2 = digest('Hello, World!');
console.log('SM3("Hello, World!"):', hash2);

const mac = hmac('key', 'message');
console.log('HMAC-SM3("key", "message"):', mac);
console.log();

// SM3 Object-Oriented API Examples
console.log('--- SM3 Hash (OOP API) ---');
const hash3 = SM3Class.digest('abc');
console.log('SM3Class.digest("abc"):', hash3);

const sm3 = new SM3Class();
sm3.update('Hello, ').update('World!');
const hash4 = sm3.digest();
console.log('SM3Class incremental hash:', hash4);
console.log();

// SM4 Functional API Examples
console.log('--- SM4 Block Cipher (Functional API) ---');
const sm4Key = '0123456789abcdeffedcba9876543210';
const plaintext = 'Hello, SM4!';

// ECB mode with constants
const encryptedECB = sm4Encrypt(sm4Key, plaintext, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
console.log('SM4 ECB Encrypted:', encryptedECB);
const decryptedECB = sm4Decrypt(sm4Key, encryptedECB, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
console.log('SM4 ECB Decrypted:', decryptedECB);

// CBC mode with constants
const iv = 'fedcba98765432100123456789abcdef';
const encryptedCBC = sm4Encrypt(sm4Key, plaintext, { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });
console.log('SM4 CBC Encrypted:', encryptedCBC);
const decryptedCBC = sm4Decrypt(sm4Key, encryptedCBC, { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });
console.log('SM4 CBC Decrypted:', decryptedCBC);
console.log();

// SM4 Object-Oriented API Examples
console.log('--- SM4 Block Cipher (OOP API) ---');
const sm4ecb = SM4Class.ECB(sm4Key);
const encrypted1 = sm4ecb.encrypt('Hello, SM4 OOP!');
console.log('SM4Class ECB Encrypted:', encrypted1);
const decrypted1 = sm4ecb.decrypt(encrypted1);
console.log('SM4Class ECB Decrypted:', decrypted1);

const sm4cbc = SM4Class.CBC(sm4Key, iv);
const encrypted2 = sm4cbc.encrypt('Hello, SM4 OOP!');
console.log('SM4Class CBC Encrypted:', encrypted2);
const decrypted2 = sm4cbc.decrypt(encrypted2);
console.log('SM4Class CBC Decrypted:', decrypted2);
console.log();

// SM2 Functional API Examples
console.log('--- SM2 Elliptic Curve (Functional API) ---');
const keyPair = generateKeyPair();
console.log('Generated key pair:');
console.log('  Public Key:', keyPair.publicKey.slice(0, 40) + '...');
console.log('  Private Key:', keyPair.privateKey.slice(0, 40) + '...');

const sm2Plaintext = 'Hello, SM2!';
const encryptedSM2 = sm2Encrypt(keyPair.publicKey, sm2Plaintext, SM2CipherMode.C1C3C2);
console.log('SM2 Encrypted:', encryptedSM2.slice(0, 40) + '...');
const decryptedSM2 = sm2Decrypt(keyPair.privateKey, encryptedSM2, SM2CipherMode.C1C3C2);
console.log('SM2 Decrypted:', decryptedSM2);

const message = 'Message to sign';
const signature = sign(keyPair.privateKey, message, { userId: DEFAULT_USER_ID });
console.log('SM2 Signature:', signature.slice(0, 40) + '...');
const isValid = verify(keyPair.publicKey, message, signature, { userId: DEFAULT_USER_ID });
console.log('Signature Valid:', isValid);
console.log();

// SM2 Object-Oriented API Examples
console.log('--- SM2 Elliptic Curve (OOP API) ---');
const sm2 = SM2Class.generateKeyPair();
console.log('SM2Class generated key pair:');
console.log('  Public Key:', sm2.getPublicKey().slice(0, 40) + '...');
console.log('  Private Key:', sm2.getPrivateKey().slice(0, 40) + '...');

const encrypted3 = sm2.encrypt('Hello, SM2 OOP!');
console.log('SM2Class Encrypted:', encrypted3.slice(0, 40) + '...');
const decrypted3 = sm2.decrypt(encrypted3);
console.log('SM2Class Decrypted:', decrypted3);

const signature2 = sm2.sign('Message to sign');
console.log('SM2Class Signature:', signature2.slice(0, 40) + '...');
const isValid2 = sm2.verify('Message to sign', signature2);
console.log('SM2Class Signature Valid:', isValid2);
console.log();

// Utility Examples
console.log('--- Utilities ---');
const hexStr = '48656c6c6f';
const bytes = hexToBytes(hexStr);
console.log('Hex to Bytes:', hexStr, '->', bytes);
const backToHex = bytesToHex(bytes);
console.log('Bytes to Hex:', bytes, '->', backToHex);
console.log();

console.log('=== Examples Complete ===');
