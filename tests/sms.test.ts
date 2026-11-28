import http from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { plantillaSms, proveedorSms } from "@/lib/sms";
import { TwilioSms } from "@/lib/sms/twilio";
import { VonageSms } from "@/lib/sms/vonage";
import { InfobipSms, urlInfobip } from "@/lib/sms/infobip";

type Captura = { metodo: string; ruta: string; headers: http.IncomingHttpHeaders; cuerpo: string };

const capturas: Captura[] = [];
let respuesta: { status: number; body: string } = { status: 200, body: "{}" };
let servidor: http.Server;
let base = "";

// Los adaptadores hablan HTTP de verdad: se apuntan a un servidor local y se
// comprueba la petición que sale, sin tocar los proveedores reales.
beforeAll(async () => {
  servidor = http.createServer((req, res) => {
    let cuerpo = "";
    req.on("data", (trozo) => (cuerpo += trozo));
    req.on("end", () => {
      capturas.push({ metodo: req.method ?? "", ruta: req.url ?? "", headers: req.headers, cuerpo });
      res.writeHead(respuesta.status, { "Content-Type": "application/json" });
      res.end(respuesta.body);
    });
  });
  await new Promise<void>((listo) => servidor.listen(0, "127.0.0.1", listo));
  const dir = servidor.address() as { port: number };
  base = `http://127.0.0.1:${dir.port}`;
});

const CLAVES = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM", "TWILIO_MESSAGING_SERVICE_SID", "TWILIO_API_BASE", "VONAGE_API_KEY", "VONAGE_API_SECRET", "VONAGE_FROM", "VONAGE_API_BASE", "INFOBIP_API_KEY", "INFOBIP_BASE_URL", "INFOBIP_FROM", "SMS_FROM", "SMS_PROVIDER"];
const entornoPrevio = new Map(CLAVES.map((k) => [k, process.env[k]]));

