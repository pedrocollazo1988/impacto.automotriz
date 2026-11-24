import { prisma } from "@/lib/prisma";

// Diagnóstico de configuración para comprobar un despliegue sin exponer valores.
// Devuelve true/false por variable y comprueba que la base de datos responde.
export const dynamic = "force-dynamic";

export async function GET() {
  const has = (k: string) => !!process.env[k];
  let db = false;
  try { await prisma.$queryRaw`SELECT 1`; db = true; } catch { db = false; }
  return Response.json({
    ok: has("APP_SECRET") && has("DATABASE_URL") && db,
    env: {
      APP_SECRET: has("APP_SECRET"),
      DATABASE_URL: has("DATABASE_URL"),
      ADMIN_EMAIL: has("ADMIN_EMAIL"),
      ADMIN_PASSWORD: has("ADMIN_PASSWORD"),
      PUBLIC_URL: has("PUBLIC_URL"),
      CRON_SECRET: has("CRON_SECRET"),
      BLOB_READ_WRITE_TOKEN: has("BLOB_READ_WRITE_TOKEN"),
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: has("NEXT_PUBLIC_TURNSTILE_SITE_KEY"),
      TURNSTILE_SECRET_KEY: has("TURNSTILE_SECRET_KEY"),
    },
    db,
  });
}
