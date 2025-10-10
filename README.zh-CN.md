# SMKit

中国国密算法（SM2、SM3、SM4）的纯 TypeScript 实现。

[English](./README.md) | 简体中文

## 特性

- **纯粹性**: 核心加密算法使用纯 TypeScript 实现，零运行时依赖
- **性能**: 内部数据处理使用 `Uint8Array` 以获得最佳性能
- **现代化**: 使用 TypeScript 编写，提供一流的类型支持，ES 模块优先，兼容 CommonJS
- **同构性**: 在 Node.js 和现代浏览器中无缝运行

## 安装

```bash
npm install smkit
```

## 使用方法

### 函数式 API

#### SM3 哈希算法

```typescript
import { digest, hmac } from 'smkit';

// 计算哈希
const hash = digest('Hello, SM3!');
console.log(hash); // 小写十六进制字符串（64 个字符）

// HMAC
const mac = hmac('secret-key', 'data to authenticate');
console.log(mac); // 小写十六进制字符串（64 个字符）
```

#### SM4 分组密码

```typescript
import { sm4Encrypt, sm4Decrypt, CipherMode, PaddingMode } from 'smkit';

const key = '0123456789abcdeffedcba9876543210'; // 128 位密钥（32 个十六进制字符）
const plaintext = 'Hello, SM4!';

// ECB 模式
const encrypted = sm4Encrypt(key, plaintext, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
const decrypted = sm4Decrypt(key, encrypted, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });

// CBC 模式
const iv = 'fedcba98765432100123456789abcdef'; // 128 位 IV（32 个十六进制字符）
const encryptedCBC = sm4Encrypt(key, plaintext, { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });
const decryptedCBC = sm4Decrypt(key, encryptedCBC, { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });
```

#### SM2 椭圆曲线密码

```typescript
import { generateKeyPair, sm2Encrypt, sm2Decrypt, sign, verify, SM2CipherMode } from 'smkit';

// 生成密钥对
const keyPair = generateKeyPair();
console.log(keyPair.publicKey);
console.log(keyPair.privateKey);

// 加密/解密
const plaintext = 'Hello, SM2!';
const encrypted = sm2Encrypt(keyPair.publicKey, plaintext, SM2CipherMode.C1C3C2);
const decrypted = sm2Decrypt(keyPair.privateKey, encrypted, SM2CipherMode.C1C3C2);

// 签名/验证
const data = 'Message to sign';
const signature = sign(keyPair.privateKey, data);
const isValid = verify(keyPair.publicKey, data, signature);
console.log(isValid); // true
```

### 面向对象 API

#### SM3Class - 哈希操作

```typescript
import { SM3Class } from 'smkit';

// 静态方法
const hash = SM3Class.digest('Hello, SM3!');
const mac = SM3Class.hmac('secret-key', 'data');

// 增量哈希
const sm3 = new SM3Class();
sm3.update('Hello, ').update('SM3!');
const result = sm3.digest();
```

#### SM4Class - 分组密码

```typescript
import { SM4Class, CipherMode, PaddingMode } from 'smkit';

const key = '0123456789abcdeffedcba9876543210';

// 使用构造函数
const sm4 = new SM4Class(key, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
const encrypted = sm4.encrypt('Hello, SM4!');
const decrypted = sm4.decrypt(encrypted);

// 使用工厂方法
const sm4ecb = SM4Class.ECB(key);
const sm4cbc = SM4Class.CBC(key, iv);

// 配置设置
sm4.setMode(CipherMode.CBC);
sm4.setIV('fedcba98765432100123456789abcdef');
sm4.setPadding(PaddingMode.PKCS7);
```

#### SM2Class - 椭圆曲线密码

