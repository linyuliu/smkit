/**
 * Elliptic Curve utilities for SM2
 * Provides point operations, key conversions, and curve validation
 */

import { hexToBytes } from './utils';

/**
 * SM2 recommended curve parameters (GM/T 0003-2012)
 */
export const SM2_CURVE = {
  // Prime modulus
  p: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFF',
  // Coefficient a
  a: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF00000000FFFFFFFFFFFFFFFC',
  // Coefficient b
  b: '28E9FA9E9D9F5E344D5A9E4BCF6509A7F39789F515AB8F92DDBCBD414D940E93',
  // Base point x coordinate
  Gx: '32C4AE2C1F1981195F9904466A39C9948FE30BBFF2660BE1715A4589334C74C7',
  // Base point y coordinate
  Gy: 'BC3736A2F4F6779C59BDCEE36B692153D0A9877CC62A474002DF32E52139F0A0',
  // Order
  n: 'FFFFFFFEFFFFFFFFFFFFFFFFFFFFFFFF7203DF6B21C6052B53BBF40939D54123',
  // Cofactor
  h: 1,
} as const;

/**
 * Point on elliptic curve
 */
export interface Point {
  x: string; // hex string
  y: string; // hex string
}

/**
 * Check if a point is the point at infinity
 */
export function isInfinity(point: Point | null): boolean {
  return point === null || (point.x === '0' && point.y === '0');
}

/**
 * Convert compressed public key to uncompressed format
 * @param compressedKey - Compressed public key (33 bytes: 02/03 + x coordinate)
 * @returns Uncompressed public key (65 bytes: 04 + x + y coordinates)
 */
export function decompressPublicKey(compressedKey: string): string {
  if (compressedKey.length !== 66) {
    throw new Error('Compressed public key must be 33 bytes (66 hex chars)');
  }
  
  const prefix = compressedKey.slice(0, 2);
  if (prefix !== '02' && prefix !== '03') {
    throw new Error('Invalid compressed key prefix, must be 02 or 03');
  }
  
  // This is a placeholder implementation
  // A full implementation would:
  // 1. Calculate y² = x³ + ax + b (mod p)
  // 2. Find the square root of y² modulo p
  // 3. Choose the odd or even y based on the prefix
  
  // For now, we'll throw an error indicating this needs a proper implementation
  throw new Error('Public key decompression requires full elliptic curve arithmetic implementation');
}

/**
 * Convert uncompressed public key to compressed format
 * @param uncompressedKey - Uncompressed public key (65 bytes: 04 + x + y coordinates)
 * @returns Compressed public key (33 bytes: 02/03 + x coordinate)
 */
export function compressPublicKey(uncompressedKey: string): string {
  if (uncompressedKey.length !== 130) {
    throw new Error('Uncompressed public key must be 65 bytes (130 hex chars)');
  }
  
  const prefix = uncompressedKey.slice(0, 2);
  if (prefix !== '04') {
    throw new Error('Invalid uncompressed key prefix, must be 04');
  }
  
  const x = uncompressedKey.slice(2, 66);
  const y = uncompressedKey.slice(66, 130);
  
  // Check if y is odd or even
  const yBytes = hexToBytes(y);
  const isOdd = (yBytes[yBytes.length - 1] & 1) === 1;
  
  const newPrefix = isOdd ? '03' : '02';
  return newPrefix + x;
}

/**
 * Validate that a point lies on the SM2 curve
 * @param point - Point to validate
 * @param curveParams - Optional custom curve parameters (default: SM2_CURVE)
 * @returns true if point is on the curve
 */
export function isPointOnCurve(point: Point, _curveParams = SM2_CURVE): boolean {
  if (isInfinity(point)) {
    return true;
  }
  
  // This is a placeholder implementation
  // A full implementation would:
  // 1. Parse x, y, a, b, p as big integers
  // 2. Calculate y² (mod p)
  // 3. Calculate x³ + ax + b (mod p)
  // 4. Compare the two values
  
  // For now, we'll return true as a placeholder
  // This needs a proper big integer library implementation
  return true;
}

/**
 * Validate public key format and optionally check if it's on the curve
 * @param publicKey - Public key as hex string
 * @param checkCurve - Whether to validate the point is on the curve
 * @returns true if valid
 */
