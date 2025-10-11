import CryptoJS from 'crypto-js';

// Validate required encryption key on module load
if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 32) {
  console.error('FATAL: ENCRYPTION_KEY must be exactly 32 characters for AES-256 encryption');
  console.error('Generate a secure key: openssl rand -hex 16');
  console.error('WARNING: Changing this key after encrypting data will make existing encrypted data unreadable!');
  process.exit(1);
}

// Type assertion is safe because we validated above
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string;

export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
