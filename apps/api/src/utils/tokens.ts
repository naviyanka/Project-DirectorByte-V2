import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { getEnv } from '../config/env';

export interface JwtPayload {
  userId: string;
  role: string;
}

export const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, getEnv().JWT_SECRET, {
    expiresIn: getEnv().JWT_ACCESS_EXPIRY as any,
  });
};

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString('hex');
};

export const verifyAccessToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, getEnv().JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};

export const generateEmailToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Simple AES-256 encryption for API keys
export const encryptString = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(getEnv().ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decryptString = (text: string): string => {
  const textParts = text.split(':');
  const ivStr = textParts.shift();
  if (!ivStr) throw new Error('Invalid encrypted string format');
  
  const iv = Buffer.from(ivStr, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(getEnv().ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
