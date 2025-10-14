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
  keyExchange,
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

    it('应该能够自动检测非压缩点格式（0x04 开头）', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Test auto-detection';
      
      // 加密（默认使用非压缩格式）
      const encrypted = encrypt(keyPair.publicKey, plaintext);
      
      // 验证密文以 04 开头（非压缩格式）
      expect(encrypted.startsWith('04')).toBe(true);
      
      // 解密时不指定 mode，应该自动检测
      const decrypted = decrypt(keyPair.privateKey, encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('应该能够自动检测 C1C3C2 和 C1C2C3 模式', () => {
      const keyPair = generateKeyPair();
      const plaintext = 'Test mode auto-detection';
      
      // 测试 C1C3C2 模式
      const encryptedC1C3C2 = encrypt(keyPair.publicKey, plaintext, SM2CipherMode.C1C3C2);
      const decryptedC1C3C2 = decrypt(keyPair.privateKey, encryptedC1C3C2); // 不指定 mode
      expect(decryptedC1C3C2).toBe(plaintext);
      
      // 测试 C1C2C3 模式
      const encryptedC1C2C3 = encrypt(keyPair.publicKey, plaintext, SM2CipherMode.C1C2C3);
      const decryptedC1C2C3 = decrypt(keyPair.privateKey, encryptedC1C2C3); // 不指定 mode
      expect(decryptedC1C2C3).toBe(plaintext);
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

  describe('SM2 密钥交换协议', () => {
    it('应该能够进行基本的密钥交换', () => {
      // 生成两个密钥对
      const keyPairA = generateKeyPair();
      const keyPairB = generateKeyPair();
      
      // A 生成临时密钥对
      const tempKeyPairA = generateKeyPair();
      
      // B 生成临时密钥对
      const tempKeyPairB = generateKeyPair();
      
      // A 作为发起方执行密钥交换
      const resultA = keyExchange({
        privateKey: keyPairA.privateKey,
        publicKey: keyPairA.publicKey,
        tempPrivateKey: tempKeyPairA.privateKey,
        peerPublicKey: keyPairB.publicKey,
        peerTempPublicKey: tempKeyPairB.publicKey,
        isInitiator: true,
      });
      
      // B 作为响应方执行密钥交换
      const resultB = keyExchange({
        privateKey: keyPairB.privateKey,
        publicKey: keyPairB.publicKey,
        tempPrivateKey: tempKeyPairB.privateKey,
        peerPublicKey: keyPairA.publicKey,
        peerTempPublicKey: tempKeyPairA.publicKey,
        isInitiator: false,
      });
      
      // 验证双方得到相同的共享密钥
      expect(resultA.sharedKey).toBe(resultB.sharedKey);
      expect(resultA.sharedKey).toBeTruthy();
      expect(resultA.sharedKey).toMatch(/^[0-9a-f]+$/);
    });

    it('应该能够自动生成临时密钥对', () => {
      const keyPairA = generateKeyPair();
      const keyPairB = generateKeyPair();
      const tempKeyPairB = generateKeyPair();
      
      // A 不提供临时密钥，让函数自动生成
      const resultA1 = keyExchange({
        privateKey: keyPairA.privateKey,
        publicKey: keyPairA.publicKey,
        peerPublicKey: keyPairB.publicKey,
        peerTempPublicKey: tempKeyPairB.publicKey,
        isInitiator: true,
      });
      
      expect(resultA1.tempPublicKey).toBeTruthy();
      expect(resultA1.tempPublicKey).toMatch(/^[0-9a-f]+$/);
      expect(resultA1.tempPublicKey.length).toBe(130); // 非压缩格式
    });

    it('应该支持自定义密钥长度', () => {
      const keyPairA = generateKeyPair();
      const keyPairB = generateKeyPair();
      const tempKeyPairA = generateKeyPair();
      const tempKeyPairB = generateKeyPair();
      
      // 测试 32 字节密钥
      const resultA = keyExchange({
        privateKey: keyPairA.privateKey,
        peerPublicKey: keyPairB.publicKey,
        peerTempPublicKey: tempKeyPairB.publicKey,
        tempPrivateKey: tempKeyPairA.privateKey,
        isInitiator: true,
        keyLength: 32,
      });
      
      const resultB = keyExchange({
        privateKey: keyPairB.privateKey,
        peerPublicKey: keyPairA.publicKey,
        peerTempPublicKey: tempKeyPairA.publicKey,
        tempPrivateKey: tempKeyPairB.privateKey,
        isInitiator: false,
        keyLength: 32,
      });
      
      expect(resultA.sharedKey).toBe(resultB.sharedKey);
      expect(resultA.sharedKey.length).toBe(64); // 32 字节 = 64 hex chars
    });

    it('应该生成正确的确认哈希值', () => {
      const keyPairA = generateKeyPair();
      const keyPairB = generateKeyPair();
      const tempKeyPairA = generateKeyPair();
      const tempKeyPairB = generateKeyPair();
      
      const resultA = keyExchange({
        privateKey: keyPairA.privateKey,
        peerPublicKey: keyPairB.publicKey,
        peerTempPublicKey: tempKeyPairB.publicKey,
        tempPrivateKey: tempKeyPairA.privateKey,
        isInitiator: true,
      });
      
      const resultB = keyExchange({
        privateKey: keyPairB.privateKey,
        peerPublicKey: keyPairA.publicKey,
        peerTempPublicKey: tempKeyPairA.publicKey,
        tempPrivateKey: tempKeyPairB.privateKey,
        isInitiator: false,
      });
      
      // 验证确认哈希值存在
      expect(resultA.s1).toBeTruthy();
      expect(resultA.s2).toBeTruthy();
      expect(resultB.s1).toBeTruthy();
      expect(resultB.s2).toBeTruthy();
      
      // 验证哈希值是有效的十六进制字符串
      expect(resultA.s1).toMatch(/^[0-9a-f]+$/);
      expect(resultA.s2).toMatch(/^[0-9a-f]+$/);
      expect(resultB.s1).toMatch(/^[0-9a-f]+$/);
      expect(resultB.s2).toMatch(/^[0-9a-f]+$/);
      
      // 验证哈希值长度为 64 字符（32 字节 SM3 哈希）
      expect(resultA.s1?.length).toBe(64);
      expect(resultA.s2?.length).toBe(64);
      expect(resultB.s1?.length).toBe(64);
      expect(resultB.s2?.length).toBe(64);
    });

    it('应该支持自定义用户 ID', () => {
      const keyPairA = generateKeyPair();
      const keyPairB = generateKeyPair();
      const tempKeyPairA = generateKeyPair();
      const tempKeyPairB = generateKeyPair();
      
      const userIdA = 'alice@example.com';
      const userIdB = 'bob@example.com';
      
      const resultA = keyExchange({
        privateKey: keyPairA.privateKey,
        userId: userIdA,
        peerPublicKey: keyPairB.publicKey,
        peerUserId: userIdB,
        peerTempPublicKey: tempKeyPairB.publicKey,
        tempPrivateKey: tempKeyPairA.privateKey,
        isInitiator: true,
      });
      
      const resultB = keyExchange({
        privateKey: keyPairB.privateKey,
        userId: userIdB,
        peerPublicKey: keyPairA.publicKey,
        peerUserId: userIdA,
        peerTempPublicKey: tempKeyPairA.publicKey,
        tempPrivateKey: tempKeyPairB.privateKey,
        isInitiator: false,
      });
      
      // 即使使用自定义用户 ID，双方也应该得到相同的共享密钥
      expect(resultA.sharedKey).toBe(resultB.sharedKey);
    });

    it('应该在不同参数下生成不同的共享密钥', () => {
      const keyPairA = generateKeyPair();
      const keyPairB = generateKeyPair();
      const tempKeyPairA1 = generateKeyPair();
      const tempKeyPairA2 = generateKeyPair();
      const tempKeyPairB = generateKeyPair();
      
      // 使用不同的临时密钥应该产生不同的共享密钥
      const result1 = keyExchange({
        privateKey: keyPairA.privateKey,
        peerPublicKey: keyPairB.publicKey,
        peerTempPublicKey: tempKeyPairB.publicKey,
        tempPrivateKey: tempKeyPairA1.privateKey,
        isInitiator: true,
      });
      
      const result2 = keyExchange({
        privateKey: keyPairA.privateKey,
        peerPublicKey: keyPairB.publicKey,
        peerTempPublicKey: tempKeyPairB.publicKey,
        tempPrivateKey: tempKeyPairA2.privateKey,
        isInitiator: true,
      });
      
      expect(result1.sharedKey).not.toBe(result2.sharedKey);
    });

    it('应该能够使用压缩公钥进行密钥交换', () => {
      const keyPairA = generateKeyPair();
      const keyPairB = generateKeyPair();
      const tempKeyPairA = generateKeyPair();
      const tempKeyPairB = generateKeyPair();
      
      // 压缩公钥
      const compressedA = compressPublicKey(keyPairA.publicKey);
      const compressedB = compressPublicKey(keyPairB.publicKey);
      const compressedTempA = compressPublicKey(tempKeyPairA.publicKey);
      const compressedTempB = compressPublicKey(tempKeyPairB.publicKey);
      
      const resultA = keyExchange({
        privateKey: keyPairA.privateKey,
        publicKey: compressedA,
        peerPublicKey: compressedB,
        peerTempPublicKey: compressedTempB,
        tempPrivateKey: tempKeyPairA.privateKey,
        isInitiator: true,
      });
      
      const resultB = keyExchange({
        privateKey: keyPairB.privateKey,
        publicKey: compressedB,
        peerPublicKey: compressedA,
        peerTempPublicKey: compressedTempA,
        tempPrivateKey: tempKeyPairB.privateKey,
        isInitiator: false,
      });
      
      expect(resultA.sharedKey).toBe(resultB.sharedKey);
    });
  });
});
