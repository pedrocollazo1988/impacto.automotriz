import { buildModelGLB } from "./glb";
import { formaDe } from "./shapes";
import { saveModel } from "./storage";

// Genera el .glb esquemático a partir del tipo de pieza (SKU y nombre). No usa la
// foto: el modelo es una reconstrucción estilizada, no el producto real.

export async function generateModel3d(producto: { sku: string; name: string }) {
  const piezas = formaDe(producto.sku, producto.name);
  return saveModel(buildModelGLB({ piezas, nombre: producto.name }));
}
