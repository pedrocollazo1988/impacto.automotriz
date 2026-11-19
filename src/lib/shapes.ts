// Formas esquemáticas por tipo de pieza. Cada función devuelve las piezas con su
// color y material; `normalizar` las centra y escala al final.

import {
  annulusX, annulusY, arcPlate, box, boxAt, boxBisel, coneY, cylinderX, cylinderY, cylinderZ,
  gearY, merge, prismY, revolveY, rotX, rotY, rotZ, scale, sphere, spring, sweepAlong, torusX,
  torusY, translate, xf, bbox, type Geo, type Vec3,
} from "./geom";
import type { Pieza } from "./glb";

type C = [number, number, number];
const STEEL: C = [0.66, 0.69, 0.74];
const DARK: C = [0.24, 0.26, 0.30];
const CAST: C = [0.40, 0.42, 0.45];
const RUBBER: C = [0.075, 0.078, 0.09];
const NAVY: C = [0.09, 0.20, 0.40];
const VOLT: C = [0.78, 0.92, 0.20];
const PLASTIC: C = [0.13, 0.14, 0.16];
const COPPER: C = [0.72, 0.45, 0.20];
const CERAMIC: C = [0.93, 0.93, 0.91];
const GLASS: C = [0.70, 0.82, 0.90];
const RED: C = [0.68, 0.12, 0.12];
const AMBER: C = [0.95, 0.62, 0.12];
const CHROME: C = [0.86, 0.88, 0.91];

const pieza = (geo: Geo, color: C, nombre: string, metalico = 0.5, rugosidad = 0.45): Pieza => ({
  geo, color, nombre, metalico, rugosidad,
});

export function normalizar(ps: Pieza[], target = 1): Pieza[] {
  const all = merge(...ps.map((p) => p.geo));
  const b = bbox(all);
  const k = target / Math.max(b.size[0], b.size[1], b.size[2], 1e-6);
  const c: Vec3 = [(b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2];
  return ps.map((p) => ({ ...p, geo: xf(p.geo, translate(-c[0], -c[1], -c[2]), scale(k)) }));
}

// ───────────── Eléctrico ─────────────

const bateria = (): Pieza[] => {
  const w = 0.5, h = 0.34, d = 0.30;
  return [
    pieza(boxBisel(w, h, d, 0.03), PLASTIC, "Carcasa"),
    pieza(box(w * 0.92, h * 0.16, d * 0.98), [0.20, 0.32, 0.55], "Etiqueta"),
    pieza(merge(
      xf(cylinderY(0.035, 0.07, 16), translate(-0.16, h / 2 + 0.03, 0.07)),
      xf(cylinderY(0.035, 0.07, 16), translate(0.16, h / 2 + 0.03, -0.07)),
    ), CHROME, "Bornes", 0.9, 0.3),
    pieza(box(w * 0.9, 0.02, 0.02), DARK, "Asa"),
  ];
};

const alternador = (): Pieza[] => [
  pieza(cylinderX(0.20, 0.34, 32), STEEL, "Cuerpo", 0.85, 0.35),
  pieza(xf(cylinderX(0.11, 0.06, 28), translate(0.20, 0, 0)), DARK, "Polea", 0.7, 0.4),
  pieza(merge(...Array.from({ length: 12 }, (_, i) =>
    xf(box(0.02, 0.15, 0.02), rotX((i / 12) * Math.PI * 2), translate(-0.16, 0, 0)))), DARK, "Ventilador"),
  pieza(boxAt([0.02, 0.20, 0], 0.10, 0.14, 0.10), STEEL, "Soporte"),
  pieza(xf(cylinderY(0.03, 0.12, 12), translate(0.10, 0.24, 0)), COPPER, "Borne B+", 0.9, 0.3),
];

const motorArranque = (): Pieza[] => [
  pieza(cylinderX(0.14, 0.30, 30), DARK, "Cuerpo", 0.8, 0.4),
  pieza(xf(gearY(0.075, 0.05, 9), rotZ(Math.PI / 2), translate(0.19, 0, 0)), STEEL, "Piñón", 0.9, 0.3),
  pieza(xf(coneY(0.14, 0.09, 0.10, 30), rotZ(-Math.PI / 2), translate(-0.20, 0, 0)), CAST, "Tapa"),
  pieza(boxAt([0, 0.16, 0], 0.06, 0.10, 0.06), STEEL, "Soporte"),
  pieza(xf(cylinderY(0.022, 0.10, 10), translate(0.05, 0.19, 0)), COPPER, "Borne", 0.9, 0.3),
];

const bujia = (): Pieza[] => [
  pieza(xf(cylinderY(0.055, 0.20, 20), translate(0, 0.12, 0)), CHROME, "Cuerpo", 0.9, 0.25),
  pieza(xf(prismY(0.075, 0.06, 6), translate(0, -0.01, 0)), STEEL, "Hexágono"),
  pieza(merge(
    ...Array.from({ length: 7 }, (_, i) => xf(torusY(0.048, 0.007, 22, 8), translate(0, -0.20 + i * 0.022, 0))),
    xf(cylinderY(0.045, 0.16, 20), translate(0, -0.20, 0)),
  ), STEEL, "Rosca", 0.9, 0.35),
  pieza(xf(cylinderY(0.030, 0.10, 16), translate(0, 0.26, 0)), CERAMIC, "Aislador", 0.1, 0.35),
  pieza(xf(cylinderY(0.018, 0.05, 12), translate(0, 0.32, 0)), CHROME, "Terminal", 0.95, 0.2),
];

const motorElectrico = (): Pieza[] => [
  pieza(merge(
    cylinderX(0.26, 0.20, 40),
    ...Array.from({ length: 20 }, (_, i) => xf(box(0.19, 0.035, 0.28), rotX((i / 20) * Math.PI * 2))),
  ), DARK, "Estator", 0.75, 0.4),
  pieza(xf(cylinderX(0.10, 0.26, 28), translate(0.04, 0, 0)), STEEL, "Rotor", 0.9, 0.3),
  pieza(xf(cylinderX(0.05, 0.10, 20), translate(0.22, 0, 0)), CHROME, "Eje", 0.95, 0.2),
  pieza(xf(cylinderX(0.24, 0.03, 36), translate(-0.12, 0, 0)), CAST, "Tapa"),
  pieza(merge(...[0, 1, 2].map((i) =>
    xf(cylinderY(0.012, 0.12, 10), translate(-0.05 + i * 0.05, 0.26, 0.10)))), COPPER, "Fases", 0.9, 0.3),
];

const controlador = (): Pieza[] => [
  pieza(boxBisel(0.36, 0.16, 0.24, 0.02), [0.16, 0.18, 0.22], "Carcasa", 0.6, 0.45),
  pieza(merge(...Array.from({ length: 9 }, (_, i) =>
    xf(box(0.34, 0.035, 0.012), translate(0, 0.10, -0.10 + i * 0.025)))), STEEL, "Disipador", 0.85, 0.35),
  pieza(boxAt([0, 0.03, 0.13], 0.16, 0.05, 0.03), PLASTIC, "Conector"),
  pieza(merge(...[0, 1, 2].map((i) =>
    xf(cylinderY(0.010, 0.08, 8), translate(-0.10 + i * 0.10, -0.10, 0.12)))), COPPER, "Fases", 0.9, 0.3),
];

const convertidor = (): Pieza[] => [
  pieza(boxBisel(0.30, 0.12, 0.20, 0.02), [0.14, 0.16, 0.20], "Carcasa", 0.5, 0.5),
  pieza(merge(...Array.from({ length: 7 }, (_, i) =>
    xf(box(0.28, 0.028, 0.010), translate(0, 0.075, -0.07 + i * 0.022)))), STEEL, "Aletas", 0.85, 0.35),
  pieza(merge(
    xf(cylinderY(0.012, 0.06, 8), translate(-0.09, -0.06, 0.09)),
    xf(cylinderY(0.012, 0.06, 8), translate(0.09, -0.06, 0.09)),
  ), RED, "Entrada 72V"),
  pieza(boxAt([0, -0.06, 0.10], 0.10, 0.04, 0.03), PLASTIC, "Salida 12V"),
];

const bancoBaterias = (): Pieza[] => {
  const celdas: Geo[] = [];
  for (let i = 0; i < 6; i++) {
    const x = -0.24 + (i % 3) * 0.24;
    const z = i < 3 ? -0.14 : 0.14;
    celdas.push(xf(box(0.20, 0.30, 0.22), translate(x, 0, z)));
  }
  return [
    pieza(merge(...celdas), PLASTIC, "Celdas 12V"),
    pieza(merge(...Array.from({ length: 4 }, (_, i) =>
      xf(box(0.05, 0.02, 0.05), translate(-0.12 + i * 0.08, 0.16, i < 2 ? -0.02 : 0.02)))), COPPER, "Puentes", 0.9, 0.3),
    pieza(box(0.72, 0.03, 0.42), DARK, "Bandeja"),
    pieza(merge(...Array.from({ length: 4 }, (_, i) =>
      xf(cylinderY(0.010, 0.34, 8), translate(-0.30 + i * 0.20, 0, i % 2 ? -0.20 : 0.20)))), STEEL, "Varillas"),
  ];
};

const cargador = (): Pieza[] => [
  pieza(boxBisel(0.26, 0.14, 0.20, 0.02), [0.18, 0.20, 0.24], "Carcasa", 0.5, 0.5),
  pieza(merge(...Array.from({ length: 6 }, (_, i) =>
    xf(box(0.24, 0.030, 0.010), translate(0, 0.085, -0.06 + i * 0.024)))), STEEL, "Aletas", 0.85, 0.35),
  pieza(xf(cylinderY(0.014, 0.30, 10), rotZ(0.6), translate(0.20, 0.05, 0.05)), RUBBER, "Cable"),
  pieza(boxAt([-0.10, 0.0, 0.11], 0.07, 0.05, 0.03), PLASTIC, "LED"),
  pieza(boxAt([0.0, -0.075, 0.0], 0.10, 0.02, 0.10), DARK, "Base"),
];

const extensor = (): Pieza[] => [
  pieza(boxBisel(0.34, 0.24, 0.26, 0.03), [0.30, 0.32, 0.35], "Bloque", 0.6, 0.5),
  pieza(xf(cylinderY(0.075, 0.22, 24), rotZ(Math.PI / 2), translate(0.06, 0.16, 0)), STEEL, "Cilindro", 0.8, 0.35),
  pieza(xf(cylinderY(0.055, 0.06, 20), rotZ(Math.PI / 2), translate(-0.12, 0.16, 0)), DARK, "Culata"),
  pieza(xf(torusY(0.09, 0.012, 30, 8), rotZ(Math.PI / 2), translate(0.18, 0.16, 0)), CHROME, "Escape", 0.9, 0.3),
  pieza(boxAt([0, -0.14, 0], 0.30, 0.06, 0.22), DARK, "Cárter"),
];

// ───────────── Frenos ─────────────

const disco = (): Pieza[] => [
  pieza(merge(
    annulusX(0.16, 0.34, 0.035, 64),
    xf(cylinderX(0.14, 0.10, 36), translate(0.05, 0, 0)),
  ), STEEL, "Disco", 0.92, 0.28),
  pieza(merge(...Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    return xf(cylinderX(0.016, 0.05, 10), translate(0, Math.cos(a) * 0.26, Math.sin(a) * 0.26));
  })), [0.30, 0.30, 0.33], "Ventilación", 0.6, 0.6),
  pieza(xf(annulusX(0.06, 0.13, 0.02, 32), translate(0.10, 0, 0)), DARK, "Brida"),
];

