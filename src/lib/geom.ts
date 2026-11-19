// Mallas paramétricas para los modelos 3D esquemáticos del catálogo.
// Convenio: los triángulos van en sentido antihorario vistos desde fuera, así que
// la normal de una cara es cross(b - a, c - a).

export type Vec3 = [number, number, number];
export type Geo = { pos: number[]; nrm: number[]; idx: number[] };
export type Mat4 = number[];

export const IDENT: Mat4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: Vec3): Vec3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const scl = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];

export function mul(a: Mat4, b: Mat4): Mat4 {
  const o: number[] = new Array(16).fill(0);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      o[c * 4 + r] = s;
    }
  return o;
}

export const translate = (x: number, y: number, z: number): Mat4 => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];
export const scale = (x: number, y = x, z = x): Mat4 => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1];
export const rotX = (a: number): Mat4 => {
  const c = Math.cos(a), s = Math.sin(a);
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1];
};
export const rotY = (a: number): Mat4 => {
  const c = Math.cos(a), s = Math.sin(a);
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
};
export const rotZ = (a: number): Mat4 => {
  const c = Math.cos(a), s = Math.sin(a);
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
};

const point = (m: Mat4, p: Vec3): Vec3 => [
  m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
  m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
  m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
];
const direction = (m: Mat4, p: Vec3): Vec3 => [
  m[0] * p[0] + m[4] * p[1] + m[8] * p[2],
  m[1] * p[0] + m[5] * p[1] + m[9] * p[2],
  m[2] * p[0] + m[6] * p[1] + m[10] * p[2],
];

export function xf(g: Geo, ...ms: Mat4[]): Geo {
  const m = ms.reduce((acc, x) => mul(acc, x), IDENT);
  const pos: number[] = [], nrm: number[] = [];
  for (let i = 0; i < g.pos.length; i += 3) {
    const p = point(m, [g.pos[i], g.pos[i + 1], g.pos[i + 2]]);
    pos.push(p[0], p[1], p[2]);
    const n = norm(direction(m, [g.nrm[i], g.nrm[i + 1], g.nrm[i + 2]]));
    nrm.push(n[0], n[1], n[2]);
  }
  return { pos, nrm, idx: g.idx.slice() };
}

// Descarta triángulos de area cero (tapas de radio 0): no se pintan y ensucian
// el recuento de caras.
export function sinDegenerados(g: Geo): Geo {
  const idx: number[] = [];
  for (let i = 0; i < g.idx.length; i += 3) {
    const a = g.idx[i] * 3, b = g.idx[i + 1] * 3, c = g.idx[i + 2] * 3;
    const u: Vec3 = [g.pos[b] - g.pos[a], g.pos[b + 1] - g.pos[a + 1], g.pos[b + 2] - g.pos[a + 2]];
    const v: Vec3 = [g.pos[c] - g.pos[a], g.pos[c + 1] - g.pos[a + 1], g.pos[c + 2] - g.pos[a + 2]];
    if (len(cross(u, v)) > 1e-12) idx.push(g.idx[i], g.idx[i + 1], g.idx[i + 2]);
  }
  return { pos: g.pos, nrm: g.nrm, idx };
}

export function merge(...gs: (Geo | null | undefined)[]): Geo {
  const out: Geo = { pos: [], nrm: [], idx: [] };
  let base = 0;
  for (const g of gs) {
    if (!g) continue;
    out.pos.push(...g.pos);
    out.nrm.push(...g.nrm);
    for (const i of g.idx) out.idx.push(i + base);
    base += g.pos.length / 3;
  }
  return out;
}

export function bbox(g: Geo) {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < g.pos.length; i += 3)
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], g.pos[i + k]);
      max[k] = Math.max(max[k], g.pos[i + k]);
    }
  return { min, max, size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]] as Vec3 };
}

