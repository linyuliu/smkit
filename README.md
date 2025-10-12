# SMKit

中国国密算法（SM2、SM3、SM4）的纯 TypeScript 实现。

简体中文 | [English](./README.en.md)

## 特性

- **纯粹性**: 核心加密算法使用纯 TypeScript 实现，零运行时依赖
- **性能**: 内部数据处理使用 `Uint8Array` 以获得最佳性能
- **现代化**: 使用 TypeScript 编写，提供一流的类型支持，ES 模块优先，兼容 CommonJS
- **同构性**: 在 Node.js 和现代浏览器中无缝运行

## 安装

```bash
npm install smkit
```

## 在线演示

想快速体验 SMKit？我们提供了交互式演示页面：

```bash
# 克隆仓库
git clone https://github.com/linyuliu/smkit.git
cd smkit

# 启动演示
npm run demo
```

在浏览器中访问演示页面，可以：
- ✅ 测试 SM3 哈希计算
- ✅ 测试 SM4 加密解密
- ✅ 测试 SM2 密钥生成、签名和验签

[查看演示说明](./demo/README.md)

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

// ECB 模式（电码本模式）
const encrypted = sm4Encrypt(key, plaintext, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
const decrypted = sm4Decrypt(key, encrypted, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });

// CBC 模式（分组链接模式）
const iv = 'fedcba98765432100123456789abcdef'; // 128 位 IV（32 个十六进制字符）
const encryptedCBC = sm4Encrypt(key, plaintext, { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });
const decryptedCBC = sm4Decrypt(key, encryptedCBC, { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });

// CTR 模式（计数器模式）- 流密码模式，无需填充
const counter = '00000000000000000000000000000000'; // 128 位计数器/随机数
const encryptedCTR = sm4Encrypt(key, plaintext, { mode: CipherMode.CTR, iv: counter });
const decryptedCTR = sm4Decrypt(key, encryptedCTR, { mode: CipherMode.CTR, iv: counter });

// CFB 模式（密文反馈模式）- 流密码模式，无需填充
const encryptedCFB = sm4Encrypt(key, plaintext, { mode: CipherMode.CFB, iv });
const decryptedCFB = sm4Decrypt(key, encryptedCFB, { mode: CipherMode.CFB, iv });

// OFB 模式（输出反馈模式）- 流密码模式，无需填充
const encryptedOFB = sm4Encrypt(key, plaintext, { mode: CipherMode.OFB, iv });
const decryptedOFB = sm4Decrypt(key, encryptedOFB, { mode: CipherMode.OFB, iv });

// GCM 模式（伽罗瓦/计数器模式）- 认证加密模式
const gcmIv = '000000000000000000000000'; // 96 位 IV（24 个十六进制字符，GCM 专用）
const aad = 'Additional Authenticated Data'; // 可选的额外认证数据
const gcmResult = sm4Encrypt(key, plaintext, { mode: CipherMode.GCM, iv: gcmIv, aad });
console.log(gcmResult); // { ciphertext: '...', tag: '...' }
const decryptedGCM = sm4Decrypt(key, gcmResult, { mode: CipherMode.GCM, iv: gcmIv, aad });
```

#### SM2 椭圆曲线密码

```typescript
import { generateKeyPair, getPublicKeyFromPrivateKey, sm2Encrypt, sm2Decrypt, sign, verify, SM2CipherMode } from 'smkit';

// 生成密钥对（使用 @noble/curves 提供的安全随机数生成）
const keyPair = generateKeyPair();
console.log(keyPair.publicKey);  // 十六进制字符串，04 开头的非压缩格式
console.log(keyPair.privateKey); // 十六进制字符串，32 字节

// 从私钥派生公钥
const publicKey = getPublicKeyFromPrivateKey(keyPair.privateKey);

// 加密/解密
const plaintext = 'Hello, SM2!';
// 支持两种密文模式：C1C3C2（默认）和 C1C2C3
const encrypted = sm2Encrypt(keyPair.publicKey, plaintext, SM2CipherMode.C1C3C2);
const decrypted = sm2Decrypt(keyPair.privateKey, encrypted, SM2CipherMode.C1C3C2);

