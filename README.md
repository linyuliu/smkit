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

### SM3 Hash Algorithm

```typescript
import { digest, hmac } from 'smkit';

// Hash a string
const hash = digest('Hello, SM3!');
console.log(hash); // lowercase hex string (64 characters)

// HMAC
const mac = hmac('secret-key', 'data to authenticate');
console.log(mac); // lowercase hex string (64 characters)
```

### SM4 Block Cipher

```typescript
import { sm4Encrypt, sm4Decrypt } from 'smkit';

const key = '0123456789abcdeffedcba9876543210'; // 128-bit key (32 hex chars)
const plaintext = 'Hello, SM4!';

// ECB mode
const encrypted = sm4Encrypt(key, plaintext, { mode: 'ECB', padding: 'Pkcs7' });
const decrypted = sm4Decrypt(key, encrypted, { mode: 'ECB', padding: 'Pkcs7' });

// CBC mode
const iv = 'fedcba98765432100123456789abcdef'; // 128-bit IV (32 hex chars)
const encryptedCBC = sm4Encrypt(key, plaintext, { mode: 'CBC', padding: 'Pkcs7', iv });
const decryptedCBC = sm4Decrypt(key, encryptedCBC, { mode: 'CBC', padding: 'Pkcs7', iv });
```

### SM2 Elliptic Curve Cryptography

```typescript
import { generateKeyPair, sm2Encrypt, sm2Decrypt, sign, verify } from 'smkit';

// Generate key pair
const keyPair = generateKeyPair();
console.log(keyPair.publicKey);
console.log(keyPair.privateKey);

// Encrypt/Decrypt
const plaintext = 'Hello, SM2!';
const encrypted = sm2Encrypt(keyPair.publicKey, plaintext, 'C1C3C2');
const decrypted = sm2Decrypt(keyPair.privateKey, encrypted, 'C1C3C2');

// Sign/Verify
const data = 'Message to sign';
const signature = sign(keyPair.privateKey, data);
const isValid = verify(keyPair.publicKey, data, signature);
console.log(isValid); // true
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

## API Reference

### SM3

- `digest(data: string | Uint8Array): string` - Compute SM3 hash digest
- `hmac(key: string | Uint8Array, data: string | Uint8Array): string` - Compute SM3-HMAC

### SM4

- `sm4Encrypt(key: string, data: string | Uint8Array, options?: SM4Options): string` - Encrypt data using SM4
- `sm4Decrypt(key: string, encryptedData: string, options?: SM4Options): string` - Decrypt data using SM4

**SM4Options:**
- `mode?: 'CBC' | 'ECB'` - Cipher mode (default: 'ECB')
- `padding?: 'Pkcs7' | 'None'` - Padding scheme (default: 'Pkcs7')
- `iv?: string` - Initialization vector for CBC mode (32 hex chars)

### SM2

- `generateKeyPair(): KeyPair` - Generate SM2 key pair
- `getPublicKeyFromPrivateKey(privateKey: string): string` - Derive public key from private key
- `sm2Encrypt(publicKey: string, data: string | Uint8Array, mode?: 'C1C3C2' | 'C1C2C3'): string` - Encrypt data using SM2
- `sm2Decrypt(privateKey: string, encryptedData: string, mode?: 'C1C3C2' | 'C1C2C3'): string` - Decrypt data using SM2
- `sign(privateKey: string, data: string | Uint8Array, options?: SignOptions): string` - Sign data using SM2
- `verify(publicKey: string, data: string | Uint8Array, signature: string, options?: VerifyOptions): boolean` - Verify signature using SM2

**SignOptions/VerifyOptions:**
- `der?: boolean` - Use DER encoding for signature
- `userId?: string` - User ID for signature (default: '1234567812345678')

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

SMKit follows functional programming principles with all features implemented as independent, pure functions. This enables:

- **Tree-shaking**: Only import what you need
- **Easy testing**: Pure functions with fixed input/output
- **Strong composability**: Combine functions like building blocks

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

## Note

This is an initial implementation. The SM2 module currently contains placeholder implementations and will be enhanced in future releases with full elliptic curve operations. SM3 and SM4 are fully functional.
