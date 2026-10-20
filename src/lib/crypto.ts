import crypto from 'crypto';

export function hashPassword(password: string): string {
  const salt = 'enactus_vips_secure_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}
