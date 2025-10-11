import { digest as digestFunc, hmac as hmacFunc } from './index';

/**
 * SM3 class providing object-oriented API for hash operations
 */
export class SM3 {
  /**
   * Compute SM3 hash digest
   * @param data - Data to hash
   * @returns Hash digest as hex string
   */
  static digest(data: string | Uint8Array): string {
    return digestFunc(data);
  }

  /**
   * Compute SM3-HMAC
   * @param key - HMAC key
   * @param data - Data to authenticate
   * @returns HMAC as hex string
   */
  static hmac(key: string | Uint8Array, data: string | Uint8Array): string {
    return hmacFunc(key, data);
  }

  /**
   * Create a new SM3 hasher instance for incremental hashing
   * Note: This is a simple wrapper around the functional API
   * A full implementation would support streaming/incremental updates
   */
  private data: Uint8Array[] = [];

  /**
   * Update the hash with new data
   * @param data - Data to add to hash
   * @returns this for chaining
   */
  update(data: string | Uint8Array): this {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    this.data.push(bytes);
    return this;
  }

  /**
   * Finalize the hash and return the digest
   * @returns Hash digest as hex string
   */
  digest(): string {
    // Concatenate all data chunks
    const totalLength = this.data.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of this.data) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Clear data after digesting
    this.data = [];
    
    return digestFunc(combined);
  }

  /**
   * Reset the hasher state
   * @returns this for chaining
   */
  reset(): this {
    this.data = [];
    return this;
  }
}