export function fit(g: Geo, target = 1): Geo {
  const { min, max, size } = bbox(g);
  const k = target / Math.max(size[0], size[1], size[2], 1e-6);
  const c: Vec3 = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
  return xf(g, translate(-c[0], -c[1], -c[2]), scale(k));
}

// Normales suavizadas por vértice, derivadas del sentido de giro.
export function computeNormals(g: Geo): Geo {
  const nrm = new Array(g.pos.length).fill(0);
  for (let i = 0; i < g.idx.length; i += 3) {
    const a = g.idx[i] * 3, b = g.idx[i + 1] * 3, c = g.idx[i + 2] * 3;
    const f = cross(
      [g.pos[b] - g.pos[a], g.pos[b + 1] - g.pos[a + 1], g.pos[b + 2] - g.pos[a + 2]],
      [g.pos[c] - g.pos[a], g.pos[c + 1] - g.pos[a + 1], g.pos[c + 2] - g.pos[a + 2]],
    );
    for (const k of [a, b, c]) {
      nrm[k] += f[0];
      nrm[k + 1] += f[1];
      nrm[k + 2] += f[2];
    }
  }
  for (let i = 0; i < nrm.length; i += 3) {
    const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]) || 1;
    nrm[i] /= l;
    nrm[i + 1] /= l;
    nrm[i + 2] /= l;
  }
  return { pos: g.pos, nrm, idx: g.idx };
}

// Normal plana deducida del sentido de giro de los cuatro vértices.
const quadAuto = (a: Vec3, b: Vec3, c: Vec3, d: Vec3): Geo => {
  const n = norm(cross(sub(b, a), sub(c, a)));
  return { pos: [...a, ...b, ...c, ...d], nrm: [...n, ...n, ...n, ...n], idx: [0, 1, 2, 0, 2, 3] };
};

export function box(w: number, h: number, d: number): Geo {
  const x = w / 2, y = h / 2, z = d / 2;
  return merge(
    quadAuto([-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]),
    quadAuto([x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]),
    quadAuto([x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z]),
    quadAuto([-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z]),
    quadAuto([-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]),
    quadAuto([-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z]),
  );
}

// Caja con aristas biseladas: tres cajas cruzadas.
export function boxBisel(w: number, h: number, d: number, c = 0.03): Geo {
  const k = Math.min(c, w / 3, h / 3, d / 3);
  return merge(box(w - 2 * k, h, d), box(w, h - 2 * k, d), box(w, h, d - 2 * k));
}

export function cylinderY(r: number, h: number, seg = 28, caps = true): Geo {
  const pos: number[] = [], nrm: number[] = [], idx: number[] = [];
  const hy = h / 2;
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2, cx = Math.cos(a), sz = Math.sin(a);
    pos.push(r * cx, -hy, r * sz); nrm.push(cx, 0, sz);
    pos.push(r * cx, hy, r * sz); nrm.push(cx, 0, sz);
  }
  for (let i = 0; i < seg; i++) {
    const v0 = i * 2;
    idx.push(v0, v0 + 1, v0 + 3, v0, v0 + 3, v0 + 2);
  }
  if (caps) {
    const top = pos.length / 3;
    pos.push(0, hy, 0); nrm.push(0, 1, 0);
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      pos.push(Math.cos(a) * r, hy, Math.sin(a) * r); nrm.push(0, 1, 0);
    }
    for (let i = 0; i < seg; i++) idx.push(top, top + 2 + i, top + 1 + i);
    const bot = pos.length / 3;
    pos.push(0, -hy, 0); nrm.push(0, -1, 0);
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * Math.PI * 2;
      pos.push(Math.cos(a) * r, -hy, Math.sin(a) * r); nrm.push(0, -1, 0);
    }
    for (let i = 0; i < seg; i++) idx.push(bot, bot + 1 + i, bot + 2 + i);
  }
  return { pos, nrm, idx };
}

