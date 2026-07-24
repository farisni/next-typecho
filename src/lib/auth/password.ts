import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt$${salt}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, keyHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !keyHex) return false;

  const storedKey = Buffer.from(keyHex, "hex");
  if (storedKey.length !== KEY_LENGTH) return false;

  const suppliedKey = (await scryptAsync(password, salt, storedKey.length)) as Buffer;
  return timingSafeEqual(storedKey, suppliedKey);
}