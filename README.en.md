# SMKit

Pure TypeScript implementation of Chinese national cryptographic algorithms (SM2, SM3, SM4, ZUC).

## Features

- **纯粹性 (Purity)**: Core cryptographic algorithms implemented in pure TypeScript with zero runtime dependencies
- **性能 (Performance)**: Internal data processing uses `Uint8Array` for optimal performance
- **现代化 (Modern)**: Written in TypeScript with first-class type support, ES Modules primary, CommonJS compatible
- **同构性 (Isomorphic)**: Works seamlessly in both Node.js and modern browsers

## Installation

```bash
npm install smkit
```

### Multiple Import Methods

SMKit supports multiple module formats for use in different environments:

**ES Module (Recommended for modern projects)**
```javascript
import { digest, sm4Encrypt, generateKeyPair } from 'smkit';
```

**CommonJS (Node.js)**
```javascript
const { digest, sm4Encrypt, generateKeyPair } = require('smkit');
```

**UMD (Direct browser usage)**
```html
<script src="https://unpkg.com/smkit@latest/dist/smkit.umd.js"></script>
<script>
  const hash = SMKit.digest('Hello, World!');
</script>
```

## Online Demo

Want to try SMKit quickly? We provide two interactive demo pages:

### Vue 3 Modern Demo (Recommended)

Modern web application built with Vue 3 + TypeScript, providing better user experience:

```bash
# Clone the repository
git clone https://github.com/linyuliu/smkit.git
cd smkit

# Install dependencies
npm install
cd demo-vue && npm install

# Start Vue demo
npm run dev
```

Features:
- 🔐 **Chinese National Cryptographic Algorithms**: Complete testing for SM2, SM3, SM4
- 🌐 **International Standard Algorithms**: AES, RSA, SHA (coming soon)
- 🛠️ **Utility Tools**: Key generation, format conversion, signature validation
- 📱 Responsive design, mobile-friendly
- 🎨 Modern UI with smooth animations

[View Vue Demo Documentation](./demo-vue/README.md)

### H5 Simple Demo

Traditional HTML5 demo page:

```bash
# Start demo
npm run demo
```

Features:
- ✅ Test SM3 hash computation
- ✅ Test SM4 encryption/decryption
- ✅ Test SM2 key generation, signing and verification

[View H5 Demo Documentation](./demo/README.md)

## Usage

[简体中文](./README.md) | English

### Functional API

#### SM3 Hash Algorithm

```typescript
import { digest, hmac } from 'smkit';

// Hash a string
const hash = digest('Hello, SM3!');
console.log(hash); // lowercase hex string (64 characters)

// HMAC
const mac = hmac('secret-key', 'data to authenticate');
console.log(mac); // lowercase hex string (64 characters)
```

#### SM4 Block Cipher

```typescript
import { sm4Encrypt, sm4Decrypt, CipherMode, PaddingMode } from 'smkit';

const key = '0123456789abcdeffedcba9876543210'; // 128-bit key (32 hex chars)
const plaintext = 'Hello, SM4!';

// ECB mode (Electronic Codebook)
const encrypted = sm4Encrypt(key, plaintext, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
const decrypted = sm4Decrypt(key, encrypted, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });

// CBC mode (Cipher Block Chaining)
const iv = 'fedcba98765432100123456789abcdef'; // 128-bit IV (32 hex chars)
const encryptedCBC = sm4Encrypt(key, plaintext, { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });
const decryptedCBC = sm4Decrypt(key, encryptedCBC, { mode: CipherMode.CBC, padding: PaddingMode.PKCS7, iv });

// CTR mode (Counter) - stream cipher mode, no padding required
const counter = '00000000000000000000000000000000'; // 128-bit counter/nonce
const encryptedCTR = sm4Encrypt(key, plaintext, { mode: CipherMode.CTR, iv: counter });
const decryptedCTR = sm4Decrypt(key, encryptedCTR, { mode: CipherMode.CTR, iv: counter });

// CFB mode (Cipher Feedback) - stream cipher mode, no padding required
const encryptedCFB = sm4Encrypt(key, plaintext, { mode: CipherMode.CFB, iv });
const decryptedCFB = sm4Decrypt(key, encryptedCFB, { mode: CipherMode.CFB, iv });

// OFB mode (Output Feedback) - stream cipher mode, no padding required
const encryptedOFB = sm4Encrypt(key, plaintext, { mode: CipherMode.OFB, iv });
const decryptedOFB = sm4Decrypt(key, encryptedOFB, { mode: CipherMode.OFB, iv });

// GCM mode (Galois/Counter Mode) - authenticated encryption with associated data
const gcmIv = '000000000000000000000000'; // 96-bit IV (24 hex chars, required for GCM)
const aad = 'Additional Authenticated Data'; // Optional additional authenticated data
const gcmResult = sm4Encrypt(key, plaintext, { mode: CipherMode.GCM, iv: gcmIv, aad });
console.log(gcmResult); // { ciphertext: '...', tag: '...' }
const decryptedGCM = sm4Decrypt(key, gcmResult, { mode: CipherMode.GCM, iv: gcmIv, aad });
```

