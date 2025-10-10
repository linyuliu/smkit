# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-10-10

### Added
- Initial project structure with TypeScript + Vite + Vitest
- SM3 cryptographic hash function implementation
  - `digest()` - Compute SM3 hash
  - `hmac()` - Compute SM3-HMAC
- SM4 block cipher implementation
  - ECB and CBC modes
  - Pkcs7 padding support
  - `sm4Encrypt()` and `sm4Decrypt()` functions
- SM2 elliptic curve cryptography (placeholder implementation)
  - `generateKeyPair()` - Generate key pair
  - `getPublicKeyFromPrivateKey()` - Derive public key
  - `sm2Encrypt()` and `sm2Decrypt()` - Encryption/decryption
  - `sign()` and `verify()` - Digital signatures
- Utility functions
  - `hexToBytes()` / `bytesToHex()` - Hex conversion
  - `stringToBytes()` / `bytesToString()` - String conversion
  - `normalizeInput()` - Input normalization
  - `xor()` - XOR operation
  - `rotl()` - Bit rotation
- Comprehensive test suite with 40 tests
- Full TypeScript type definitions
- ESM and CJS module support
- README documentation
- Usage examples

### Technical Details
- Zero runtime dependencies (pure TypeScript)
- Uses Uint8Array for internal data processing
- All outputs as lowercase hex strings
- Tree-shakable exports
- Works in Node.js and browsers
