import Link from "next/link";
import { redirect } from "next/navigation";
import { can, getSessionUser, type Perm } from "@/lib/auth";
import LogoutAdmin from "./LogoutAdmin";

const LINKS: [string, string, Perm][] = [["/admin", "Pedidos", "orders"], ["/admin/productos", "Productos", "products"], ["/admin/cupones", "Cupones", "coupons"], ["/admin/envios", "Entregas y zonas", "logistics"],
  ["/admin/campanas", "Email marketing", "email"], ["/admin/reportes", "Reportes", "reports"], ["/admin/resenas", "Reseñas", "reviews"], ["/admin/equipo", "Equipo", "team"], ["/admin/auditoria", "Actividad", "team"]];
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const u = await getSessionUser();
  if (!u) redirect("/admin/login");
  return (
    <>
      <nav className="flex flex-wrap items-center gap-5 bg-navy px-6 py-3 text-sm font-medium text-white">
        {LINKS.filter(([, , p]) => can(u, p)).map(([h, l]) => <Link key={h} href={h}>{l}</Link>)}
        <span className="ml-auto text-white/70">{u.name} · {u.role}</span><Link href="/">Ver tienda</Link><LogoutAdmin />
      </nav>
      {children}
    </>
  );
}
