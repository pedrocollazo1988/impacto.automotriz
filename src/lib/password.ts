import crypto from "node:crypto";
export { MIN_CLAVE, esContrasenaValida } from "./password-policy";

export function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(pw, salt, 64).toString("hex")}`;
}
export function verifyPassword(pw: string, stored: string | null | undefined) {
  const [salt, h] = (stored ?? "").split(":"); if (!salt || !h) return false;
  const a = Buffer.from(h, "hex"), b = crypto.scryptSync(pw, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