const pastillas = (): Pieza[] => {
  const una = (dx: number) => merge(
    xf(box(0.30, 0.10, 0.04), translate(dx, 0.04, 0)),
    xf(box(0.26, 0.03, 0.035), translate(dx, -0.02, 0)),
  );
  return [
    pieza(merge(una(-0.19), una(0.19)), [0.32, 0.30, 0.28], "Fricción", 0.2, 0.85),
    pieza(merge(
      xf(box(0.31, 0.09, 0.025), translate(-0.19, 0.11, 0)),
      xf(box(0.31, 0.09, 0.025), translate(0.19, 0.11, 0)),
    ), STEEL, "Placa", 0.9, 0.3),
  ];
};

const zapatas = (): Pieza[] => [
  pieza(merge(
    arcPlate(0.20, 0.035, 0.10, 150, 30),
    xf(arcPlate(0.20, 0.035, 0.10, 150, 30), rotY(Math.PI)),
  ), [0.34, 0.30, 0.26], "Zapatas", 0.2, 0.85),
  pieza(merge(
    arcPlate(0.235, 0.02, 0.09, 150, 30),
    xf(arcPlate(0.235, 0.02, 0.09, 150, 30), rotY(Math.PI)),
  ), STEEL, "Soporte", 0.9, 0.3),
  pieza(xf(cylinderY(0.035, 0.22, 18), rotZ(Math.PI / 2)), CHROME, "Perno", 0.95, 0.2),
  pieza(merge(
    xf(spring(0.05, 0.008, 4, 0.10), translate(-0.10, 0, 0.16)),
    xf(spring(0.05, 0.008, 4, 0.10), translate(0.10, 0, 0.16)),
  ), STEEL, "Resortes"),
];

const botella = (): Pieza[] => [
  pieza(revolveY([
    [0.00, -0.26], [0.13, -0.26], [0.14, -0.22], [0.14, 0.02], [0.12, 0.08],
    [0.06, 0.13], [0.055, 0.18], [0.055, 0.24], [0.00, 0.24],
  ], 36), [0.86, 0.72, 0.16], "Envase", 0.1, 0.25),
  pieza(xf(cylinderY(0.062, 0.04, 20), translate(0, 0.26, 0)), RED, "Tapón", 0.2, 0.5),
  pieza(xf(cylinderY(0.145, 0.14, 32), translate(0, -0.16, 0)), [0.92, 0.92, 0.90], "Etiqueta", 0.05, 0.7),
];

