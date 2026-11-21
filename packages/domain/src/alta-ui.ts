export type TextosAlta = {
  titulo: string;
  apple: string;
  google: string;
  o: string;
  correo: string;
  enviar: string;
  listo: string;
  condiciones: string;
  privacidad: string;
  cuenta: string;
  entrar: string;
  salir: string;
  borrar: string;
  confirmar: string;
  cancelar: string;
  codigo: string;
  codigoAyuda: string;
  entrarCodigo: string;
  codigoError: string;
};

const TEXTOS: Record<string, TextosAlta> = {
  es: {
    titulo: "La Biblia, cada día.",
    apple: "Continuar con Apple",
    google: "Continuar con Google",
    o: "o",
    correo: "Correo",
    enviar: "Enviar enlace",
    listo: "Listo",
    condiciones: "Condiciones",
    privacidad: "Privacidad",
    cuenta: "Cuenta",
    entrar: "Entrar",
    salir: "Salir",
    borrar: "Borrar cuenta",
    confirmar: "¿Borrar la cuenta?",
    cancelar: "Cancelar",
    codigo: "Código",
    codigoAyuda: "Si el enlace no abre la app, escribe el código de 6 dígitos.",
    entrarCodigo: "Entrar",
    codigoError: "Ese código no vale.",
  },
  en: {
    titulo: "The Bible, every day.",
    apple: "Continue with Apple",
    google: "Continue with Google",
    o: "or",
    correo: "Email",
    enviar: "Send link",
    listo: "Done",
    condiciones: "Terms",
    privacidad: "Privacy",
    cuenta: "Account",
    entrar: "Sign in",
    salir: "Sign out",
    borrar: "Delete account",
    confirmar: "Delete the account?",
    cancelar: "Cancel",
    codigo: "Code",
    codigoAyuda: "If the link does not open the app, enter the 6-digit code.",
    entrarCodigo: "Sign in",
    codigoError: "That code is not valid.",
  },
  it: {
    titulo: "La Bibbia, ogni giorno.",
    apple: "Continua con Apple",
    google: "Continua con Google",
    o: "o",
    correo: "Email",
    enviar: "Invia il link",
    listo: "Fatto",
    condiciones: "Condizioni",
    privacidad: "Privacy",
    cuenta: "Account",
    entrar: "Entra",
    salir: "Esci",
    borrar: "Elimina account",
    confirmar: "Eliminare l'account?",
    cancelar: "Annulla",
    codigo: "Codice",
    codigoAyuda: "Se il link non apre l'app, inserisci il codice a 6 cifre.",
    entrarCodigo: "Entra",
    codigoError: "Quel codice non è valido.",
  },
  pt: {
    titulo: "A Bíblia, cada dia.",
    apple: "Continuar com a Apple",
    google: "Continuar com o Google",
    o: "ou",
    correo: "Email",
    enviar: "Enviar ligação",
    listo: "Feito",
    condiciones: "Condições",
    privacidad: "Privacidade",
    cuenta: "Conta",
    entrar: "Entrar",
    salir: "Sair",
    borrar: "Apagar conta",
    confirmar: "Apagar a conta?",
    cancelar: "Cancelar",
    codigo: "Código",
    codigoAyuda: "Se a ligação não abrir a app, escreve o código de 6 dígitos.",
    entrarCodigo: "Entrar",
    codigoError: "Esse código não é válido.",
  },
  fr: {
    titulo: "La Bible, chaque jour.",
    apple: "Continuer avec Apple",
    google: "Continuer avec Google",
    o: "ou",
    correo: "E-mail",
    enviar: "Envoyer le lien",
    listo: "C'est fait",
    condiciones: "Conditions",
    privacidad: "Confidentialité",
    cuenta: "Compte",
    entrar: "Entrer",
    salir: "Sortir",
    borrar: "Supprimer le compte",
    confirmar: "Supprimer le compte ?",
    cancelar: "Annuler",
    codigo: "Code",
    codigoAyuda: "Si le lien n'ouvre pas l'app, saisis le code à 6 chiffres.",
    entrarCodigo: "Entrer",
    codigoError: "Ce code n'est pas valable.",
  },
  de: {
    titulo: "Die Bibel, jeden Tag.",
    apple: "Mit Apple fortfahren",
    google: "Weiter mit Google",
    o: "oder",
    correo: "E-Mail",
    enviar: "Link senden",
    listo: "Fertig",
    condiciones: "Bedingungen",
    privacidad: "Datenschutz",
    cuenta: "Konto",
    entrar: "Anmelden",
    salir: "Abmelden",
    borrar: "Konto löschen",
    confirmar: "Konto löschen?",
    cancelar: "Abbrechen",
    codigo: "Code",
    codigoAyuda: "Wenn der Link die App nicht öffnet, gib den 6-stelligen Code ein.",
    entrarCodigo: "Anmelden",
    codigoError: "Dieser Code gilt nicht.",
  },
  zh: {
    titulo: "圣经，每一天。",
    apple: "通过 Apple 继续",
    google: "使用 Google 继续",
    o: "或",
    correo: "邮箱",
    enviar: "发送链接",
    listo: "完成",
    condiciones: "条款",
    privacidad: "隐私",
    cuenta: "账户",
    entrar: "登录",
    salir: "退出",
    borrar: "删除账户",
    confirmar: "删除账户？",
    cancelar: "取消",
    codigo: "验证码",
    codigoAyuda: "如果链接无法打开应用，请输入 6 位验证码。",
    entrarCodigo: "登录",
    codigoError: "验证码无效。",
  },
};

export function textosAlta(idioma: string): TextosAlta {
  return TEXTOS[idioma] ?? TEXTOS.es;
}
