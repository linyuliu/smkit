import { describe, it, expect } from 'vitest';
import {
  generateKeyPair,
  getPublicKeyFromPrivateKey,
  encrypt,
  decrypt,
  sign,
  verify,
} from '../src/sm2';
import { SM2CipherMode, DEFAULT_USER_ID } from '../src/constants';

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
  });
});
