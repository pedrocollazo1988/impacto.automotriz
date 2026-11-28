import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/customer-auth";
import { telefonoLegible } from "@/lib/phone";
import AuthForm from "@/components/AuthForm";
import TelegramLogin from "@/components/TelegramLogin";
import { estadoTelegram } from "@/lib/telegram";
import GarageManager from "@/components/GarageManager";
import DireccionesCuenta from "@/components/cuenta/DireccionesCuenta";
import PedidosCuenta from "@/components/cuenta/PedidosCuenta";
import { ordenarDirecciones } from "@/lib/direcciones";
import PerfilCuenta from "@/components/cuenta/PerfilCuenta";
import Avatar from "@/components/cuenta/Avatar";
import ProductCard from "@/components/ProductCard";
import VerifyBanner from "@/components/VerifyBanner";
import Icon from "@/components/brand/Icon";
import LogoutButton from "./LogoutButton";
export const dynamic = "force-dynamic";
export const metadata = { title: "Mi cuenta", robots: { index: false } };


export default async function Cuenta({ searchParams }: { searchParams: Promise<{ verificado?: string; error?: string }> }) {
  const sp = await searchParams;
  const me = await getCustomer();
  if (!me) return (
    <div className="container-x py-12">
      {sp.error && (
        <p className="mx-auto mb-4 max-w-md rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {sp.error === "telegram" ? "No se pudo iniciar sesión con Telegram. Inténtalo de nuevo." : "No se pudo iniciar sesión con Google. Inténtalo de nuevo."}
        </p>
      )}
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
        <AuthForm google={!!process.env.GOOGLE_CLIENT_ID} telegram={estadoTelegram().configurado ? estadoTelegram().usuario : ""} />
      </div>
    </div>
  );
  const [orders, garage, wish, credencial, direcciones] = await Promise.all([
    prisma.order.findMany({ where: { customerId: me.id }, orderBy: { id: "desc" }, take: 20 }),
    prisma.garageVehicle.findMany({ where: { customerId: me.id } }),
    prisma.wishlistItem.findMany({ where: { customerId: me.id }, include: { product: { include: { category: { select: { slug: true } } } } } }),
    prisma.customer.findUnique({ where: { id: me.id }, select: { passwordHash: true } }),
    prisma.address.findMany({ where: { customerId: me.id } }).then(ordenarDirecciones),
  ]);
  return (
    <div className="container-x py-8">
      <div className="card relative overflow-hidden p-6">
        <div aria-hidden className="absolute inset-0 blueprint-dark" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar url={me.avatarUrl} name={me.name} />
            <div>
              <h1 className="font-display text-2xl font-extrabold text-navy">Hola, {me.name.split(" ")[0]}</h1>
              <p className="text-sm text-slate-500">{me.email ?? (me.phoneE164 ? telefonoLegible(me.phoneE164) : "Cuenta de Telegram")}</p>
              {me.telegramId && <p className="text-xs font-semibold text-[color:var(--color-ok)]">Telegram vinculado</p>}
            </div>
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

      <section id="pedidos" className="mt-8 scroll-mt-28">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy"><Icon name="box" size={18} /> Mis pedidos</h2>
        <PedidosCuenta pedidos={orders.map((o) => ({ id: o.id, number: o.number, status: o.status, createdAt: o.createdAt.toISOString(), totalUsd: Number(o.totalUsd) }))} />
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy"><Icon name="car" size={18} /> Mi garaje</h2>
        <div className="mt-4"><GarageManager vehicles={garage} /></div>
      </section>

      <section id="direcciones" className="mt-8 scroll-mt-28">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy"><Icon name="pin" size={18} /> Direcciones de entrega</h2>
        <div className="mt-4"><DireccionesCuenta iniciales={direcciones} /></div>
      </section>

      <section id="deseos" className="mt-8 scroll-mt-28">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy"><Icon name="heart" size={18} /> Lista de deseos</h2>
        {wish.length ? <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">{wish.map((w) => <ProductCard key={w.id} p={w.product} />)}</div>
          : <p className="mt-3 text-sm text-slate-500">Guarda productos con el botón ♡ de cada ficha.</p>}
      </section>
    </div>
  );
}
