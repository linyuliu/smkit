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
} from '../src/crypto/sm2';
import { SM2CipherMode, DEFAULT_USER_ID } from '../src/types/constants';

describe('SM2', () => {
  describe('generateKeyPair', () => {
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

  describe('getPublicKeyFromPrivateKey', () => {
    it('should derive public key from private key', () => {
      const privateKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const publicKey = getPublicKeyFromPrivateKey(privateKey);
      expect(publicKey).toBeTruthy();
      expect(publicKey).toMatch(/^[0-9a-f]+$/);
      expect(publicKey.startsWith('04')).toBe(true); // 非压缩格式
      expect(publicKey.length).toBe(130); // 65 bytes = 130 hex chars
    });

    it('should derive compressed public key from private key', () => {
      const privateKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const publicKey = getPublicKeyFromPrivateKey(privateKey, true);
      expect(publicKey).toBeTruthy();
      expect(publicKey).toMatch(/^[0-9a-f]+$/);
      expect(publicKey.startsWith('02') || publicKey.startsWith('03')).toBe(true); // 压缩格式
      expect(publicKey.length).toBe(66); // 33 bytes = 66 hex chars
    });
  });

  describe('compressPublicKey/decompressPublicKey', () => {
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

    it('should handle already decompressed public key', () => {
      const keyPair = generateKeyPair();
      const result = decompressPublicKey(keyPair.publicKey);
      expect(result).toBe(keyPair.publicKey.toLowerCase());
    });
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt data', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Hello, SM2!';
      const encrypted = encrypt(keyPair.publicKey, plaintext);
      expect(encrypted).toBeTruthy();
      expect(encrypted).toMatch(/^[0-9a-zA-Z]+$/);
    });

    it('should support both cipher modes', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Hello';
      
      const encrypted1 = encrypt(keyPair.publicKey, plaintext, SM2CipherMode.C1C3C2);
      expect(encrypted1).toBeTruthy();
      
      const encrypted2 = encrypt(keyPair.publicKey, plaintext, SM2CipherMode.C1C2C3);
      expect(encrypted2).toBeTruthy();
    });

    it('should accept Uint8Array input', () => {
      const keyPair = generateKeyPair();
      const plaintext = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      const encrypted = encrypt(keyPair.publicKey, plaintext);
      expect(encrypted).toBeTruthy();
    });
  });

  describe('sign/verify', () => {
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

    it('should support options', () => {
      const keyPair = generateKeyPair();
      const data = 'Hello';
      
      const signature = sign(keyPair.privateKey, data, { der: true, userId: DEFAULT_USER_ID });
      expect(signature).toBeTruthy();
      
      const isValid = verify(keyPair.publicKey, data, signature, { der: true, userId: DEFAULT_USER_ID });
      expect(isValid).toBe(true);
    });

    it('should support skipZComputation option', () => {
      const keyPair = generateKeyPair();
      const data = 'Hello, SM2!';
      
      // 签名时跳过 Z 值计算
      const signature = sign(keyPair.privateKey, data, { skipZComputation: true });
      expect(signature).toBeTruthy();
      
      // 验证时也需要跳过 Z 值计算
      const isValid = verify(keyPair.publicKey, data, signature, { skipZComputation: true });
      expect(isValid).toBe(true);
      
      // 如果验证时不跳过 Z 值计算，应该验证失败
      const isInvalid = verify(keyPair.publicKey, data, signature, { skipZComputation: false });
      expect(isInvalid).toBe(false);
    });

    it('should work with compressed public key', () => {
      const keyPair = generateKeyPair();
      const compressed = compressPublicKey(keyPair.publicKey);
      const data = 'Hello, SM2!';
      
      const signature = sign(keyPair.privateKey, data);
      const isValid = verify(compressed, data, signature);
      expect(isValid).toBe(true);
    });
  });
});
