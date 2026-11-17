# Módulos de entregas y email marketing

- **Zonas**: sin regla = método no disponible. Regla de municipio > regla de provincia. Los métodos de recogida no dependen de la zona.
- **Checkout seguro**: `buildOrderDelivery()` (src/lib/shipping.ts) revalida método, zona, cupos y costo en el servidor.
- **Correo del dominio**: guardar SMTP vía `POST /api/admin/email-settings` (la contraseña se cifra). Configurar SPF, DKIM y DMARC en el DNS.
- **Cola**: `/api/cron/campaigns` envía por lotes (límite por minuto y por día) para proteger la reputación del dominio.
- **Consentimiento**: solo se envía a suscriptores activos; cada correo lleva enlace de baja y cabecera List-Unsubscribe.

## Roles del equipo
| Rol | Permisos |
|---|---|
| Administrador | todo, incluido equipo y actividad |
| Gerente | todo salvo equipo y actividad |
| Ventas | pedidos, cupones, reportes, reseñas, email marketing |
| Almacén | productos, pedidos, logística, archivos |

## Variantes
Si un producto tiene variantes activas, el cliente elige una (precio y stock propios). Las existencias del producto son la suma de sus variantes y se descuentan ambas al vender.

## Archivos subidos
Con `BLOB_READ_WRITE_TOKEN` se guardan en Vercel Blob; sin él, en `UPLOAD_DIR` (servidor con disco persistente). Solo JPG/PNG/WebP (5 MB) y GLB (25 MB), validados por su contenido.

## Suscripciones
Toda suscripción (formulario o registro con casilla de marketing) queda PENDIENTE hasta confirmar el correo; solo las ACTIVAS reciben campañas.