// ───────────── Filtros ─────────────

const filtroAceite = (): Pieza[] => [
  pieza(cylinderY(0.16, 0.26, 36), [0.14, 0.30, 0.55], "Carcasa", 0.6, 0.35),
  pieza(xf(cylinderY(0.155, 0.02, 36), translate(0, 0.13, 0)), DARK, "Tapa"),
  pieza(xf(torusY(0.145, 0.012, 36, 10), translate(0, -0.11, 0)), RUBBER, "Junta"),
  pieza(merge(...Array.from({ length: 8 }, (_, i) =>
    xf(box(0.02, 0.012, 0.30), rotY((i / 8) * Math.PI)))), [0.30, 0.32, 0.36], "Nervios"),
  pieza(xf(cylinderY(0.055, 0.05, 20), translate(0, -0.15, 0)), STEEL, "Rosca", 0.9, 0.3),
];

const filtroAire = (): Pieza[] => [
  pieza(merge(...Array.from({ length: 26 }, (_, i) =>
    xf(box(0.012, 0.20, 0.30), translate(-0.17 + i * 0.0135, 0, 0)))), [0.90, 0.88, 0.82], "Papel filtrante", 0.05, 0.9),
  pieza(merge(box(0.36, 0.03, 0.32), xf(box(0.36, 0.03, 0.32), translate(0, 0.22, 0))), RUBBER, "Marcos"),
  pieza(xf(box(0.36, 0.02, 0.30), translate(0, 0.10, 0)), STEEL, "Rejilla", 0.9, 0.35),
];

const filtroCombustible = (): Pieza[] => [
  pieza(cylinderY(0.10, 0.28, 30), CHROME, "Cuerpo", 0.9, 0.25),
  pieza(merge(
    xf(coneY(0.10, 0.05, 0.06, 30), translate(0, 0.17, 0)),
    xf(coneY(0.05, 0.10, 0.06, 30), translate(0, -0.17, 0)),
  ), STEEL, "Boquillas"),
  pieza(xf(cylinderY(0.02, 0.10, 12), translate(0, 0.24, 0)), RUBBER, "Manguito"),
  pieza(xf(annulusY(0.085, 0.10, 0.02, 30), translate(0, 0.08, 0)), RED, "Junta"),
];

// ───────────── Suspensión ─────────────

const amortiguador = (): Pieza[] => [
  pieza(merge(
    cylinderY(0.075, 0.34, 28),
    xf(cylinderY(0.055, 0.05, 20), translate(0, 0.19, 0)),
  ), DARK, "Cuerpo", 0.8, 0.35),
  pieza(xf(cylinderY(0.032, 0.26, 20), translate(0, 0.30, 0)), CHROME, "Vástago", 0.95, 0.15),
  pieza(xf(spring(0.10, 0.014, 6, 0.34), translate(0, 0.02, 0)), [0.55, 0.16, 0.14], "Muelle", 0.7, 0.4),
  pieza(merge(
    xf(annulusY(0.06, 0.13, 0.03, 28), translate(0, 0.19, 0)),
    xf(annulusY(0.06, 0.13, 0.03, 28), translate(0, -0.15, 0)),
  ), STEEL, "Platos"),
  pieza(xf(annulusY(0.03, 0.075, 0.035, 22), translate(0, -0.20, 0)), DARK, "Ojo inferior"),
];

const amortiguadorPar = (): Pieza[] => {
  const base = amortiguador();
  return [-0.12, 0.12].flatMap((dx) =>
    base.map((p) => ({ ...p, geo: xf(p.geo, translate(dx, 0, 0)) })));
};

const rotula = (): Pieza[] => [
  pieza(sphere(0.115, 30, 20), CHROME, "Rótula", 0.95, 0.2),
  pieza(xf(cylinderY(0.13, 0.13, 30), translate(0, 0.13, 0)), DARK, "Cápsula"),
  pieza(xf(cylinderY(0.045, 0.30, 18), translate(0, 0.32, 0)), STEEL, "Vástago", 0.9, 0.3),
  pieza(xf(cylinderY(0.07, 0.06, 20), translate(0, 0.46, 0)), STEEL, "Tuerca", 0.85, 0.35),
  pieza(xf(coneY(0.055, 0.075, 0.10, 20), translate(0, 0.50, 0)), STEEL, "Espárrago"),
  pieza(xf(box(0.16, 0.05, 0.16), translate(0, 0.20, 0)), STEEL, "Soporte"),
];

const ballesta = (): Pieza[] => [
  pieza(merge(...Array.from({ length: 5 }, (_, i) =>
    xf(arcPlate(1.6, 0.022, 0.13, 34, 24), translate(0, 0.075 - i * 0.035, 0), scale((0.95 - i * 0.13) / 0.95, 1, 1)))), [0.34, 0.35, 0.38], "Hojas", 0.85, 0.4),
  pieza(xf(cylinderY(0.035, 0.20, 16), rotX(Math.PI / 2), translate(0, 0.09, 0)), STEEL, "Abrazadera"),
  pieza(merge(
    xf(annulusY(0.05, 0.10, 0.04, 24), translate(-0.40, 0.05, 0)),
    xf(annulusY(0.05, 0.10, 0.04, 24), translate(0.40, 0.05, 0)),
  ), DARK, "Ojos"),
  pieza(merge(
    xf(cylinderY(0.014, 0.16, 10), translate(0, 0.16, -0.09)),
    xf(cylinderY(0.014, 0.16, 10), translate(0, 0.16, 0.09)),
  ), STEEL, "Pernos"),
];

const horquilla = (): Pieza[] => [
  pieza(merge(
    ...[-0.16, 0.16].flatMap((dx) => [
      xf(cylinderY(0.055, 0.55, 24), translate(dx, 0.10, 0)),
      xf(cylinderY(0.042, 0.40, 20), translate(dx, 0.30, 0)),
    ]),
  ), CHROME, "Barras", 0.95, 0.18),
  pieza(merge(
    xf(cylinderY(0.075, 0.16, 24), translate(-0.16, -0.13, 0)),
    xf(cylinderY(0.075, 0.16, 24), translate(0.16, -0.13, 0)),
  ), DARK, "Guardapolvos"),
  pieza(xf(box(0.44, 0.06, 0.12), translate(0, 0.42, 0)), DARK, "Tija"),
  pieza(xf(box(0.40, 0.05, 0.08), translate(0, 0.50, 0)), STEEL, "Manillar"),
  pieza(merge(
    xf(spring(0.06, 0.010, 5, 0.30), translate(-0.16, 0.16, 0)),
    xf(spring(0.06, 0.010, 5, 0.30), translate(0.16, 0.16, 0)),
  ), [0.60, 0.60, 0.62], "Muelles"),
];

