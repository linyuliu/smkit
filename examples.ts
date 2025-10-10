/**
 * Example usage of SMKit
 * Run with: npx tsx examples.ts
 */

import {
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
} from './src/index';

console.log('=== SMKit Examples ===\n');

// SM3 Examples
console.log('--- SM3 Hash ---');
const hash1 = digest('abc');
console.log('SM3("abc"):', hash1);

const hash2 = digest('Hello, World!');
console.log('SM3("Hello, World!"):', hash2);

const mac = hmac('key', 'message');
console.log('HMAC-SM3("key", "message"):', mac);
console.log();

// SM4 Examples
console.log('--- SM4 Block Cipher ---');
const sm4Key = '0123456789abcdeffedcba9876543210';
const plaintext = 'Hello, SM4!';

// ECB mode
const encryptedECB = sm4Encrypt(sm4Key, plaintext, { mode: 'ECB', padding: 'Pkcs7' });
console.log('SM4 ECB Encrypted:', encryptedECB);
const decryptedECB = sm4Decrypt(sm4Key, encryptedECB, { mode: 'ECB', padding: 'Pkcs7' });
console.log('SM4 ECB Decrypted:', decryptedECB);

// CBC mode
const iv = 'fedcba98765432100123456789abcdef';
const encryptedCBC = sm4Encrypt(sm4Key, plaintext, { mode: 'CBC', padding: 'Pkcs7', iv });
console.log('SM4 CBC Encrypted:', encryptedCBC);
const decryptedCBC = sm4Decrypt(sm4Key, encryptedCBC, { mode: 'CBC', padding: 'Pkcs7', iv });
console.log('SM4 CBC Decrypted:', decryptedCBC);
console.log();

// SM2 Examples
console.log('--- SM2 Elliptic Curve ---');
const keyPair = generateKeyPair();
console.log('Generated key pair:');
console.log('  Public Key:', keyPair.publicKey.slice(0, 40) + '...');
console.log('  Private Key:', keyPair.privateKey.slice(0, 40) + '...');

const sm2Plaintext = 'Hello, SM2!';
const encryptedSM2 = sm2Encrypt(keyPair.publicKey, sm2Plaintext, 'C1C3C2');
console.log('SM2 Encrypted:', encryptedSM2.slice(0, 40) + '...');
const decryptedSM2 = sm2Decrypt(keyPair.privateKey, encryptedSM2, 'C1C3C2');
console.log('SM2 Decrypted:', decryptedSM2);

const message = 'Message to sign';
const signature = sign(keyPair.privateKey, message);
console.log('SM2 Signature:', signature.slice(0, 40) + '...');
const isValid = verify(keyPair.publicKey, message, signature);
console.log('Signature Valid:', isValid);
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
