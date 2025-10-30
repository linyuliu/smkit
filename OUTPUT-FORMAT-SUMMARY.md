# 输出格式统一改进总结

## 概述

根据反馈意见，对 SMKit 进行了全面改进，确保所有加密算法的 API 一致性。

## 完成的改进

### 1. 所有算法的输出格式支持

为所有加密算法添加了统一的 `outputFormat` 配置选项：

| 算法 | 输出格式支持 | 接口 | 状态 |
|------|------------|------|------|
| SM3 哈希 | ✅ | `SM3Options` | 已完成 |
| SM4 分组密码 | ✅ | `SM4Options` | 新增 |
| SM2 椭圆曲线 | ✅ | `SM2EncryptOptions` | 新增 |
| ZUC 流密码 | ✅ | `ZUCOptions` | 新增 |
| SHA 哈希 | ✅ | `SHAOptions` | 已完成 |

### 2. 自动格式检测

所有解密函数都支持自动检测输入格式：

```typescript
// 加密时指定格式
const hexCipher = sm4Encrypt(key, data); // 默认 hex
const b64Cipher = sm4Encrypt(key, data, { outputFormat: OutputFormat.BASE64 });

// 解密时自动检测
const plain1 = sm4Decrypt(key, hexCipher); // 自动识别 hex
const plain2 = sm4Decrypt(key, b64Cipher); // 自动识别 base64
```

**自动检测算法：**
- 检查字符串是否只包含 `[0-9a-fA-F]` → hex
- 检查字符串是否匹配 `[A-Za-z0-9+/]+=*` → base64
- 默认使用 hex（向后兼容）

### 3. PKCS7/PKCS5 等价性说明

#### 在代码注释中说明

```typescript
/**
 * 填充模式 (Padding mode)
 * - PKCS7: PKCS#7 填充，填充值为填充字节数
 *   注意：JavaScript 中的 PKCS7 等同于 Java 中的 PKCS5（PKCS5 是 PKCS7 针对 8 字节块的特例）
 *   Note: PKCS7 in JavaScript is equivalent to PKCS5 in Java
 */
```

#### 技术说明

- **PKCS5**: 专门用于 8 字节块的填充标准（如 DES）
- **PKCS7**: PKCS5 的通用版本，支持 1-255 字节的块
- **SM4/AES**: 使用 16 字节块，因此只能使用 PKCS7
- **等价性**: JavaScript 的 PKCS7 对应 Java 的 PKCS5Padding

### 4. API 设计参考

参考了 CryptoJS 等主流加密库的最佳实践：

#### CryptoJS 风格
```javascript
// CryptoJS 使用对象配置
var encrypted = CryptoJS.AES.encrypt(message, key, {
  mode: CryptoJS.mode.CBC,
  padding: CryptoJS.pad.Pkcs7
});
```

#### SMKit 风格（改进后）
```typescript
// SMKit 使用 TypeScript 类型安全的对象配置
const encrypted = sm4Encrypt(key, message, {
  mode: CipherMode.CBC,
  padding: PaddingMode.PKCS7,
  outputFormat: OutputFormat.BASE64
});
```

**设计优势：**
- ✅ 类型安全（TypeScript 枚举）
- ✅ 向后兼容（默认值）
- ✅ 可扩展（新增选项不影响现有代码）
- ✅ 简洁明了（options 对象）

## 新增的接口

### SM2EncryptOptions
```typescript
export interface SM2EncryptOptions {
  mode?: SM2CipherModeType;      // C1C3C2 或 C1C2C3
  outputFormat?: OutputFormatType; // hex 或 base64
}
```

### ZUCOptions
```typescript
export interface ZUCOptions {
  outputFormat?: OutputFormatType; // hex 或 base64
}
```

### SM4Options（扩展）
```typescript
export interface SM4Options {
  mode?: CipherModeType;
  padding?: PaddingModeType;
  iv?: string;
  aad?: string | Uint8Array;
  tagLength?: number;
  outputFormat?: OutputFormatType; // 新增
}
```

## 向后兼容性

### SM2 加密函数

**旧 API（仍然支持）：**
```typescript
sm2Encrypt(publicKey, data, 'C1C3C2'); // 第三个参数是模式字符串
```

**新 API：**
```typescript
sm2Encrypt(publicKey, data, {
  mode: SM2CipherMode.C1C3C2,
  outputFormat: OutputFormat.BASE64
});
```