export function coneY(r0: number, r1: number, h: number, seg = 28, caps = true): Geo {
  const pos: number[] = [], nrm: number[] = [], idx: number[] = [];
  const hy = h / 2, slope = (r0 - r1) / h;
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2, cx = Math.cos(a), sz = Math.sin(a);
    const n = norm([cx, slope, sz]);
    pos.push(r0 * cx, -hy, r0 * sz); nrm.push(n[0], n[1], n[2]);
    pos.push(r1 * cx, hy, r1 * sz); nrm.push(n[0], n[1], n[2]);
  }
  for (let i = 0; i < seg; i++) {
    const v0 = i * 2;
    idx.push(v0, v0 + 1, v0 + 3, v0, v0 + 3, v0 + 2);
  }
  if (caps) {
    if (r0 > 1e-6) {
      const bot = pos.length / 3;
      pos.push(0, -hy, 0); nrm.push(0, -1, 0);
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        pos.push(Math.cos(a) * r0, -hy, Math.sin(a) * r0); nrm.push(0, -1, 0);
      }
      for (let i = 0; i < seg; i++) idx.push(bot, bot + 1 + i, bot + 2 + i);
    }
    if (r1 > 1e-6) {
      const top = pos.length / 3;
      pos.push(0, hy, 0); nrm.push(0, 1, 0);
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        pos.push(Math.cos(a) * r1, hy, Math.sin(a) * r1); nrm.push(0, 1, 0);
      }
      for (let i = 0; i < seg; i++) idx.push(top, top + 2 + i, top + 1 + i);
    }
  }
  return { pos, nrm, idx };
}

export function sphere(r: number, segU = 28, segV = 18): Geo {
  const pos: number[] = [], nrm: number[] = [], idx: number[] = [];
  for (let j = 0; j <= segV; j++) {
    const v = (j / segV) * Math.PI, cy = Math.cos(v), sr = Math.sin(v);
    for (let i = 0; i <= segU; i++) {
      const u = (i / segU) * Math.PI * 2;
      const n: Vec3 = [sr * Math.cos(u), cy, sr * Math.sin(u)];
      pos.push(n[0] * r, n[1] * r, n[2] * r);
      nrm.push(n[0], n[1], n[2]);
    }
  }
  for (let j = 0; j < segV; j++)
    for (let i = 0; i < segU; i++) {
      const a = j * (segU + 1) + i, b = a + segU + 1;
      idx.push(a, b + 1, b, a, a + 1, b + 1);
    }
  return { pos, nrm, idx };
}

export function torusY(R: number, r: number, segU = 40, segV = 16): Geo {
  const pos: number[] = [], nrm: number[] = [], idx: number[] = [];
  for (let i = 0; i <= segU; i++) {
    const u = (i / segU) * Math.PI * 2, cu = Math.cos(u), su = Math.sin(u);
    for (let j = 0; j <= segV; j++) {
      const v = (j / segV) * Math.PI * 2, cv = Math.cos(v), sv = Math.sin(v);
      pos.push((R + r * cv) * cu, r * sv, (R + r * cv) * su);
      nrm.push(cv * cu, sv, cv * su);
    }
  }
  for (let i = 0; i < segU; i++)
    for (let j = 0; j < segV; j++) {
      const a = i * (segV + 1) + j, b = a + segV + 1;
      idx.push(a, b + 1, b, a, a + 1, b + 1);
    }
  return { pos, nrm, idx };
}

