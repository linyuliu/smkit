<!--
  SM2 椭圆曲线算法视图组件
  SM2 Elliptic Curve Algorithm View Component
  
  功能：
  1. 生成密钥对 (Generate key pair)
  2. 加密/解密 (Encrypt/Decrypt)
  3. 签名/验签 (Sign/Verify)
-->
<script setup lang="ts">
import { ref } from 'vue'
import { generateKeyPair, sm2Encrypt, sm2Decrypt, sign, verify } from 'smkit'

// ========== 密钥管理 Key Management ==========
// 私钥 Private key
const privateKey = ref('')
// 公钥 Public key
const publicKey = ref('')

// 生成SM2密钥对 Generate SM2 key pair
const generateKeys = () => {
  try {
    const keyPair = generateKeyPair()
    privateKey.value = keyPair.privateKey
    publicKey.value = keyPair.publicKey
    showSuccess('密钥对生成成功！')
  } catch (error) {
    showError('密钥对生成失败：' + (error as Error).message)
  }
}

// ========== 加密/解密 Encryption/Decryption ==========
// 明文 Plaintext
const plaintext = ref('Hello, SM2 Encryption!')
// 密文 Ciphertext
const ciphertext = ref('')

// 加密操作 Encrypt operation
const encryptText = () => {
  if (!publicKey.value) {
    showError('请先生成密钥对！')
    return
  }
  
  try {
    // 使用公钥加密明文 Encrypt plaintext with public key
    const encrypted = sm2Encrypt(publicKey.value, plaintext.value)
    ciphertext.value = encrypted
    showSuccess('加密成功！')
  } catch (error) {
    showError('加密失败：' + (error as Error).message)
  }
}

// 解密操作 Decrypt operation
const decryptText = () => {
  if (!privateKey.value) {
    showError('请先生成密钥对！')
    return
  }
  
  if (!ciphertext.value) {
    showError('请先执行加密操作！')
    return
  }
  
  try {
    // 使用私钥解密密文 Decrypt ciphertext with private key
    const decrypted = sm2Decrypt(privateKey.value, ciphertext.value)
    plaintext.value = decrypted
    showSuccess('解密成功！')
  } catch (error) {
    showError('解密失败：' + (error as Error).message)
  }
}

// ========== 签名/验签 Sign/Verify ==========
// 待签名消息 Message to sign
const message = ref('Hello, SM2!')
// 签名结果 Signature result
const signature = ref('')
// 用户ID (用于Z值计算) User ID (for Z value calculation)
const userId = ref('1234567812345678')

// 签名操作 Sign operation
const signMessage = () => {
  if (!privateKey.value) {
    showError('请先生成密钥对！')
    return
  }
  
  try {
    // 使用私钥对消息进行签名 Sign message with private key
    const sig = sign(privateKey.value, message.value, {
      userId: userId.value
    })
    signature.value = sig
    showSuccess('签名成功！')
  } catch (error) {
    showError('签名失败：' + (error as Error).message)
  }
}

// 验签操作 Verify operation
const verifySignature = () => {
  if (!publicKey.value) {
    showError('请先生成密钥对！')
    return
  }
  
  if (!signature.value) {
    showError('请先执行签名操作！')
    return
  }
  
  try {
    // 使用公钥验证签名 Verify signature with public key
    const isValid = verify(publicKey.value, message.value, signature.value, {
      userId: userId.value
    })
    
    if (isValid) {
      showSuccess('✅ 签名验证成功！')
    } else {
      showError('❌ 签名验证失败！')
    }
  } catch (error) {
    showError('验证失败：' + (error as Error).message)
  }
}

// ========== 消息提示 Message notifications ==========
const messageText = ref('')
const messageType = ref<'success' | 'error'>('success')
const showMessage = ref(false)

// 显示成功消息 Show success message
const showSuccess = (msg: string) => {
  messageText.value = msg
  messageType.value = 'success'
  showMessage.value = true
  setTimeout(() => {
    showMessage.value = false
  }, 3000)
}

// 显示错误消息 Show error message
const showError = (msg: string) => {
  messageText.value = msg
  messageType.value = 'error'
  showMessage.value = true
  setTimeout(() => {
    showMessage.value = false
  }, 3000)
}
</script>

