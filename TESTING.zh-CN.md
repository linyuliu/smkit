# 本地测试指南

本文档介绍如何在本地测试 SMKit 的各项功能，包括加解密、签名验签、密钥交换等。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 运行现有测试套件

```bash
# 运行所有测试
npm test

# 运行测试并监听文件变化
npm run test:watch

# 类型检查
npm run type-check

# 构建项目
npm run build
```

## 测试示例

### 方式一：使用提供的示例文件

项目提供了完整的示例文件 `examples.ts`，展示了所有功能的用法：

```bash
# 安装 tsx（如果还没有安装）
npm install -g tsx

# 运行示例
npx tsx examples.ts
```

### 方式二：使用本地测试脚本

我们提供了一个交互式测试脚本 `test-local.ts`，可以让你快速测试各项功能：

```bash
# 运行本地测试脚本
npx tsx test-local.ts
```

### 方式三：在 Node.js REPL 中测试

```bash
# 启动 Node.js 并导入 SMKit
node
```

然后在 REPL 中：

```javascript
// 导入 SMKit (需要先构建项目)
const smkit = require('./dist/smkit.cjs');

// 测试 SM3 哈希
const hash = smkit.digest('Hello, World!');
console.log('SM3 哈希:', hash);

// 测试 SM4 加密
const key = '0123456789abcdeffedcba9876543210';
const encrypted = smkit.sm4Encrypt(key, 'Hello, SM4!', { mode: 'ecb', padding: 'pkcs7' });
console.log('SM4 加密:', encrypted);

const decrypted = smkit.sm4Decrypt(key, encrypted, { mode: 'ecb', padding: 'pkcs7' });
console.log('SM4 解密:', decrypted);

// 测试 SM2 密钥生成
const keyPair = smkit.generateKeyPair();
console.log('公钥:', keyPair.publicKey);
console.log('私钥:', keyPair.privateKey);

// 测试 SM2 加密解密
const sm2Encrypted = smkit.sm2Encrypt(keyPair.publicKey, 'Hello, SM2!');
console.log('SM2 加密:', sm2Encrypted);

const sm2Decrypted = smkit.sm2Decrypt(keyPair.privateKey, sm2Encrypted);
console.log('SM2 解密:', sm2Decrypted);

// 测试 SM2 签名验签
const signature = smkit.sign(keyPair.privateKey, 'Message to sign');
console.log('签名:', signature);

const isValid = smkit.verify(keyPair.publicKey, 'Message to sign', signature);
console.log('验签结果:', isValid);
```

### 方式四：使用在线演示页面

#### H5 简单演示

```bash
# 构建项目
npm run build

# 启动演示服务器
npm run demo
```

然后在浏览器中访问 http://localhost:3000/demo/index.html

#### Vue 3 现代化演示

```bash
# 安装依赖
cd demo-vue
npm install

# 启动开发服务器
npm run dev
```

然后在浏览器中访问显示的地址（通常是 http://localhost:5173）

## 功能测试清单

### SM3 哈希算法

- [x] 基本哈希计算
- [x] HMAC 计算
- [x] 增量哈希（使用 OOP API）
- [x] 空字符串哈希
- [x] 大数据哈希

### SM4 分组密码

- [x] ECB 模式加密解密
- [x] CBC 模式加密解密
- [x] CTR 模式加密解密
- [x] CFB 模式加密解密
- [x] OFB 模式加密解密
- [x] GCM 模式认证加密
- [x] PKCS7 填充
- [x] 零填充
- [x] 无填充

### SM2 椭圆曲线密码

- [x] 密钥对生成
- [x] 从私钥派生公钥
- [x] 公钥压缩/解压缩
- [x] 加密解密（C1C3C2 模式）
- [x] 加密解密（C1C2C3 模式）
- [x] 签名验签（Raw 格式）
- [x] 签名验签（DER 格式）
- [x] 自定义用户 ID
- [x] 密钥交换协议

### ZUC 流密码

- [x] ZUC-128 加密解密
- [x] 密钥流生成
- [x] EEA3 加密算法
- [x] EIA3 完整性算法

## 性能测试

运行性能基准测试：

```bash
# 运行 ZUC 性能测试
npx tsx test/zuc-benchmark.ts
```

## 常见问题

### 1. 测试失败怎么办？

如果测试失败，请检查：

- Node.js 版本是否 >= 18
- 依赖是否正确安装 (`npm install`)
- 是否运行了构建 (`npm run build`)

### 2. 如何测试特定的算法？

可以使用 vitest 的过滤功能：

```bash
# 只测试 SM2
npm test -- sm2

# 只测试 SM3
npm test -- sm3

# 只测试 SM4
npm test -- sm4

# 只测试 ZUC
npm test -- zuc
```

### 3. 如何添加自己的测试用例？

在 `test/` 目录下创建新的测试文件，参考现有测试文件的格式：

```typescript
import { describe, it, expect } from 'vitest';
import { digest } from '../src';

describe('My Custom Tests', () => {
  it('should compute correct hash', () => {
    const result = digest('test data');
    expect(result).toBeDefined();
    expect(result.length).toBe(64); // SM3 输出 256 位 = 64 个十六进制字符
  });
});
```

然后运行：

```bash
npm test
```

## 调试技巧

### 使用 VS Code 调试

在 `.vscode/launch.json` 中添加配置：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Run Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["test"],
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Run Examples",
      "program": "${workspaceFolder}/examples.ts",
      "runtimeArgs": ["-r", "tsx/cjs"],
      "console": "integratedTerminal"
    }
  ]
}
```

### 查看详细日志

在测试中添加 console.log 输出：

```typescript
console.log('Input:', data);
console.log('Output:', result);
console.log('Expected:', expected);
```

## 测试覆盖率

运行测试覆盖率报告：

```bash
# 运行测试并生成覆盖率报告
npx vitest run --coverage
```

## 进一步阅读

- [API 文档](./README.md)
- [与 Hutool 对接测试](./docs/HUTOOL-INTEGRATION.zh-CN.md)
- [架构说明](./ARCHITECTURE.zh-CN.md)
- [性能优化](./docs/PERFORMANCE.md)
