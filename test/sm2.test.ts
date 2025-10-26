import { describe, it, expect } from 'vitest';
import {
  generateKeyPair,
  getPublicKeyFromPrivateKey,
  compressPublicKey,
  decompressPublicKey,
  encrypt,
  decrypt,
  sign,
  verify,
  keyExchange,
} from '../src/crypto/sm2';
import { SM2CipherMode, DEFAULT_USER_ID } from '../src/types/constants';

describe('SM2 Cryptographic Algorithm', () => {
  describe('Key Pair Generation', () => {
    it('should generate key pair', () => {
      const keyPair = generateKeyPair();
      expect(keyPair.publicKey).toBeTruthy();
      expect(keyPair.privateKey).toBeTruthy();
      expect(keyPair.publicKey).toMatch(/^[0-9a-f]+$/);
      expect(keyPair.privateKey).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different keys each time', () => {
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    });
  });

  describe('Derive Public Key from Private Key', () => {
    it('should derive uncompressed public key from private key', () => {
      const privateKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const publicKey = getPublicKeyFromPrivateKey(privateKey);
      expect(publicKey).toBeTruthy();
      expect(publicKey).toMatch(/^[0-9a-f]+$/);
      expect(publicKey.startsWith('04')).toBe(true); // uncompressed format
      expect(publicKey.length).toBe(130); // 65 bytes = 130 hex chars
    });

    it('should derive compressed public key from private key', () => {
      const privateKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const publicKey = getPublicKeyFromPrivateKey(privateKey, true);
      expect(publicKey).toBeTruthy();
      expect(publicKey).toMatch(/^[0-9a-f]+$/);
      expect(publicKey.startsWith('02') || publicKey.startsWith('03')).toBe(true); // compressed format
      expect(publicKey.length).toBe(66); // 33 bytes = 66 hex chars
    });
  });

  describe('Public Key Compression and Decompression', () => {
    it('should compress uncompressed public key', () => {
      const keyPair = generateKeyPair();
      const compressed = compressPublicKey(keyPair.publicKey);
      expect(compressed).toBeTruthy();
      expect(compressed.startsWith('02') || compressed.startsWith('03')).toBe(true);
      expect(compressed.length).toBe(66); // 33 bytes
    });

    it('should decompress compressed public key', () => {
      const keyPair = generateKeyPair();
      const uncompressed = keyPair.publicKey;
      const compressed = compressPublicKey(uncompressed);
      const decompressed = decompressPublicKey(compressed);
      expect(decompressed).toBeTruthy();
      expect(decompressed.startsWith('04')).toBe(true);
      expect(decompressed.length).toBe(130); // 65 bytes
      expect(decompressed).toBe(uncompressed);
    });

    it('should handle already uncompressed public key correctly', () => {
      const keyPair = generateKeyPair();
      const result = decompressPublicKey(keyPair.publicKey);
      expect(result).toBe(keyPair.publicKey.toLowerCase());
    });
  });

  describe('Encryption and Decryption', () => {
    it('should encrypt data', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Hello, SM2!';
      const encrypted = encrypt(keyPair.publicKey, plaintext);
      expect(encrypted).toBeTruthy();
      expect(encrypted).toMatch(/^[0-9a-zA-Z]+$/);
    });

    it('should auto-detect uncompressed point format (starting with 0x04)', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Test auto-detection';
      
      // Encrypt (uses uncompressed format by default)
      const encrypted = encrypt(keyPair.publicKey, plaintext);
      
      // Verify ciphertext starts with 04 (uncompressed format)
      expect(encrypted.startsWith('04')).toBe(true);
      
      // Decrypt without specifying mode, should auto-detect
      const decrypted = decrypt(keyPair.privateKey, encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should auto-detect C1C3C2 and C1C2C3 modes', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Test mode auto-detection';
      
      // Test C1C3C2 mode
      const encryptedC1C3C2 = encrypt(keyPair.publicKey, plaintext, SM2CipherMode.C1C3C2);
      const decryptedC1C3C2 = decrypt(keyPair.privateKey, encryptedC1C3C2); // without specifying mode
      expect(decryptedC1C3C2).toBe(plaintext);
      
      // Test C1C2C3 mode
      const encryptedC1C2C3 = encrypt(keyPair.publicKey, plaintext, SM2CipherMode.C1C2C3);
      const decryptedC1C2C3 = decrypt(keyPair.privateKey, encryptedC1C2C3); // without specifying mode
      expect(decryptedC1C2C3).toBe(plaintext);
    });

    it('should correctly decrypt - short text', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Hello, SM2!';
      const encrypted = encrypt(keyPair.publicKey, plaintext);
      const decrypted = decrypt(keyPair.privateKey, encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should correctly decrypt - Chinese text', () => {
      const keyPair = generateKeyPair();
      const plaintext = '你好，国密SM2算法！';
      const encrypted = encrypt(keyPair.publicKey, plaintext);
      const decrypted = decrypt(keyPair.privateKey, encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should correctly decrypt - long text', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'This is a longer text to test SM2 encryption and decryption. It contains multiple sentences and should work correctly with the SM2 algorithm implementation.';
      const encrypted = encrypt(keyPair.publicKey, plaintext);
      const decrypted = decrypt(keyPair.privateKey, encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should correctly decrypt - numbers and special characters', () => {
      const keyPair = generateKeyPair();
      const plaintext = '1234567890!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(keyPair.publicKey, plaintext);
      const decrypted = decrypt(keyPair.privateKey, encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should support both cipher modes - C1C3C2', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Hello';
      
      const encrypted = encrypt(keyPair.publicKey, plaintext, SM2CipherMode.C1C3C2);
      expect(encrypted).toBeTruthy();
      const decrypted = decrypt(keyPair.privateKey, encrypted, SM2CipherMode.C1C3C2);
      expect(decrypted).toBe(plaintext);
    });

    it('should support both cipher modes - C1C2C3', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Hello';
      
      const encrypted = encrypt(keyPair.publicKey, plaintext, SM2CipherMode.C1C2C3);
      expect(encrypted).toBeTruthy();
      const decrypted = decrypt(keyPair.privateKey, encrypted, SM2CipherMode.C1C2C3);
      expect(decrypted).toBe(plaintext);
    });

    it('should accept Uint8Array input and decrypt correctly', () => {
      const keyPair = generateKeyPair();
      const plaintext = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
      const encrypted = encrypt(keyPair.publicKey, plaintext);
      expect(encrypted).toBeTruthy();
      const decrypted = decrypt(keyPair.privateKey, encrypted);
      expect(decrypted).toBe('Hello');
    });

    it('should encrypt using compressed public key', () => {
      const keyPair = generateKeyPair();
      const compressed = compressPublicKey(keyPair.publicKey);
      const plaintext = 'Test with compressed key';
      const encrypted = encrypt(compressed, plaintext);
      const decrypted = decrypt(keyPair.privateKey, encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle compressed point format ciphertext (starting with 0x02/0x03)', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Test compressed C1 format';
      
      // Encrypt then manually replace C1 with compressed format
      const encrypted = encrypt(keyPair.publicKey, plaintext, SM2CipherMode.C1C3C2);
      const encryptedBytes = new Uint8Array(encrypted.length / 2);
      for (let i = 0; i < encryptedBytes.length; i++) {
        encryptedBytes[i] = parseInt(encrypted.slice(i * 2, i * 2 + 2), 16);
      }
      
      // Extract C1 and compress it
      const c1Uncompressed = encryptedBytes.slice(0, 65);
      const c1Hex = Array.from(c1Uncompressed).map(b => b.toString(16).padStart(2, '0')).join('');
      const c1Compressed = compressPublicKey(c1Hex);
      const c1CompressedBytes = new Uint8Array(c1Compressed.length / 2);
      for (let i = 0; i < c1CompressedBytes.length; i++) {
        c1CompressedBytes[i] = parseInt(c1Compressed.slice(i * 2, i * 2 + 2), 16);
      }
      
      // Reassemble ciphertext: compressed C1 + C3 + C2
      const c3c2 = encryptedBytes.slice(65);
      const compressedCipherBytes = new Uint8Array(c1CompressedBytes.length + c3c2.length);
      compressedCipherBytes.set(c1CompressedBytes, 0);
      compressedCipherBytes.set(c3c2, c1CompressedBytes.length);
      
      const compressedCipher = Array.from(compressedCipherBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Verify ciphertext starts with 02 or 03 (compressed format)
      expect(compressedCipher.startsWith('02') || compressedCipher.startsWith('03')).toBe(true);
      
      // Decryption should auto-detect compressed format
      const decrypted = decrypt(keyPair.privateKey, compressedCipher);
      expect(decrypted).toBe(plaintext);
    });

    it('should auto-detect C1C2C3 mode with compressed format', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Test compressed C1C2C3 format';
      
      // Encrypt in C1C2C3 mode
      const encrypted = encrypt(keyPair.publicKey, plaintext, SM2CipherMode.C1C2C3);
      const encryptedBytes = new Uint8Array(encrypted.length / 2);
      for (let i = 0; i < encryptedBytes.length; i++) {
        encryptedBytes[i] = parseInt(encrypted.slice(i * 2, i * 2 + 2), 16);
      }
      
      // Extract C1, C2, C3
      const c1Uncompressed = encryptedBytes.slice(0, 65);
      const c2 = encryptedBytes.slice(65, encryptedBytes.length - 32);
      const c3 = encryptedBytes.slice(encryptedBytes.length - 32);
      
      // Compress C1
      const c1Hex = Array.from(c1Uncompressed).map(b => b.toString(16).padStart(2, '0')).join('');
      const c1Compressed = compressPublicKey(c1Hex);
      const c1CompressedBytes = new Uint8Array(c1Compressed.length / 2);
      for (let i = 0; i < c1CompressedBytes.length; i++) {
        c1CompressedBytes[i] = parseInt(c1Compressed.slice(i * 2, i * 2 + 2), 16);
      }
      
      // Reassemble ciphertext: compressed C1 + C2 + C3 (C1C2C3 order)
      const compressedCipherBytes = new Uint8Array(c1CompressedBytes.length + c2.length + c3.length);
      compressedCipherBytes.set(c1CompressedBytes, 0);
      compressedCipherBytes.set(c2, c1CompressedBytes.length);
      compressedCipherBytes.set(c3, c1CompressedBytes.length + c2.length);
      
      const compressedCipher = Array.from(compressedCipherBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Verify ciphertext starts with 02 or 03 (compressed format)
      expect(compressedCipher.startsWith('02') || compressedCipher.startsWith('03')).toBe(true);
      
      // Decryption should auto-detect format and mode
      const decrypted = decrypt(keyPair.privateKey, compressedCipher);
      expect(decrypted).toBe(plaintext);
    });

    it('should reject invalid ciphertext format', () => {
      const keyPair = generateKeyPair();
      
      // Test empty ciphertext
      expect(() => decrypt(keyPair.privateKey, '')).toThrow('Invalid ciphertext: empty data');
      
      // Test invalid first byte (not 0x30, 0x04, 0x02, 0x03)
      const invalidCipher = '05' + '00'.repeat(100);
      expect(() => decrypt(keyPair.privateKey, invalidCipher)).toThrow('Invalid ciphertext: unsupported format');
      
      // Test ciphertext too short
      const shortCipher = '04' + '00'.repeat(50);
      expect(() => decrypt(keyPair.privateKey, shortCipher)).toThrow('Invalid ciphertext: too short');
    });

    it('should throw error when C3 verification fails', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Test C3 verification';
      
      // Normal encryption
      const encrypted = encrypt(keyPair.publicKey, plaintext);
      const encryptedBytes = new Uint8Array(encrypted.length / 2);
      for (let i = 0; i < encryptedBytes.length; i++) {
        encryptedBytes[i] = parseInt(encrypted.slice(i * 2, i * 2 + 2), 16);
      }
      
      // Tamper with C3 part (assuming C1C3C2 mode, C3 starts at byte 65 for 32 bytes)
      encryptedBytes[65] ^= 0xFF; // Flip one byte
      
      const tamperedCipher = Array.from(encryptedBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Decryption should fail
      expect(() => decrypt(keyPair.privateKey, tamperedCipher)).toThrow();
    });
  });

  describe('Signature and Verification', () => {
    it('should sign data', () => {
      const keyPair = generateKeyPair();
      const data = 'Hello, SM2!';
      const signature = sign(keyPair.privateKey, data);
      expect(signature).toBeTruthy();
      expect(signature).toMatch(/^[0-9a-f]+$/);
    });

    it('should verify signature', () => {
      const keyPair = generateKeyPair();
      const data = 'Hello, SM2!';
      const signature = sign(keyPair.privateKey, data);
      const isValid = verify(keyPair.publicKey, data, signature);
      expect(isValid).toBe(true);
    });

    it('should accept Uint8Array input', () => {
      const keyPair = generateKeyPair();
      const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      const signature = sign(keyPair.privateKey, data);
      expect(signature).toBeTruthy();
      
      const isValid = verify(keyPair.publicKey, data, signature);
      expect(isValid).toBe(true);
    });

    it('should support configuration options', () => {
      const keyPair = generateKeyPair();
      const data = 'Hello';
      
      const signature = sign(keyPair.privateKey, data, { der: true, userId: DEFAULT_USER_ID });
      expect(signature).toBeTruthy();
      
      const isValid = verify(keyPair.publicKey, data, signature, { der: true, userId: DEFAULT_USER_ID });
      expect(isValid).toBe(true);
    });

    it('should support skip Z computation option', () => {
      const keyPair = generateKeyPair();
      const data = 'Hello, SM2!';
      
      // Sign with Z computation skipped
      const signature = sign(keyPair.privateKey, data, { skipZComputation: true });
      expect(signature).toBeTruthy();
      
      // Verification also needs to skip Z computation
      const isValid = verify(keyPair.publicKey, data, signature, { skipZComputation: true });
      expect(isValid).toBe(true);
      
      // If verification doesn't skip Z computation, it should fail
      const isInvalid = verify(keyPair.publicKey, data, signature, { skipZComputation: false });
      expect(isInvalid).toBe(false);
    });

    it('should verify signature using compressed public key', () => {
      const keyPair = generateKeyPair();
      const compressed = compressPublicKey(keyPair.publicKey);
      const data = 'Hello, SM2!';
      
      const signature = sign(keyPair.privateKey, data);
      const isValid = verify(compressed, data, signature);
      expect(isValid).toBe(true);
    });
  });

  describe('SM2 Key Exchange Protocol', () => {
    it('should perform basic key exchange', () => {
      // Generate two key pairs
      const keyPairA = generateKeyPair();
      const keyPairB = generateKeyPair();
      
      // A generates temporary key pair
      const tempKeyPairA = generateKeyPair();
      
      // B generates temporary key pair
      const tempKeyPairB = generateKeyPair();
      
      // A as initiator performs key exchange
      const resultA = keyExchange({
        privateKey: keyPairA.privateKey,
        publicKey: keyPairA.publicKey,
        tempPrivateKey: tempKeyPairA.privateKey,
        peerPublicKey: keyPairB.publicKey,
        peerTempPublicKey: tempKeyPairB.publicKey,
        isInitiator: true,
      });
      
      // B as responder performs key exchange
      const resultB = keyExchange({
        privateKey: keyPairB.privateKey,
        publicKey: keyPairB.publicKey,
        tempPrivateKey: tempKeyPairB.privateKey,
        peerPublicKey: keyPairA.publicKey,
        peerTempPublicKey: tempKeyPairA.publicKey,
        isInitiator: false,
      });
      
      // Verify both parties get the same shared key
      expect(resultA.sharedKey).toBe(resultB.sharedKey);
      expect(resultA.sharedKey).toBeTruthy();
      expect(resultA.sharedKey).toMatch(/^[0-9a-f]+$/);
    });

    it('should auto-generate temporary key pair', () => {
      const keyPairA = generateKeyPair();
      const keyPairB = generateKeyPair();
      const tempKeyPairB = generateKeyPair();
      
      // A doesn't provide temporary key, let function auto-generate
      const resultA1 = keyExchange({
        privateKey: keyPairA.privateKey,
        publicKey: keyPairA.publicKey,
        peerPublicKey: keyPairB.publicKey,
        peerTempPublicKey: tempKeyPairB.publicKey,
        isInitiator: true,
      });
      
      expect(resultA1.tempPublicKey).toBeTruthy();
      expect(resultA1.tempPublicKey).toMatch(/^[0-9a-f]+$/);
      expect(resultA1.tempPublicKey.length).toBe(130); // uncompressed format
    });

    it('should support custom key length', () => {
      const keyPairA = generateKeyPair();
      const keyPairB = generateKeyPair();
      const tempKeyPairA = generateKeyPair();
      const tempKeyPairB = generateKeyPair();
      
      // Test 32-byte key
      const resultA = keyExchange({
        privateKey: keyPairA.privateKey,
        peerPublicKey: keyPairB.publicKey,
        peerTempPublicKey: tempKeyPairB.publicKey,
        tempPrivateKey: tempKeyPairA.privateKey,
        isInitiator: true,
        keyLength: 32,
      });
      
      const resultB = keyExchange({
        privateKey: keyPairB.privateKey,
        peerPublicKey: keyPairA.publicKey,
        peerTempPublicKey: tempKeyPairA.publicKey,
        tempPrivateKey: tempKeyPairB.privateKey,
        isInitiator: false,
        keyLength: 32,
      });
      
      expect(resultA.sharedKey).toBe(resultB.sharedKey);
      expect(resultA.sharedKey.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should generate correct confirmation hashes', () => {
      const keyPairA = generateKeyPair();
      const keyPairB = generateKeyPair();
      const tempKeyPairA = generateKeyPair();
      const tempKeyPairB = generateKeyPair();
      
      const resultA = keyExchange({
        privateKey: keyPairA.privateKey,
        peerPublicKey: keyPairB.publicKey,
        peerTempPublicKey: tempKeyPairB.publicKey,
        tempPrivateKey: tempKeyPairA.privateKey,
        isInitiator: true,
      });
      
      const resultB = keyExchange({
        privateKey: keyPairB.privateKey,
        peerPublicKey: keyPairA.publicKey,
        peerTempPublicKey: tempKeyPairA.publicKey,
        tempPrivateKey: tempKeyPairB.privateKey,
        isInitiator: false,
      });
      
      // Verify confirmation hashes exist
      expect(resultA.s1).toBeTruthy();
      expect(resultA.s2).toBeTruthy();
      expect(resultB.s1).toBeTruthy();
      expect(resultB.s2).toBeTruthy();
      
      // Verify hashes are valid hex strings
      expect(resultA.s1).toMatch(/^[0-9a-f]+$/);
      expect(resultA.s2).toMatch(/^[0-9a-f]+$/);
      expect(resultB.s1).toMatch(/^[0-9a-f]+$/);
      expect(resultB.s2).toMatch(/^[0-9a-f]+$/);
      
      // Verify hash length is 64 characters (32 bytes SM3 hash)
      expect(resultA.s1?.length).toBe(64);
      expect(resultA.s2?.length).toBe(64);
      expect(resultB.s1?.length).toBe(64);
      expect(resultB.s2?.length).toBe(64);
    });

    it('should support custom user ID', () => {
      const keyPairA = generateKeyPair();
      const keyPairB = generateKeyPair();
      const tempKeyPairA = generateKeyPair();
      const tempKeyPairB = generateKeyPair();
      
      const userIdA = 'alice@example.com';
      const userIdB = 'bob@example.com';
      
      const resultA = keyExchange({
        privateKey: keyPairA.privateKey,
        userId: userIdA,
        peerPublicKey: keyPairB.publicKey,
        peerUserId: userIdB,
        peerTempPublicKey: tempKeyPairB.publicKey,
        tempPrivateKey: tempKeyPairA.privateKey,
        isInitiator: true,
      });
      
      const resultB = keyExchange({
        privateKey: keyPairB.privateKey,
        userId: userIdB,
        peerPublicKey: keyPairA.publicKey,
        peerUserId: userIdA,
        peerTempPublicKey: tempKeyPairA.publicKey,
        tempPrivateKey: tempKeyPairB.privateKey,
        isInitiator: false,
      });
      
      // Even with custom user IDs, both parties should get the same shared key
      expect(resultA.sharedKey).toBe(resultB.sharedKey);
    });

    it('should generate different shared keys with different parameters', () => {
      const keyPairA = generateKeyPair();
      const keyPairB = generateKeyPair();
      const tempKeyPairA1 = generateKeyPair();
      const tempKeyPairA2 = generateKeyPair();
      const tempKeyPairB = generateKeyPair();
      
      // Using different temporary keys should produce different shared keys
      const result1 = keyExchange({
        privateKey: keyPairA.privateKey,
        peerPublicKey: keyPairB.publicKey,
        peerTempPublicKey: tempKeyPairB.publicKey,
        tempPrivateKey: tempKeyPairA1.privateKey,
        isInitiator: true,
      });
      
      const result2 = keyExchange({
        privateKey: keyPairA.privateKey,
        peerPublicKey: keyPairB.publicKey,
        peerTempPublicKey: tempKeyPairB.publicKey,
        tempPrivateKey: tempKeyPairA2.privateKey,
        isInitiator: true,
      });
      
      expect(result1.sharedKey).not.toBe(result2.sharedKey);
    });

    it('should perform key exchange using compressed public keys', () => {
      const keyPairA = generateKeyPair();
      const keyPairB = generateKeyPair();
      const tempKeyPairA = generateKeyPair();
      const tempKeyPairB = generateKeyPair();
      
      // 压缩公钥
      const compressedA = compressPublicKey(keyPairA.publicKey);
      const compressedB = compressPublicKey(keyPairB.publicKey);
      const compressedTempA = compressPublicKey(tempKeyPairA.publicKey);
      const compressedTempB = compressPublicKey(tempKeyPairB.publicKey);
      
      const resultA = keyExchange({
        privateKey: keyPairA.privateKey,
        publicKey: compressedA,
        peerPublicKey: compressedB,
        peerTempPublicKey: compressedTempB,
        tempPrivateKey: tempKeyPairA.privateKey,
        isInitiator: true,
      });
      
      const resultB = keyExchange({
        privateKey: keyPairB.privateKey,
        publicKey: compressedB,
        peerPublicKey: compressedA,
        peerTempPublicKey: compressedTempA,
        tempPrivateKey: tempKeyPairB.privateKey,
        isInitiator: false,
      });
      
      expect(resultA.sharedKey).toBe(resultB.sharedKey);
    });
  });
});