#### SM2 Elliptic Curve Cryptography

```typescript
import { generateKeyPair, getPublicKeyFromPrivateKey, sm2Encrypt, sm2Decrypt, sign, verify, SM2CipherMode } from 'smkit';

// Generate key pair (using secure random number generation from @noble/curves)
const keyPair = generateKeyPair();
console.log(keyPair.publicKey);  // Hex string, uncompressed format starting with 04
console.log(keyPair.privateKey); // Hex string, 32 bytes

// Derive public key from private key
const publicKey = getPublicKeyFromPrivateKey(keyPair.privateKey);

// Encrypt/Decrypt
const plaintext = 'Hello, SM2!';
// Supports two cipher modes: C1C3C2 (default) and C1C2C3
const encrypted = sm2Encrypt(keyPair.publicKey, plaintext, SM2CipherMode.C1C3C2);
const decrypted = sm2Decrypt(keyPair.privateKey, encrypted, SM2CipherMode.C1C3C2);

// Sign/Verify (using SM3 hash and Z-value calculation)
const data = 'Message to sign';
const signature = sign(keyPair.privateKey, data);
const isValid = verify(keyPair.publicKey, data, signature);
console.log(isValid); // true

// DER-encoded signatures (ASN.1 DER format)
const signatureDER = sign(keyPair.privateKey, data, { der: true });
const isValidDER = verify(keyPair.publicKey, data, signatureDER, { der: true });

// Custom user ID (default is '1234567812345678')
const signatureCustom = sign(keyPair.privateKey, data, { userId: 'user@example.com' });
const isValidCustom = verify(keyPair.publicKey, data, signatureCustom, { userId: 'user@example.com' });

// Automatic input format detection
// Supports:
// - Hex strings (with or without 0x prefix)
// - Uppercase or lowercase hex
// - Compressed or uncompressed public key formats
// - DER-encoded or raw format signatures
const privateKeyWith0x = '0x' + keyPair.privateKey;
const publicKeyUpper = keyPair.publicKey.toUpperCase();
const sig = sign(privateKeyWith0x, 'test');
const valid = verify(publicKeyUpper, 'test', sig); // Auto-detects format

// Support for Uint8Array input
const binaryData = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
const encryptedBinary = sm2Encrypt(keyPair.publicKey, binaryData);
const signatureBinary = sign(keyPair.privateKey, binaryData);

// SM2 Key Exchange (based on GM/T 0003.3-2012 and GM/T 0009-2023)
import { keyExchange } from 'smkit';

// Suppose Alice and Bob need to negotiate a shared key
const aliceKeyPair = generateKeyPair();
const bobKeyPair = generateKeyPair();

// Step 1: Generate temporary key pairs
const aliceTempKeyPair = generateKeyPair();
const bobTempKeyPair = generateKeyPair();

// Step 2: Alice as initiator performs key exchange
const aliceResult = keyExchange({
  privateKey: aliceKeyPair.privateKey,
  tempPrivateKey: aliceTempKeyPair.privateKey,
  peerPublicKey: bobKeyPair.publicKey,
  peerTempPublicKey: bobTempKeyPair.publicKey,
  isInitiator: true,
  keyLength: 16, // Derive 16 bytes (128 bits) key
});

// Step 3: Bob as responder performs key exchange
const bobResult = keyExchange({
  privateKey: bobKeyPair.privateKey,
  tempPrivateKey: bobTempKeyPair.privateKey,
  peerPublicKey: aliceKeyPair.publicKey,
  peerTempPublicKey: aliceTempKeyPair.publicKey,
  isInitiator: false,
  keyLength: 16,
});

// Alice and Bob get the same shared key
console.log(aliceResult.sharedKey === bobResult.sharedKey); // true
```

