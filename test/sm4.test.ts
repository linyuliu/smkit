import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../src/crypto/sm4';
import { CipherMode, PaddingMode } from '../src/types/constants';

describe('SM4', () => {
  const key = '0123456789abcdeffedcba9876543210'; // 128-bit key

  describe('ECB mode', () => {
    it('should encrypt and decrypt with ECB mode', () => {
      const plaintext = 'Hello, SM4!';
      const encrypted = encrypt(key, plaintext, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
      
      const decrypted = decrypt(key, encrypted, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
      expect(decrypted).toBe(plaintext);
    });

    it('should handle Uint8Array input', () => {
      const plaintext = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      const encrypted = encrypt(key, plaintext, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
      
      const decrypted = decrypt(key, encrypted, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
      expect(decrypted).toBe('Hello');
    });

    it('should encrypt exactly 16 bytes without padding', () => {
      const plaintext = '0123456789abcdef'; // exactly 16 bytes
      const encrypted = encrypt(key, plaintext, { mode: CipherMode.ECB, padding: PaddingMode.NONE });
      expect(encrypted).toHaveLength(32); // 16 bytes = 32 hex chars
      
      const decrypted = decrypt(key, encrypted, { mode: CipherMode.ECB, padding: PaddingMode.NONE });
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('CBC mode', () => {
    const iv = 'fedcba98765432100123456789abcdef'; // 128-bit IV

    it('should encrypt and decrypt with CBC mode', () => {
      const plaintext = 'Hello, SM4 CBC!';
      const encrypted = encrypt(key, plaintext, { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
      
      const decrypted = decrypt(key, encrypted, { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });
      expect(decrypted).toBe(plaintext);
    });

    it('should require IV for CBC mode', () => {
      const plaintext = 'Hello';
      expect(() => encrypt(key, plaintext, { mode: CipherMode.CBC })).toThrow('IV is required');
    });

    it('should validate IV length', () => {
      const plaintext = 'Hello';
      const shortIv = '0123456789abcdef'; // too short
      expect(() => encrypt(key, plaintext, { mode: CipherMode.CBC, iv: shortIv })).toThrow();
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
      const encrypted = encrypt(key, plaintext, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
      
      const decrypted = decrypt(key, encrypted, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('CTR mode', () => {
    const iv = '00000000000000000000000000000000'; // 128-bit counter/nonce

    it('should encrypt and decrypt with CTR mode', () => {
      const plaintext = 'Hello, SM4 CTR mode!';
      const encrypted = encrypt(key, plaintext, { mode: CipherMode.CTR, iv });
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
      
      const decrypted = decrypt(key, encrypted, { mode: CipherMode.CTR, iv });
      expect(decrypted).toBe(plaintext);
    });

    it('should handle non-block-aligned data in CTR mode', () => {
      const plaintext = 'Hello'; // 5 bytes, not multiple of 16
      const encrypted = encrypt(key, plaintext, { mode: CipherMode.CTR, iv });
      expect(encrypted).toHaveLength(10); // 5 bytes = 10 hex chars
      
      const decrypted = decrypt(key, encrypted, { mode: CipherMode.CTR, iv });
      expect(decrypted).toBe(plaintext);
    });

    it('should require IV for CTR mode', () => {
      const plaintext = 'Hello';
      expect(() => encrypt(key, plaintext, { mode: CipherMode.CTR })).toThrow('IV');
    });

    it('should handle large data in CTR mode', () => {
      const plaintext = 'a'.repeat(1000);
      const encrypted = encrypt(key, plaintext, { mode: CipherMode.CTR, iv });
      const decrypted = decrypt(key, encrypted, { mode: CipherMode.CTR, iv });
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('CFB mode', () => {
    const iv = 'fedcba98765432100123456789abcdef'; // 128-bit IV

    it('should encrypt and decrypt with CFB mode', () => {
      const plaintext = 'Hello, SM4 CFB mode!';
      const encrypted = encrypt(key, plaintext, { mode: CipherMode.CFB, iv });
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
      
      const decrypted = decrypt(key, encrypted, { mode: CipherMode.CFB, iv });
      expect(decrypted).toBe(plaintext);
    });

    it('should handle non-block-aligned data in CFB mode', () => {
      const plaintext = 'Test!'; // 5 bytes, not multiple of 16
      const encrypted = encrypt(key, plaintext, { mode: CipherMode.CFB, iv });
      expect(encrypted).toHaveLength(10); // 5 bytes = 10 hex chars
      
      const decrypted = decrypt(key, encrypted, { mode: CipherMode.CFB, iv });
      expect(decrypted).toBe(plaintext);
    });

    it('should require IV for CFB mode', () => {
      const plaintext = 'Hello';
      expect(() => encrypt(key, plaintext, { mode: CipherMode.CFB })).toThrow('IV');
    });

    it('should handle multiple blocks in CFB mode', () => {
      const plaintext = 'a'.repeat(100);
      const encrypted = encrypt(key, plaintext, { mode: CipherMode.CFB, iv });
      const decrypted = decrypt(key, encrypted, { mode: CipherMode.CFB, iv });
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('OFB mode', () => {
    const iv = 'fedcba98765432100123456789abcdef'; // 128-bit IV

    it('should encrypt and decrypt with OFB mode', () => {
      const plaintext = 'Hello, SM4 OFB mode!';
      const encrypted = encrypt(key, plaintext, { mode: CipherMode.OFB, iv });
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
      
      const decrypted = decrypt(key, encrypted, { mode: CipherMode.OFB, iv });
      expect(decrypted).toBe(plaintext);
    });

    it('should handle non-block-aligned data in OFB mode', () => {
      const plaintext = 'Hi!'; // 3 bytes, not multiple of 16
      const encrypted = encrypt(key, plaintext, { mode: CipherMode.OFB, iv });
      expect(encrypted).toHaveLength(6); // 3 bytes = 6 hex chars
      
      const decrypted = decrypt(key, encrypted, { mode: CipherMode.OFB, iv });
      expect(decrypted).toBe(plaintext);
    });

    it('should require IV for OFB mode', () => {
      const plaintext = 'Hello';
      expect(() => encrypt(key, plaintext, { mode: CipherMode.OFB })).toThrow('IV');
    });

    it('should handle multiple blocks in OFB mode', () => {
      const plaintext = 'a'.repeat(200);
      const encrypted = encrypt(key, plaintext, { mode: CipherMode.OFB, iv });
      const decrypted = decrypt(key, encrypted, { mode: CipherMode.OFB, iv });
      expect(decrypted).toBe(plaintext);
    });

    it('should produce the same keystream for encryption and decryption', () => {
      // OFB decryption is identical to encryption (XOR property)
      const plaintext1 = 'Hello, World!';
      const plaintext2 = 'Test Message!'; // same length
      
      const encrypted1 = encrypt(key, plaintext1, { mode: CipherMode.OFB, iv });
      const encrypted2 = encrypt(key, plaintext2, { mode: CipherMode.OFB, iv });
      
      // Since OFB generates the same keystream, decrypting with wrong plaintext shouldn't match
      const decrypted1 = decrypt(key, encrypted1, { mode: CipherMode.OFB, iv });
      expect(decrypted1).toBe(plaintext1);
      
      const decrypted2 = decrypt(key, encrypted2, { mode: CipherMode.OFB, iv });
      expect(decrypted2).toBe(plaintext2);
    });
  });
});