<template>
  <div class="sm2-view">
    <!-- 页面标题 Page title -->
    <div class="page-header">
      <h1>🔐 SM2 椭圆曲线算法</h1>
      <p class="page-description">
        SM2 是中国国家密码管理局发布的椭圆曲线公钥密码算法，基于 256 位椭圆曲线。
        支持数字签名、密钥交换和加密等功能。
      </p>
    </div>

    <!-- 消息提示 Message notification -->
    <transition name="slide-down">
      <div v-if="showMessage" :class="['message', messageType]">
        {{ messageText }}
      </div>
    </transition>

    <!-- 密钥管理区域 Key management section -->
    <div class="section">
      <h2 class="section-title">🔑 密钥管理</h2>
      <div class="section-content">
        <button class="btn btn-primary" @click="generateKeys">生成密钥对</button>
        
        <!-- 私钥显示 Private key display -->
        <div class="form-group">
          <label for="private-key">私钥 (Private Key)：</label>
          <input 
            id="private-key"
            v-model="privateKey" 
            type="text" 
            class="input" 
            placeholder="点击【生成密钥对】按钮生成"
            readonly
          >
          <p class="hint">💡 私钥用于解密和签名，请妥善保管</p>
        </div>
        
        <!-- 公钥显示 Public key display -->
        <div class="form-group">
          <label for="public-key">公钥 (Public Key)：</label>
          <input 
            id="public-key"
            v-model="publicKey" 
            type="text" 
            class="input" 
            placeholder="点击【生成密钥对】按钮生成"
            readonly
          >
          <p class="hint">💡 公钥可以公开，用于加密和验签</p>
        </div>
      </div>
    </div>

    <!-- 加密/解密区域 Encryption/Decryption section -->
    <div class="section">
      <h2 class="section-title">🔒 加密/解密</h2>
      <div class="section-content">
        <!-- 明文输入 Plaintext input -->
        <div class="form-group">
          <label for="plaintext">明文 (Plaintext)：</label>
          <textarea 
            id="plaintext"
            v-model="plaintext" 
            class="textarea" 
            placeholder="输入要加密的文本..."
            rows="3"
          ></textarea>
        </div>
        
        <!-- 操作按钮 Action buttons -->
        <div class="button-group">
          <button class="btn btn-primary" @click="encryptText">🔒 加密</button>
          <button class="btn btn-secondary" @click="decryptText">🔓 解密</button>
        </div>
        
        <!-- 密文显示 Ciphertext display -->
        <div class="form-group">
          <label for="ciphertext">密文 (Ciphertext)：</label>
          <textarea 
            id="ciphertext"
            v-model="ciphertext" 
            class="textarea" 
            placeholder="加密后的密文将显示在这里..."
            rows="4"
          ></textarea>
          <p class="hint">💡 密文格式：04 + C1 + C3 + C2（十六进制）</p>
        </div>
      </div>
    </div>

    <!-- 签名/验签区域 Sign/Verify section -->
    <div class="section">
      <h2 class="section-title">✍️ 签名/验签</h2>
      <div class="section-content">
        <!-- 消息输入 Message input -->
        <div class="form-group">
          <label for="message">消息 (Message)：</label>
          <textarea 
            id="message"
            v-model="message" 
            class="textarea" 
            placeholder="输入要签名的消息..."
            rows="3"
          ></textarea>
        </div>
        
        <!-- 用户ID输入 User ID input -->
        <div class="form-group">
          <label for="user-id">用户ID (User ID)：</label>
          <input 
            id="user-id"
            v-model="userId" 
            type="text" 
            class="input" 
            placeholder="输入用户ID（默认：1234567812345678）"
          >
          <p class="hint">💡 用于签名和验签时的 Z 值计算，必须保持一致</p>
        </div>
        
        <!-- 操作按钮 Action buttons -->
        <div class="button-group">
          <button class="btn btn-primary" @click="signMessage">✍️ 签名</button>
          <button class="btn btn-secondary" @click="verifySignature">✅ 验签</button>
        </div>
        
        <!-- 签名结果显示 Signature result display -->
        <div class="form-group">
          <label for="signature">签名 (Signature)：</label>
          <textarea 
            id="signature"
            v-model="signature" 
            class="textarea" 
            placeholder="签名结果将显示在这里..."
            rows="4"
          ></textarea>
          <p class="hint">💡 签名格式：r + s（十六进制，各32字节）</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 视图容器 View container */
.sm2-view {
  max-width: 1000px;
  margin: 0 auto;
}

/* 页面标题样式 Page header styles */
.page-header {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  padding: 35px;
  border-radius: 16px;
  margin-bottom: 30px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.12);
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.page-header h1 {
  font-size: 2.2em;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 15px;
  font-weight: 700;
}

.page-description {
  color: #555;
  line-height: 1.8;
  font-size: 1.05em;
}

/* 消息提示样式 Message notification styles */
.message {
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* 消息进入/离开动画 Message enter/leave animation */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 区块样式 Section styles */
.section {
  background: white;
  padding: 35px;
  border-radius: 16px;
  margin-bottom: 30px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
}

.section:hover {
  box-shadow: 0 8px 28px rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.2);
}

.section-title {
  font-size: 1.6em;
  color: #333;
  margin-bottom: 25px;
  padding-bottom: 18px;
  border-bottom: 3px solid transparent;
  border-image: linear-gradient(90deg, #667eea, #764ba2) 1;
  font-weight: 600;
}

.section-content {
  padding-top: 10px;
}

/* 表单组样式 Form group styles */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 0.95em;
}

/* 输入框样式 Input styles */
.input {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  transition: all 0.3s ease;
  background: #fafafa;
  color: #333;
}

.input:hover {
  border-color: #d0d0d0;
}

.input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

/* 文本域样式 Textarea styles */
.textarea {
  width: 100%;
  padding: 14px 18px;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  resize: vertical;
  transition: all 0.3s ease;
  background: #fafafa;
  color: #333;
  line-height: 1.6;
}

.textarea:hover {
  border-color: #d0d0d0;
}

.textarea:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

/* 提示文本样式 Hint text styles */
.hint {
  margin-top: 8px;
  font-size: 0.88em;
  color: #666;
  line-height: 1.6;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 6px;
  border-left: 3px solid #ffd93d;
}

/* 按钮样式 Button styles */
.btn {
  padding: 14px 32px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn:hover::before {
  width: 300px;
  height: 300px;
}

.btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(-1px);
}

/* 主按钮 Primary button */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.4);
}

/* 次按钮 Secondary button */
.btn-secondary {
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  color: #333;
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #e8e8e8 0%, #d8d8d8 100%);
}

/* 按钮组样式 Button group styles */
.button-group {
  display: flex;
  gap: 15px;
  margin: 20px 0;
  flex-wrap: wrap;
}

/* 响应式设计 Responsive design */
@media (max-width: 768px) {
  .page-header {
    padding: 20px;
  }

  .page-header h1 {
    font-size: 1.6em;
  }

  .section {
    padding: 20px;
  }

  .section-title {
    font-size: 1.3em;
  }

  .button-group {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