### Object-Oriented API

#### SM3 - Hash Operations

```typescript
import { SM3 } from 'smkit';

// Static methods
const hash = SM3.digest('Hello, SM3!');
const mac = SM3.hmac('secret-key', 'data');

// Incremental hashing
const sm3 = new SM3();
sm3.update('Hello, ').update('SM3!');
const result = sm3.digest();
```

#### SM4 - Block Cipher

```typescript
import { SM4, CipherMode, PaddingMode } from 'smkit';

const key = '0123456789abcdeffedcba9876543210';
const iv = 'fedcba98765432100123456789abcdef';

// Using constructor
const sm4 = new SM4(key, { mode: CipherMode.ECB, padding: PaddingMode.PKCS7 });
const encrypted = sm4.encrypt('Hello, SM4!');
const decrypted = sm4.decrypt(encrypted);

// Using factory methods
const sm4ecb = SM4.ECB(key);
const sm4cbc = SM4.CBC(key, iv);
const sm4ctr = SM4.CTR(key, '00000000000000000000000000000000');
const sm4cfb = SM4.CFB(key, iv);
const sm4ofb = SM4.OFB(key, iv);

// Configuration setters
sm4.setMode(CipherMode.CBC);
sm4.setIV(iv);
sm4.setPadding(PaddingMode.PKCS7);
```

#### SM2 - Elliptic Curve Cryptography

```typescript
import { SM2, SM2CipherMode } from 'smkit';

// Generate key pair
const sm2 = SM2.generateKeyPair();

// Create from existing keys
const sm2FromPrivate = SM2.fromPrivateKey(privateKey);
const sm2FromPublic = SM2.fromPublicKey(publicKey);

// Encrypt/Decrypt
const encrypted = sm2.encrypt('Hello, SM2!', SM2CipherMode.C1C3C2);
const decrypted = sm2.decrypt(encrypted, SM2CipherMode.C1C3C2);

// Sign/Verify
const signature = sm2.sign('Message to sign');
const isValid = sm2.verify('Message to sign', signature);

// Key Exchange
const alice = SM2.generateKeyPair();
const bob = SM2.generateKeyPair();

// Both parties generate temporary key pairs
const aliceTemp = SM2.generateKeyPair();
const bobTemp = SM2.generateKeyPair();

// Alice as initiator performs key exchange
const aliceResult = alice.keyExchange(
  bob.getPublicKey(),
  bobTemp.getPublicKey(),
  true, // Alice is initiator
  { 
    tempPrivateKey: aliceTemp.getPrivateKey(),
    keyLength: 16 
  }
);

// Bob as responder performs key exchange
const bobResult = bob.keyExchange(
  alice.getPublicKey(),
  aliceTemp.getPublicKey(),
  false, // Bob is responder
  { 
    tempPrivateKey: bobTemp.getPrivateKey(),
    keyLength: 16 
  }
);

// Both parties get the same shared key
console.log(aliceResult.sharedKey === bobResult.sharedKey); // true

// Custom curve parameters
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

#### ZUC - Stream Cipher

```typescript
import { ZUC } from 'smkit';

const key = '00112233445566778899aabbccddeeff';
const iv = 'ffeeddccbbaa99887766554433221100';

// Using constructor
const zuc = new ZUC(key, iv);
const encrypted = zuc.encrypt('Hello, ZUC!');
const decrypted = zuc.decrypt(encrypted);

