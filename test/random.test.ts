import { describe, it, expect } from 'vitest';
import { generateKeyPair } from '../src/crypto/sm2';

describe('Random Number Generation', () => {
  describe('Random Generator Fallback Mechanism', () => {
    it('should use Web Crypto API as first priority', () => {
      // Web Crypto API should be available (via test/setup.ts polyfill)
      expect(globalThis.crypto).toBeDefined();
      expect(globalThis.crypto.getRandomValues).toBeDefined();
      
      // Key pair generation should succeed
      const keyPair = generateKeyPair();
      expect(keyPair.privateKey).toBeTruthy();
      expect(keyPair.publicKey).toBeTruthy();
    });

    it('should generate unique random keys', () => {
      // Generate multiple key pairs
      const keyPairs = [];
      for (let i = 0; i < 5; i++) {
        keyPairs.push(generateKeyPair());
      }
      
      // Check that all private keys are unique
      const uniquePrivateKeys = new Set(keyPairs.map(kp => kp.privateKey));
      expect(uniquePrivateKeys.size).toBe(5);
      
      // Check that all public keys are unique
      const uniquePublicKeys = new Set(keyPairs.map(kp => kp.publicKey));
      expect(uniquePublicKeys.size).toBe(5);
    });

    it('should generate keys compliant with SM2 specification', () => {
      const keyPair = generateKeyPair();
      
      // Private key should be 64 hex characters (32 bytes)
      expect(keyPair.privateKey).toMatch(/^[0-9a-f]{64}$/);
      
      // Public key should be 130 hex characters (65 bytes, 04 + x + y)
      // or 66 characters (compressed format)
      expect(keyPair.publicKey.length).toBeGreaterThanOrEqual(66);
      expect(keyPair.publicKey).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('Performance Test', () => {
    it('should generate key pairs quickly', () => {
      const startTime = Date.now();
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        generateKeyPair();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const avgTime = duration / iterations;
      
      // Average key pair generation should complete in reasonable time (less than 1 second)
      expect(avgTime).toBeLessThan(1000);
      
      console.log(`Average time to generate ${iterations} key pairs: ${avgTime.toFixed(2)}ms`);
    });
  });
});
