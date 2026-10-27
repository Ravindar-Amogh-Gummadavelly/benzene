import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'aicte_fdr_portal_fallback_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

/**
 * Hash plaintext password using bcrypt with salt rounds of 10.
 */
export async function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Password must be a non-empty string.');
  }
  return await bcrypt.hash(plainPassword, 10);
}

/**
 * Compare plaintext password with hashed password.
 */
export async function verifyPassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) return false;
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generate a signed JWT token containing user identity and authorization claims.
 */
export function generateToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    institutionId: user.institutionId || null,
    name: user.name,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token.
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