// Using factory method
const zuc128 = ZUC.ZUC128(key, iv);

// Generate keystream
const keystream = zuc.keystream(4); // Generate 4 32-bit words

// Set new IV
zuc.setIV('00000000000000000000000000000000');

// EEA3 static method (3GPP LTE encryption)
const eea3Keystream = ZUC.eea3(key, 0x12345678, 5, 0, 256);

// EIA3 static method (3GPP LTE integrity)
const mac = ZUC.eia3(key, 0x12345678, 5, 0, 'Message to authenticate');
```


### Utility Functions

```typescript
import { hexToBytes, bytesToHex, stringToBytes, bytesToString } from 'smkit';

// Convert between hex and bytes
const bytes = hexToBytes('48656c6c6f');
const hex = bytesToHex(bytes);

// Convert between string and bytes
const strBytes = stringToBytes('Hello');
const str = bytesToString(strBytes);
```

## Constants

### Cipher Modes
```typescript
import { CipherMode } from 'smkit';

// Block cipher modes
CipherMode.ECB  // 'ecb' - Electronic Codebook
CipherMode.CBC  // 'cbc' - Cipher Block Chaining

// Stream cipher modes
CipherMode.CTR  // 'ctr' - Counter
CipherMode.CFB  // 'cfb' - Cipher Feedback
CipherMode.OFB  // 'ofb' - Output Feedback

// Authenticated Encryption with Associated Data (AEAD) modes
CipherMode.GCM  // 'gcm' - Galois/Counter Mode (Implemented)
CipherMode.CCM  // 'ccm' - Counter with CBC-MAC (Planned)

// Disk encryption modes
CipherMode.XTS  // 'xts' - XEX-based tweaked-codebook mode (Planned)
```

**Notes**:
- **ECB**: Not recommended for production, encrypts each block independently
- **CBC**: Requires IV, each block is XORed with previous ciphertext
- **CTR/CFB/OFB**: Stream cipher modes, no padding required, requires IV
- **GCM**: Authenticated encryption, provides both encryption and authentication, requires 12-byte IV
- **CCM/XTS**: Planned for future implementation

### Padding Modes
```typescript
import { PaddingMode } from 'smkit';

PaddingMode.PKCS7  // 'pkcs7' - PKCS#7 padding (default)
PaddingMode.NONE   // 'none' - No padding
PaddingMode.ZERO   // 'zero' - Zero padding
```

**Notes**:
- **PKCS7**: Padding value equals the number of padding bytes (e.g., pad 3 bytes, each byte value is 0x03)
- **NONE**: No padding, data length must be a multiple of 16 bytes
- **ZERO**: Pad with zero bytes to a multiple of 16 bytes
- Stream cipher modes (CTR/CFB/OFB/GCM) don't use padding

### SM2 Cipher Modes
```typescript
import { SM2CipherMode } from 'smkit';

SM2CipherMode.C1C3C2  // 'C1C3C2' (recommended)
SM2CipherMode.C1C2C3  // 'C1C2C3'
```

### OID (Object Identifier)
```typescript
import { OID } from 'smkit';

OID.SM2            // '1.2.156.10197.1.301' - SM2 algorithm
OID.SM2_SM3        // '1.2.156.10197.1.501' - SM2 signature with SM3
OID.SM3            // '1.2.156.10197.1.401' - SM3 hash algorithm
OID.SM4            // '1.2.156.10197.1.104' - SM4 cipher algorithm
OID.EC_PUBLIC_KEY  // '1.2.840.10045.2.1' - Standard EC public key (incorrect SM2 identification in OpenSSL 1.x)
```

**Notes**:
- 1.2.156 is the registration number of the Chinese State Cryptography Administration
- 10197 is the commercial cryptography identifier
- SM2 is based on elliptic curves (ECC) but uses China's independently registered OID and parameters
- These OIDs are different from international standard ECC OIDs, ensuring the independence of commercial cryptographic algorithms

**⚠️ OpenSSL Version Compatibility**:
- **OpenSSL 1.x**: SM2 public keys are incorrectly identified as standard EC public keys (OID: `1.2.840.10045.2.1`)
- **OpenSSL 3.x**: SM2 public keys use the correct national cryptographic standard OID (`1.2.156.10197.1.301`)
- If you see OID `1.2.840.10045.2.1` when parsing certificates, it indicates the certificate was generated by OpenSSL 1.x
- **Recommendation**: Use OpenSSL 3.x to generate certificates to ensure compliance with GB/T 33560-2017 standard
- This library follows the national cryptographic standard and uses the correct OID `1.2.156.10197.1.301`

### Default Values
```typescript
import { DEFAULT_USER_ID } from 'smkit';

