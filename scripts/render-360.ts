// Renderiza el giro 360 de un modelo del catálogo: orbita una cámara alrededor
// del .glb en un Chromium headless y guarda 36 fotogramas WebP en
// public/products/360/<sku>-NN.webp, que es lo que lee src/lib/photo360.ts.
//
//   npx tsx scripts/render-360.ts te-4001 [te-4002 ...]
//
// Requiere three (ya es dependencia), sharp y un chromium en el PATH.
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";

const REPO = process.cwd();
const MODELOS = path.join(REPO, "public", "models");
const DESTINO = path.join(REPO, "public", "products", "360");
const FOTOGRAMAS = 36;
const LADO = 900;
const PUERTO = 8791;

const skus = process.argv.slice(2);
if (!skus.length) {
  console.error("Uso: npx tsx scripts/render-360.ts <sku> [sku...]");
  process.exit(1);
}

const pagina = (): string => `<!doctype html>
<html><head><meta charset="utf-8">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<style>html,body{margin:0}canvas{display:block}</style>
</head><body>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const LADO = ${LADO}, TOTAL = ${FOTOGRAMAS};
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(LADO, LADO);
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const escena = new THREE.Scene();
escena.background = new THREE.Color(0xf1f5f9);

// Estudio de tres puntos: sin luz lateral el volumen no se lee al girar.
const clave = new THREE.DirectionalLight(0xffffff, 2.6); clave.position.set(4, 7, 5); escena.add(clave);
const relleno = new THREE.DirectionalLight(0xffffff, 1.1); relleno.position.set(-6, 3, -3); escena.add(relleno);
const contra = new THREE.DirectionalLight(0xffffff, 1.4); contra.position.set(-2, 4, -7); escena.add(contra);
escena.add(new THREE.HemisphereLight(0xffffff, 0x94a3b8, 1.5));

const camara = new THREE.PerspectiveCamera(32, 1, 0.01, 100);

const gltf = await new GLTFLoader().loadAsync('/modelo.glb');
const raiz = gltf.scene;
escena.add(raiz);
raiz.updateWorldMatrix(true, true);

const caja = new THREE.Box3().setFromObject(raiz);
const centro = caja.getCenter(new THREE.Vector3());
const tam = caja.getSize(new THREE.Vector3());

// Cilindro envolvente, no esfera: con la diagonal los modelos altos y
// estrechos (bici, patinete) salen diminutos en el encuadre.
const radioH = Math.hypot(tam.x, tam.z) * 0.5;
const medioFov = (camara.fov * Math.PI) / 360;
const dist = (Math.max(radioH, tam.y * 0.5) / Math.tan(medioFov)) * 1.12;

const fotos = [];
for (let i = 0; i < TOTAL; i++) {
  const a = (i / TOTAL) * Math.PI * 2;
  camara.position.set(centro.x + dist * Math.sin(a), centro.y, centro.z + dist * Math.cos(a));
  camara.lookAt(centro);
  renderer.render(escena, camara);
  fotos.push(renderer.domElement.toDataURL('image/png'));
}

await fetch('/guardar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fotos }) });
document.title = 'LISTO';
</script></body></html>`;

const tipos: Record<string, string> = { ".js": "text/javascript", ".html": "text/html", ".glb": "model/gltf-binary" };

async function renderSku(sku: string) {
  const glb = path.join(MODELOS, `${sku}.glb`);
  if (!fs.existsSync(glb)) throw new Error(`No existe el modelo ${glb}`);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `r360-${sku}-`));

  await new Promise<void>((resolve, reject) => {
    const servidor = http.createServer((req, res) => {
      const url = (req.url ?? "/").split("?")[0];

      if (req.method === "POST" && url === "/guardar") {
        let cuerpo = "";
        req.on("data", (c) => (cuerpo += c));
        req.on("end", () => {
          const { fotos } = JSON.parse(cuerpo) as { fotos: string[] };
          fs.mkdirSync(DESTINO, { recursive: true });
          fotos.forEach((d, i) => {
            const base64 = d.replace(/^data:image\/png;base64,/, "");
            fs.writeFileSync(path.join(tmp, `f${String(i + 1).padStart(2, "0")}.png`), Buffer.from(base64, "base64"));
          });
          res.writeHead(200).end("ok");
          servidor.close(() => resolve());
        });
        return;
      }

      const archivo =
        url === "/" || url === "/render.html"
          ? null
          : url === "/modelo.glb"
            ? glb
            : url.startsWith("/three/")
              ? path.join(REPO, "node_modules", url.slice(1))
              : undefined;

      if (url === "/" || url === "/render.html") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8" }).end(pagina());
        return;
      }
      if (!archivo || !fs.existsSync(archivo)) {
        res.writeHead(404).end("no");
        return;
      }
      res.writeHead(200, { "content-type": tipos[path.extname(archivo)] ?? "application/octet-stream" });
      fs.createReadStream(archivo).pipe(res);
    });

    servidor.on("error", reject);
    servidor.listen(PUERTO, () => {
      const chromium = spawn(
        "chromium",
        [
          "--headless", "--no-sandbox", "--hide-scrollbars", "--enable-unsafe-swiftshader",
          `--window-size=${LADO},${LADO}`, "--virtual-time-budget=90000",
          `--screenshot=${path.join(tmp, "probe.png")}`, `http://localhost:${PUERTO}/`,
        ],
        { stdio: "ignore" },
      );
      chromium.on("error", reject);
      chromium.on("close", () => {
        if (!fs.existsSync(path.join(tmp, "f01.png"))) {
          servidor.close();
          reject(new Error("Chromium no generó fotogramas (¿WebGL desactivado?)"));
        }
      });
    });
  });

  fs.mkdirSync(DESTINO, { recursive: true });
  const pngs = fs.readdirSync(tmp).filter((f) => f.endsWith(".png") && f.startsWith("f")).sort();
  for (let i = 0; i < pngs.length; i++) {
    const destino = path.join(DESTINO, `${sku}-${String(i + 1).padStart(2, "0")}.webp`);
    await sharp(path.join(tmp, pngs[i])).resize(LADO, LADO, { fit: "cover" }).webp({ quality: 80, effort: 6 }).toFile(destino);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`${sku}: ${pngs.length} fotogramas`);
}

async function main() {
  for (const sku of skus) {
    if (spawnSync("which", ["chromium"]).status !== 0) {
      console.error("Falta chromium en el PATH");
      process.exit(1);
    }
    await renderSku(sku.toLowerCase());
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
