type Params = Record<string, string | number | boolean | undefined>;

/** Envía un evento a GA4 si la persona aceptó las cookies y hay ID configurado. */
export function track(evento: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("cookie-consent") !== "yes") return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === "function") gtag("event", evento, params);
}
