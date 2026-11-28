import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/customer-auth";
import { telefonoLegible } from "@/lib/phone";
import AuthForm from "@/components/AuthForm";
import GarageManager from "@/components/GarageManager";
import PerfilCuenta from "@/components/cuenta/PerfilCuenta";
import Avatar from "@/components/cuenta/Avatar";
import ProductCard from "@/components/ProductCard";
import VerifyBanner from "@/components/VerifyBanner";
import Icon from "@/components/brand/Icon";
import LogoutButton from "./LogoutButton";
export const dynamic = "force-dynamic";
export const metadata = { title: "Mi cuenta", robots: { index: false } };

const L: Record<string, [string, string]> = {
  PENDING_PAYMENT: ["Pendiente de pago", "bg-amber-100 text-amber-700"],
  PAID: ["Pagado", "bg-blue-100 text-blue-700"],
  PREPARING: ["En preparación", "bg-indigo-100 text-indigo-700"],
  SHIPPED: ["Enviado", "bg-violet-100 text-violet-700"],
  DELIVERED: ["Entregado", "bg-green-100 text-green-700"],
  CANCELED: ["Cancelado", "bg-slate-200 text-slate-600"],
};

export default async function Cuenta({ searchParams }: { searchParams: Promise<{ verificado?: string; error?: string }> }) {
  const sp = await searchParams;
  const me = await getCustomer();
  if (!me) return (
    <div className="container-x py-12">
      {sp.error && <p className="mx-auto mb-4 max-w-md rounded-xl bg-red-50 p-3 text-sm text-red-700">No se pudo iniciar sesión con Google. Inténtalo de nuevo.</p>}
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <div>
          <span className="eyebrow">Tu cuenta</span>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-navy">Bienvenido de nuevo</h1>
          <p className="mt-3 text-slate-500">Inicia sesión para seguir tus pedidos, guardar tu garaje, tu lista de deseos y valorar los productos que compres.</p>
          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            {["Sigue el estado de tus pedidos", "Guarda tus vehículos y ve piezas compatibles", "Lista de deseos y comparaciones", "Historial de compras y comprobantes"].map((t) => (
              <li key={t} className="flex items-center gap-2"><Icon name="check" size={16} className="text-[color:var(--color-ok)]" /> {t}</li>
            ))}
          </ul>
        </div>
        <AuthForm google={!!process.env.GOOGLE_CLIENT_ID} />
      </div>
    </div>
  );
  const [orders, garage, wish, credencial] = await Promise.all([
    prisma.order.findMany({ where: { customerId: me.id }, orderBy: { id: "desc" }, take: 20 }),
    prisma.garageVehicle.findMany({ where: { customerId: me.id } }),
    prisma.wishlistItem.findMany({ where: { customerId: me.id }, include: { product: { include: { category: { select: { slug: true } } } } } }),
    prisma.customer.findUnique({ where: { id: me.id }, select: { passwordHash: true } }),
  ]);
  return (
    <div className="container-x py-8">
      <div className="card relative overflow-hidden p-6">
        <div aria-hidden className="absolute inset-0 blueprint-dark" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar url={me.avatarUrl} name={me.name} />
            <div><h1 className="font-display text-2xl font-extrabold text-navy">Hola, {me.name.split(" ")[0]}</h1><p className="text-sm text-slate-500">{me.email ?? telefonoLegible(me.phoneE164)}</p></div>
          </div>
          <LogoutButton />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {sp.verificado === "1" && <p className="rounded-xl bg-green-50 p-3 text-sm text-green-700">¡Correo confirmado!</p>}
        {sp.verificado === "0" && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">El enlace de confirmación no es válido o venció.</p>}
        {me.email && !me.emailVerified && <VerifyBanner />}
      </div>

      <PerfilCuenta
        email={me.email}
        emailVerified={me.emailVerified}
        phone={me.phoneE164}
        phoneVerified={!!me.phoneVerifiedAt}
        tieneClave={!!credencial?.passwordHash}
      />

      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy"><Icon name="box" size={18} /> Mis pedidos</h2>
        {orders.length ? (
          <div className="mt-4 space-y-3">
            {orders.map((o) => {
              const [label, cls] = L[o.status] ?? [o.status, "bg-slate-100 text-slate-600"];
              return (
                <Link key={o.id} href={`/pedido/${o.id}`} className="card card-hover flex flex-wrap items-center gap-4 p-4">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]"><Icon name="box" size={20} /></span>
                  <div className="min-w-0 flex-1"><p className="font-semibold text-slate-800">Pedido #{o.number}</p><p className="text-xs text-slate-400">{o.createdAt.toLocaleDateString("es-CU")}</p></div>
                  <span className={`badge ${cls}`}>{label}</span>
                  <span className="font-display font-extrabold text-navy">{Number(o.totalUsd).toFixed(2)} USD</span>
                  <Icon name="chevronRight" size={18} className="text-slate-300" />
                </Link>
              );
            })}
          </div>
        ) : <p className="mt-3 text-sm text-slate-500">Aún no tienes pedidos.</p>}
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy"><Icon name="car" size={18} /> Mi garaje</h2>
        <div className="mt-4"><GarageManager vehicles={garage} /></div>
      </section>

      <section id="deseos" className="mt-8 scroll-mt-28">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy"><Icon name="heart" size={18} /> Lista de deseos</h2>
        {wish.length ? <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">{wish.map((w) => <ProductCard key={w.id} p={w.product} />)}</div>
          : <p className="mt-3 text-sm text-slate-500">Guarda productos con el botón ♡ de cada ficha.</p>}
      </section>
    </div>
  );
}
