import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../src/sm4';

describe('SM4', () => {
  const key = '0123456789abcdeffedcba9876543210'; // 128-bit key

  describe('ECB mode', () => {
    it('should encrypt and decrypt with ECB mode', () => {
      const plaintext = 'Hello, SM4!';
      const encrypted = encrypt(key, plaintext, { mode: 'ECB', padding: 'Pkcs7' });
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
      
      const decrypted = decrypt(key, encrypted, { mode: 'ECB', padding: 'Pkcs7' });
      expect(decrypted).toBe(plaintext);
    });

    it('should handle Uint8Array input', () => {
      const plaintext = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      const encrypted = encrypt(key, plaintext, { mode: 'ECB', padding: 'Pkcs7' });
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
      
      const decrypted = decrypt(key, encrypted, { mode: 'ECB', padding: 'Pkcs7' });
      expect(decrypted).toBe('Hello');
    });

    it('should encrypt exactly 16 bytes without padding', () => {
      const plaintext = '0123456789abcdef'; // exactly 16 bytes
      const encrypted = encrypt(key, plaintext, { mode: 'ECB', padding: 'None' });
      expect(encrypted).toHaveLength(32); // 16 bytes = 32 hex chars
      
      const decrypted = decrypt(key, encrypted, { mode: 'ECB', padding: 'None' });
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('CBC mode', () => {
    const iv = 'fedcba98765432100123456789abcdef'; // 128-bit IV

    it('should encrypt and decrypt with CBC mode', () => {
      const plaintext = 'Hello, SM4 CBC!';
      const encrypted = encrypt(key, plaintext, { mode: 'CBC', padding: 'Pkcs7', iv });
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
      
      const decrypted = decrypt(key, encrypted, { mode: 'CBC', padding: 'Pkcs7', iv });
      expect(decrypted).toBe(plaintext);
    });

    it('should require IV for CBC mode', () => {
      const plaintext = 'Hello';
      expect(() => encrypt(key, plaintext, { mode: 'CBC' })).toThrow('IV is required');
    });

    it('should validate IV length', () => {
      const plaintext = 'Hello';
      const shortIv = '0123456789abcdef'; // too short
      expect(() => encrypt(key, plaintext, { mode: 'CBC', iv: shortIv })).toThrow();
    });
  });

  describe('Key validation', () => {
    it('should reject invalid key length', () => {
      const plaintext = 'Hello';
      const shortKey = '0123456789abcdef'; // too short
      expect(() => encrypt(shortKey, plaintext)).toThrow('SM4 key must be 16 bytes');
    });
  });

  describe('Multiple blocks', () => {
    it('should handle multiple blocks correctly', () => {
      const plaintext = 'a'.repeat(100);
      const encrypted = encrypt(key, plaintext, { mode: 'ECB', padding: 'Pkcs7' });
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
      
      const decrypted = decrypt(key, encrypted, { mode: 'ECB', padding: 'Pkcs7' });
      expect(decrypted).toBe(plaintext);
    });
  });
});
