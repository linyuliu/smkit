import { describe, it, expect } from 'vitest';
import { SM2Class, SM3Class, SM4Class } from '../src/index';
import { CipherMode, PaddingMode, SM2CipherMode } from '../src/constants';

describe('Object-Oriented API', () => {
  describe('SM2Class', () => {
    it('should generate key pair', () => {
      const sm2 = SM2Class.generateKeyPair();
      expect(sm2.getPublicKey()).toBeTruthy();
      expect(sm2.getPrivateKey()).toBeTruthy();
    });

    it('should create from private key', () => {
      const sm2 = SM2Class.generateKeyPair();
      const privateKey = sm2.getPrivateKey();
      
      const sm2FromPrivate = SM2Class.fromPrivateKey(privateKey);
      expect(sm2FromPrivate.getPrivateKey()).toBe(privateKey);
      expect(sm2FromPrivate.getPublicKey()).toBeTruthy();
    });

    it('should create from public key', () => {
      const sm2 = SM2Class.generateKeyPair();
      const publicKey = sm2.getPublicKey();
      
      const sm2FromPublic = SM2Class.fromPublicKey(publicKey);
      expect(sm2FromPublic.getPublicKey()).toBe(publicKey);
      expect(() => sm2FromPublic.getPrivateKey()).toThrow();
    });

    it('should encrypt and decrypt', () => {
      const sm2 = SM2Class.generateKeyPair();
      const plaintext = 'Hello, SM2!';
      
      const encrypted = sm2.encrypt(plaintext);
      expect(encrypted).toBeTruthy();
      
      const decrypted = sm2.decrypt(encrypted);
      expect(decrypted).toBeTruthy();
    });

    it('should sign and verify', () => {
      const sm2 = SM2Class.generateKeyPair();
      const data = 'Message to sign';
      
      const signature = sm2.sign(data);
      expect(signature).toBeTruthy();
      
      const isValid = sm2.verify(data, signature);
      expect(isValid).toBe(true);
    });

    it('should support custom curve parameters', () => {
      const curveParams = {
        p: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFF',
        a: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFC',
        b: '28E9FA9E9D9F5E344D5A9E4BCF6509A7F39789F515AB8F92DDBCBD414D940E93',
      };
      
      const sm2 = SM2Class.generateKeyPair(curveParams);
      expect(sm2.getCurveParams()).toEqual(curveParams);
      
      sm2.setCurveParams({ ...curveParams, n: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFF7203DF6B21C6052B53BBF40939D54123' });
      expect(sm2.getCurveParams()?.n).toBeTruthy();
    });

    it('should support cipher modes', () => {
      const sm2 = SM2Class.generateKeyPair();
      const plaintext = 'Hello';
      
      const encrypted1 = sm2.encrypt(plaintext, SM2CipherMode.C1C3C2);
      expect(encrypted1).toBeTruthy();
      
      const encrypted2 = sm2.encrypt(plaintext, SM2CipherMode.C1C2C3);
      expect(encrypted2).toBeTruthy();
    });
  });

  describe('SM3Class', () => {
    it('should compute digest (static)', () => {
      const hash = SM3Class.digest('Hello, SM3!');
      expect(hash).toMatch(/^[0-9a-f]+$/);
      expect(hash).toHaveLength(64);
    });

    it('should compute HMAC (static)', () => {
      const mac = SM3Class.hmac('secret-key', 'data');
      expect(mac).toMatch(/^[0-9a-f]+$/);
      expect(mac).toHaveLength(64);
    });

    it('should support incremental hashing', () => {
      const sm3 = new SM3Class();
      sm3.update('Hello, ').update('SM3!');
      const hash = sm3.digest();
      expect(hash).toMatch(/^[0-9a-f]+$/);
      expect(hash).toHaveLength(64);
      
      // Should match single digest
      const hashDirect = SM3Class.digest('Hello, SM3!');
      expect(hash).toBe(hashDirect);
    });

    it('should support reset', () => {
      const sm3 = new SM3Class();
      sm3.update('data1');
      sm3.reset();
      sm3.update('data2');
      const hash = sm3.digest();
      
      const hashDirect = SM3Class.digest('data2');
      expect(hash).toBe(hashDirect);
    });

    it('should handle Uint8Array input', () => {
      const sm3 = new SM3Class();
      const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      sm3.update(data);
      const hash = sm3.digest();
      expect(hash).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('SM4Class', () => {
    const key = '0123456789abcdeffedcba9876543210';

    it('should encrypt and decrypt with ECB mode', () => {
      const sm4 = new SM4Class(key, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
      const plaintext = 'Hello, SM4!';
      
      const encrypted = sm4.encrypt(plaintext);
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
      
      const decrypted = sm4.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt with CBC mode', () => {
      const iv = 'fedcba98765432100123456789abcdef';
      const sm4 = new SM4Class(key, { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });
      const plaintext = 'Hello, SM4 CBC!';
      
      const encrypted = sm4.encrypt(plaintext);
      expect(encrypted).toMatch(/^[0-9a-f]+$/);
      
      const decrypted = sm4.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should create with ECB factory method', () => {
      const sm4 = SM4Class.ECB(key);
      const plaintext = 'Hello';
      
      const encrypted = sm4.encrypt(plaintext);
      const decrypted = sm4.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should create with CBC factory method', () => {
      const iv = 'fedcba98765432100123456789abcdef';
      const sm4 = SM4Class.CBC(key, iv);
      const plaintext = 'Hello';
      
      const encrypted = sm4.encrypt(plaintext);
      const decrypted = sm4.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should get and set mode', () => {
      const sm4 = new SM4Class(key);
      expect(sm4.getMode()).toBe(CipherMode.ECB);
      
      sm4.setMode(CipherMode.CBC);
      expect(sm4.getMode()).toBe(CipherMode.CBC);
    });

    it('should get and set padding', () => {
      const sm4 = new SM4Class(key);
      expect(sm4.getPadding()).toBe(PaddingMode.PKCS7);
      
      sm4.setPadding(PaddingMode.NONE);
      expect(sm4.getPadding()).toBe(PaddingMode.NONE);
    });

    it('should get and set IV', () => {
      const iv = 'fedcba98765432100123456789abcdef';
      const sm4 = new SM4Class(key);
      expect(sm4.getIV()).toBeUndefined();
      
      sm4.setIV(iv);
      expect(sm4.getIV()).toBe(iv);
    });

    it('should handle Uint8Array input', () => {
      const sm4 = SM4Class.ECB(key);
      const plaintext = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      
      const encrypted = sm4.encrypt(plaintext);
      const decrypted = sm4.decrypt(encrypted);
      expect(decrypted).toBe('Hello');
    });
  });
});
