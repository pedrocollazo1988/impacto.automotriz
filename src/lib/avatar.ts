// El avatar viene de un proveedor externo (Google) y se pinta en la cuenta y en
// el checkout: solo se aceptan https para no romper la página con un esquema raro.
const PERMITIDA = /^https:\/\/[^\s"'<>\\]{1,300}$/;

export const urlAvatar = (v: unknown): string | null => (typeof v === "string" && PERMITIDA.test(v) ? v : null);