**实现策略：**
```typescript
export function encrypt(
  publicKey: string,
  data: string | Uint8Array,
  optionsOrMode?: SM2EncryptOptions | SM2CipherModeType
): string {
  // 检测参数类型，支持两种调用方式
  if (typeof optionsOrMode === 'string') {
    // 旧 API：使用模式字符串
  } else {
    // 新 API：使用选项对象
  }
}
```

## 测试覆盖

### 新增测试文件
- `test/output-format.test.ts`: 15 个新测试用例

### 测试内容
1. **SM4 输出格式测试**
   - hex 格式输出
   - base64 格式输出
   - hex 格式解密
   - base64 格式解密
   - CBC 模式 base64 支持

2. **SM2 输出格式测试**
   - hex 格式输出
   - base64 格式输出
   - hex 格式解密
   - base64 格式解密
   - 向后兼容性测试

3. **ZUC 输出格式测试**
   - hex 格式输出
   - base64 格式输出
   - hex 格式解密
   - base64 格式解密

4. **PKCS7 填充测试**
   - 验证 PKCS7 填充正常工作
   - 与 Java PKCS5 等价性说明

### 测试结果
```
✅ 263 个测试通过
❌ 0 个测试失败
⏭️  3 个测试跳过（ZUC-256 标准向量）
```

## 使用示例

### 统一的输出格式配置

```typescript
import { 
  sm2Encrypt, sm2Decrypt,
  sm4Encrypt, sm4Decrypt,
  zucEncrypt, zucDecrypt,
  digest, sha256,
  OutputFormat 
} from 'smkit';

// SM2
const sm2Cipher = sm2Encrypt(pubKey, 'data', { 
  outputFormat: OutputFormat.BASE64 
});

// SM4
const sm4Cipher = sm4Encrypt(key, 'data', { 
  outputFormat: OutputFormat.BASE64 
});

// ZUC
const zucCipher = zucEncrypt(key, iv, 'data', { 
  outputFormat: OutputFormat.BASE64 
});

// SM3
const sm3Hash = digest('data', { 
  outputFormat: OutputFormat.BASE64 
});

// SHA
const shaHash = sha256('data', { 
  outputFormat: OutputFormat.BASE64 
});
```

### 自动格式检测

```typescript
// 所有解密函数都能自动检测格式
const plain1 = sm4Decrypt(key, hexCiphertext);    // 自动识别 hex
const plain2 = sm4Decrypt(key, base64Ciphertext); // 自动识别 base64
const plain3 = sm2Decrypt(privKey, hexCiphertext);
const plain4 = zucDecrypt(key, iv, base64Ciphertext);
```

## 文档更新

### 更新的文档
1. **`docs/INTERNATIONAL-ALGORITHMS.zh-CN.md`**
   - 添加 SM4、SM2、ZUC 的输出格式示例
   - 添加 PKCS7/PKCS5 等价性说明
   - 更新支持范围说明

2. **代码注释**
   - 所有新增接口都有详细的中文注释
   - 添加使用示例
   - 说明默认值和向后兼容性

## 技术细节

### 格式检测正则表达式

```typescript
// Hex 检测
/^[0-9a-fA-F]+$/

// Base64 检测
/^[A-Za-z0-9+/]+=*$/
```

### 格式转换函数

```typescript
// Hex → Bytes
hexToBytes(str: string): Uint8Array

// Base64 → Bytes
base64ToBytes(str: string): Uint8Array

// Bytes → Hex
bytesToHex(bytes: Uint8Array): string

// Bytes → Base64
bytesToBase64(bytes: Uint8Array): string
```

## 代码质量

### 类型安全
- ✅ 所有接口都有完整的 TypeScript 类型定义
- ✅ 使用枚举类型提供编译时检查
- ✅ 导出所有新增类型供用户使用

### 向后兼容
- ✅ 默认值保持不变（hex 格式）
- ✅ 旧的 API 调用方式仍然有效
- ✅ 现有测试全部通过

### 代码重用
- ✅ 格式检测逻辑复用
- ✅ 格式转换函数统一
- ✅ 减少重复代码

## 总结

通过本次改进：
1. ✅ 实现了所有算法的输出格式一致性
2. ✅ 参考了 CryptoJS 等主流库的 API 设计
3. ✅ 添加了 PKCS7/PKCS5 等价性说明和文档
4. ✅ 保持了向后兼容性
5. ✅ 添加了完整的测试覆盖
6. ✅ 更新了文档和示例

所有改进都符合最佳实践，代码质量高，测试覆盖完整，文档清晰。
