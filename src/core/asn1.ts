/**
 * ASN.1 DER encoding/decoding utilities for SM2
 * Based on ITU-T X.690 standard
 */

/**
 * ASN.1 tag types
 */
export const ASN1Tag = {
  INTEGER: 0x02,
  BIT_STRING: 0x03,
  OCTET_STRING: 0x04,
  NULL: 0x05,
  OBJECT_IDENTIFIER: 0x06,
  SEQUENCE: 0x30,
} as const;

/**
 * Encode length in DER format
 * @param length - Length to encode
 * @returns DER-encoded length bytes
 */
function encodeLength(length: number): Uint8Array {
  if (length < 128) {
    return new Uint8Array([length]);
  }
  
  const bytes: number[] = [];
  let temp = length;
  while (temp > 0) {
    bytes.unshift(temp & 0xff);
    temp >>= 8;
  }
  
  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

/**
 * Decode length from DER format
 * @param data - Data containing DER-encoded length
 * @param offset - Starting offset
 * @returns Object with length and bytes consumed
 */
function decodeLength(data: Uint8Array, offset: number): { length: number; bytesRead: number } {
  const firstByte = data[offset];
  
  if (firstByte < 128) {
    return { length: firstByte, bytesRead: 1 };
  }
  
  const numBytes = firstByte & 0x7f;
  let length = 0;
  
  for (let i = 0; i < numBytes; i++) {
    length = (length << 8) | data[offset + 1 + i];
  }
  
  return { length, bytesRead: 1 + numBytes };
}

/**
 * Encode integer in DER format
 * @param value - Integer value as hex string or Uint8Array
 * @returns DER-encoded integer
 */
export function encodeInteger(value: string | Uint8Array): Uint8Array {
  let bytes: Uint8Array;
  
  if (typeof value === 'string') {
    // Remove leading zeros but keep at least one byte
    const cleaned = value.replace(/^0+/, '') || '0';
    const hex = cleaned.length % 2 === 0 ? cleaned : '0' + cleaned;
    bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
  } else {
    bytes = value;
  }
  
  // Add leading zero if high bit is set (to indicate positive number)
  if (bytes[0] & 0x80) {
    const padded = new Uint8Array(bytes.length + 1);
    padded[0] = 0x00;
    padded.set(bytes, 1);
    bytes = padded;
  }
  
  const length = encodeLength(bytes.length);
  const result = new Uint8Array(1 + length.length + bytes.length);
  result[0] = ASN1Tag.INTEGER;
  result.set(length, 1);
  result.set(bytes, 1 + length.length);
  
  return result;
}

/**
 * Decode integer from DER format
 * @param data - DER-encoded data
 * @param offset - Starting offset
 * @returns Object with integer value and bytes consumed
 */
export function decodeInteger(data: Uint8Array, offset: number = 0): { value: Uint8Array; bytesRead: number } {
  if (data[offset] !== ASN1Tag.INTEGER) {
    throw new Error('Expected INTEGER tag');
  }
  
  const { length, bytesRead: lengthBytes } = decodeLength(data, offset + 1);
  const start = offset + 1 + lengthBytes;
  const value = data.slice(start, start + length);
  
  // Remove leading zero if present (padding for positive numbers)
  const actualValue = value[0] === 0x00 ? value.slice(1) : value;
  
  return {
    value: actualValue,
    bytesRead: 1 + lengthBytes + length,
  };
}

/**
 * Encode sequence in DER format
 * @param elements - Array of DER-encoded elements
 * @returns DER-encoded sequence
 */
export function encodeSequence(...elements: Uint8Array[]): Uint8Array {
  const contentLength = elements.reduce((sum, el) => sum + el.length, 0);
  const length = encodeLength(contentLength);
  const result = new Uint8Array(1 + length.length + contentLength);
  
  result[0] = ASN1Tag.SEQUENCE;
  result.set(length, 1);
  
  let offset = 1 + length.length;
  for (const element of elements) {
    result.set(element, offset);
    offset += element.length;
  }
  
  return result;
}

/**
 * Decode sequence from DER format
 * @param data - DER-encoded data
 * @param offset - Starting offset
 * @returns Object with sequence elements and bytes consumed
 */
export function decodeSequence(data: Uint8Array, offset: number = 0): { elements: Uint8Array[]; bytesRead: number } {
  if (data[offset] !== ASN1Tag.SEQUENCE) {
    throw new Error('Expected SEQUENCE tag');
  }
  
  const { length, bytesRead: lengthBytes } = decodeLength(data, offset + 1);
  const contentStart = offset + 1 + lengthBytes;
  const contentEnd = contentStart + length;
  
  const elements: Uint8Array[] = [];
  let pos = contentStart;
  
  while (pos < contentEnd) {
    const { length: elemLength, bytesRead: elemLengthBytes } = decodeLength(data, pos + 1);
    const elemTotalLength = 1 + elemLengthBytes + elemLength;
    
    elements.push(data.slice(pos, pos + elemTotalLength));
    pos += elemTotalLength;
  }
  
  return {
    elements,
    bytesRead: 1 + lengthBytes + length,
  };
}

/**
 * Encode SM2 signature (r, s) in DER format
 * @param r - R component as hex string
 * @param s - S component as hex string
 * @returns DER-encoded signature
 */
export function encodeSignature(r: string, s: string): Uint8Array {
  const rEncoded = encodeInteger(r);
  const sEncoded = encodeInteger(s);
  return encodeSequence(rEncoded, sEncoded);
}

/**
 * Decode SM2 signature from DER format
 * @param signature - DER-encoded signature
 * @returns Object with r and s components as hex strings
 */
export function decodeSignature(signature: Uint8Array): { r: string; s: string } {
  const { elements } = decodeSequence(signature);
  
  if (elements.length !== 2) {
    throw new Error('Invalid signature: expected 2 elements');
  }
  
  const { value: rBytes } = decodeInteger(elements[0]);
  const { value: sBytes } = decodeInteger(elements[1]);
  
  const r = Array.from(rBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const s = Array.from(sBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { r, s };
}

/**
 * Convert raw signature (r || s) to DER format
 * @param rawSignature - Raw signature as hex string (64 bytes)
 * @returns DER-encoded signature
 */
export function rawToDer(rawSignature: string): Uint8Array {
  if (rawSignature.length !== 128) {
    throw new Error('Raw signature must be 64 bytes (128 hex characters)');
  }
  
  const r = rawSignature.slice(0, 64);
  const s = rawSignature.slice(64, 128);
  
  return encodeSignature(r, s);
}

/**
 * Convert DER signature to raw format (r || s)
 * @param derSignature - DER-encoded signature
 * @returns Raw signature as hex string (64 bytes)
 */
export function derToRaw(derSignature: Uint8Array): string {
  const { r, s } = decodeSignature(derSignature);
  
  // Pad to 32 bytes each
  const rPadded = r.padStart(64, '0');
  const sPadded = s.padStart(64, '0');
  
  return rPadded + sPadded;
}
