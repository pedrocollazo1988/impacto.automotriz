# Fotos del giro 360

Secuencias ya publicadas: `te-4001`, `te-4002` y `te-4003` (36 fotogramas cada
una, 900x900 px, ~7 KB por fotograma). Son **renders del modelo 3D** del propio
catálogo (`public/models/<sku>.glb`), no fotografías del vehículo real.

## Cómo se generan

Con `three.js` en un Chromium headless, una vuelta completa en 36 pasos:

    npx tsx scripts/render-360.ts <sku>

El script sirve el `.glb`, orbita la cámara alrededor de la caja envolvente y
convierte cada vista a WebP con `sharp`. Es reproducible: si cambia el modelo,
se vuelve a lanzar y se sobrescriben los fotogramas.

## Si algún día hay fotos reales

Basta con sustituir los `.webp` manteniendo el nombre. Reglas:

- Mínimo 8 fotos; con menos se muestra solo la foto principal.
- Todas del mismo tamaño y encuadre, para que el giro no salte.
- Una vuelta completa: 24–36 fotos dan un giro fluido; 36 es lo habitual.
- Se ordenan por el número del nombre, no por fecha.
- Van en el repositorio porque en Vercel el disco es de solo lectura.

Sin secuencia, la ficha del eléctrico muestra su foto y no simula el giro.