```typescript
import { SM2Class, SM2CipherMode } from 'smkit';

// 生成密钥对
const sm2 = SM2Class.generateKeyPair();

// 从现有密钥创建
const sm2FromPrivate = SM2Class.fromPrivateKey(privateKey);
const sm2FromPublic = SM2Class.fromPublicKey(publicKey);

// 加密/解密
const encrypted = sm2.encrypt('Hello, SM2!', SM2CipherMode.C1C3C2);
const decrypted = sm2.decrypt(encrypted, SM2CipherMode.C1C3C2);

// 签名/验证
const signature = sm2.sign('Message to sign');
const isValid = sm2.verify('Message to sign', signature);

// 自定义曲线参数
const curveParams = {
  p: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFF',
  a: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFC',
  b: '28E9FA9E9D9F5E344D5A9E4BCF6509A7F39789F515AB8F92DDBCBD414D940E93',
  Gx: '32C4AE2C1F1981195F9904466A39C9948FE30BBFF2660BE1715A4589334C74C7',
  Gy: 'BC3736A2F4F6779C59BDCEE36B692153D0A9877CC62A474002DF32E52139F0A0',
  n: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFF7203DF6B21C6052B53BBF40939D54123',
};
const sm2Custom = SM2Class.generateKeyPair(curveParams);
```

### 工具函数

```typescript
import { hexToBytes, bytesToHex, stringToBytes, bytesToString } from 'smkit';

// 在十六进制和字节之间转换
const bytes = hexToBytes('48656c6c6f');
const hex = bytesToHex(bytes);

// 在字符串和字节之间转换
const strBytes = stringToBytes('Hello');
const str = bytesToString(strBytes);
```

## 常量

### 密码模式
```typescript
import { CipherMode } from 'smkit';

CipherMode.ECB  // 'ECB'
CipherMode.CBC  // 'CBC'
```

### 填充模式
```typescript
import { PaddingMode } from 'smkit';

PaddingMode.PKCS7  // 'PKCS7'
PaddingMode.NONE   // 'NONE'
```

### SM2 密文模式
```typescript
import { SM2CipherMode } from 'smkit';

SM2CipherMode.C1C3C2  // 'C1C3C2' (推荐)
SM2CipherMode.C1C2C3  // 'C1C2C3'
```

### OID（对象标识符）
```typescript
import { OID } from 'smkit';

OID.SM2      // '1.2.156.10197.1.301' - SM2 算法
OID.SM2_SM3  // '1.2.156.10197.1.501' - SM2 签名（使用 SM3）
OID.SM3      // '1.2.156.10197.1.401' - SM3 哈希算法
OID.SM4      // '1.2.156.10197.1.104' - SM4 密码算法
```

### 默认值
```typescript
import { DEFAULT_USER_ID } from 'smkit';

DEFAULT_USER_ID  // '1234567812345678' - SM2 签名的默认用户 ID（GM/T 0009-2012 规定）
```

## API 参考

### SM3

**函数式 API:**
- `digest(data: string | Uint8Array): string` - 计算 SM3 哈希摘要
- `hmac(key: string | Uint8Array, data: string | Uint8Array): string` - 计算 SM3-HMAC

**面向对象 API:**
- `SM3Class.digest(data)` - 静态方法计算哈希
- `SM3Class.hmac(key, data)` - 静态方法计算 HMAC
- `new SM3Class()` - 创建增量哈希实例
  - `.update(data)` - 添加数据
  - `.digest()` - 完成并返回哈希
  - `.reset()` - 重置状态

### SM4

**函数式 API:**
- `sm4Encrypt(key: string, data: string | Uint8Array, options?: SM4Options): string` - 使用 SM4 加密数据
- `sm4Decrypt(key: string, encryptedData: string, options?: SM4Options): string` - 使用 SM4 解密数据

**SM4Options:**
- `mode?: CipherModeType` - 密码模式（默认：ECB）
- `padding?: PaddingModeType` - 填充方案（默认：PKCS7）
- `iv?: string` - CBC 模式的初始化向量（32 个十六进制字符）

**面向对象 API:**
- `new SM4Class(key, options?)` - 创建 SM4 实例
- `SM4Class.ECB(key, padding?)` - 创建 ECB 模式实例
- `SM4Class.CBC(key, iv, padding?)` - 创建 CBC 模式实例
- 实例方法：
  - `.encrypt(data)` - 加密数据
  - `.decrypt(encryptedData)` - 解密数据
  - `.setMode(mode)` / `.getMode()` - 设置/获取模式
  - `.setPadding(padding)` / `.getPadding()` - 设置/获取填充
  - `.setIV(iv)` / `.getIV()` - 设置/获取 IV

### SM2

