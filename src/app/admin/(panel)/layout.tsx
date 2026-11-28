import { redirect } from "next/navigation";
import { can, getSessionUser, type Perm } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import AdminShell, { type NavLink } from "@/components/admin/AdminShell";

// El panel depende de la sesión en todas sus rutas. Sin esto, las páginas que
// solo son cliente (Pagos, Cupones…) se prerenderizan sin cookie y Next guarda
// el redirect a /admin/login en el HTML estático, dejando el panel inaccesible.
export const dynamic = "force-dynamic";

// El segundo campo es la clave del diccionario: el idioma se resuelve en cada
// petición, así que la lista no puede guardar texto ya traducido.
const LINKS: [string, string, Perm, string][] = [
  ["/admin", "adm.shell.orders", "orders", "box"],
  ["/admin/productos", "adm.shell.products", "products", "cube"],
  ["/admin/categorias", "adm.shell.categories", "products", "grid"],
  ["/admin/despiece", "adm.shell.parts", "products", "layers"],
  ["/admin/cupones", "adm.shell.coupons", "coupons", "tag"],
  ["/admin/pagos", "adm.shell.payments", "payments", "card"],
  ["/admin/envios", "adm.shell.logistics", "logistics", "truck"],
  ["/admin/campanas", "adm.shell.email", "email", "mail"],
  ["/admin/sms", "adm.shell.sms", "email", "mobile"],
  ["/admin/reportes", "adm.shell.reports", "reports", "chart"],
  ["/admin/resenas", "adm.shell.reviews", "reviews", "star"],
  ["/admin/contenido", "adm.shell.content", "content", "image"],
  ["/admin/equipo", "adm.shell.team", "team", "user"],
  ["/admin/auditoria", "adm.shell.activity", "team", "clock"],
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const u = await getSessionUser();
  if (!u) redirect("/admin/login");
  const { t } = await getT();
  const links: NavLink[] = LINKS.filter(([, , p]) => can(u, p)).map(([href, key, , icon]) => ({ href, label: t(key), icon, exact: href === "/admin" }));
  return <AdminShell links={links} userName={u.name} role={u.role}>{children}</AdminShell>;
}
