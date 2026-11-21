// Encuadre de las tomas de un plato giratorio.
//
// El problema real de un 360 casero no es girar: es que el producto no se mueva
// ni cambie de tamano entre tomas. Si cada foto se recorta a su antojo, el giro
// "baila". Por eso cada toma se analiza por separado para hallar la silueta y
// despues se recorta TODAS con la misma ventana, la que abarca el producto en su
// posicion mas extrema. El tamano queda constante y el centro no se mueve.

export type Caja = { x0: number; y0: number; x1: number; y1: number };

/** Fondo estimado a partir del anillo exterior: mediana por canal. */
export function fondoBorde(data: Uint8Array | Buffer, w: number, h: number, ch: number): [number, number, number] {
  const borde = Math.max(1, Math.round(Math.min(w, h) * 0.03));
  const canales: number[][] = [[], [], []];
  const tomar = (x: number, y: number) => {
    const i = (y * w + x) * ch;
    canales[0].push(data[i]);
    canales[1].push(data[i + 1]);
    canales[2].push(data[i + 2]);
  };
  for (let y = 0; y < h; y++) {
    const enBorde = y < borde || y >= h - borde;
    if (enBorde) for (let x = 0; x < w; x++) tomar(x, y);
    else for (let x = 0; x < w; x += 1) if (x < borde || x >= w - borde) tomar(x, y);
  }
  const mediana = (v: number[]) => {
    v.sort((a, b) => a - b);
    return v[v.length >> 1] ?? 0;
  };
  return [mediana(canales[0]), mediana(canales[1]), mediana(canales[2])];
}

/**
 * Caja de la silueta (coordenadas normalizadas 0..1) o null si no se distingue
 * nada del fondo. Se queda con la mancha mas grande para no confundir sombras
 * sueltas o motas con el producto.
 */
export function cajaObjeto(data: Uint8Array | Buffer, w: number, h: number, ch: number): Caja | null {
  const [br, bg, bb] = fondoBorde(data, w, h, ch);

  // El umbral se adapta al ruido del propio fondo: se mira cuanto se separa el
  // anillo exterior de su mediana y se exige bastante mas que eso.
  let ruido = 0;
  const borde = Math.max(1, Math.round(Math.min(w, h) * 0.03));
  let n = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (x >= borde && x < w - borde && y >= borde && y < h - borde) continue;
      const i = (y * w + x) * ch;
      ruido += Math.abs(data[i] - br) + Math.abs(data[i + 1] - bg) + Math.abs(data[i + 2] - bb);
      n++;
    }
  }
  const umbral = Math.min(72, Math.max(26, (ruido / Math.max(1, n)) * 2.2 + 22));

  const mascara = new Uint8Array(w * h);
  for (let p = 0, i = 0; p < w * h; p++, i += ch) {
    const d = Math.abs(data[i] - br) + Math.abs(data[i + 1] - bg) + Math.abs(data[i + 2] - bb);
    if (d > umbral) mascara[p] = 1;
  }

  // Componentes conexas (4 vecinos): la mayor es el producto.
  const visto = new Uint8Array(w * h);
  const pila = new Int32Array(w * h);
  let mejor: { area: number; x0: number; y0: number; x1: number; y1: number } | null = null;
  for (let p = 0; p < w * h; p++) {
    if (!mascara[p] || visto[p]) continue;
    let tope = 0;
    pila[tope++] = p;
    visto[p] = 1;
    let area = 0;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    while (tope) {
      const q = pila[--tope];
      const x = q % w;
      const y = (q / w) | 0;
      area++;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      if (x > 0 && mascara[q - 1] && !visto[q - 1]) { visto[q - 1] = 1; pila[tope++] = q - 1; }
      if (x < w - 1 && mascara[q + 1] && !visto[q + 1]) { visto[q + 1] = 1; pila[tope++] = q + 1; }
      if (y > 0 && mascara[q - w] && !visto[q - w]) { visto[q - w] = 1; pila[tope++] = q - w; }
      if (y < h - 1 && mascara[q + w] && !visto[q + w]) { visto[q + w] = 1; pila[tope++] = q + w; }
    }
    if (!mejor || area > mejor.area) mejor = { area, x0, y0, x1, y1 };
  }
  if (!mejor) return null;
  // Menos del 0,3 % del lienzo es una mota, no el producto.
  if (mejor.area < w * h * 0.003) return null;
  return { x0: mejor.x0 / w, y0: mejor.y0 / h, x1: (mejor.x1 + 1) / w, y1: (mejor.y1 + 1) / h };
}

/**
 * Ventana cuadrada comun a todas las tomas, en PIXELES del lienzo de referencia.
 *
 * Se calcula en pixeles y no en proporciones porque un cuadrado en proporciones
 * no es un cuadrado en pixeles cuando la foto no es cuadrada: el producto
 * saldria estirado. `margen` es la holgura alrededor (0.12 = 12 %).
 */
export function cajaComun(cajas: Caja[], w: number, h: number, margen = 0.12): Caja {
  const validas = cajas.filter((c) => c.x1 > c.x0 && c.y1 > c.y0);
  if (!validas.length) {
    const lado = Math.min(w, h);
    return { x0: (w - lado) / 2, y0: (h - lado) / 2, x1: (w + lado) / 2, y1: (h + lado) / 2 };
  }
  const x0 = Math.min(...validas.map((c) => c.x0)) * w;
  const y0 = Math.min(...validas.map((c) => c.y0)) * h;
  const x1 = Math.max(...validas.map((c) => c.x1)) * w;
  const y1 = Math.max(...validas.map((c) => c.y1)) * h;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  // El lado nunca puede pasar del lienzo: si no, el recorte se sale.
  const lado = Math.min(Math.max(x1 - x0, y1 - y0) * (1 + margen * 2), Math.min(w, h));
  let lx0 = cx - lado / 2;
  let ly0 = cy - lado / 2;
  lx0 = Math.min(Math.max(0, lx0), w - lado);
  ly0 = Math.min(Math.max(0, ly0), h - lado);
  return { x0: lx0, y0: ly0, x1: lx0 + lado, y1: ly0 + lado };
}

/** Centro y area de una caja, para diagnosticar saltos entre tomas. */
export function centro(c: Caja) {
  return { x: (c.x0 + c.x1) / 2, y: (c.y0 + c.y1) / 2, area: (c.x1 - c.x0) * (c.y1 - c.y0) };
}

/** Orden natural: "foto2" antes que "foto10". */
export function ordenNatural(a: string, b: string): number {
  const trozos = (s: string) => s.toLowerCase().match(/\d+|\D+/g) ?? [];
  const ta = trozos(a);
  const tb = trozos(b);
  for (let i = 0; i < Math.min(ta.length, tb.length); i++) {
    const na = /^\d+$/.test(ta[i]);
    const nb = /^\d+$/.test(tb[i]);
    if (na && nb) {
      const d = parseInt(ta[i], 10) - parseInt(tb[i], 10);
      if (d) return d;
    } else if (ta[i] !== tb[i]) {
      return ta[i] < tb[i] ? -1 : 1;
    }
  }
  return ta.length - tb.length;
}