**函数式 API:**
- `generateKeyPair(): KeyPair` - 生成 SM2 密钥对
- `getPublicKeyFromPrivateKey(privateKey: string): string` - 从私钥派生公钥
- `sm2Encrypt(publicKey: string, data: string | Uint8Array, mode?: SM2CipherModeType): string` - 使用 SM2 加密数据
- `sm2Decrypt(privateKey: string, encryptedData: string, mode?: SM2CipherModeType): string` - 使用 SM2 解密数据
- `sign(privateKey: string, data: string | Uint8Array, options?: SignOptions): string` - 使用 SM2 签名数据
- `verify(publicKey: string, data: string | Uint8Array, signature: string, options?: VerifyOptions): boolean` - 使用 SM2 验证签名

**SignOptions/VerifyOptions:**
- `der?: boolean` - 使用 DER 编码签名
- `userId?: string` - 签名的用户 ID（默认：'1234567812345678'）
- `curveParams?: SM2CurveParams` - 自定义椭圆曲线参数

**SM2CurveParams:**
- `p?: string` - 素数模数 p
- `a?: string` - 系数 a
- `b?: string` - 系数 b
- `Gx?: string` - 基点 x 坐标
- `Gy?: string` - 基点 y 坐标
- `n?: string` - 阶 n

**面向对象 API:**
- `SM2Class.generateKeyPair(curveParams?)` - 生成密钥对
- `SM2Class.fromPrivateKey(privateKey, curveParams?)` - 从私钥创建
- `SM2Class.fromPublicKey(publicKey, curveParams?)` - 从公钥创建
- 实例方法：
  - `.encrypt(data, mode?)` - 加密数据
  - `.decrypt(encryptedData, mode?)` - 解密数据
  - `.sign(data, options?)` - 签名数据
  - `.verify(data, signature, options?)` - 验证签名
  - `.getPublicKey()` / `.getPrivateKey()` - 获取密钥
  - `.setCurveParams(params)` / `.getCurveParams()` - 设置/获取曲线参数

### 工具函数

- `hexToBytes(hex: string): Uint8Array` - 将十六进制字符串转换为字节
- `bytesToHex(bytes: Uint8Array): string` - 将字节转换为小写十六进制字符串
- `stringToBytes(str: string): Uint8Array` - 将 UTF-8 字符串转换为字节
- `bytesToString(bytes: Uint8Array): string` - 将字节转换为 UTF-8 字符串
- `normalizeInput(data: string | Uint8Array): Uint8Array` - 将输入规范化为 Uint8Array
- `xor(a: Uint8Array, b: Uint8Array): Uint8Array` - 对两个字节数组进行异或
- `rotl(value: number, shift: number): number` - 左旋转 32 位值

## 数据格式约定

- **内部处理**: 所有二进制数据使用 `Uint8Array`
- **输入**: 接受 `string` 和 `Uint8Array` 类型。字符串按 UTF-8 解码
- **输出**: 二进制输出（密文、签名）编码为**小写十六进制字符串**
- **密钥**: 所有密钥使用**十六进制字符串**格式

## 架构

SMKit 遵循函数式编程原则，所有功能都实现为独立的纯函数。同时提供面向对象的 API 以提供更好的状态管理和易用性。这使得：

- **Tree-shaking**: 只导入您需要的内容
- **易于测试**: 具有固定输入/输出的纯函数
- **强大的可组合性**: 像构建块一样组合函数
- **灵活性**: 选择函数式或面向对象风格

## 从源码构建

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 构建
npm run build

# 类型检查
npm run type-check
```

## 标准和参考

本库实现基于以下中国国家密码标准：

- **GM/T 0003-2012**: SM2 椭圆曲线公钥密码算法
- **GM/T 0004-2012**: SM3 密码杂凑算法
- **GM/T 0002-2012**: SM4 分组密码算法
- **GM/T 0009-2012**: SM2 密码算法使用规范
- **GM/T 0006-2012**: 密码应用标识规范（OID 定义）

## 许可证

Apache-2.0

## 注意

这是一个初始实现。SM2 模块当前包含占位符实现，将在未来版本中通过完整的椭圆曲线运算进行增强。SM3 和 SM4 功能完整。

## 相关项目

- [sm-crypto-v2](https://github.com/Cubelrti/sm-crypto-v2) - 另一个优秀的 SM 算法实现
