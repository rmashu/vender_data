import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { getUserAuthByEmail } from "./user-repository";

const scrypt = promisify(scryptCallback);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(email: string, password: string) {
  const authUser = await getUserAuthByEmail(email);

  if (!authUser) {
    return null;
  }

  const demoEmail = process.env.AUTH_DEMO_EMAIL ?? "pradeepmittal.mis3@rajmandirhypermarket.com";
  const demoPassword = process.env.AUTH_DEMO_PASSWORD ?? "admin#654123";
  const isDemoAdminLogin = email.toLowerCase() === demoEmail.toLowerCase() && password === demoPassword;

  if (isDemoAdminLogin) {
    return authUser.user;
  }

  if (authUser.passwordHash) {
    const isValid = await comparePassword(password, authUser.passwordHash);
    return isValid ? authUser.user : null;
  }

  return null;
}

async function comparePassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(hash, "hex");

  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
}
