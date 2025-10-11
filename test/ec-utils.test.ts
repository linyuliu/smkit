import { describe, it, expect } from 'vitest';
import {
  SM2_CURVE,
  isInfinity,
  compressPublicKey,
  isPointOnCurve,
  isValidPublicKey,
  parsePublicKey,
  formatPublicKey,
  getBasePoint,
} from '../src/ec-utils';

describe('Elliptic Curve Utilities', () => {
  describe('SM2_CURVE constants', () => {
    it('should have all required curve parameters', () => {
      expect(SM2_CURVE.p).toBeTruthy();
      expect(SM2_CURVE.a).toBeTruthy();
      expect(SM2_CURVE.b).toBeTruthy();
      expect(SM2_CURVE.Gx).toBeTruthy();
      expect(SM2_CURVE.Gy).toBeTruthy();
      expect(SM2_CURVE.n).toBeTruthy();
      expect(SM2_CURVE.h).toBe(1);
    });

    it('should have 256-bit parameters', () => {
      expect(SM2_CURVE.p.length).toBe(64);
      expect(SM2_CURVE.n.length).toBe(64);
      expect(SM2_CURVE.Gx.length).toBe(64);
      expect(SM2_CURVE.Gy.length).toBe(64);
    });
  });

  describe('Point utilities', () => {
    it('should identify infinity point', () => {
      expect(isInfinity(null)).toBe(true);
      expect(isInfinity({ x: '0', y: '0' })).toBe(true);
      expect(isInfinity({ x: '1', y: '1' })).toBe(false);
    });

    it('should get base point', () => {
      const G = getBasePoint();
      expect(G.x).toBe(SM2_CURVE.Gx);
      expect(G.y).toBe(SM2_CURVE.Gy);
    });

    it('should validate point on curve (placeholder)', () => {
      const point = {
        x: SM2_CURVE.Gx,
        y: SM2_CURVE.Gy,
      };
      // This is a placeholder test - actual validation requires full implementation
      expect(isPointOnCurve(point)).toBe(true);
    });
  });

  describe('Public key compression', () => {
    const uncompressed = '04' +
      '32C4AE2C1F1981195F9904466A39C9948FE30BBFF2660BE1715A4589334C74C7' +
      'BC3736A2F4F6779C59BDCEE36B692153D0A9877CC62A474002DF32E52139F0A0';

    it('should compress uncompressed public key', () => {
      const compressed = compressPublicKey(uncompressed);
      
      expect(compressed.length).toBe(66); // 33 bytes
      expect(['02', '03']).toContain(compressed.slice(0, 2));
      expect(compressed.slice(2, 66)).toBe('32C4AE2C1F1981195F9904466A39C9948FE30BBFF2660BE1715A4589334C74C7');
    });

    it('should choose correct prefix based on y coordinate', () => {
      // y ends with 0xA0 which is even, so prefix should be 02
      const compressed = compressPublicKey(uncompressed);
      expect(compressed.slice(0, 2)).toBe('02');
    });

    it('should throw error for invalid uncompressed key', () => {
      expect(() => compressPublicKey('04123')).toThrow('must be 65 bytes');
      expect(() => compressPublicKey('02' + '1'.repeat(64))).toThrow('must be 65 bytes');
    });
  });

  describe('Public key validation', () => {
    it('should validate uncompressed public key format', () => {
      const valid = '04' + '1'.repeat(128);
      expect(isValidPublicKey(valid)).toBe(true);
    });

    it('should validate compressed public key format', () => {
      const valid02 = '02' + '1'.repeat(64);
      const valid03 = '03' + '1'.repeat(64);
      expect(isValidPublicKey(valid02)).toBe(true);
      expect(isValidPublicKey(valid03)).toBe(true);
    });

    it('should reject invalid public key length', () => {
      expect(isValidPublicKey('04123')).toBe(false);
      expect(isValidPublicKey('02123')).toBe(false);
    });

    it('should reject invalid public key prefix', () => {
      const invalid = '05' + '1'.repeat(128);
      expect(isValidPublicKey(invalid)).toBe(false);
    });

    it('should reject non-hex characters', () => {
      const invalid = '04' + 'g'.repeat(128);
      expect(isValidPublicKey(invalid)).toBe(false);
    });
  });

  describe('Public key parsing', () => {
    const uncompressed = '04' +
      '32C4AE2C1F1981195F9904466A39C9948FE30BBFF2660BE1715A4589334C74C7' +
      'BC3736A2F4F6779C59BDCEE36B692153D0A9877CC62A474002DF32E52139F0A0';

    it('should parse uncompressed public key', () => {
      const point = parsePublicKey(uncompressed);
      
      expect(point.x).toBe('32C4AE2C1F1981195F9904466A39C9948FE30BBFF2660BE1715A4589334C74C7');
      expect(point.y).toBe('BC3736A2F4F6779C59BDCEE36B692153D0A9877CC62A474002DF32E52139F0A0');
    });

    it('should throw error for compressed key', () => {
      const compressed = '02' + '1'.repeat(64);
      expect(() => parsePublicKey(compressed)).toThrow('compressed public key');
    });

    it('should throw error for invalid length', () => {
      expect(() => parsePublicKey('04123')).toThrow('must be 65 bytes');
    });
  });

  describe('Public key formatting', () => {
    const point = {
      x: '32C4AE2C1F1981195F9904466A39C9948FE30BBFF2660BE1715A4589334C74C7',
      y: 'BC3736A2F4F6779C59BDCEE36B692153D0A9877CC62A474002DF32E52139F0A0',
    };

    it('should format point as uncompressed public key', () => {
      const publicKey = formatPublicKey(point);
      
      expect(publicKey.length).toBe(130);
      expect(publicKey.slice(0, 2)).toBe('04');
      expect(publicKey.slice(2, 66)).toBe(point.x);
      expect(publicKey.slice(66, 130)).toBe(point.y);
    });

    it('should format point as compressed public key', () => {
      const publicKey = formatPublicKey(point, true);
      
      expect(publicKey.length).toBe(66);
      expect(['02', '03']).toContain(publicKey.slice(0, 2));
      expect(publicKey.slice(2, 66)).toBe(point.x);
    });

    it('should pad short coordinates', () => {
      const shortPoint = { x: '1', y: '2' };
      const publicKey = formatPublicKey(shortPoint);
      
      expect(publicKey.length).toBe(130);
      expect(publicKey.slice(2, 66)).toBe('0'.repeat(63) + '1');
      expect(publicKey.slice(66, 130)).toBe('0'.repeat(63) + '2');
    });

    it('should throw error for infinity point', () => {
      expect(() => formatPublicKey({ x: '0', y: '0' })).toThrow('point at infinity');
    });
  });

  describe('Point operations placeholders', () => {
    it('should have getBasePoint function', () => {
      const G = getBasePoint();
      expect(G.x).toBeTruthy();
      expect(G.y).toBeTruthy();
    });
  });
});