export function prismY(r: number, h: number, sides = 6): Geo {
  const pos: number[] = [], nrm: number[] = [], idx: number[] = [];
  const hy = h / 2;
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2, b = ((i + 1) / sides) * Math.PI * 2;
    const p0: Vec3 = [Math.cos(a) * r, -hy, Math.sin(a) * r];
    const p1: Vec3 = [Math.cos(b) * r, -hy, Math.sin(b) * r];
    const p2: Vec3 = [p1[0], hy, p1[2]];
    const p3: Vec3 = [p0[0], hy, p0[2]];
    const n = norm(cross(sub(p1, p0), sub(p3, p0)));
    const base = pos.length / 3;
    pos.push(...p0, ...p1, ...p2, ...p3);
    for (let k = 0; k < 4; k++) nrm.push(n[0], n[1], n[2]);
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  for (const y of [hy, -hy]) {
    const c = pos.length / 3;
    pos.push(0, y, 0); nrm.push(0, y > 0 ? 1 : -1, 0);
    for (let i = 0; i <= sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      pos.push(Math.cos(a) * r, y, Math.sin(a) * r); nrm.push(0, y > 0 ? 1 : -1, 0);
    }
    for (let i = 0; i < sides; i++) {
      if (y > 0) idx.push(c, c + 2 + i, c + 1 + i);
      else idx.push(c, c + 1 + i, c + 2 + i);
    }
  }
  return { pos, nrm, idx };
}

// Perfil 2D (radio, altura) girado alrededor del eje Y.
export function revolveY(profile: [number, number][], seg = 40): Geo {
  const pos: number[] = [], idx: number[] = [];
  const rings = profile.length;
  for (let i = 0; i <= seg; i++) {
    const a = (i / seg) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    for (let j = 0; j < rings; j++) {
      const [r, y] = profile[j];
      pos.push(r * ca, y, r * sa);
    }
  }
  for (let i = 0; i < seg; i++)
    for (let j = 0; j < rings - 1; j++) {
      const a = i * rings + j, b = a + rings;
      idx.push(a, b + 1, b, a, a + 1, b + 1);
    }
  return computeNormals({ pos, nrm: new Array(pos.length).fill(0), idx });
}

export const circleSection = (r: number, seg = 14): [number, number][] =>
  Array.from({ length: seg }, (_, i) => {
    const a = (i / seg) * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
  });

export const rectSection = (w: number, h: number): [number, number][] => [
  [-w / 2, -h / 2],
  [w / 2, -h / 2],
  [w / 2, h / 2],
  [-w / 2, h / 2],
];

const perp = (t: Vec3): Vec3 => norm(cross(Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], t));

// Barre una sección 2D cerrada a lo largo de una polilínea 3D.
export function sweepAlong(pts: Vec3[], section: [number, number][], opts: { capEnds?: boolean } = {}): Geo {
  const { capEnds = true } = opts;
  const n = pts.length, m = section.length;
  const tangents: Vec3[] = pts.map((_, i) => norm(sub(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)])));
  const N: Vec3[] = [perp(tangents[0])];
  for (let i = 1; i < n; i++) {
    const t = tangents[i];
    N.push(norm(sub(N[i - 1], scl(t, dot(N[i - 1], t)))));
  }
  const B = N.map((nn, i) => norm(cross(tangents[i], nn)));
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i < n; i++)
    for (let j = 0; j < m; j++) {
      const [sx, sy] = section[j];
      pos.push(
        pts[i][0] + N[i][0] * sx + B[i][0] * sy,
        pts[i][1] + N[i][1] * sx + B[i][1] * sy,
        pts[i][2] + N[i][2] * sx + B[i][2] * sy,
      );
    }
  for (let i = 0; i < n - 1; i++)
    for (let j = 0; j < m; j++) {
      const j2 = (j + 1) % m;
      const a = i * m + j, b = i * m + j2, c = (i + 1) * m + j2, d = (i + 1) * m + j;
      idx.push(a, b, c, a, c, d);
    }
  if (capEnds) {
    for (const i of [0, n - 1]) {
      const c0 = pos.length / 3;
      pos.push(...pts[i]);
      for (let j = 0; j < m; j++) {
        const k = (i * m + j) * 3;
        pos.push(pos[k], pos[k + 1], pos[k + 2]);
      }
      for (let j = 0; j < m; j++) {
        const j2 = (j + 1) % m;
        idx.push(c0, c0 + 1 + j, c0 + 1 + j2);
      }
    }
  }
  return computeNormals({ pos, nrm: new Array(pos.length).fill(0), idx });
}

export const tube = (pts: Vec3[], r: number, seg = 14): Geo => sweepAlong(pts, circleSection(r, seg));