// ───────────── Ruedas ─────────────

const neumatico = (): Pieza[] => [
  pieza(torusX(0.34, 0.135, 48, 20), RUBBER, "Cubierta", 0.02, 0.95),
  pieza(merge(...Array.from({ length: 40 }, (_, i) => {
    const a = (i / 40) * Math.PI * 2;
    return xf(box(0.11, 0.03, 0.055), rotX(a), translate(0, Math.cos(a) * 0.465, Math.sin(a) * 0.465));
  })), [0.13, 0.13, 0.15], "Dibujo", 0.02, 0.9),
  pieza(annulusX(0.20, 0.235, 0.11, 44), DARK, "Talón"),
];

const camara = (): Pieza[] => [
  pieza(xf(torusX(0.33, 0.075, 48, 16), scale(1, 0.8, 1)), [0.10, 0.10, 0.12], "Cámara", 0.02, 0.9),
  pieza(xf(cylinderY(0.018, 0.09, 12), translate(0, 0.40, 0)), CHROME, "Válvula", 0.9, 0.25),
  pieza(xf(cylinderY(0.026, 0.03, 12), translate(0, 0.45, 0)), DARK, "Tapón"),
];

const rin = (): Pieza[] => [
  pieza(annulusX(0.30, 0.36, 0.10, 48), STEEL, "Aro", 0.9, 0.3),
  pieza(xf(cylinderX(0.30, 0.02, 40)), [0.42, 0.44, 0.47], "Disco", 0.8, 0.4),
  pieza(merge(...Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return xf(box(0.03, 0.26, 0.05), rotX(a), translate(0, Math.cos(a) * 0.16, Math.sin(a) * 0.16));
  })), STEEL, "Radios", 0.9, 0.3),
  pieza(xf(cylinderX(0.075, 0.10, 24), translate(0.02, 0, 0)), DARK, "Buje"),
  pieza(merge(...[0, 1, 2, 3].map((i) => {
    const a = (i / 4) * Math.PI * 2;
    return xf(cylinderX(0.016, 0.06, 10), translate(0.03, Math.cos(a) * 0.06, Math.sin(a) * 0.06));
  })), CHROME, "Tornillos", 0.95, 0.2),
];

const ejeDiferencial = (): Pieza[] => [
  pieza(cylinderX(0.055, 0.80, 24), DARK, "Tubo", 0.85, 0.35),
  pieza(xf(sphere(0.17, 28, 18), scale(1, 0.9, 0.9)), CAST, "Diferencial"),
  pieza(xf(gearY(0.10, 0.09, 12), rotZ(Math.PI / 2), translate(0, 0, 0.16)), STEEL, "Corona", 0.9, 0.3),
  pieza(merge(
    xf(annulusX(0.03, 0.075, 0.04, 24), translate(-0.40, 0, 0)),
    xf(annulusX(0.03, 0.075, 0.04, 24), translate(0.40, 0, 0)),
  ), STEEL, "Bridas"),
  pieza(xf(cylinderY(0.035, 0.12, 14), translate(0, 0.18, 0)), STEEL, "Entrada"),
  pieza(xf(box(0.10, 0.06, 0.10), translate(0, 0.26, 0)), DARK, "Yugo"),
];

// ───────────── Motor y transmisión ─────────────

const motorBloque = (): Pieza[] => [
  pieza(boxBisel(0.52, 0.40, 0.34, 0.04), CAST, "Bloque"),
  pieza(xf(boxBisel(0.50, 0.10, 0.32, 0.02), translate(0, 0.24, 0)), [0.46, 0.48, 0.51], "Culata"),
  pieza(merge(...Array.from({ length: 4 }, (_, i) =>
    xf(cylinderY(0.035, 0.10, 16), translate(-0.18 + i * 0.12, 0.28, 0.05)))), DARK, "Bujías"),
  pieza(xf(boxBisel(0.50, 0.10, 0.30, 0.02), translate(0, -0.24, 0)), DARK, "Cárter"),
  pieza(xf(box(0.16, 0.14, 0.30), translate(0.32, 0.06, 0)), [0.42, 0.44, 0.47], "Colector"),
  pieza(merge(...Array.from({ length: 4 }, (_, i) =>
    xf(cylinderY(0.045, 0.03, 16), rotZ(Math.PI / 2), translate(-0.28, 0.10 - i * 0.09, 0)))), STEEL, "Poleas"),
];

const kitDistribucion = (): Pieza[] => {
  const pts: Vec3[] = [];
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    pts.push([Math.cos(a) * 0.24, Math.sin(a) * 0.24 * 0.72, 0]);
  }
  return [
    pieza(sweepAlong(pts, [[-0.035, -0.008], [0.035, -0.008], [0.035, 0.008], [-0.035, 0.008]], { capEnds: false }),
      [0.10, 0.10, 0.12], "Correa", 0.1, 0.8),
    pieza(xf(gearY(0.075, 0.05, 20, 0.012), translate(-0.24, 0, 0)), STEEL, "Piñón cigüeñal", 0.9, 0.3),
    pieza(xf(gearY(0.10, 0.05, 24, 0.012), translate(0.22, 0.06, 0)), STEEL, "Piñón árbol", 0.9, 0.3),
    pieza(xf(annulusX(0.03, 0.055, 0.06, 24), rotX(Math.PI / 2), translate(0.02, -0.16, 0)), DARK, "Tensor"),
    pieza(xf(annulusX(0.028, 0.05, 0.05, 20), rotX(Math.PI / 2), translate(-0.14, 0.16, 0)), DARK, "Rodillo"),
  ];
};

const bombaAgua = (): Pieza[] => [
  pieza(xf(cylinderX(0.14, 0.16, 30), translate(0.06, 0, 0)), [0.44, 0.46, 0.49], "Cuerpo"),
  pieza(xf(cylinderX(0.15, 0.03, 30), translate(-0.05, 0, 0)), CAST, "Tapa"),
  pieza(xf(cylinderX(0.07, 0.10, 22), translate(-0.12, 0, 0)), STEEL, "Polea", 0.9, 0.3),
  pieza(merge(...Array.from({ length: 8 }, (_, i) =>
    xf(box(0.05, 0.05, 0.012), rotX((i / 8) * Math.PI * 2), translate(-0.16, 0, 0)))), DARK, "Aspas"),
  pieza(xf(cylinderY(0.045, 0.10, 18), translate(0.06, 0.15, 0)), STEEL, "Brida"),
  pieza(xf(torusY(0.135, 0.012, 30, 8), rotZ(Math.PI / 2), translate(-0.03, 0, 0)), RUBBER, "Junta"),
];

