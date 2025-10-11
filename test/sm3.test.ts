import { describe, it, expect } from 'vitest';
import { digest, hmac } from '../src/crypto/sm3';

describe('SM3', () => {
  describe('digest', () => {
    it('should hash empty string', () => {
      const result = digest('');
      expect(result).toBe('1ab21d8355cfa17f8e61194831e81a8f22bec8c728fefb747ed035eb5082aa2b');
    });

    it('should hash "abc"', () => {
      const result = digest('abc');
      expect(result).toBe('66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0');
    });

    it('should hash longer string', () => {
      const input = 'abcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd';
      const result = digest(input);
      expect(result).toBe('debe9ff92275b8a138604889c18e5a4d6fdb70e5387e5765293dcba39c0c5732');
    });

    it('should accept Uint8Array input', () => {
      const input = new Uint8Array([0x61, 0x62, 0x63]); // "abc"
      const result = digest(input);
      expect(result).toBe('66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0');
    });

    it('should produce 64 character hex string', () => {
      const result = digest('test');
      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('hmac', () => {
    it('should compute HMAC', () => {
      const key = 'key';
      const data = 'The quick brown fox jumps over the lazy dog';
      const result = hmac(key, data);
      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should accept Uint8Array for key and data', () => {
      const key = new Uint8Array([0x6b, 0x65, 0x79]); // "key"
      const data = new Uint8Array([0x64, 0x61, 0x74, 0x61]); // "data"
      const result = hmac(key, data);
      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should handle long keys', () => {
      const key = 'a'.repeat(100);
      const data = 'test';
      const result = hmac(key, data);
      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[0-9a-f]{64}$/);
    });
  });
});
