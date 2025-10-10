import { describe, it, expect } from 'vitest';
import {
  hexToBytes,
  bytesToHex,
  stringToBytes,
  bytesToString,
  normalizeInput,
  xor,
  rotl,
} from '../src/utils';

describe('Utils', () => {
  describe('hexToBytes', () => {
    it('should convert hex string to bytes', () => {
      const hex = '48656c6c6f';
      const bytes = hexToBytes(hex);
      expect(bytes).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
    });

    it('should handle 0x prefix', () => {
      const hex = '0x48656c6c6f';
      const bytes = hexToBytes(hex);
      expect(bytes).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
    });

    it('should handle odd length hex strings', () => {
      const hex = 'abc';
      const bytes = hexToBytes(hex);
      expect(bytes).toEqual(new Uint8Array([0x0a, 0xbc]));
    });
  });

  describe('bytesToHex', () => {
    it('should convert bytes to lowercase hex string', () => {
      const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      const hex = bytesToHex(bytes);
      expect(hex).toBe('48656c6c6f');
    });

    it('should pad single digit hex values', () => {
      const bytes = new Uint8Array([0x01, 0x0a, 0xff]);
      const hex = bytesToHex(bytes);
      expect(hex).toBe('010aff');
    });
  });

  describe('stringToBytes', () => {
    it('should convert UTF-8 string to bytes', () => {
      const str = 'Hello';
      const bytes = stringToBytes(str);
      expect(bytes).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
    });

    it('should handle Unicode characters', () => {
      const str = '你好';
      const bytes = stringToBytes(str);
      expect(bytes.length).toBeGreaterThan(2);
    });
  });

  describe('bytesToString', () => {
    it('should convert bytes to UTF-8 string', () => {
      const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      const str = bytesToString(bytes);
      expect(str).toBe('Hello');
    });
  });

  describe('normalizeInput', () => {
    it('should return Uint8Array as is', () => {
      const bytes = new Uint8Array([1, 2, 3]);
      const result = normalizeInput(bytes);
      expect(result).toBe(bytes);
    });

    it('should convert string to Uint8Array', () => {
      const str = 'Hello';
      const result = normalizeInput(str);
      expect(result).toEqual(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
    });
  });

  describe('xor', () => {
    it('should XOR two arrays', () => {
      const a = new Uint8Array([0xff, 0x00, 0xaa]);
      const b = new Uint8Array([0x0f, 0xf0, 0x55]);
      const result = xor(a, b);
      expect(result).toEqual(new Uint8Array([0xf0, 0xf0, 0xff]));
    });

    it('should throw error for different lengths', () => {
      const a = new Uint8Array([1, 2]);
      const b = new Uint8Array([1, 2, 3]);
      expect(() => xor(a, b)).toThrow();
    });
  });

  describe('rotl', () => {
    it('should rotate left correctly', () => {
      const value = 0b00000001000000000000000000000000;
      const result = rotl(value, 1);
      expect(result).toBe(0b00000010000000000000000000000000);
    });

    it('should handle wrap around', () => {
      const value = 0b10000000000000000000000000000000;
      const result = rotl(value, 1);
      expect(result).toBe(0b00000000000000000000000000000001);
    });
  });
});