const selector = (): Pieza[] => [
  pieza(box(0.26, 0.18, 0.20), [0.18, 0.20, 0.24], "Caja"),
  pieza(xf(cylinderY(0.035, 0.36, 18), rotZ(0.35), translate(0.02, 0.24, 0)), STEEL, "Palanca", 0.9, 0.3),
  pieza(xf(sphere(0.055, 20, 14), translate(0.09, 0.41, 0)), DARK, "Pomo"),
  pieza(xf(cylinderY(0.014, 0.30, 10), rotZ(-0.5), translate(-0.14, 0.14, 0.06)), [0.12, 0.12, 0.14], "Guaya"),
  pieza(xf(annulusY(0.05, 0.085, 0.03, 22), translate(-0.18, 0.0, 0)), STEEL, "Tope"),
];

// ───────────── Luces y carrocería ─────────────

const faro = (): Pieza[] => [
  pieza(boxBisel(0.42, 0.20, 0.16, 0.03), [0.20, 0.22, 0.26], "Carcasa"),
  pieza(xf(cylinderZ(0.085, 0.03, 32), translate(-0.09, 0, 0.08)), CHROME, "Reflector", 0.95, 0.12),
  pieza(xf(cylinderZ(0.075, 0.02, 32), translate(-0.09, 0, 0.095)), [0.95, 0.96, 0.98], "Lente LED", 0.2, 0.1),
  pieza(xf(cylinderZ(0.05, 0.03, 28), translate(0.10, 0, 0.08)), CHROME, "Reflector 2", 0.95, 0.12),
  pieza(xf(box(0.40, 0.06, 0.02), translate(0, 0.07, 0.085)), AMBER, "Intermitente", 0.2, 0.2),
  pieza(xf(box(0.06, 0.10, 0.12), translate(0.20, 0, -0.02)), DARK, "Soporte"),
];

const bombilla = (): Pieza[] => [
  pieza(xf(cylinderY(0.055, 0.10, 22), translate(0, -0.10, 0)), [0.90, 0.90, 0.92], "Casquillo", 0.6, 0.3),
  pieza(xf(cylinderY(0.062, 0.03, 22), translate(0, -0.03, 0)), STEEL, "Brida"),
  pieza(merge(
    xf(sphere(0.085, 24, 16), scale(1, 1.15, 1), translate(0, 0.10, 0)),
    xf(sphere(0.085, 24, 16), scale(1, 1.15, 1), translate(-0.06, 0.02, 0)),
    xf(sphere(0.085, 24, 16), scale(1, 1.15, 1), translate(0.06, 0.02, 0)),
  ), [0.88, 0.92, 0.98], "Ampolla", 0.05, 0.1),
  pieza(merge(
    xf(cylinderY(0.012, 0.16, 8), translate(-0.03, 0.04, 0)),
    xf(cylinderY(0.012, 0.16, 8), translate(0.03, 0.04, 0)),
  ), [0.85, 0.75, 0.35], "Filamento", 0.9, 0.4),
];

const espejo = (): Pieza[] => [
  pieza(boxBisel(0.30, 0.18, 0.07, 0.02), [0.16, 0.18, 0.22], "Carcasa"),
  pieza(xf(box(0.28, 0.16, 0.012), translate(0, 0, 0.038)), [0.72, 0.78, 0.84], "Cristal", 0.98, 0.05),
  pieza(xf(cylinderY(0.030, 0.20, 16), rotZ(0.9), translate(-0.20, -0.10, 0)), STEEL, "Brazo", 0.9, 0.3),
  pieza(xf(box(0.10, 0.10, 0.06), translate(-0.28, -0.18, 0)), DARK, "Base"),
  pieza(xf(box(0.06, 0.03, 0.02), translate(0.10, -0.09, 0.03)), AMBER, "Intermitente"),
];

const parachoques = (): Pieza[] => [
  pieza(arcPlate(1.30, 0.10, 0.30, 78, 34), [0.20, 0.22, 0.26], "Cuerpo", 0.2, 0.55),
  pieza(xf(arcPlate(1.26, 0.04, 0.10, 74, 30), translate(0, 0, 0.14)), DARK, "Moldura"),
  pieza(merge(
    xf(box(0.10, 0.14, 0.16), translate(-0.62, 0.02, -0.06)),
    xf(box(0.10, 0.14, 0.16), translate(0.62, 0.02, -0.06)),
  ), STEEL, "Soportes"),
  pieza(merge(
    xf(box(0.14, 0.06, 0.04), translate(-0.30, -0.10, 0.13)),
    xf(box(0.14, 0.06, 0.04), translate(0.30, -0.10, 0.13)),
  ), AMBER, "Antinieblas"),
];

const parabrisas = (): Pieza[] => [
  pieza(xf(box(0.62, 0.42, 0.015), rotX(-0.22), translate(0, 0.04, 0)), GLASS, "Cristal", 0.1, 0.05),
  pieza(merge(
    xf(box(0.64, 0.035, 0.04), rotX(-0.22), translate(0, 0.26, -0.05)),
    xf(box(0.64, 0.035, 0.04), rotX(-0.22), translate(0, -0.18, 0.05)),
  ), STEEL, "Marco", 0.9, 0.3),
  pieza(merge(
    xf(cylinderY(0.018, 0.42, 10), rotX(-0.22), translate(-0.31, 0.04, 0)),
    xf(cylinderY(0.018, 0.42, 10), rotX(-0.22), translate(0.31, 0.04, 0)),
  ), DARK, "Laterales"),
  pieza(xf(box(0.58, 0.03, 0.05), rotX(-0.22), translate(0, 0.28, -0.06)), [0.20, 0.22, 0.26], "Visera"),
];

// ───────────── Vehículos ─────────────

const triciclo = (): Pieza[] => {
  const rueda = (x: number, y: number, z: number, r: number) => merge(
    xf(torusX(r, r * 0.34, 40, 16), translate(x, y, z)),
    xf(annulusX(r * 0.55, r * 0.72, r * 0.30, 32), translate(x, y, z)),
  );
  return [
    pieza(merge(
      xf(box(1.50, 0.09, 0.10), translate(0.10, 0.28, -0.34)),
      xf(box(1.50, 0.09, 0.10), translate(0.10, 0.28, 0.34)),
      xf(box(0.09, 0.09, 0.72), translate(-0.62, 0.28, 0)),
      xf(box(0.09, 0.09, 0.72), translate(0.78, 0.28, 0)),
    ), [0.24, 0.26, 0.30], "Chasis", 0.8, 0.4),
    pieza(merge(
      xf(box(0.86, 0.06, 1.02), translate(0.20, 0.46, 0)),
      xf(box(0.86, 0.26, 0.05), translate(0.20, 0.60, -0.50)),
      xf(box(0.86, 0.26, 0.05), translate(0.20, 0.60, 0.50)),
      xf(box(0.05, 0.26, 1.02), translate(-0.22, 0.60, 0)),
      xf(box(0.05, 0.26, 1.02), translate(0.62, 0.60, 0)),
    ), [0.16, 0.34, 0.62], "Tolva de carga", 0.55, 0.45),
    pieza(merge(rueda(-0.74, 0.30, 0, 0.30), rueda(0.74, 0.30, -0.44, 0.30), rueda(0.74, 0.30, 0.44, 0.30)),
      RUBBER, "Ruedas", 0.02, 0.92),
    pieza(xf(cylinderY(0.045, 0.52, 18), rotX(-0.25), translate(-0.62, 0.58, 0)), STEEL, "Horquilla", 0.9, 0.3),
    pieza(merge(
      xf(cylinderY(0.032, 0.62, 14), translate(-0.62, 0.86, 0)),
      xf(cylinderY(0.030, 0.16, 12), rotZ(Math.PI / 2), translate(-0.62, 0.94, 0)),
    ), DARK, "Manillar"),
    pieza(xf(boxBisel(0.30, 0.10, 0.34, 0.02), translate(-0.30, 0.66, 0)), [0.10, 0.10, 0.12], "Asiento"),
    pieza(xf(box(0.22, 0.18, 0.26), translate(-0.10, 0.40, 0)), NAVY, "Baterías"),
    pieza(xf(cylinderX(0.10, 0.16, 24), translate(0.30, 0.30, 0)), DARK, "Motor"),
  ];
};

