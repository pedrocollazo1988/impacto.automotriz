import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { estadoTelegram, verificarTelegram } from "@/lib/telegram";

const TOKEN = "123456:ABCdefGHIjkl";
const AHORA = 1_800_000_000_000;
const ENV = { TELEGRAM_BOT_TOKEN: TOKEN, TELEGRAM_BOT_USERNAME: "@impacto_bot" };

const firmado = (campos: Record<string, string>, token = TOKEN) => {
  const texto = Object.keys(campos).sort().map((k) => `${k}=${campos[k]}`).join("\n");
  const clave = crypto.createHash("sha256").update(token).digest();
  const hash = crypto.createHmac("sha256", clave).update(texto).digest("hex");
  return new URLSearchParams({ ...campos, hash });
};

const base = () => ({ id: "987654321", first_name: "Ana", last_name: "Pérez", username: "anap", auth_date: String(AHORA / 1000) });

describe("verificarTelegram", () => {
  it("acepta la firma del widget y devuelve el usuario", () => {
    expect(verificarTelegram(firmado(base()), ENV, AHORA)).toEqual({
      id: "987654321", nombre: "Ana Pérez", usuario: "anap", foto: null,
    });
  });

  it("usa la foto y el nombre de usuario cuando no hay nombre", () => {
    const u = verificarTelegram(firmado({ id: "1", username: "solo", auth_date: String(AHORA / 1000), photo_url: "https://t.me/i/userpic/320/x.jpg" }), ENV, AHORA);
    expect(u).toEqual({ id: "1", nombre: "solo", usuario: "solo", foto: "https://t.me/i/userpic/320/x.jpg" });
  });

  it("rechaza los datos manipulados", () => {
    const p = firmado(base());
    p.set("first_name", "Mallory");
    expect(verificarTelegram(p, ENV, AHORA)).toBeNull();
  });

  it("rechaza firmas hechas con otro token", () => {
    expect(verificarTelegram(firmado(base(), "999:otro"), ENV, AHORA)).toBeNull();
  });

  it("rechaza una firma vieja", () => {
    const viejo = { ...base(), auth_date: String(AHORA / 1000 - 600) };
    expect(verificarTelegram(firmado(viejo), ENV, AHORA)).toBeNull();
  });

  it("rechaza un id que no es numérico", () => {
    expect(verificarTelegram(firmado({ ...base(), id: "abc" }), ENV, AHORA)).toBeNull();
  });

  it("sin token configurado no hay nada que verificar", () => {
    expect(verificarTelegram(firmado(base()), {}, AHORA)).toBeNull();
  });

  it("rechaza un hash mal formado", () => {
    const p = firmado(base());
    p.set("hash", "no-es-un-hash");
    expect(verificarTelegram(p, ENV, AHORA)).toBeNull();
  });
});

describe("estadoTelegram", () => {
  it("está configurado con token válido y nombre de bot", () => {
    expect(estadoTelegram(ENV)).toEqual({ configurado: true, usuario: "impacto_bot" });
  });

  it("sin nombre de bot no se muestra el botón", () => {
    expect(estadoTelegram({ TELEGRAM_BOT_TOKEN: TOKEN }).configurado).toBe(false);
  });

  it("un token con forma rara no cuenta como configurado", () => {
    expect(estadoTelegram({ TELEGRAM_BOT_TOKEN: "abc", TELEGRAM_BOT_USERNAME: "x" }).configurado).toBe(false);
  });
});
