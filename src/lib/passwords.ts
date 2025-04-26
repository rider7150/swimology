import bcrypt from "bcryptjs";

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, hashedPassword);
}

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
} 