const bicicleta = (): Pieza[] => {
  const rueda = (x: number, r: number) => merge(
    xf(torusX(r, r * 0.10, 44, 14), translate(x, r, 0)),
    ...Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return xf(box(0.008, r * 1.8, 0.008), translate(x, r, 0), rotX(a));
    }),
    xf(cylinderX(0.03, 0.06, 16), translate(x, r, 0)),
  );
  return [
    pieza(merge(rueda(-0.44, 0.24), rueda(0.44, 0.24)), RUBBER, "Ruedas", 0.05, 0.9),
    pieza(merge(
      xf(cylinderY(0.022, 0.62, 12), rotZ(0.55), translate(0.06, 0.34, 0)),
      xf(cylinderY(0.022, 0.44, 12), rotZ(-0.9), translate(-0.20, 0.36, 0)),
      xf(cylinderY(0.022, 0.36, 12), rotZ(0.35), translate(-0.30, 0.20, 0)),
      xf(cylinderY(0.022, 0.34, 12), rotZ(-0.35), translate(-0.36, 0.44, 0)),
      xf(cylinderY(0.022, 0.30, 12), rotZ(1.15), translate(-0.46, 0.40, 0)),
    ), [0.12, 0.32, 0.60], "Cuadro", 0.75, 0.35),
    pieza(xf(box(0.16, 0.05, 0.07), translate(-0.26, 0.56, 0)), DARK, "Sillín"),
    pieza(merge(
      xf(cylinderY(0.020, 0.30, 10), translate(0.30, 0.60, 0)),
      xf(cylinderY(0.018, 0.20, 10), rotZ(Math.PI / 2), translate(0.30, 0.74, 0)),
    ), DARK, "Manillar"),
    pieza(xf(annulusX(0.075, 0.105, 0.02, 28), translate(0.02, 0.20, 0)), STEEL, "Plato", 0.9, 0.3),
    pieza(xf(box(0.20, 0.03, 0.10), translate(0.24, 0.30, 0)), [0.20, 0.22, 0.26], "Batería"),
  ];
};

const patinete = (): Pieza[] => [
  pieza(merge(
    xf(cylinderX(0.075, 0.05, 24), translate(-0.36, 0.075, 0)),
    xf(cylinderX(0.075, 0.05, 24), translate(0.40, 0.075, 0)),
  ), RUBBER, "Ruedas", 0.05, 0.9),
  pieza(xf(box(0.72, 0.035, 0.14), translate(0.02, 0.13, 0)), [0.20, 0.22, 0.26], "Plataforma"),
  pieza(xf(cylinderY(0.028, 0.62, 14), rotZ(-0.16), translate(0.40, 0.44, 0)), STEEL, "Tija", 0.9, 0.3),
  pieza(merge(
    xf(cylinderY(0.020, 0.34, 10), rotZ(Math.PI / 2), translate(0.46, 0.74, 0)),
    xf(box(0.04, 0.04, 0.12), translate(0.46, 0.74, 0)),
  ), DARK, "Manillar"),
  pieza(xf(boxBisel(0.16, 0.10, 0.08, 0.01), translate(0.34, 0.20, 0)), NAVY, "Batería"),
  pieza(xf(box(0.05, 0.02, 0.05), translate(0.46, 0.70, 0)), VOLT, "Display"),
];

const alfombrillas = (): Pieza[] => {
  const una = (dx: number) => merge(
    xf(box(0.42, 0.02, 0.30), translate(dx, 0, 0)),
    xf(box(0.42, 0.04, 0.02), translate(dx, 0.02, -0.15)),
    xf(box(0.42, 0.04, 0.02), translate(dx, 0.02, 0.15)),
  );
  return [
    pieza(merge(una(-0.23), una(0.23)), [0.12, 0.13, 0.15], "Goma", 0.02, 0.9),
    pieza(merge(
      ...Array.from({ length: 7 }, (_, i) => xf(box(0.38, 0.006, 0.022), translate(-0.23, 0.014, -0.11 + i * 0.037))),
      ...Array.from({ length: 7 }, (_, i) => xf(box(0.38, 0.006, 0.022), translate(0.23, 0.014, -0.11 + i * 0.037))),
    ), [0.20, 0.21, 0.24], "Nervios"),
    pieza(merge(
      xf(annulusY(0.028, 0.038, 0.03, 16), translate(-0.23, 0.01, 0.09)),
      xf(annulusY(0.028, 0.038, 0.03, 16), translate(0.23, 0.01, 0.09)),
    ), VOLT, "Sujeción"),
  ];
};

const soporteTelefono = (): Pieza[] => [
  pieza(xf(boxBisel(0.20, 0.02, 0.14, 0.01), translate(0, -0.20, 0)), DARK, "Base"),
  pieza(xf(cylinderY(0.022, 0.26, 14), rotZ(0.30), translate(0, -0.04, 0)), STEEL, "Brazo", 0.9, 0.3),
  pieza(xf(sphere(0.045, 20, 14), translate(0.04, 0.09, 0)), DARK, "Rótula"),
  pieza(xf(box(0.22, 0.30, 0.03), rotZ(0.30), translate(0.05, 0.24, 0)), [0.15, 0.16, 0.19], "Cuna"),
  pieza(merge(
    xf(box(0.03, 0.26, 0.05), rotZ(0.30), translate(-0.06, 0.24, 0.02)),
    xf(box(0.03, 0.26, 0.05), rotZ(0.30), translate(0.16, 0.24, 0.02)),
  ), DARK, "Garras"),
];

