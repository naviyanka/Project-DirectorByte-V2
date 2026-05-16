import crypto from 'crypto';
import { env } from '../config/env';

export class EncryptionService {
  private static ALGORITHM = 'aes-256-gcm';
  private static IV_LENGTH = 12; // 96 bits for GCM
  private static AUTH_TAG_LENGTH = 16; // 128 bits

  /**
   * Encrypts plaintext using AES-256-GCM.
   * Returns a base64 encoded string containing IV + AuthTag + Ciphertext.
   */
  static encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const key = Buffer.from(env.ENCRYPTION_KEY, 'utf-8');
    
    if (key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 bytes.');
    }

    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv) as crypto.CipherGCM;
    
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf-8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();

    // Format: base64(iv + authTag + encryptedText)
    const combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString('base64');
  }

  /**
   * Decrypts ciphertext previously encrypted by this service.
   */
  static decrypt(ciphertext: string): string {
    const combined = Buffer.from(ciphertext, 'base64');
    const key = Buffer.from(env.ENCRYPTION_KEY, 'utf-8');

    if (key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 bytes.');
    }

    // Extract parts
    const iv = combined.subarray(0, this.IV_LENGTH);
    const authTag = combined.subarray(this.IV_LENGTH, this.IV_LENGTH + this.AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(this.IV_LENGTH + this.AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return decrypted.toString('utf-8');
  }
}