// Muelle helicoidal de eje Y.
export function spring(R: number, wire: number, turns: number, height: number, perTurn = 30, seg = 10): Geo {
  const n = Math.max(10, Math.round(turns * perTurn));
  const pts: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = t * turns * Math.PI * 2;
    pts.push([Math.cos(a) * R, -height / 2 + t * height, Math.sin(a) * R]);
  }
  return tube(pts, wire, seg);
}

// Placa curvada en el plano XY: paragolpes, zapatas, ballestas.
export function arcPlate(radius: number, thickness: number, width: number, arcDeg: number, seg = 26): Geo {
  const half = ((arcDeg * Math.PI) / 180) / 2;
  const rIn = radius - thickness / 2, rOut = radius + thickness / 2, hz = width / 2;
  const pos: number[] = [], idx: number[] = [];
  const ring = (a: number) => {
    const ca = Math.cos(a), sa = Math.sin(a);
    return {
      i0: [rIn * ca, rIn * sa, -hz] as Vec3,
      i1: [rIn * ca, rIn * sa, hz] as Vec3,
      o0: [rOut * ca, rOut * sa, -hz] as Vec3,
      o1: [rOut * ca, rOut * sa, hz] as Vec3,
    };
  };
  const quad4 = (a: Vec3, b: Vec3, c: Vec3, d: Vec3) => {
    const base = pos.length / 3;
    pos.push(...a, ...b, ...c, ...d);
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  for (let i = 0; i < seg; i++) {
    const A = ring(-half + (i / seg) * 2 * half), B = ring(-half + ((i + 1) / seg) * 2 * half);
    quad4(A.o0, B.o0, B.o1, A.o1);
    quad4(A.i0, A.i1, B.i1, B.i0);
    quad4(A.i0, B.i0, B.o0, A.o0);
    quad4(A.i1, A.o1, B.o1, B.i1);
  }
  const S = ring(-half), E = ring(half);
  quad4(S.i0, S.i1, S.o1, S.o0);
  quad4(E.i0, E.o0, E.o1, E.i1);
  return computeNormals({ pos, nrm: new Array(pos.length).fill(0), idx });
}

// Corona plana con espesor: disco, aro, arandela.
export const annulusY = (rIn: number, rOut: number, h: number, seg = 44): Geo =>
  revolveY([[rIn, -h / 2], [rOut, -h / 2], [rOut, h / 2], [rIn, h / 2], [rIn, -h / 2]], seg);

// Engranaje: cilindro con dientes alrededor.
export function gearY(r: number, h: number, teeth: number, toothH = 0.018): Geo {
  const parts: Geo[] = [cylinderY(r, h, Math.max(24, teeth * 2))];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    parts.push(xf(box(toothH, h, toothH * 1.6), rotY(a), translate(r + toothH * 0.4, 0, 0)));
  }
  return merge(...parts);
}

export const cylinderX = (r: number, h: number, seg = 32): Geo => xf(cylinderY(r, h, seg), rotZ(Math.PI / 2));
export const cylinderZ = (r: number, h: number, seg = 32): Geo => xf(cylinderY(r, h, seg), rotX(Math.PI / 2));
export const torusX = (R: number, r: number, su = 44, sv = 18): Geo => xf(torusY(R, r, su, sv), rotZ(Math.PI / 2));
export const annulusX = (ri: number, ro: number, h: number, seg = 48): Geo => xf(annulusY(ri, ro, h, seg), rotZ(Math.PI / 2));
export const prismX = (r: number, h: number, sides = 6): Geo => xf(prismY(r, h, sides), rotZ(Math.PI / 2));
export const sphereAt = (p: Vec3, r: number): Geo => xf(sphere(r), translate(p[0], p[1], p[2]));
export const boxAt = (p: Vec3, w: number, h: number, d: number): Geo =>
  xf(box(w, h, d), translate(p[0], p[1], p[2]));
