import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { contentBlock: { findUnique } } }));

import { getMenuEmpresa, getMenuPrincipal } from "@/lib/menu-server";
import { NAV_EMPRESA, NAV_PRINCIPAL } from "@/lib/site";

const fila = (items: unknown) => ({ eyebrow: "", title: "", subtitle: "", items, visible: true });

describe("menús editables", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it("sin fila guardada devuelve el menú de fábrica", async () => {
    findUnique.mockResolvedValue(null);
    expect(await getMenuPrincipal()).toEqual(NAV_PRINCIPAL.map(({ href, label }) => ({ href, label })));
    expect(await getMenuEmpresa()).toEqual(NAV_EMPRESA.map(({ href, label }) => ({ href, label })));
  });

  it("usa los enlaces guardados en el panel", async () => {
    findUnique.mockResolvedValue(fila([{ titulo: "Tienda", href: "/catalogo" }, { titulo: "Blog", href: "/novedades" }]));
    expect(await getMenuPrincipal()).toEqual([{ href: "/catalogo", label: "Tienda" }, { href: "/novedades", label: "Blog" }]);
  });

  it("cae al menú de fábrica si la base de datos falla", async () => {
    findUnique.mockImplementation(() => { throw new Error("sin conexión"); });
    expect(await getMenuPrincipal()).toHaveLength(NAV_PRINCIPAL.length);
  });

  it("descarta enlaces vacíos o con esquemas peligrosos", async () => {
    findUnique.mockResolvedValue(fila([{ titulo: "Malo", href: "javascript:alert(1)" }, { titulo: "Sin enlace" }, { titulo: "Bueno", href: "/ofertas" }]));
    expect(await getMenuPrincipal()).toEqual([{ href: "/ofertas", label: "Bueno" }]);
  });

  it("sin base de datos disponible tampoco rompe", async () => {
    findUnique.mockImplementation(() => { throw new TypeError("contentBlock is undefined"); });
    expect(await getMenuEmpresa()).toHaveLength(NAV_EMPRESA.length);
  });
});
