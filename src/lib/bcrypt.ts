// lib/bcrypt.ts
import bcrypt from 'bcryptjs';
import * as Crypto from 'expo-crypto';

const SALT_ROUNDS = 10;

// ✅ Provide a random bytes fallback for React Native / Hermes
bcrypt.setRandomFallback((len: number) => {
  const randomBytes = Crypto.getRandomValues(new Uint8Array(len));
  return Array.from(randomBytes);
});

/**
 * Hash a plain-text password/PIN
 */
export async function hashPassword(plainText: string): Promise<string> {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(SALT_ROUNDS, (err, salt) => {
      if (err) return reject(err);
      bcrypt.hash(plainText, salt as string, (err, hash) => {
        if (err) return reject(err);
        if (hash === undefined) return reject(new Error('Hash generation failed'));
        resolve(hash);
      });
    });
  });
}

/**
 * Compare a plain-text password/PIN against a stored hash
 */
export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    bcrypt.compare(plainText, hash, (err, result) => {
      if (err) return reject(err);
      // bcrypt.compare may call back with `undefined` in some runtimes; coerce to boolean
      resolve(Boolean(result));
    });
  });
}