export function isValidPublicKey(publicKey: string, checkCurve: boolean = false): boolean {
  // Check length
  if (publicKey.length !== 130 && publicKey.length !== 66) {
    return false;
  }
  
  const prefix = publicKey.slice(0, 2);
  
  // Check prefix
  if (publicKey.length === 130 && prefix !== '04') {
    return false;
  }
  
  if (publicKey.length === 66 && prefix !== '02' && prefix !== '03') {
    return false;
  }
  
  // Check if valid hex
  if (!/^[0-9a-fA-F]+$/.test(publicKey)) {
    return false;
  }
  
  if (checkCurve && publicKey.length === 130) {
    const x = publicKey.slice(2, 66);
    const y = publicKey.slice(66, 130);
    return isPointOnCurve({ x, y });
  }
  
  return true;
}

/**
 * Parse public key into point coordinates
 * @param publicKey - Public key as hex string (uncompressed format)
 * @returns Point with x and y coordinates
 */
export function parsePublicKey(publicKey: string): Point {
  if (publicKey.length === 66) {
    throw new Error('Cannot parse compressed public key. Use decompressPublicKey first.');
  }
  
  if (publicKey.length !== 130) {
    throw new Error('Public key must be 65 bytes (130 hex chars) in uncompressed format');
  }
  
  const prefix = publicKey.slice(0, 2);
  if (prefix !== '04') {
    throw new Error('Invalid uncompressed key prefix, must be 04');
  }
  
  const x = publicKey.slice(2, 66);
  const y = publicKey.slice(66, 130);
  
  return { x, y };
}

/**
 * Format point coordinates as public key
 * @param point - Point with x and y coordinates
 * @param compressed - Whether to return compressed format
 * @returns Public key as hex string
 */
export function formatPublicKey(point: Point, compressed: boolean = false): string {
  if (isInfinity(point)) {
    throw new Error('Cannot format point at infinity as public key');
  }
  
  const uncompressed = '04' + point.x.padStart(64, '0') + point.y.padStart(64, '0');
  
  if (compressed) {
    return compressPublicKey(uncompressed);
  }
  
  return uncompressed;
}

/**
 * Placeholder for point addition on elliptic curve
 * Note: This requires proper big integer arithmetic implementation
 */
export function pointAdd(p1: Point, p2: Point, _curveParams = SM2_CURVE): Point {
  if (isInfinity(p1)) return p2;
  if (isInfinity(p2)) return p1;
  
  throw new Error('Point addition requires full elliptic curve arithmetic implementation with big integer support');
}

/**
 * Placeholder for point doubling on elliptic curve
 * Note: This requires proper big integer arithmetic implementation
 */
export function pointDouble(point: Point, _curveParams = SM2_CURVE): Point {
  if (isInfinity(point)) return point;
  
  throw new Error('Point doubling requires full elliptic curve arithmetic implementation with big integer support');
}

/**
 * Placeholder for scalar multiplication on elliptic curve
 * Note: This requires proper big integer arithmetic implementation
 */
export function pointMultiply(point: Point, scalar: string, _curveParams = SM2_CURVE): Point {
  if (isInfinity(point)) return point;
  if (scalar === '0') return { x: '0', y: '0' };
  if (scalar === '1') return point;
  
  throw new Error('Scalar multiplication requires full elliptic curve arithmetic implementation with big integer support');
}

/**
 * Get the base point (generator) of the SM2 curve
 */
export function getBasePoint(): Point {
  return {
    x: SM2_CURVE.Gx,
    y: SM2_CURVE.Gy,
  };
}

/**
 * Compute public key from private key
 * Public key = private key × G (base point)
 * Note: This is a placeholder that requires proper implementation
 */
export function computePublicKey(privateKey: string): string {
  if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error('Private key must be 32 bytes (64 hex chars)');
  }
  
  // This is a placeholder
  // A full implementation would:
  // 1. Parse private key as big integer
  // 2. Perform scalar multiplication: public_key = private_key × G
  // 3. Return the resulting point in uncompressed format
  
  throw new Error('Public key computation from private key requires full elliptic curve arithmetic implementation');
}
