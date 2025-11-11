# Changelog / 更新日志

本文档记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
项目遵循 [语义化版本](https://semver.org/lang/zh-CN/spec/v2.0.0.html)。

## [0.9.1] - 2024-11-11

### 新增 Added
- 完整实现 SM2 椭圆曲线公钥密码算法（符合 GM/T 0003-2012 和 GM/T 0009-2023 标准）
  - 密钥对生成（支持压缩/非压缩格式）
  - 加密/解密（支持 C1C3C2 和 C1C2C3 密文模式，自动格式检测）
  - 数字签名/验证（支持 Raw 和 DER 编码格式）
  - 密钥交换协议（基于 GM/T 0003.3-2012）
  - 公钥格式转换（压缩/解压缩）
- 完整实现 SM3 密码杂凑算法（符合 GM/T 0004-2012 标准）
  - 哈希计算（digest）
  - HMAC 消息认证码
  - 增量哈希计算（支持流式处理）
- 完整实现 SM4 分组密码算法（符合 GM/T 0002-2012 标准）
  - ECB、CBC、CTR、CFB、OFB 工作模式
  - GCM 认证加密模式（提供加密和完整性保护）
  - PKCS7、零填充和无填充模式
  - 面向对象 API（SM4 类）和函数式 API
- 完整实现 ZUC 流密码算法（符合 GM/T 0001-2012 标准）
  - ZUC-128 加密/解密
  - 密钥流生成
  - EEA3 加密算法（3GPP LTE 标准）
  - EIA3 完整性算法（3GPP LTE 标准）
- 国际标准算法支持
  - SHA-256、SHA-384、SHA-512 哈希算法（基于 @noble/hashes）
  - HMAC-SHA256、HMAC-SHA384、HMAC-SHA512
  - 统一的输出格式支持（Hex 和 Base64）
- 完善的演示页面
  - HTML5 简单演示页面（支持所有核心算法测试）
  - Vue 3 现代化演示应用（响应式设计，移动端友好）
- 完整的文档体系
  - 中英文双语 README
  - Hutool 集成指南（前后端对接）
  - 国际标准算法使用指南
  - 架构设计文档
  - 性能基准测试报告
  - GMT 标准合规性文档
- 完善的工具函数
  - 格式转换：hexToBytes、bytesToHex、stringToBytes、bytesToString
  - ASN.1 编码/解码：encodeSignature、decodeSignature、rawToDer、derToRaw
  - 调试工具：asn1ToXml、signatureToXml
  - 位运算：xor、rotl
- 灵活的输出格式
  - 支持 Hex（十六进制）和 Base64 两种输出格式
  - 所有加密和哈希函数统一支持格式配置
- TypeScript 完整类型支持
  - 全面的类型定义和类型推导
  - 严格的类型检查确保代码安全
- 多种模块格式支持
  - ES Module（主要格式）
  - CommonJS（Node.js 兼容）
  - UMD（浏览器直接引入）
- 267+ 全面的单元测试
  - 功能测试、边界测试、标准向量验证
  - 测试覆盖率高，确保代码质量

### 优化 Changed
- 移除了计划但未实现的密码模式（CCM、XTS），避免运行时错误
- 优化了文档结构，移除了冗余的测试指南文件
- 完善了作者信息和包元数据
- 改进了错误处理和输入验证
- 优化了性能，特别是在 SM2 和 SM4 算法中

### 修复 Fixed
- 修正了文档中的拼写错误（"Pkcs7" → "PKCS7"）
- 修复了英文文档中的术语表达
- 澄清了路线图中的密码模式说明

### 技术细节 Technical Details
- 核心国密算法使用纯 TypeScript 实现，无运行时依赖
- SM2 基于 @noble/curves 提供的安全椭圆曲线运算
- SHA 系列基于 @noble/hashes 高性能库
- 内部数据处理使用 Uint8Array 以获得最佳性能
- 所有输出默认为小写十六进制字符串
- Tree-shakable 导出，只打包使用的功能
- 同时支持 Node.js 18+ 和现代浏览器环境
- 符合 GM/T 0003-2012、GM/T 0004-2012、GM/T 0002-2012、GM/T 0001-2012 标准
- 兼容 GM/T 0009-2023（SM2 密码算法使用规范）

### 安全性 Security
- 使用加密安全的随机数生成器（Web Crypto API / Node.js Crypto）
- 实现了完整的 PKCS7 填充验证，防止填充攻击
- GCM 模式提供认证加密，防止密文篡改
- 所有密钥操作都经过严格验证
- 遵循国密标准的安全建议和最佳实践

## [0.1.0] - 2024-10-10

### 新增 Added
- 初始项目结构（TypeScript + Vite + Vitest）
- SM3 密码杂凑算法实现
  - `digest()` - 计算 SM3 哈希
  - `hmac()` - 计算 SM3-HMAC
- SM4 分组密码实现
  - ECB 和 CBC 模式
  - PKCS7 填充支持
  - `sm4Encrypt()` 和 `sm4Decrypt()` 函数
- SM2 椭圆曲线密码（占位实现）
  - `generateKeyPair()` - 生成密钥对
  - `getPublicKeyFromPrivateKey()` - 导出公钥
  - `sm2Encrypt()` 和 `sm2Decrypt()` - 加密/解密
  - `sign()` 和 `verify()` - 数字签名
- 工具函数
  - `hexToBytes()` / `bytesToHex()` - 十六进制转换
  - `stringToBytes()` / `bytesToString()` - 字符串转换
  - `normalizeInput()` - 输入规范化
  - `xor()` - 异或运算
  - `rotl()` - 位旋转
- 40 个单元测试
- 完整的 TypeScript 类型定义
- ESM 和 CJS 模块支持
- README 文档
- 使用示例

### 技术细节 Technical Details
- 零运行时依赖（纯 TypeScript）
- 使用 Uint8Array 进行内部数据处理
- 所有输出为小写十六进制字符串
- Tree-shakable 导出
- 支持 Node.js 和浏览器环境
