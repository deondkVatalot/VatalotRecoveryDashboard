import bcryptjs from 'bcryptjs';

// Use Web Crypto API for secure key generation
const SALT_ROUNDS = 10;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Generate a secure key using Web Crypto API
const generateKey = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Use a secure, browser-generated key
const ENCRYPTION_KEY = generateKey();

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export function encryptData(data: string): string {
  try {
    const encoded = encoder.encode(data);
    const encrypted = Array.from(encoded)
      .map((byte, i) => 
        byte ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    return btoa(String.fromCharCode(...encrypted));
  } catch {
    return '';
  }
}

export function decryptData(encryptedData: string): string {
  try {
    const encrypted = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const decrypted = Array.from(encrypted)
      .map((byte, i) => 
        byte ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)
      );
    return decoder.decode(new Uint8Array(decrypted));
  } catch {
    return '';
  }
}