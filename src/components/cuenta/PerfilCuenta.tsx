"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneField from "@/components/phone/PhoneField";
import CodigoOtp from "@/components/CodigoOtp";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";
import { telefonoLegible } from "@/lib/phone";
import { esContrasenaValida } from "@/lib/password-policy";

type Props = {
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
  tieneClave: boolean;
};

const TEL = /^\+[1-9]\d{5,15}$/;

export default function PerfilCuenta(props: Props) {
  const { t } = usePreferences();
  const router = useRouter();
  const [panel, setPanel] = useState<"telefono" | "clave" | null>(null);
  const [paso, setPaso] = useState<"numero" | "codigo">("numero");
  const [numero, setNumero] = useState("");
  const [codigo, setCodigo] = useState("");
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  /** Los errores del servidor llegan como código (AUTH_...); se traducen aquí. */
  const traducir = (codigoError?: string) => {
    if (!codigoError) return t("err.default");
    const clave = `err.${codigoError}`;
    const traducido = t(clave);
    return traducido === clave ? codigoError : traducido;
  };

  async function pedir(url: string, cuerpo: unknown) {
    setOcupado(true);
    setError("");
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setError(traducir(d.error));
        return false;
      }
      return true;
    } catch {
      setError(t("err.default"));
      return false;
    } finally {
      setOcupado(false);
    }
  }

  function abrir(cual: "telefono" | "clave") {
    setPanel(panel === cual ? null : cual);
    setPaso("numero");
    setCodigo("");
    setActual("");
    setNueva("");
    setError("");
    setAviso("");
  }

  async function pedirCodigo(e: React.FormEvent) {
    e.preventDefault();
    setAviso("");
    if (!TEL.test(numero)) { setError(t("err.AUTH_PHONE_INVALID")); return; }
    if (await pedir("/api/account/phone/link", { phone: numero })) {
      setPaso("codigo");
      setCodigo("");
      setAviso(t("cuenta.codeSent"));
    }
  }

  async function confirmarCodigo(valor: string) {
    if (valor.length !== 6 || ocupado) return;
    if (await pedir("/api/account/phone/link/verify", { phone: numero, code: valor })) {
      setPanel(null);
      setNumero("");
      setCodigo("");
      setAviso(t("cuenta.phoneSaved"));
      router.refresh();
    }
  }

  async function guardarClave(e: React.FormEvent) {
    e.preventDefault();
    setAviso("");
    if (!esContrasenaValida(nueva)) { setError(t("err.AUTH_PASSWORD_WEAK")); return; }
    const cuerpo = props.tieneClave ? { currentPassword: actual, password: nueva } : { password: nueva };
    if (await pedir("/api/account/password", cuerpo)) {
      setPanel(null);
      setActual("");
      setNueva("");
      setAviso(t("cuenta.passwordSaved"));
      router.refresh();
    }
  }

  const fila = "flex flex-wrap items-start justify-between gap-3";
  const etiqueta = "text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy"><Icon name="user" size={18} /> {t("cuenta.data")}</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <div className={fila}>
            <div className="min-w-0">
              <span className={etiqueta}>{t("cuenta.email")}</span>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">{props.email ?? "—"}</p>
            </div>
            {props.email && (
              <span className={`badge ${props.emailVerified ? "badge-ok" : "badge-mute"}`}>
                {props.emailVerified ? t("cuenta.verified") : t("cuenta.pending")}
              </span>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className={fila}>
            <div className="min-w-0">
              <span className={etiqueta}>{t("cuenta.phone")}</span>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">{props.phone ? telefonoLegible(props.phone) : "—"}</p>
            </div>
            {props.phone && (
              <span className={`badge ${props.phoneVerified ? "badge-ok" : "badge-mute"}`}>
                {props.phoneVerified ? t("cuenta.verified") : t("cuenta.pending")}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">{props.phone ? t("cuenta.phoneHint") : t("cuenta.noPhone")}</p>
          <button type="button" onClick={() => abrir("telefono")} className="btn btn-ghost mt-3 w-full" disabled={ocupado}>
            <Icon name="edit" size={15} /> {props.phone ? t("cuenta.changePhone") : t("cuenta.addPhone")}
          </button>
        </div>

        <div className="card p-5">
          <div className={fila}>
            <div className="min-w-0">
              <span className={etiqueta}>{t("cuenta.password")}</span>
              <p className="mt-1 text-sm font-semibold text-slate-800">{props.tieneClave ? t("cuenta.passwordSet") : t("cuenta.passwordNone")}</p>
            </div>
          </div>
          <button type="button" onClick={() => abrir("clave")} className="btn btn-ghost mt-3 w-full" disabled={ocupado}>
            <Icon name="shield" size={15} /> {props.tieneClave ? t("cuenta.changePassword") : t("cuenta.addPassword")}
          </button>
        </div>
      </div>

      {aviso && <p role="status" className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800"><Icon name="check" size={15} /> {aviso}</p>}

      {panel === "telefono" && (
        <div className="card mt-3 p-5">
          {paso === "numero" ? (
            <form onSubmit={pedirCodigo} className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">{t("cuenta.newPhone")}</p>
              <p className="text-xs text-slate-500">{t("cuenta.newPhoneHint")}</p>
              <PhoneField value={numero} onChange={setNumero} error={error || undefined} />
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn btn-primary disabled:opacity-50" disabled={ocupado || !numero}>{ocupado ? "…" : t("cuenta.sendCode")}</button>
                <button type="button" onClick={() => abrir("telefono")} className="btn btn-ghost">{t("cuenta.cancel")}</button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">{t("cuenta.codeTitle")}</p>
              <p className="text-xs text-slate-500">{t("cuenta.codeHint")} <strong className="text-slate-700">{telefonoLegible(numero)}</strong></p>
              <CodigoOtp value={codigo} onChange={setCodigo} onComplete={confirmarCodigo} error={error || undefined} disabled={ocupado} />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => confirmarCodigo(codigo)} className="btn btn-primary disabled:opacity-50" disabled={ocupado || codigo.length !== 6}>{ocupado ? "…" : t("cuenta.confirm")}</button>
                <button type="button" onClick={() => { setPaso("numero"); setCodigo(""); setError(""); setAviso(""); }} className="btn btn-ghost">{t("cuenta.changeNumber")}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {panel === "clave" && (
        <form onSubmit={guardarClave} className="card mt-3 space-y-3 p-5">
          <p className="text-sm font-semibold text-slate-800">{props.tieneClave ? t("cuenta.changePassword") : t("cuenta.addPassword")}</p>
          <p className="text-xs text-slate-500">{t("auth.password")}</p>
          {props.tieneClave && (
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">{t("cuenta.currentPassword")}</span>
              <input className="input" type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} required />
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-600">{t("cuenta.newPassword")}</span>
            <input className="input" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} required />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn btn-primary disabled:opacity-50" disabled={ocupado}>{ocupado ? "…" : t("cuenta.save")}</button>
            <button type="button" onClick={() => abrir("clave")} className="btn btn-ghost">{t("cuenta.cancel")}</button>
          </div>
        </form>
      )}

      {error && panel === null && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </section>
  );
}
