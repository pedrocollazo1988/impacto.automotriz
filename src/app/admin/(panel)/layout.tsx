import { redirect } from "next/navigation";
import { can, getSessionUser, type Perm } from "@/lib/auth";
import AdminShell, { type NavLink } from "@/components/admin/AdminShell";

// El panel depende de la sesión en todas sus rutas. Sin esto, las páginas que
// solo son cliente (Pagos, Cupones…) se prerenderizan sin cookie y Next guarda
// el redirect a /admin/login en el HTML estático, dejando el panel inaccesible.
export const dynamic = "force-dynamic";

const LINKS: [string, string, Perm, string][] = [
  ["/admin", "Pedidos", "orders", "box"],
  ["/admin/productos", "Productos", "products", "cube"],
  ["/admin/categorias", "Categorías", "products", "grid"],
  ["/admin/despiece", "Despiece", "products", "layers"],
  ["/admin/cupones", "Cupones", "coupons", "tag"],
  ["/admin/pagos", "Pagos", "payments", "card"],
  ["/admin/envios", "Entregas y zonas", "logistics", "truck"],
  ["/admin/campanas", "Email marketing", "email", "mail"],
  ["/admin/reportes", "Reportes", "reports", "chart"],
  ["/admin/resenas", "Reseñas", "reviews", "star"],
  ["/admin/contenido", "Contenido", "content", "image"],
  ["/admin/equipo", "Equipo", "team", "user"],
  ["/admin/auditoria", "Actividad", "team", "clock"],
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const u = await getSessionUser();
  if (!u) redirect("/admin/login");
  const links: NavLink[] = LINKS.filter(([, , p]) => can(u, p)).map(([href, label, , icon]) => ({ href, label, icon, exact: href === "/admin" }));
  return <AdminShell links={links} userName={u.name} role={u.role}>{children}</AdminShell>;
}
