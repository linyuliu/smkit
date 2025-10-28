# 发版前检查清单

在发布新版本之前，请确保完成以下所有检查项。

## ✅ 代码质量检查

- [x] **运行所有测试**: `npm test`
  - 所有测试通过 ✓ (214 passed, 3 skipped)
  
- [x] **类型检查**: `npm run type-check`
  - 无类型错误 ✓
  
- [x] **构建验证**: `npm run build`
  - 构建成功，生成 ESM, CJS, UMD 三种格式 ✓
  
- [x] **依赖安全检查**: `npm audit`
  - 生产依赖无漏洞 ✓
  - 开发依赖漏洞不影响发布包 ✓

## ✅ 功能测试

- [x] **本地功能测试**: `npx tsx test-local.ts`
  - SM3 哈希算法 ✓
  - SM4 分组密码（ECB, CBC, CTR, CFB, OFB, GCM）✓
  - SM2 椭圆曲线（密钥生成、加密解密、签名验签、密钥交换）✓
  - ZUC 流密码（加密解密、EEA3、EIA3）✓

## ✅ 文档检查

- [x] **README.md 更新**
  - 版本信息正确 ✓
  - API 文档完整 ✓
  - 示例代码可运行 ✓
  
- [x] **CHANGELOG.md 更新**
  - 记录本次发布的变更 ⚠️ 需要手动更新
  
- [x] **文档结构优化**
  - 技术文档已移至 docs/ 目录 ✓
  - 文档索引已创建 ✓
  
- [x] **测试指南完善**
  - 本地测试指南 ✓
  - Hutool 集成指南 ✓

## ✅ 版本管理

- [ ] **更新版本号**: `npm version [patch|minor|major]`
  - 当前版本: 0.1.0
  - 建议下一版本: 0.2.0 (新增测试文档和工具)
  
- [ ] **更新 CHANGELOG.md**
  ```markdown
  ## [0.2.0] - 2025-10-28
  
  ### Added
  - 本地测试脚本 test-local.ts
  - 本地测试指南 TESTING.zh-CN.md
  - Hutool 后端集成指南 HUTOOL-INTEGRATION.zh-CN.md
  - 文档目录结构优化
  
  ### Changed
  - 将技术文档移至 docs/ 目录
  - 优化 README 文档结构
  
  ### Fixed
  - 修复部分开发依赖的安全漏洞
  ```

## ✅ 发布准备

- [ ] **本地打包测试**: `npm pack`
  ```bash
  npm pack
  # 生成 smkit-0.2.0.tgz
  # 在另一个项目中测试安装
  ```
  
- [ ] **示例验证**
  - 运行 examples.ts ✓
  - 测试 demo/index.html ✓
  - 测试 demo-vue ✓

## ✅ 发布流程

### 1. 准备发布

```bash
# 更新版本号
npm version minor  # 0.1.0 -> 0.2.0

# 提交变更
git add .
git commit -m "chore: release v0.2.0"
git push
```

### 2. 创建标签

```bash
# 创建标签
git tag v0.2.0

# 推送标签（将触发自动发布）
git push origin v0.2.0
```

### 3. 监控发布

- 查看 GitHub Actions 工作流
- 确认所有检查通过
- 验证发布到 NPM

### 4. 验证发布

```bash
# 检查 NPM 上的版本
npm view smkit version

# 在新项目中安装测试
mkdir test-smkit && cd test-smkit
npm init -y
npm install smkit@latest

# 测试导入
node -e "const smkit = require('smkit'); console.log(smkit.digest('test'));"
```

## 📋 发布后检查

- [ ] NPM 包可正常安装
- [ ] ESM/CJS/UMD 格式都可用
- [ ] TypeScript 类型定义正确
- [ ] CDN 链接可访问
  - unpkg: https://unpkg.com/smkit@latest/dist/smkit.umd.js
  - jsDelivr: https://cdn.jsdelivr.net/npm/smkit@latest/dist/smkit.umd.js

## 🔍 问题排查

如果发布失败：

1. **版本不匹配**
   ```bash
   git tag -d v0.2.0
   git push origin :refs/tags/v0.2.0
   # 修正 package.json 版本
   git tag v0.2.0
   git push origin v0.2.0
   ```

2. **NPM 发布失败**
   - 检查 NPM_TOKEN 配置
   - 检查包名是否可用
   - 查看 Actions 日志

3. **构建失败**
   - 本地运行 `npm run build` 调试
   - 检查依赖版本

## 📚 相关文档

- [发布指南](./docs/PUBLISHING.md) - 详细发布流程
- [CHANGELOG.md](./CHANGELOG.md) - 版本历史
- [GitHub Releases](https://github.com/linyuliu/smkit/releases) - 发布记录

## 当前状态

✅ 代码质量良好，所有测试通过
✅ 文档完善，结构清晰
✅ 测试工具齐全
⏭️ 准备发布新版本

建议发布版本：**v0.2.0**

发布亮点：
- 新增完整的本地测试指南和工具
- 新增 Hutool 后端集成指南
- 优化文档结构，提升开发体验
