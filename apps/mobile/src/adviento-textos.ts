export type IdiomaApp = "es" | "en";

export function idiomaApp(valor: string | undefined): IdiomaApp {
  return valor === "en" ? "en" : "es";
}

export function textosAdviento(lang: IdiomaApp) {
  if (lang === "en") {
    return {
      gratis: "It is free. You need an account: sign up or sign in. There is no subscription and no trial.",
      entrar: "Sign up or sign in",
      oir: "Listen",
      entra: "Sign in to listen",
    };
  }
  return {
    gratis: "Es gratis. Hace falta una cuenta: regístrate o inicia sesión. No se pide suscripción ni prueba.",
    entrar: "Regístrate o inicia sesión",
    oir: "Oír",
    entra: "Entra para oír",
  };
}
