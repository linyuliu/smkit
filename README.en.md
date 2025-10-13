# SMKit

Pure TypeScript implementation of Chinese national cryptographic algorithms (SM2, SM3, SM4).

## Features

- **纯粹性 (Purity)**: Core cryptographic algorithms implemented in pure TypeScript with zero runtime dependencies
- **性能 (Performance)**: Internal data processing uses `Uint8Array` for optimal performance
- **现代化 (Modern)**: Written in TypeScript with first-class type support, ES Modules primary, CommonJS compatible
- **同构性 (Isomorphic)**: Works seamlessly in both Node.js and modern browsers

## Installation

```bash
npm install smkit
```

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

DEFAULT_USER_ID  // '1234567812345678' - Default user ID for SM2 signature (specified in GM/T 0009-2012)
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
- `generateKeyPair(): KeyPair` - Generate SM2 key pair
- `getPublicKeyFromPrivateKey(privateKey: string): string` - Derive public key from private key
- `sm2Encrypt(publicKey: string, data: string | Uint8Array, mode?: SM2CipherModeType): string` - Encrypt data using SM2
- `sm2Decrypt(privateKey: string, encryptedData: string, mode?: SM2CipherModeType): string` - Decrypt data using SM2
- `sign(privateKey: string, data: string | Uint8Array, options?: SignOptions): string` - Sign data using SM2
- `verify(publicKey: string, data: string | Uint8Array, signature: string, options?: VerifyOptions): boolean` - Verify signature using SM2

**SignOptions/VerifyOptions:**
- `der?: boolean` - Use DER encoding for signature
- `userId?: string` - User ID for signature (default: '1234567812345678')
- `curveParams?: SM2CurveParams` - Custom elliptic curve parameters

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
  - `.encrypt(data, mode?)` - Encrypt data
  - `.decrypt(encryptedData, mode?)` - Decrypt data
  - `.sign(data, options?)` - Sign data
  - `.verify(data, signature, options?)` - Verify signature
  - `.getPublicKey()` / `.getPrivateKey()` - Get keys
  - `.setCurveParams(params)` / `.getCurveParams()` - Set/get curve parameters

### Utils

- `hexToBytes(hex: string): Uint8Array` - Convert hex string to bytes
- `bytesToHex(bytes: Uint8Array): string` - Convert bytes to lowercase hex string
- `stringToBytes(str: string): Uint8Array` - Convert UTF-8 string to bytes
- `bytesToString(bytes: Uint8Array): string` - Convert bytes to UTF-8 string
- `normalizeInput(data: string | Uint8Array): Uint8Array` - Normalize input to Uint8Array
- `xor(a: Uint8Array, b: Uint8Array): Uint8Array` - XOR two byte arrays
- `rotl(value: number, shift: number): number` - Left rotate a 32-bit value

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

## License

Apache-2.0

## Standards and References

This library implements the following Chinese national cryptographic standards:

- **GM/T 0003-2012**: SM2 Elliptic Curve Public Key Cryptographic Algorithm
- **GM/T 0004-2012**: SM3 Cryptographic Hash Algorithm
- **GM/T 0002-2012**: SM4 Block Cipher Algorithm
- **GM/T 0009-2012**: SM2 Cryptographic Algorithm Application Specification
- **GM/T 0006-2012**: Cryptographic Application Identifier Specification (OID definitions)

## Note

SMKit provides full implementations of SM2, SM3, and SM4 algorithms, validated by 128 unit tests. All core features are implemented and production-ready.

## Related Projects

- [sm-crypto-v2](https://github.com/Cubelrti/sm-crypto-v2) - Another excellent implementation of SM algorithms
