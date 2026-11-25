import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifyCaptcha } from "@/lib/captcha";

const SECRET = "secreto-de-prueba-para-captcha";
const NONCE = "0123456789abcdef01234567";

function token(answer: string, { exp = Date.now() + 60_000, version = 1 } = {}) {
  const h = crypto.createHmac("sha256", SECRET).update(`captcha:answer:${NONCE}:${answer}`).digest("hex");
  const payload = { v: version, iat: Date.now(), exp, n: NONCE, h };
  const cuerpo = Buffer.from(JSON.stringify(payload), "utf8");
  return Buffer.concat([cuerpo, crypto.createHmac("sha256", SECRET).update(cuerpo).digest()]).toString("base64url");
}

describe("captcha firmado", () => {
  let prev: string | undefined;

  beforeEach(() => {
    prev = process.env.APP_SECRET;
    process.env.APP_SECRET = SECRET;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.APP_SECRET;
    else process.env.APP_SECRET = prev;
  });

  it("acepta la respuesta correcta sin distinguir mayúsculas ni separadores", () => {
    const t = token("ABC2");
    expect(verifyCaptcha(t, "ABC2")).toBe(true);
    expect(verifyCaptcha(t, "a b-c2")).toBe(true);
  });

  it("rechaza una respuesta incorrecta", () => {
    expect(verifyCaptcha(token("ABC2"), "ZZZZ")).toBe(false);
    expect(verifyCaptcha(token("ABC2"), "")).toBe(false);
  });

  it("rechaza tokens vencidos, con otra versión o manipulados", () => {
    expect(verifyCaptcha(token("ABC2", { exp: Date.now() - 1 }), "ABC2")).toBe(false);
    expect(verifyCaptcha(token("ABC2", { version: 2 }), "ABC2")).toBe(false);

    const raw = Buffer.from(token("ABC2"), "base64url");
    raw[5] ^= 1;
    expect(verifyCaptcha(raw.toString("base64url"), "ABC2")).toBe(false);

    const firma = Buffer.from(token("ABC2"), "base64url");
    firma[firma.length - 1] ^= 1;
    expect(verifyCaptcha(firma.toString("base64url"), "ABC2")).toBe(false);
  });

  it("rechaza codificaciones no canónicas", () => {
    expect(verifyCaptcha(`${token("ABC2")}=`, "ABC2")).toBe(false);
    expect(verifyCaptcha("no-es-un-token", "ABC2")).toBe(false);
  });

  it("falla de forma explícita si falta APP_SECRET", () => {
    delete process.env.APP_SECRET;
    expect(() => verifyCaptcha(token("ABC2"), "ABC2")).toThrow(/APP_SECRET/);
  });
});