// 签名/验证（使用 SM3 哈希和 Z 值计算）
const data = 'Message to sign';
const signature = sign(keyPair.privateKey, data);
const isValid = verify(keyPair.publicKey, data, signature);
console.log(isValid); // true

// DER 编码签名（ASN.1 DER 格式）
const signatureDER = sign(keyPair.privateKey, data, { der: true });
const isValidDER = verify(keyPair.publicKey, data, signatureDER, { der: true });

// 自定义用户 ID（默认为 '1234567812345678'）
const signatureCustom = sign(keyPair.privateKey, data, { userId: 'user@example.com' });
const isValidCustom = verify(keyPair.publicKey, data, signatureCustom, { userId: 'user@example.com' });

// 自动识别输入格式
// 支持：
// - 十六进制字符串（带或不带 0x 前缀）
// - 大写或小写十六进制
// - 压缩或非压缩公钥格式
// - DER 编码或原始格式签名
const privateKeyWith0x = '0x' + keyPair.privateKey;
const publicKeyUpper = keyPair.publicKey.toUpperCase();
const sig = sign(privateKeyWith0x, 'test');
const valid = verify(publicKeyUpper, 'test', sig); // 自动识别格式

// 支持 Uint8Array 输入
const binaryData = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
const encryptedBinary = sm2Encrypt(keyPair.publicKey, binaryData);
const signatureBinary = sign(keyPair.privateKey, binaryData);
```

### 面向对象 API

#### SM3 - 哈希操作

```typescript
import { SM3 } from 'smkit';

// 静态方法
const hash = SM3.digest('Hello, SM3!');
const mac = SM3.hmac('secret-key', 'data');

// 增量哈希
const sm3 = new SM3();
sm3.update('Hello, ').update('SM3!');
const result = sm3.digest();
```

#### SM4 - 分组密码

```typescript
import { SM4, CipherMode, PaddingMode } from 'smkit';

const key = '0123456789abcdeffedcba9876543210';
const iv = 'fedcba98765432100123456789abcdef';

