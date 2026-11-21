# Fotos del giro 360

Secuencias publicadas: `te-4001`, `te-4002` y `te-4003`, 36 fotogramas cada una
de 900×900 px.

**Las que hay ahora mismo son renders de un modelo 3D esquemático**, generado por
código en `src/lib/shapes.ts` y renderizado con `scripts/render-360.ts`. Sirven
para que la ficha no esté vacía, pero no son el producto real: parecen un
juguete de CAD. Están pendientes de sustituir por fotos de verdad.

## Cómo poner fotos reales

1. Monta el producto en un plato giratorio, cámara en trípode, luz que no cambie
   entre tomas. Fondo liso y distinto del producto.
2. Dispara una vuelta completa. **36 tomas** (una cada 10°) es lo habitual; el
   visor admite de 8 a 72.
3. Copia las fotos a una carpeta, sin renombrar: el orden es el de los nombres y
   entiende `foto2` antes que `foto10`.
4. Lanza:

       npx tsx scripts/fotos-360.ts TE-4001 ~/tomas/triciclo

El script recorta todas las tomas con la **misma** ventana, la que abarca el
producto en su posición más extrema, para que el giro no baile. Avisa si detecta
un salto de encuadre o un cambio de tamaño entre tomas, y escribe
`public/products/360/<sku>-NN.webp` borrando antes la secuencia anterior del SKU.

Añade `--seco` para ver el análisis sin escribir nada.

## Reglas

- Todas del mismo tamaño y encuadre. Si el producto se mueve o cambia de tamaño
  entre tomas, el giro salta.
- Se ordenan por el número del nombre, no por fecha.
- Van en el repositorio porque en Vercel el disco es de solo lectura.
- Con menos de 8 fotos el visor muestra solo la foto principal, no simula giro.
