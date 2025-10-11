/**
 * Test setup file
 * Polyfills for Node.js environment
 */

import { webcrypto } from 'crypto';

// Polyfill crypto.getRandomValues for Node.js test environment
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}