const cargadorUsb = (): Pieza[] => [
  pieza(xf(cylinderY(0.075, 0.10, 28), rotX(Math.PI / 2)), DARK, "Cuerpo"),
  pieza(xf(cylinderY(0.078, 0.02, 28), rotX(Math.PI / 2), translate(0, 0, 0.05)), CHROME, "Aro", 0.95, 0.2),
  pieza(merge(
    xf(box(0.04, 0.014, 0.02), translate(-0.022, 0.012, 0.06)),
    xf(box(0.04, 0.014, 0.02), translate(0.022, 0.012, 0.06)),
  ), [0.85, 0.85, 0.88], "Puertos USB"),
  pieza(xf(box(0.03, 0.03, 0.02), translate(0, -0.02, 0.06)), VOLT, "LED"),
  pieza(merge(
    xf(cylinderY(0.012, 0.06, 10), translate(-0.03, 0.075, -0.02)),
    xf(cylinderY(0.012, 0.06, 10), translate(0.03, 0.075, -0.02)),
  ), COPPER, "Contactos", 0.9, 0.3),
];

// ───────────── Mandos del triciclo ─────────────

const puno = (): Pieza[] => [
  pieza(xf(cylinderX(0.052, 0.20, 24), translate(0.02, 0, 0)), [0.16, 0.17, 0.19], "Goma", 0.02, 0.9),
  pieza(xf(cylinderX(0.048, 0.21, 24), translate(0.02, 0, 0)), RUBBER, "Puño", 0.02, 0.9),
  pieza(xf(box(0.10, 0.07, 0.09), translate(-0.13, 0, 0)), DARK, "Mando"),
  pieza(xf(box(0.03, 0.03, 0.05), translate(-0.13, 0.05, 0)), VOLT, "Botón"),
  pieza(xf(cylinderX(0.016, 0.16, 12), translate(-0.22, 0.01, 0)), STEEL, "Varilla", 0.9, 0.3),
  pieza(xf(box(0.04, 0.02, 0.06), translate(-0.13, -0.05, 0)), RED, "Gatillo"),
];

const display = (): Pieza[] => [
  pieza(boxBisel(0.22, 0.16, 0.05, 0.015), DARK, "Carcasa"),
  pieza(xf(box(0.18, 0.12, 0.01), translate(0, 0.01, 0.028)), [0.30, 0.55, 0.35], "LCD", 0.1, 0.2),
  pieza(merge(
    xf(box(0.14, 0.008, 0.005), translate(0, 0.05, 0.034)),
    xf(box(0.10, 0.008, 0.005), translate(-0.02, 0.02, 0.034)),
    xf(box(0.12, 0.008, 0.005), translate(0, -0.01, 0.034)),
  ), [0.75, 0.95, 0.80], "Dígitos"),
  pieza(xf(cylinderY(0.010, 0.16, 10), rotX(0.5), translate(0, -0.12, -0.02)), RUBBER, "Cable"),
];

const switchEncendido = (): Pieza[] => [
  pieza(cylinderY(0.065, 0.09, 26), DARK, "Bombín"),
  pieza(xf(cylinderY(0.045, 0.03, 22), translate(0, 0.055, 0)), STEEL, "Rondana", 0.9, 0.3),
  pieza(xf(box(0.10, 0.03, 0.05), translate(0, 0.085, 0)), [0.18, 0.19, 0.22], "Llave"),
  pieza(xf(cylinderY(0.012, 0.02, 10), translate(0.04, 0.085, 0)), STEEL, "Diente"),
  pieza(merge(
    xf(box(0.02, 0.02, 0.02), translate(0.06, -0.06, 0.04)),
    xf(box(0.02, 0.02, 0.02), translate(-0.06, -0.06, 0.04)),
  ), COPPER, "Terminales", 0.9, 0.3),
];

const pedal = (): Pieza[] => [
  pieza(xf(boxBisel(0.16, 0.03, 0.10, 0.008), translate(0, 0, 0)), DARK, "Pedal"),
  pieza(merge(...Array.from({ length: 5 }, (_, i) =>
    xf(box(0.14, 0.008, 0.010), translate(0, 0.02, -0.035 + i * 0.017)))), RUBBER, "Goma"),
  pieza(xf(cylinderY(0.014, 0.30, 12), rotZ(0.5), translate(-0.10, 0.14, 0)), STEEL, "Varilla", 0.9, 0.3),
  pieza(xf(box(0.05, 0.05, 0.05), translate(-0.19, 0.28, 0)), DARK, "Rótula"),
  pieza(xf(box(0.03, 0.02, 0.03), translate(0.06, 0.02, 0.04)), VOLT, "Sensor"),
];

const palancaFreno = (): Pieza[] => [
  pieza(xf(box(0.06, 0.30, 0.05), translate(0, 0.10, 0)), DARK, "Palanca"),
  pieza(xf(box(0.09, 0.05, 0.07), translate(0, 0.26, 0)), RUBBER, "Empuñadura"),
  pieza(xf(box(0.10, 0.03, 0.10), translate(0, -0.06, 0)), STEEL, "Base"),
  pieza(xf(cylinderY(0.012, 0.12, 10), translate(0.02, -0.02, 0.06)), STEEL, "Pasador"),
  pieza(xf(box(0.03, 0.03, 0.04), translate(0.03, 0.14, 0.03)), VOLT, "Pulsador"),
];

// ───────────── Carrocería del triciclo ─────────────

const tolva = (): Pieza[] => [
  pieza(merge(
    xf(box(1.00, 0.05, 0.90), translate(0, -0.16, 0)),
    xf(box(1.00, 0.30, 0.04), translate(0, 0.00, -0.45)),
    xf(box(1.00, 0.30, 0.04), translate(0, 0.00, 0.45)),
    xf(box(0.04, 0.30, 0.90), translate(-0.50, 0.00, 0)),
    xf(box(0.04, 0.30, 0.90), translate(0.50, 0.00, 0)),
  ), [0.16, 0.34, 0.62], "Tolva", 0.55, 0.45),
  pieza(merge(
    xf(box(1.02, 0.05, 0.05), translate(0, 0.16, -0.45)),
    xf(box(1.02, 0.05, 0.05), translate(0, 0.16, 0.45)),
    xf(box(0.05, 0.05, 0.90), translate(-0.50, 0.16, 0)),
    xf(box(0.05, 0.05, 0.90), translate(0.50, 0.16, 0)),
  ), STEEL, "Refuerzos", 0.85, 0.35),
  pieza(merge(
    xf(cylinderY(0.03, 0.26, 14), rotZ(Math.PI / 2), translate(0, -0.14, -0.50)),
    xf(box(0.10, 0.12, 0.08), translate(0, -0.24, -0.50)),
  ), DARK, "Bisagra de volteo"),
  pieza(xf(cylinderY(0.035, 0.40, 16), rotZ(Math.PI / 2), translate(0, -0.10, 0.48)), CHROME, "Pasador", 0.95, 0.2),
];

