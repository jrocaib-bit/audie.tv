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
  },
};

export function textosAlta(idioma: string): TextosAlta {
  return TEXTOS[idioma] ?? TEXTOS.es;
}