afterAll(async () => {
  await new Promise<void>((listo) => servidor.close(() => listo()));
  for (const [k, v] of entornoPrevio) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

beforeEach(() => {
  capturas.length = 0;
  respuesta = { status: 200, body: "{}" };
  for (const k of CLAVES) delete process.env[k];
});

const codigo = "123456";

describe("Twilio", () => {
  it("manda To, From y el texto por formulario con autenticación básica", async () => {
    Object.assign(process.env, { TWILIO_ACCOUNT_SID: "AC123", TWILIO_AUTH_TOKEN: "secreto", TWILIO_FROM: "+15550001111", TWILIO_API_BASE: base });
    const r = await new TwilioSms().enviarCodigo({ to: "+5355551234", codigo, lang: "es" });

    expect(r).toEqual({ ok: true });
    expect(capturas).toHaveLength(1);
    const [p] = capturas;
    expect(p.metodo).toBe("POST");
    expect(p.ruta).toBe("/2010-04-01/Accounts/AC123/Messages.json");
    expect(p.headers.authorization).toBe(`Basic ${Buffer.from("AC123:secreto").toString("base64")}`);
    expect(p.headers["content-type"]).toContain("application/x-www-form-urlencoded");
    const form = new URLSearchParams(p.cuerpo);
    expect(form.get("To")).toBe("+5355551234");
    expect(form.get("From")).toBe("+15550001111");
    expect(form.get("Body")).toContain(codigo);
    expect(form.get("MessagingServiceSid")).toBeNull();
  });

  it("usa el servicio de mensajería cuando no hay número remitente", async () => {
    Object.assign(process.env, { TWILIO_ACCOUNT_SID: "AC123", TWILIO_AUTH_TOKEN: "secreto", TWILIO_MESSAGING_SERVICE_SID: "MG999", TWILIO_API_BASE: base });
    const r = await new TwilioSms().enviarCodigo({ to: "+5355551234", codigo, lang: "en" });

    expect(r.ok).toBe(true);
    const form = new URLSearchParams(capturas[0].cuerpo);
    expect(form.get("MessagingServiceSid")).toBe("MG999");
    expect(form.get("From")).toBeNull();
    expect(form.get("Body")).toContain("verification code");
  });

  it("devuelve el estado HTTP cuando el proveedor falla", async () => {
    Object.assign(process.env, { TWILIO_ACCOUNT_SID: "AC123", TWILIO_AUTH_TOKEN: "secreto", TWILIO_FROM: "+1", TWILIO_API_BASE: base });
    respuesta = { status: 500, body: "{}" };
    expect(await new TwilioSms().enviarCodigo({ to: "+5355551234", codigo, lang: "es" })).toEqual({ ok: false, error: "twilio_500" });
  });

  it("no llama a la red sin credenciales", async () => {
    expect(await new TwilioSms().enviarCodigo({ to: "+5355551234", codigo, lang: "es" })).toEqual({ ok: false, error: "twilio_sin_configurar" });
    expect(capturas).toHaveLength(0);
  });
});

describe("Vonage", () => {
  it("manda el destino sin el + y acepta el estado 0", async () => {
    Object.assign(process.env, { VONAGE_API_KEY: "k1", VONAGE_API_SECRET: "s1", VONAGE_FROM: "Impacto", VONAGE_API_BASE: base });
    respuesta = { status: 200, body: JSON.stringify({ messages: [{ status: "0" }] }) };
    const r = await new VonageSms().enviarCodigo({ to: "+5355551234", codigo, lang: "es" });

    expect(r).toEqual({ ok: true });
    const [p] = capturas;
    expect(p.ruta).toBe("/sms/json");
    const form = new URLSearchParams(p.cuerpo);
    expect(form.get("api_key")).toBe("k1");
    expect(form.get("api_secret")).toBe("s1");
    expect(form.get("from")).toBe("Impacto");
    expect(form.get("to")).toBe("5355551234");
    expect(form.get("text")).toContain(codigo);
    expect(form.get("type")).toBe("unicode");
  });

  it("trata como error un estado distinto de 0 aunque el HTTP sea 200", async () => {
    Object.assign(process.env, { VONAGE_API_KEY: "k1", VONAGE_API_SECRET: "s1", VONAGE_API_BASE: base });
    respuesta = { status: 200, body: JSON.stringify({ messages: [{ status: "15" }] }) };
    expect(await new VonageSms().enviarCodigo({ to: "+5355551234", codigo, lang: "es" })).toEqual({ ok: false, error: "vonage_15" });
  });

  it("no llama a la red sin credenciales", async () => {
    expect(await new VonageSms().enviarCodigo({ to: "+5355551234", codigo, lang: "es" })).toEqual({ ok: false, error: "vonage_sin_configurar" });
    expect(capturas).toHaveLength(0);
  });
});

describe("Infobip", () => {
  it("manda JSON con destino, remitente y texto", async () => {
    Object.assign(process.env, { INFOBIP_API_KEY: "app-key", INFOBIP_BASE_URL: base, INFOBIP_FROM: "Impacto" });
    const r = await new InfobipSms().enviarCodigo({ to: "+5355551234", codigo, lang: "en" });

    expect(r).toEqual({ ok: true });
    const [p] = capturas;
    expect(p.ruta).toBe("/sms/2/text/advanced");
    expect(p.headers.authorization).toBe("App app-key");
    expect(p.headers["content-type"]).toContain("application/json");
    const json = JSON.parse(p.cuerpo);
    expect(json.messages[0].destinations[0].to).toBe("+5355551234");
    expect(json.messages[0].from).toBe("Impacto");
    expect(json.messages[0].text).toContain(codigo);
  });

  it("acepta el subdominio sin esquema y la URL completa", () => {
    expect(urlInfobip("xxxxx.api.infobip.com")).toBe("https://xxxxx.api.infobip.com");
    expect(urlInfobip("https://xxxxx.api.infobip.com/")).toBe("https://xxxxx.api.infobip.com");
    expect(urlInfobip("http://127.0.0.1:9000")).toBe("http://127.0.0.1:9000");
  });

  it("exige remitente además de la clave y la base", async () => {
    Object.assign(process.env, { INFOBIP_API_KEY: "app-key", INFOBIP_BASE_URL: base });
    expect(await new InfobipSms().enviarCodigo({ to: "+5355551234", codigo, lang: "es" })).toEqual({ ok: false, error: "infobip_sin_configurar" });
    expect(capturas).toHaveLength(0);
  });
});

describe("elección de proveedor", () => {
  it("sin credenciales usa el mock", () => {
    expect(proveedorSms().nombre).toBe("mock");
  });

  it("SMS_PROVIDER manda sobre las credenciales presentes", () => {
    Object.assign(process.env, { SMS_PROVIDER: "vonage", TWILIO_ACCOUNT_SID: "AC", TWILIO_AUTH_TOKEN: "t" });
    expect(proveedorSms().nombre).toBe("vonage");
  });

  it("elige el primer proveedor con credenciales completas", () => {
    Object.assign(process.env, { VONAGE_API_KEY: "k", VONAGE_API_SECRET: "s" });
    expect(proveedorSms().nombre).toBe("vonage");
    Object.assign(process.env, { TWILIO_ACCOUNT_SID: "AC", TWILIO_AUTH_TOKEN: "t" });
    expect(proveedorSms().nombre).toBe("twilio");
    Object.assign(process.env, { INFOBIP_API_KEY: "k", INFOBIP_BASE_URL: "b" });
    expect(proveedorSms().nombre).toBe("twilio");
  });

  it("con SMS_PROVIDER=infobip devuelve infobip", () => {
    process.env.SMS_PROVIDER = "infobip";
    expect(proveedorSms().nombre).toBe("infobip");
  });
});

describe("plantilla del mensaje", () => {
  it("incluye el código y no lleva enlaces", () => {
    for (const lang of ["es", "en"] as const) {
      const texto = plantillaSms(lang, codigo);
      expect(texto).toContain(codigo);
      expect(texto).not.toMatch(/https?:\/\//);
      expect(texto.length).toBeLessThan(160);
    }
    expect(plantillaSms("es", codigo)).toMatch(/caduca en 5 minutos/i);
    expect(plantillaSms("en", codigo)).toMatch(/expires in 5 minutes/i);
  });
});
