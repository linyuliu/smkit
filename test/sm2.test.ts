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

describe('SM2 国密算法测试', () => {
  describe('密钥对生成', () => {
    it('应该能够生成密钥对', () => {
      const keyPair = generateKeyPair();
      expect(keyPair.publicKey).toBeTruthy();
      expect(keyPair.privateKey).toBeTruthy();
      expect(keyPair.publicKey).toMatch(/^[0-9a-f]+$/);
      expect(keyPair.privateKey).toMatch(/^[0-9a-f]+$/);
    });

    it('应该每次生成不同的密钥', () => {
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    });
  });

  describe('从私钥派生公钥', () => {
    it('应该能够从私钥派生非压缩公钥', () => {
      const privateKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const publicKey = getPublicKeyFromPrivateKey(privateKey);
      expect(publicKey).toBeTruthy();
      expect(publicKey).toMatch(/^[0-9a-f]+$/);
      expect(publicKey.startsWith('04')).toBe(true); // 非压缩格式
      expect(publicKey.length).toBe(130); // 65 bytes = 130 hex chars
    });

    it('应该能够从私钥派生压缩公钥', () => {
      const privateKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
      const publicKey = getPublicKeyFromPrivateKey(privateKey, true);
      expect(publicKey).toBeTruthy();
      expect(publicKey).toMatch(/^[0-9a-f]+$/);
      expect(publicKey.startsWith('02') || publicKey.startsWith('03')).toBe(true); // 压缩格式
      expect(publicKey.length).toBe(66); // 33 bytes = 66 hex chars
    });
  });

  describe('公钥压缩与解压', () => {
    it('应该能够压缩非压缩公钥', () => {
      const keyPair = generateKeyPair();
      const compressed = compressPublicKey(keyPair.publicKey);
      expect(compressed).toBeTruthy();
      expect(compressed.startsWith('02') || compressed.startsWith('03')).toBe(true);
      expect(compressed.length).toBe(66); // 33 bytes
    });

    it('应该能够解压压缩公钥', () => {
      const keyPair = generateKeyPair();
      const uncompressed = keyPair.publicKey;
      const compressed = compressPublicKey(uncompressed);
      const decompressed = decompressPublicKey(compressed);
      expect(decompressed).toBeTruthy();
      expect(decompressed.startsWith('04')).toBe(true);
      expect(decompressed.length).toBe(130); // 65 bytes
      expect(decompressed).toBe(uncompressed);
    });

    it('应该正确处理已经是非压缩格式的公钥', () => {
      const keyPair = generateKeyPair();
      const result = decompressPublicKey(keyPair.publicKey);
      expect(result).toBe(keyPair.publicKey.toLowerCase());
    });
  });

  describe('加解密测试', () => {
    it('应该能够加密数据', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Hello, SM2!';
      const encrypted = encrypt(keyPair.publicKey, plaintext);
      expect(encrypted).toBeTruthy();
      expect(encrypted).toMatch(/^[0-9a-zA-Z]+$/);
    });

    it('应该能够正确解密 - 短文本', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Hello, SM2!';
      const encrypted = encrypt(keyPair.publicKey, plaintext);
      const decrypted = decrypt(keyPair.privateKey, encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('应该能够正确解密 - 中文文本', () => {
      const keyPair = generateKeyPair();
      const plaintext = '你好，国密SM2算法！';
      const encrypted = encrypt(keyPair.publicKey, plaintext);
      const decrypted = decrypt(keyPair.privateKey, encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('应该能够正确解密 - 长文本', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'This is a longer text to test SM2 encryption and decryption. It contains multiple sentences and should work correctly with the SM2 algorithm implementation.';
      const encrypted = encrypt(keyPair.publicKey, plaintext);
      const decrypted = decrypt(keyPair.privateKey, encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('应该能够正确解密 - 数字和特殊字符', () => {
      const keyPair = generateKeyPair();
      const plaintext = '1234567890!@#$%^&*()_+-=[]{}|;:,.<>?';
      const encrypted = encrypt(keyPair.publicKey, plaintext);
      const decrypted = decrypt(keyPair.privateKey, encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('应该支持两种密文模式 - C1C3C2', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Hello';
      
      const encrypted = encrypt(keyPair.publicKey, plaintext, SM2CipherMode.C1C3C2);
      expect(encrypted).toBeTruthy();
      const decrypted = decrypt(keyPair.privateKey, encrypted, SM2CipherMode.C1C3C2);
      expect(decrypted).toBe(plaintext);
    });

    it('应该支持两种密文模式 - C1C2C3', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Hello';
      
      const encrypted = encrypt(keyPair.publicKey, plaintext, SM2CipherMode.C1C2C3);
      expect(encrypted).toBeTruthy();
      const decrypted = decrypt(keyPair.privateKey, encrypted, SM2CipherMode.C1C2C3);
      expect(decrypted).toBe(plaintext);
    });

    it('应该接受 Uint8Array 输入并正确解密', () => {
      const keyPair = generateKeyPair();
      const plaintext = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
      const encrypted = encrypt(keyPair.publicKey, plaintext);
      expect(encrypted).toBeTruthy();
      const decrypted = decrypt(keyPair.privateKey, encrypted);
      expect(decrypted).toBe('Hello');
    });

    it('应该能使用压缩公钥进行加密', () => {
      const keyPair = generateKeyPair();
      const compressed = compressPublicKey(keyPair.publicKey);
      const plaintext = 'Test with compressed key';
      const encrypted = encrypt(compressed, plaintext);
      const decrypted = decrypt(keyPair.privateKey, encrypted);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('签名与验签', () => {
    it('应该能够对数据进行签名', () => {
      const keyPair = generateKeyPair();
      const data = 'Hello, SM2!';
      const signature = sign(keyPair.privateKey, data);
      expect(signature).toBeTruthy();
      expect(signature).toMatch(/^[0-9a-f]+$/);
    });

    it('应该能够验证签名', () => {
      const keyPair = generateKeyPair();
      const data = 'Hello, SM2!';
      const signature = sign(keyPair.privateKey, data);
      const isValid = verify(keyPair.publicKey, data, signature);
      expect(isValid).toBe(true);
    });

    it('应该接受 Uint8Array 输入', () => {
      const keyPair = generateKeyPair();
      const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      const signature = sign(keyPair.privateKey, data);
      expect(signature).toBeTruthy();
      
      const isValid = verify(keyPair.publicKey, data, signature);
      expect(isValid).toBe(true);
    });

    it('应该支持配置选项', () => {
      const keyPair = generateKeyPair();
      const data = 'Hello';
      
      const signature = sign(keyPair.privateKey, data, { der: true, userId: DEFAULT_USER_ID });
      expect(signature).toBeTruthy();
      
      const isValid = verify(keyPair.publicKey, data, signature, { der: true, userId: DEFAULT_USER_ID });
      expect(isValid).toBe(true);
    });

    it('应该支持跳过 Z 值计算选项', () => {
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

    it('应该能使用压缩公钥进行验签', () => {
      const keyPair = generateKeyPair();
      const compressed = compressPublicKey(keyPair.publicKey);
      const data = 'Hello, SM2!';
      
      const signature = sign(keyPair.privateKey, data);
      const isValid = verify(compressed, data, signature);
      expect(isValid).toBe(true);
    });
  });
});
