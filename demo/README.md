# SMKit 演示页面

这是一个简单的 Web 演示页面，用于测试 SMKit 库的功能。

## 使用方法

### 方式一：直接打开

在浏览器中直接打开 `index.html` 文件即可使用。

### 方式二：使用本地服务器

```bash
# 在项目根目录运行
npx serve demo
```

然后在浏览器中访问 `http://localhost:3000`

### 方式三：与实际构建集成

要使用实际构建的 SMKit 库，需要：

1. 构建项目：
```bash
npm run build
```

2. 在 `index.html` 中添加对构建文件的引用：
```html
<script type="module">
    import * as smkit from '../dist/smkit.js';
    window.smkit = smkit;
</script>
```

## 功能

### SM3 哈希
- 输入任意文本
- 计算 SM3 哈希值
- 显示 256 位哈希结果

### SM4 加解密
- 输入密钥（16 字节）
- 输入明文
- 加密和解密操作
- 支持 ECB 和 CBC 模式

### SM2 签名验签
- 生成密钥对
- 对消息进行签名
- 验证签名有效性

## 注意事项

当前演示页面使用简化的占位实现，仅用于展示界面和交互流程。

要使用真实的 SM2、SM3、SM4 算法，需要引入实际构建的 SMKit 库。

## 技术栈

- 纯 HTML/CSS/JavaScript
- 响应式设计
- 现代浏览器兼容
