import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/customer-auth";
import AuthForm from "@/components/AuthForm";
import GarageManager from "@/components/GarageManager";
import ProductCard from "@/components/ProductCard";
import VerifyBanner from "@/components/VerifyBanner";
import LogoutButton from "./LogoutButton";
export const dynamic = "force-dynamic";
export const metadata = { title: "Mi cuenta", robots: { index: false } };

const L: Record<string, string> = { PENDING_PAYMENT: "Pendiente de pago", PAID: "Pagado", PREPARING: "En preparación", SHIPPED: "Enviado", DELIVERED: "Entregado", CANCELED: "Cancelado" };
export default async function Cuenta({ searchParams }: { searchParams: Promise<{ verificado?: string; error?: string }> }) {
  const sp = await searchParams;
  const me = await getCustomer();
  if (!me) return <div className="space-y-3">{sp.error && <p className="mx-auto max-w-sm rounded bg-red-50 p-3 text-sm text-red-700">No se pudo iniciar sesión con Google. Inténtalo de nuevo.</p>}<AuthForm google={!!process.env.GOOGLE_CLIENT_ID} /></div>;
  const [orders, garage, wish] = await Promise.all([
    prisma.order.findMany({ where: { customerId: me.id }, orderBy: { id: "desc" }, take: 20 }),
    prisma.garageVehicle.findMany({ where: { customerId: me.id } }),
    prisma.wishlistItem.findMany({ where: { customerId: me.id }, include: { product: true } }),
  ]);
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-navy">Hola, {me.name}</h1><LogoutButton /></div>
      {sp.verificado === "1" && <p className="rounded bg-green-50 p-3 text-sm text-green-700">¡Correo confirmado!</p>}
      {sp.verificado === "0" && <p className="rounded bg-red-50 p-3 text-sm text-red-700">El enlace de confirmación no es válido o venció.</p>}
      {!me.emailVerified && <VerifyBanner />}
      <section><h2 className="mb-2 font-semibold">Mis pedidos</h2>
        {orders.length ? <ul className="divide-y rounded-lg border text-sm">{orders.map((o) => <li key={o.id} className="flex justify-between p-3"><Link className="text-navy underline" href={`/pedido/${o.id}`}>Pedido #{o.number}</Link><span>{Number(o.totalUsd).toFixed(2)} USD · {L[o.status]}</span></li>)}</ul> : <p className="text-sm text-slate-500">Aún no tienes pedidos.</p>}</section>
      <section><h2 className="mb-2 font-semibold">Mi garaje</h2><GarageManager vehicles={garage} /></section>
      <section><h2 className="mb-2 font-semibold">Lista de deseos</h2>
        {wish.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{wish.map((w) => <ProductCard key={w.id} p={w.product} />)}</div> : <p className="text-sm text-slate-500">Guarda productos con el botón ♡ de cada ficha.</p>}</section>
    </div>);
}