// 使用构造函数
const sm4 = new SM4(key, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
const encrypted = sm4.encrypt('Hello, SM4!');
const decrypted = sm4.decrypt(encrypted);

// 使用工厂方法
const sm4ecb = SM4.ECB(key);
const sm4cbc = SM4.CBC(key, iv);
const sm4ctr = SM4.CTR(key, '00000000000000000000000000000000');
const sm4cfb = SM4.CFB(key, iv);
const sm4ofb = SM4.OFB(key, iv);

// 配置设置
sm4.setMode(CipherMode.CBC);
sm4.setIV(iv);
sm4.setPadding(PaddingMode.PKCS7);
```

#### SM2 - 椭圆曲线密码

```typescript
import { SM2, SM2CipherMode } from 'smkit';

// 生成密钥对
const sm2 = SM2.generateKeyPair();

// 从现有密钥创建
const sm2FromPrivate = SM2.fromPrivateKey(privateKey);
const sm2FromPublic = SM2.fromPublicKey(publicKey);

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
const sm2Custom = SM2.generateKeyPair(curveParams);
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

// 分组密码模式
CipherMode.ECB  // 'ecb' - 电码本模式
CipherMode.CBC  // 'cbc' - 分组链接模式

// 流密码模式
CipherMode.CTR  // 'ctr' - 计数器模式
CipherMode.CFB  // 'cfb' - 密文反馈模式
CipherMode.OFB  // 'ofb' - 输出反馈模式

// 认证加密模式
CipherMode.GCM  // 'gcm' - 伽罗瓦/计数器模式（已实现）
CipherMode.CCM  // 'ccm' - 计数器与CBC-MAC模式（计划中）

// 磁盘加密模式
CipherMode.XTS  // 'xts' - 可调密码本模式（计划中）
```

**说明**：
- **ECB**: 不推荐用于生产环境，每个块独立加密
- **CBC**: 需要 IV，每个块与前一个密文块异或
- **CTR/CFB/OFB**: 流密码模式，不需要填充，需要 IV
- **GCM**: 认证加密，提供加密和认证，需要 12 字节 IV
- **CCM/XTS**: 计划实现中

### 填充模式
```typescript
import { PaddingMode } from 'smkit';

PaddingMode.PKCS7  // 'pkcs7' - PKCS#7 填充（默认）
PaddingMode.NONE   // 'none' - 无填充
PaddingMode.ZERO   // 'zero' - 零填充
```

**说明**：
- **PKCS7**: 填充值为填充字节数（例如：填充 3 字节，则每个字节值为 0x03）
- **NONE**: 无填充，数据长度必须是 16 字节的倍数
- **ZERO**: 用零字节填充到 16 字节的倍数
- 流密码模式（CTR/CFB/OFB/GCM）不使用填充

### SM2 密文模式
```typescript
import { SM2CipherMode } from 'smkit';

SM2CipherMode.C1C3C2  // 'C1C3C2' (推荐)
SM2CipherMode.C1C2C3  // 'C1C2C3'
```

### OID（对象标识符）
```typescript
import { OID } from 'smkit';

OID.SM2            // '1.2.156.10197.1.301' - SM2 椭圆曲线公钥密码算法
OID.SM2_SM3        // '1.2.156.10197.1.501' - SM2 签名（使用 SM3）
OID.SM3            // '1.2.156.10197.1.401' - SM3 哈希算法
OID.SM4            // '1.2.156.10197.1.104' - SM4 密码算法
OID.EC_PUBLIC_KEY  // '1.2.840.10045.2.1' - 标准 EC 公钥（OpenSSL 1.x 对 SM2 的错误标识）
```

**说明**：
- 1.2.156 是中国国家密码管理局的注册号
- 10197 是商用密码标识
- SM2 基于椭圆曲线（ECC），但使用中国自主注册的 OID 和参数
- 这些 OID 与国际标准的 ECC OID 不同，确保了商密算法的独立性

**⚠️ OpenSSL 版本兼容性**：
- **OpenSSL 1.x**：SM2 公钥被错误地标识为标准 EC 公钥（OID: `1.2.840.10045.2.1`）
- **OpenSSL 3.x**：SM2 公钥使用正确的国密标准 OID（`1.2.156.10197.1.301`）
- 如果您在解析证书时看到 OID `1.2.840.10045.2.1`，这表明证书是由 OpenSSL 1.x 生成的
- **建议**：使用 OpenSSL 3.x 生成证书以确保符合 GB/T 33560-2017 国密标准
- 本库遵循国密标准，使用正确的 OID `1.2.156.10197.1.301`

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
- `SM3.digest(data)` - 静态方法计算哈希
- `SM3.hmac(key, data)` - 静态方法计算 HMAC
- `new SM3()` - 创建增量哈希实例
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
- `new SM4(key, options?)` - 创建 SM4 实例
- `SM4.ECB(key, padding?)` - 创建 ECB 模式实例
- `SM4.CBC(key, iv, padding?)` - 创建 CBC 模式实例
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
- `SM2.generateKeyPair(curveParams?)` - 生成密钥对
- `SM2.fromPrivateKey(privateKey, curveParams?)` - 从私钥创建
- `SM2.fromPublicKey(publicKey, curveParams?)` - 从公钥创建
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

SMKit 采用模块化、分层的架构设计，便于扩展和维护：

```
src/
├── crypto/          # 密码算法实现（按算法分类）
│   ├── sm2/        # SM2 椭圆曲线算法
│   ├── sm3/        # SM3 哈希算法
│   └── sm4/        # SM4 分组密码算法
├── core/           # 核心工具模块
├── types/          # 类型定义和常量
└── index.ts        # 统一导出接口
```

**设计原则**：
- **模块化**: 每个算法独立目录，职责清晰
- **Tree-shaking**: 只导入您需要的内容
- **双 API 设计**: 同时支持函数式和面向对象风格
- **易于扩展**: 新增算法只需添加新模块并导出
- **中文注释**: 核心代码包含详细的中文注释

详细架构说明请参阅 [架构文档](./ARCHITECTURE.zh-CN.md)

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
