# Impacto Automotriz · Tienda online

Tienda de partes, piezas, accesorios y transporte eléctrico con catálogo, búsqueda por vehículo, visor 3D/AR,
carrito con validación en servidor, entrega por provincia y municipio de Cuba, pagos (Tropipay, transferencia,
efectivo), cuentas administrativas y email marketing con el correo del dominio.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · PostgreSQL + Prisma 6 · `<model-viewer>` · Nodemailer.

## Puesta en marcha
```bash
npm install
cp .env.example .env            # completar valores
npx prisma migrate dev --name init
npm run db:seed                 # 16 provincias, 168 municipios, métodos de entrega y productos DEMO
npm run dev                     # http://localhost:3000
npm test                        # pruebas automatizadas
```

**Primer acceso al panel:** entra en `/admin/login` con `ADMIN_EMAIL` + `ADMIN_PASSWORD` del `.env`; eso crea el primer administrador.
Después crea al resto del equipo en `/admin/equipo` (roles: Administrador, Gerente, Ventas, Almacén) y cambia la clave inicial.

> Si ya habías ejecutado una migración anterior, esta versión cambia el esquema (variantes, equipo, auditoría, tokens). En desarrollo usa `npx prisma migrate reset`; en una base con datos reales crea una migración nueva con `prisma migrate dev`.

## Subir a GitHub
```bash
git init && git add . && git commit -m "Tienda Impacto Automotriz"
git branch -M main
git remote add origin https://github.com/<usuario>/impacto-automotriz-store.git
git push -u origin main
```
`.env` está en `.gitignore`: **nunca** subas credenciales. El workflow de `.github/workflows/ci.yml` valida tipos y compila.

## Despliegue
- **Vercel**: importar el repositorio, definir las variables de `.env.example` y ejecutar `npx prisma migrate deploy` contra la base de datos.
  `vercel.json` programa la cola de correos cada minuto (requiere un plan que permita crons por minuto).
- **Servidor propio**: `npm run build && npm start` + `crontab`:
  `* * * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://tudominio.com/api/cron/campaigns`

## Qué está implementado
| Área | Estado |
|---|---|
| Catálogo, filtros, búsqueda por nombre/código y por vehículo, ficha con compatibilidad, SEO y datos estructurados (con valoraciones) | ✔ |
| Visor 3D (GLB) y realidad aumentada con foto de respaldo | ✔ |
| **Variantes** (medida, color, versión) con precio y existencias propios | ✔ |
| **Comparador** de hasta 4 productos (`/comparar`) | ✔ |
| Carrito persistente; precios, existencias, cupón y envío validados en servidor; descuento de stock transaccional | ✔ |
| Entrega por provincia/municipio de Cuba: domicilio, recogida, mensajería, punto acordado, franjas, PIN, compra para tercero | ✔ (`/admin/envios`) |
| **Pagos**: Tropipay y **QvaPay** (enlace + confirmación verificada), transferencia, efectivo; reintento; cancelación que devuelve stock y cupón | ✔ — **validar ambas pasarelas en sandbox** |
| **Cuentas de cliente**: registro, login, **Google**, **verificación de correo**, recuperación de contraseña, historial, lista de deseos, garaje, reseñas de compra verificada | ✔ |
| **Equipo con roles y permisos** + **registro de actividad** (`/admin/equipo`, `/admin/auditoria`) | ✔ |
| **Subida de fotos (JPG/PNG/WebP) y modelos 3D (GLB)** desde el panel, validada por contenido; Vercel Blob o disco | ✔ |
| Productos: formulario, variantes y **carga masiva Excel (.xlsx) o CSV** | ✔ |
| Moderación de reseñas (`/admin/resenas`), cupones, reportes, comprobante imprimible | ✔ |
| **Email marketing con doble confirmación**, segmentos, cola con límites, baja con un clic, correos transaccionales, aviso «ya hay existencias» | ✔ |
| PWA instalable; **GA4 solo tras aceptar cookies** | ✔ |
| API de solo lectura para el agente de IA (`/api/agent/products`) | ✔ |
| **Límite de intentos persistente** (PostgreSQL) en login, registro, recuperación y suscripción | ✔ |
| **Pruebas automatizadas** (Vitest: CSV, contraseñas, firma de Tropipay, cálculo de envíos) ejecutadas en CI | ✔ (cobertura básica) |

## Pendiente / siguiente fase
- Validar en sandbox los endpoints de Tropipay y QvaPay (escritos según la documentación pública conocida, sin cuenta de pruebas).
- Pruebas de extremo a extremo (checkout completo con base de datos de prueba) y revisión de seguridad externa antes de producción.
- Autenticación en dos pasos para el equipo; recuperación de clave del personal (hoy la cambia un Administrador).
- Facturación fiscal oficial (el comprobante actual no sustituye una factura legal) y cálculo de envío por peso, si se requieren.

## Seguridad
Sesión de equipo con cookie `httpOnly` firmada y permisos por rol en cada ruta `/api/admin/*` (403 si el rol no corresponde); acciones sensibles quedan en el registro de actividad.
La contraseña SMTP se guarda cifrada (AES-256-GCM con `APP_SECRET`). Cambia `APP_SECRET` y `ADMIN_PASSWORD` antes de producción.

Más detalle de los módulos de entregas y correo: ver `docs/MODULOS.md`.
