import { HttpError } from "./auth";
import { OtpError } from "./otp";

/** Respuesta de error con código estable: el frontend traduce, no el servidor. */
export const errorJson = (codigo: string, status: number, retryAfter?: number) =>
  Response.json(
    { error: codigo, ...(retryAfter ? { retryAfter } : {}) },
    { status, ...(retryAfter ? { headers: { "Retry-After": String(retryAfter) } } : {}) },
  );

/** Traduce los errores de OTP y de límite a códigos; si no es suyo, devuelve null. */
export function errorOtp(e: unknown): Response | null {
  if (e instanceof OtpError) return errorJson(e.codigo, 429, e.retryAfter);
  if (e instanceof HttpError && e.status === 429) return errorJson("AUTH_RATE_LIMIT", 429);
  return null;
}