const asientos = (): Pieza[] => {
  const uno = (dx: number) => merge(
    xf(box(0.34, 0.06, 0.32), translate(dx, 0, 0)),
    xf(box(0.34, 0.30, 0.06), translate(dx, 0.17, -0.16)),
    xf(box(0.06, 0.22, 0.30), translate(dx, -0.14, 0)),
  );
  return [
    pieza(merge(uno(-0.24), uno(0.24)), [0.10, 0.11, 0.13], "Asientos", 0.02, 0.9),
    pieza(xf(box(0.60, 0.04, 0.34), translate(0, -0.26, 0)), STEEL, "Bancada", 0.9, 0.3),
    pieza(merge(
      xf(cylinderY(0.02, 0.30, 12), rotX(0.4), translate(-0.24, -0.20, -0.20)),
      xf(cylinderY(0.02, 0.30, 12), rotX(0.4), translate(0.24, -0.20, -0.20)),
    ), STEEL, "Plegado"),
    pieza(merge(
      xf(box(0.03, 0.30, 0.03), translate(-0.50, -0.12, 0.20)),
      xf(box(0.03, 0.30, 0.03), translate(0.50, -0.12, 0.20)),
      xf(box(0.03, 0.03, 0.22), translate(-0.50, 0.00, 0.20)),
      xf(box(0.03, 0.03, 0.22), translate(0.50, 0.00, 0.20)),
    ), CHROME, "Escalera", 0.95, 0.2),
  ];
};

export const FORMAS = {
  bateria, alternador, motorArranque, bujia, motorElectrico, controlador, convertidor, bancoBaterias,
  cargador, extensor, disco, pastillas, zapatas, botella, filtroAceite, filtroAire, filtroCombustible,
  amortiguador, amortiguadorPar, rotula, ballesta, horquilla, neumatico, camara, rin, ejeDiferencial,
  motorBloque, kitDistribucion, bombaAgua, selector, faro, bombilla, espejo, parachoques, parabrisas,
  triciclo, bicicleta, patinete, alfombrillas, soporteTelefono, cargadorUsb, puno, display,
  switchEncendido, pedal, palancaFreno, tolva, asientos,
} as const;

export type FormaId = keyof typeof FORMAS;

// Pieza genérica: cuerpo con nervios y tornillos, nunca una caja plana.
const generica = (): Pieza[] => [
  pieza(merge(box(0.40, 0.06, 0.30), xf(box(0.40, 0.22, 0.05), translate(0, 0.14, -0.12))), [0.42, 0.44, 0.47], "Cuerpo"),
  pieza(merge(...[0, 1].map((i) => xf(box(0.05, 0.24, 0.05), translate(-0.15 + i * 0.30, 0.10, 0.10)))), STEEL, "Nervios"),
  pieza(merge(...[[-0.16, -0.10], [0.16, -0.10], [-0.16, 0.10], [0.16, 0.10]].map(([x, z]) =>
    xf(cylinderY(0.018, 0.08, 10), translate(x, 0.02, z)))), CHROME, "Tornillos", 0.95, 0.2),
];

const POR_SKU: Record<string, FormaId> = {
  "AC-9001": "alfombrillas", "AC-9002": "soporteTelefono", "AC-9003": "cargadorUsb",
  "CA-8001": "espejo", "CA-8002": "parachoques",
  "EL-3001": "bateria", "EL-3002": "alternador", "EL-3003": "motorArranque", "EL-3004": "bujia",
  "FI-6001": "filtroAceite", "FI-6002": "filtroAire", "FI-6003": "filtroCombustible",
  "FR-1001": "pastillas", "FR-1002": "disco", "FR-1003": "botella",
  "LU-7001": "faro", "LU-7002": "bombilla",
  "MO-5001": "motorBloque", "MO-5002": "kitDistribucion", "MO-5003": "bombaAgua",
  "SU-2001": "amortiguador", "SU-2002": "amortiguadorPar", "SU-2003": "rotula",
  "TE-4001": "triciclo", "TE-4002": "bicicleta", "TE-4003": "patinete",
  "KVI-CAR-01": "tolva", "KVI-CAR-02": "asientos", "KVI-CAR-03": "parabrisas",
  "KVI-ELE-01": "controlador", "KVI-ELE-02": "bancoBaterias", "KVI-ELE-03": "cargador",
  "KVI-ELE-04": "convertidor", "KVI-ELE-05": "extensor",
  "KVI-FRE-01": "zapatas", "KVI-FRE-02": "pedal", "KVI-FRE-03": "palancaFreno",
  "KVI-MAN-01": "puno", "KVI-MAN-02": "display", "KVI-MAN-03": "switchEncendido",
  "KVI-MOT-01": "motorElectrico", "KVI-MOT-02": "ejeDiferencial", "KVI-MOT-03": "selector",
  "KVI-RUE-01": "neumatico", "KVI-RUE-02": "camara", "KVI-RUE-03": "rin",
  "KVI-SUS-01": "horquilla", "KVI-SUS-02": "ballesta", "KVI-SUS-03": "amortiguador",
};

const POR_TEXTO: [RegExp, FormaId][] = [
  [/triciclo|tolva/i, "triciclo"],
  [/bicicleta/i, "bicicleta"],
  [/patinete/i, "patinete"],
  [/bater[ií]a/i, "bateria"],
  [/alternador/i, "alternador"],
  [/arranque/i, "motorArranque"],
  [/buj[ií]a/i, "bujia"],
  [/filtro de aceite/i, "filtroAceite"],
  [/filtro de aire/i, "filtroAire"],
  [/filtro/i, "filtroCombustible"],
  [/pastilla/i, "pastillas"],
  [/disco/i, "disco"],
  [/l[ií]quido/i, "botella"],
  [/faro|farol/i, "faro"],
  [/bombilla|l[aá]mpara/i, "bombilla"],
  [/espejo/i, "espejo"],
  [/paragolpes|parachoques/i, "parachoques"],
  [/parabrisas/i, "parabrisas"],
  [/amortiguador/i, "amortiguador"],
  [/r[oó]tula/i, "rotula"],
  [/ballesta/i, "ballesta"],
  [/horquilla/i, "horquilla"],
  [/neum[aá]tico|cubierta/i, "neumatico"],
  [/c[aá]mara/i, "camara"],
  [/rin\b|aro de acero/i, "rin"],
  [/diferencial/i, "ejeDiferencial"],
  [/motor/i, "motorBloque"],
  [/bomba/i, "bombaAgua"],
  [/distribuci[oó]n|correa/i, "kitDistribucion"],
  [/alfombrilla/i, "alfombrillas"],
  [/soporte/i, "soporteTelefono"],
  [/cargador usb/i, "cargadorUsb"],
];

export function formaDe(sku: string, nombre: string): Pieza[] {
  const id = POR_SKU[sku] ?? POR_TEXTO.find(([re]) => re.test(nombre))?.[1];
  const fn = id ? FORMAS[id] : generica;
  return normalizar(fn(), 1);
}