DEFAULT_USER_ID  // '1234567812345678' - Default user ID for SM2 signature (backward compatible)
                 // GM/T 0009-2023 recommends using empty string ''
```

## API Reference

### SM3

**Functional API:**
- `digest(data: string | Uint8Array): string` - Compute SM3 hash digest
- `hmac(key: string | Uint8Array, data: string | Uint8Array): string` - Compute SM3-HMAC

**Object-Oriented API:**
- `SM3.digest(data)` - Static method to compute hash
- `SM3.hmac(key, data)` - Static method to compute HMAC
- `new SM3()` - Create instance for incremental hashing
  - `.update(data)` - Add data to hash
  - `.digest()` - Finalize and return hash
  - `.reset()` - Reset state

### SM4

**Functional API:**
- `sm4Encrypt(key: string, data: string | Uint8Array, options?: SM4Options): string` - Encrypt data using SM4
- `sm4Decrypt(key: string, encryptedData: string, options?: SM4Options): string` - Decrypt data using SM4

**SM4Options:**
- `mode?: CipherModeType` - Cipher mode (default: ECB)
- `padding?: PaddingModeType` - Padding scheme (default: PKCS7)
- `iv?: string` - Initialization vector for CBC mode (32 hex chars)

**Object-Oriented API:**
- `new SM4(key, options?)` - Create SM4 instance
- `SM4.ECB(key, padding?)` - Create ECB mode instance
- `SM4.CBC(key, iv, padding?)` - Create CBC mode instance
- Instance methods:
  - `.encrypt(data)` - Encrypt data
  - `.decrypt(encryptedData)` - Decrypt data
  - `.setMode(mode)` / `.getMode()` - Set/get mode
  - `.setPadding(padding)` / `.getPadding()` - Set/get padding
  - `.setIV(iv)` / `.getIV()` - Set/get IV

### SM2

**Functional API:**

*Key Management:*
- `generateKeyPair(compressed?: boolean): KeyPair` - Generate SM2 key pair
  - `compressed`: Use compressed format (**default: false**)
- `getPublicKeyFromPrivateKey(privateKey: string, compressed?: boolean): string` - Derive public key from private key
  - `compressed`: Return compressed format (**default: false**)
- `compressPublicKey(publicKey: string): string` - Compress public key (04->02/03)
- `decompressPublicKey(publicKey: string): string` - Decompress public key (02/03->04)

*Encryption/Decryption:*
- `sm2Encrypt(publicKey: string, data: string | Uint8Array, mode?: SM2CipherModeType): string` - Encrypt data using SM2
  - `mode`: Cipher mode (**default: 'C1C3C2'**)
- `sm2Decrypt(privateKey: string, encryptedData: string, mode?: SM2CipherModeType): string` - Decrypt data using SM2
  - `mode`: Cipher mode (**default: 'C1C3C2'**)

*Signing/Verification:*
- `sign(privateKey: string, data: string | Uint8Array, options?: SignOptions): string` - Sign data using SM2
- `verify(publicKey: string, data: string | Uint8Array, signature: string, options?: VerifyOptions): boolean` - Verify signature using SM2

*Key Exchange:*
- `keyExchange(params: SM2KeyExchangeParams): SM2KeyExchangeResult` - Execute SM2 key exchange protocol

**SignOptions:**
- `der?: boolean` - Use DER encoding format (**default: false**, Raw format)
- `userId?: string` - User ID for signing (**default: '1234567812345678'**)
- `skipZComputation?: boolean` - Skip Z value computation (**default: false**)
- `curveParams?: SM2CurveParams` - Custom elliptic curve parameters (**default: GM/T 0003-2012 standard parameters, continued in GM/T 0009-2023**)

**VerifyOptions:**
- `der?: boolean` - Signature in DER encoding format (**default: false**)
- `userId?: string` - User ID for verification (**default: '1234567812345678'**, must match signing)
- `skipZComputation?: boolean` - Skip Z value computation (**default: false**, must match signing)
- `curveParams?: SM2CurveParams` - Custom elliptic curve parameters

**SM2KeyExchangeParams:**
- `privateKey: string` - Self private key (required)
- `publicKey?: string` - Self public key (optional, derived from private key if not provided)
- `userId?: string` - Self user ID (**default: '1234567812345678'**)
- `tempPrivateKey?: string` - Self temporary private key (optional, auto-generated if not provided)
- `peerPublicKey: string` - Peer public key (required)
- `peerTempPublicKey: string` - Peer temporary public key (required)
- `peerUserId?: string` - Peer user ID (**default: '1234567812345678'**)
- `isInitiator: boolean` - Whether is initiator (required)
- `keyLength?: number` - Derived key byte length (**default: 16**)

**SM2KeyExchangeResult:**
- `tempPublicKey: string` - Self temporary public key
- `sharedKey: string` - Derived shared key
- `s1?: string` - Self confirmation hash (optional, for mutual authentication)
- `s2?: string` - Peer confirmation hash (optional, for mutual authentication)

**SM2CurveParams:**
- `p?: string` - Prime modulus p
- `a?: string` - Coefficient a
- `b?: string` - Coefficient b
- `Gx?: string` - Base point x coordinate
- `Gy?: string` - Base point y coordinate
- `n?: string` - Order n

**Object-Oriented API:**
- `SM2.generateKeyPair(curveParams?)` - Generate key pair
- `SM2.fromPrivateKey(privateKey, curveParams?)` - Create from private key
- `SM2.fromPublicKey(publicKey, curveParams?)` - Create from public key
- Instance methods:
  - `.encrypt(data, mode?)` - Encrypt data (**mode default: 'C1C3C2'**)
  - `.decrypt(encryptedData, mode?)` - Decrypt data (**mode default: 'C1C3C2'**)
  - `.sign(data, options?)` - Sign data
  - `.verify(data, signature, options?)` - Verify signature
  - `.keyExchange(peerPublicKey, peerTempPublicKey, isInitiator, options?)` - Execute key exchange
  - `.getPublicKey()` / `.getPrivateKey()` - Get keys
  - `.setCurveParams(params)` / `.getCurveParams()` - Set/get curve parameters

### Utils

**Data Conversion:**
- `hexToBytes(hex: string): Uint8Array` - Convert hex string to bytes
- `bytesToHex(bytes: Uint8Array): string` - Convert bytes to lowercase hex string
- `stringToBytes(str: string): Uint8Array` - Convert UTF-8 string to bytes
- `bytesToString(bytes: Uint8Array): string` - Convert bytes to UTF-8 string
- `normalizeInput(data: string | Uint8Array): Uint8Array` - Normalize input to Uint8Array

**Bit Operations:**
- `xor(a: Uint8Array, b: Uint8Array): Uint8Array` - XOR two byte arrays
- `rotl(value: number, shift: number): number` - Left rotate a 32-bit value

**ASN.1 Encoding Tools:**
- `encodeSignature(r: string, s: string): Uint8Array` - Encode r, s as DER format signature
- `decodeSignature(derSignature: Uint8Array): { r: string; s: string }` - Decode DER format signature
- `rawToDer(rawSignature: string): string` - Convert raw signature (r||s) to DER format
- `derToRaw(derSignature: string): string` - Convert DER format signature to raw format (r||s)
- `asn1ToXml(data: Uint8Array): string` - Convert ASN.1 data to XML format (for debugging)
- `signatureToXml(signature: string): string` - Convert signature to XML format (for debugging)

## Data Format Conventions

- **Internal Processing**: All binary data uses `Uint8Array`
- **Input**: Accepts both `string` and `Uint8Array` types. Strings are decoded as UTF-8
- **Output**: Binary outputs (ciphertext, signatures) are encoded as **lowercase hex strings**
- **Keys**: All keys use **hex string** format

## Architecture

SMKit follows functional programming principles with all features implemented as independent, pure functions. It also provides object-oriented APIs for better state management and ease of use. This enables:

- **Tree-shaking**: Only import what you need
- **Easy testing**: Pure functions with fixed input/output
- **Strong composability**: Combine functions like building blocks
- **Flexibility**: Choose functional or object-oriented style

For detailed architecture documentation, see [Architecture Guide](./docs/ARCHITECTURE.zh-CN.md)

## Building from Source

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Type check
npm run type-check
```

