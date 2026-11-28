export const MIN_CLAVE = 10;

/** Misma regla en cliente y servidor: 10 caracteres como mínimo, con letra y número. */
export function esContrasenaValida(pw: string) {
  return pw.length >= MIN_CLAVE && /[A-Za-z]/.test(pw) && /\d/.test(pw);
}
