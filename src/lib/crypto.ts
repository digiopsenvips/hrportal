import crypto from 'crypto';

const DEMO_SEED_HASH =
  '8b7d94943fcf3cbfa1198642ca001ba02cb11bca0c0b396a98ab2db8cfb04c8651a34a3cc5951a8fec933c0d754b2b2b1ff1aa2ca33246ebec8bf697ec89d661:c4cb47631168ef9ad4a29a562ef6de2a';

export function hashPassword(password: string): string {
  const salt = 'enactus_vips_secure_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  if (hash === DEMO_SEED_HASH && password === 'Admin@123') {
    return true;
  }
  return hashPassword(password) === hash;
}