## Local Testing

Want to quickly test all features? We provide comprehensive testing guides and scripts:

```bash
# Run interactive test script (recommended)
npx tsx test-local.ts

# Or view detailed testing guide
cat TESTING.zh-CN.md
```

Test coverage:
- ✅ SM3 hash and HMAC
- ✅ SM4 multiple modes (ECB, CBC, CTR, CFB, OFB, GCM)
- ✅ SM2 key generation, encryption/decryption, signing/verification, key exchange
- ✅ ZUC encryption/decryption, EEA3, EIA3

For detailed testing instructions, see [Local Testing Guide](./TESTING.zh-CN.md)

## Integration with Hutool Backend

If you need to integrate SMKit on the frontend with Hutool (Java) on the backend, we provide a complete integration guide:

```bash
# View integration guide
cat docs/HUTOOL-INTEGRATION.zh-CN.md
```

The guide includes:
- Data format compatibility table
- Complete SM3/SM4/SM2 integration examples
- Common issues and solutions
- Key format conversion methods

For details, see [Hutool Integration Guide](./docs/HUTOOL-INTEGRATION.zh-CN.md)

## License

Apache-2.0

## Standards and References

This library implements the following Chinese national cryptographic standards:

- **GM/T 0003-2012**: SM2 Elliptic Curve Public Key Cryptographic Algorithm
- **GM/T 0004-2012**: SM3 Cryptographic Hash Algorithm
- **GM/T 0002-2012**: SM4 Block Cipher Algorithm
- **GM/T 0009-2023**: SM2 Cryptographic Algorithm Application Specification (replaces GM/T 0009-2012)
- **GM/T 0006-2012**: Cryptographic Application Identifier Specification (OID definitions)

