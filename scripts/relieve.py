"""Genera los mapas de relieve (color, profundidad y recorte) de una foto.

La profundidad se estima con Depth Anything V2 y el objeto se recorta con
RMBG-1.4, ambos en ONNX sobre CPU. No se inventa nada que la foto no muestre:
por eso también mide hasta qué ángulo el desplazamiento deja de abrir huecos,
y ese valor viaja en meta.json para que el visor no pase de ahí.
"""
import argparse
import json
import os
import sys

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter


def sesion(ruta: str) -> ort.InferenceSession:
    return ort.InferenceSession(ruta, providers=["CPUExecutionProvider"])


def mascara(seg: ort.InferenceSession, img: Image.Image) -> np.ndarray:
    x = np.asarray(img.resize((1024, 1024)), np.float32) / 255.0
    x = (x - 0.5).transpose(2, 0, 1)[None]
    m = np.squeeze(seg.run(None, {seg.get_inputs()[0].name: x})[0])
    m = (m - m.min()) / (m.max() - m.min() + 1e-8)
    return np.asarray(
        Image.fromarray((m * 255).astype(np.uint8)).resize(img.size, Image.BICUBIC),
        np.float32,
    ) / 255.0


def profundidad(dep: ort.InferenceSession, img: Image.Image) -> np.ndarray:
    x = np.asarray(img.resize((518, 518)), np.float32) / 255.0
    x = (x - np.array([0.485, 0.456, 0.406], np.float32)) / np.array([0.229, 0.224, 0.225], np.float32)
    d = np.squeeze(dep.run(None, {dep.get_inputs()[0].name: x.transpose(2, 0, 1)[None]})[0])
    d = (d - d.min()) / (d.max() - d.min() + 1e-8)
    return np.asarray(
        Image.fromarray((d * 255).astype(np.uint8)).resize(img.size, Image.BICUBIC),
        np.float32,
    ) / 255.0


def huecos(prof: np.ndarray, obj: np.ndarray, grados: float) -> float:
    """Porcentaje de píxeles del objeto que, al girar, no reciben origen válido."""
    h, w = prof.shape
    yy, xx = np.meshgrid(np.arange(h), np.arange(w), indexing="ij")
    z = 0.55 + 0.45 * prof
    t = np.tan(np.radians(grados))
    src = xx - (z - 1.0) * (-t) * w * 0.5
    valido = (src >= 0) & (src < w - 1) & obj
    return float((obj & ~valido).sum()) / float(obj.sum() + 1e-8)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--foto", required=True)
    ap.add_argument("--salida", required=True)
    ap.add_argument("--prof", required=True)
    ap.add_argument("--seg", required=True)
    ap.add_argument("--angulo", type=float, default=26)
    ap.add_argument("--ancho-color", type=int, default=600)
    ap.add_argument("--ancho-mapa", type=int, default=300)
    ap.add_argument("--huecos-max", type=float, default=0.03)
    a = ap.parse_args()

    os.makedirs(a.salida, exist_ok=True)
    img = Image.open(a.foto).convert("RGB")

    m = mascara(sesion(a.seg), img)
    d = profundidad(sesion(a.prof), img)
    obj = m > 0.5

    # La profundidad se normaliza solo dentro del objeto; el fondo queda al
    # máximo para que no se cuele en el desplazamiento.
    dn = (d - d[obj].min()) / (d[obj].max() - d[obj].min() + 1e-8)
    dn = np.where(obj, dn, 1.0)
    dn = np.asarray(
        Image.fromarray((dn * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)),
        np.float32,
    ) / 255.0

    # Ángulo seguro: el mayor que mantiene los huecos por debajo del umbral.
    seguro = a.angulo
    for g in np.arange(a.angulo, 0, -2.0):
        if huecos(dn, obj, float(g)) <= a.huecos_max:
            seguro = float(g)
            break
    else:
        seguro = 8.0

    alfa = np.clip((m - 0.35) / 0.3, 0, 1)

    def guardar(arr: np.ndarray, nombre: str, ancho: int, gris: bool):
        im = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8))
        alto = int(round(ancho * im.height / im.width))
        im = im.resize((ancho, alto), Image.LANCZOS)
        if gris:
            im = im.convert("L")
        im.save(os.path.join(a.salida, nombre), "WEBP", quality=82, method=6)

    guardar(np.asarray(img, np.float32) / 255.0, "color.webp", a.ancho_color, False)
    guardar(dn, "profundidad.webp", a.ancho_mapa, True)
    guardar(alfa, "recorte.webp", a.ancho_mapa, True)

    print(json.dumps({"anguloSeguro": round(seguro, 1), "huecos": round(huecos(dn, obj, seguro), 4)}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