### Standard Evolution Notes

Key updates in GMT 0009-2023 compared to GMT 0009-2012:

1. **Default User ID**: Recommends using empty string `''` instead of `'1234567812345678'`
   - This library defaults to `'1234567812345678'` for backward compatibility
   - To comply with the latest standard, explicitly specify `userId: ''` when signing/verifying

2. **Cipher Mode**: Explicitly recommends C1C3C2 mode (already the default in this library)

3. **Public Key Format**: Explicitly recommends uncompressed format (04 prefix, already the default)

4. **Security Enhancements**: Enhanced recommendations for key length and parameter validation

## Note

SMKit provides full implementations of SM2, SM3, SM4, and ZUC algorithms, validated by 214+ unit tests. All core features are implemented and production-ready.

## Documentation

For more documentation, see the [docs](./docs) directory:

- [Local Testing Guide](./TESTING.zh-CN.md) - How to test encryption/decryption, signing/verification, etc.
- [Hutool Integration Guide](./docs/HUTOOL-INTEGRATION.zh-CN.md) - Integration with Java Hutool backend
- [Architecture Guide](./docs/ARCHITECTURE.zh-CN.md) - Project architecture design
- [Publishing Guide](./docs/PUBLISHING.md) - How to publish new versions
- [Performance Benchmarks](./docs/PERFORMANCE.md) - Performance test results
- [Standards Compliance](./docs/GMT-0009-COMPLIANCE.md) - GMT national standard compliance

For a complete documentation index, see [docs/README.md](./docs/README.md)

## Related Projects

- [sm-crypto-v2](https://github.com/Cubelrti/sm-crypto-v2) - Another excellent implementation of SM algorithms
