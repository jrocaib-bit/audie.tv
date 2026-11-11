export const REMITENTE = "Audite <no-reply@audite.tv>";
export const RESPUESTA = "soporte@audite.tv";

export const URL_WEB = "https://audite.tv";
export const URL_APP = "https://audite.tv/app";
export const URL_AYUDA = "https://audite.tv/ayuda";
export const URL_PRIVACIDAD = "https://audite.tv/privacidad";
export const URL_CUENTA = "https://audite.tv/cuenta";

export const PRECIO_MES = "1,99 € al mes";
export const PRECIO_ANIO = "8,00 € al año";

export type PlanCorreo = "mensual" | "anual";
export type PlataformaCorreo = "App Store" | "Google Play";

export type DatosCorreo = {
  nombre?: string | null;
  correo?: string | null;
  plan?: PlanCorreo;
  precio?: string;
  fecha_fin_prueba?: string;
  fecha_proximo_cobro?: string;
  importe_cobro?: string;
  plataforma?: PlataformaCorreo;
  nombre_reto?: string | null;
  fecha_inicio_reto?: string;
  fecha_fin_acceso?: string | null;
  reto_id?: string;
  token?: string;
  sin_prueba?: boolean;
};

export type IdCorreo =
  | "bienvenida"
  | "aviso_fin_prueba"
  | "primer_cobro"
  | "fin_prueba_sin_cobro"
  | "inactividad_7"
  | "inactividad_14"
  | "recuperacion"
  | "adviento_servicio"
  | "adviento_campana"
  | "confirmacion_boletin"
  | "bienvenida_lista"
  | "acuse_soporte"
  | "confirmacion_lanzamiento";

export function urlBaja(token = ""): string {
  return `https://audite.tv/correo/baja?t=${token}`;
}

export function urlReto(id = ""): string {
  return `https://audite.tv/reto/${id}`;
}

export function saludo(nombre?: string | null): string {
  const limpio = nombre?.trim();
  return limpio ? `Hola, ${limpio}:` : "Hola:";
}

function precioDe(datos: DatosCorreo): string {
  if (datos.precio) return datos.precio;
  return datos.plan === "anual" ? PRECIO_ANIO : PRECIO_MES;
}

function campos(datos: DatosCorreo): Record<string, string> {
  const precio = precioDe(datos);
  return {
    nombre: datos.nombre?.trim() ?? "",
    correo: datos.correo?.trim() ?? "",
    plan: datos.plan ?? "mensual",
    precio,
    fecha_fin_prueba: datos.fecha_fin_prueba ?? "",
    fecha_proximo_cobro: datos.fecha_proximo_cobro ?? "",
    importe_cobro: datos.importe_cobro?.trim() || precio,
    plataforma: datos.plataforma ?? "App Store",
    nombre_reto: datos.nombre_reto?.trim() ?? "",
    fecha_inicio_reto: datos.fecha_inicio_reto ?? "",
    fecha_fin_acceso: datos.fecha_fin_acceso?.trim() ?? "",
    url_web: URL_WEB,
    url_app: URL_APP,
    url_reto: urlReto(datos.reto_id ?? ""),
    url_ayuda: URL_AYUDA,
    url_privacidad: URL_PRIVACIDAD,
    token: datos.token ?? "",
    url_confirmar: `${URL_WEB}/correo/confirmar?t=${datos.token ?? ""}`,
    url_baja: urlBaja(datos.token ?? ""),
    url_cuenta: URL_CUENTA,
  };
}

export function rellenar(texto: string, datos: DatosCorreo): string {
  const mapa = campos(datos);
  return texto.replace(/\{([a-z_]+)\}/g, (_, clave: string) => mapa[clave] ?? "");
}

export function pie(tipo: "transactional" | "marketing", datos: DatosCorreo, ayuda?: string): string {
  const lineaAyuda = ayuda ?? (tipo === "marketing"
    ? "Ayuda: soporte@audite.tv"
    : "Si necesitas ayuda, escribe a soporte@audite.tv.");
  const baja = tipo === "marketing" ? `Si prefieres no recibir este tipo de correos: ${urlBaja(datos.token ?? "")}\n` : "";
  return [
    "—",
    "Este correo lo envía Audite desde no-reply@audite.tv y no admite respuesta.",
    lineaAyuda,
    baja.trimEnd(),
    "Privacidad: https://audite.tv/privacidad",
    "https://audite.tv",
  ].filter((linea) => linea !== "").join("\n");
}

export type Borrador = {
  id: IdCorreo;
  tipo: "transactional" | "marketing";
  asuntoA: string;
  asuntoB: string;
  preheader: string;
  cta: string;
  ctaUrl: string;
  ctaSecundario?: { etiqueta: string; url: string };
  cuerpo: string;
};

const AYUDA_CARGO = "Si este cargo no te encaja, escribe a soporte@audite.tv. El reembolso de un pago de la tienda lo gestiona Apple o Google, en la tienda donde compraste.";

export function borrador(id: IdCorreo, datos: DatosCorreo): Borrador {
  const hola = saludo(datos.nombre);
  const f = (texto: string) => rellenar(texto, datos);
  if (id === "bienvenida") {
    const cobro = datos.sin_prueba ? [] : [f("Tienes 7 días de prueba para recorrer la Escritura con calma, en la app o en https://audite.tv, con la misma cuenta. Si no cancelas antes del {fecha_fin_prueba}, se cobrará el plan {plan} ({precio}) a través de {plataforma}. Puedes cancelar cuando quieras desde tu cuenta de Apple o de Google Play, que es donde se contrata la suscripción; lo explicamos en {url_ayuda}.")];
    return {
      id, tipo: "transactional",
      asuntoA: "Bienvenido a Audite",
      asuntoB: "Tu escucha empieza aquí",
      preheader: "7 días de prueba. La Biblia, de principio a fin.",
      cta: "Empezar a escuchar",
      ctaUrl: URL_APP,
      cuerpo: [hola, "Bienvenido a Audite. Gracias por confiar en nosotros para escuchar la Biblia.", ...cobro, "El 29 de noviembre empieza el Adviento. Si te viene bien, ese día abre el reto Adviento con Isaías: un pasaje para cada día, hasta Nochebuena. El audio, en este lanzamiento, está en español.", "Para entrar, usa el mismo método con el que te registraste (Apple, Google o el enlace que te enviamos al correo).", "Que esta escucha te haga bien.", "El equipo de Audite"].join("\n\n"),
    };
  }
  if (id === "aviso_fin_prueba") {
    return {
      id, tipo: "transactional",
      asuntoA: f("Tu prueba de Audite termina el {fecha_fin_prueba}"),
      asuntoB: "Un aviso sobre tu prueba de 7 días",
      preheader: f("Si no cancelas, el {fecha_proximo_cobro} se cobrará {importe_cobro}."),
      cta: "Seguir escuchando",
      ctaUrl: URL_APP,
      ctaSecundario: { etiqueta: "Cómo cancelar", url: URL_AYUDA },
      cuerpo: [hola, f("Tu prueba gratis de Audite termina el {fecha_fin_prueba}."), f("Si quieres seguir escuchando, no tienes que hacer nada: el {fecha_proximo_cobro} se cobrará {importe_cobro} ({plan}, {precio}) a través de {plataforma}, y la suscripción se renovará hasta que la canceles. Con esa misma cuenta podrás seguir oyendo Audite en el iPhone, en Android y en la web."), f("Si prefieres no continuar, cancela antes de esa fecha en tu cuenta de Apple (Ajustes → tu nombre → Suscripciones) o de Google Play (perfil → Pagos y suscripciones → Suscripciones), según donde te suscribieras. Borrar la app no basta, y desde la web no se cancela. Lo detallamos en {url_ayuda}."), "Gracias por estos días de escucha.", "El equipo de Audite"].join("\n\n"),
    };
  }
  if (id === "primer_cobro") {
    return {
      id, tipo: "transactional",
      asuntoA: "Gracias por quedarte en Audite",
      asuntoB: "Tu suscripción de Audite ya está activa",
      preheader: f("Se ha cobrado {importe_cobro} ({plan}) a través de {plataforma}."),
      cta: "Seguir escuchando",
      ctaUrl: URL_APP,
      cuerpo: [hola, f("Ha terminado tu prueba de 7 días y tu suscripción {plan} de Audite ya está activa. Se ha cobrado {importe_cobro} a través de {plataforma}."), f("Puedes seguir escuchando la Biblia en la app y en https://audite.tv, con la misma cuenta. La próxima renovación será el {fecha_proximo_cobro}, salvo que canceles antes en tu cuenta de Apple o de Google Play ({url_ayuda})."), "Gracias por caminar con nosotros.", "El equipo de Audite"].join("\n\n"),
    };
  }
  if (id === "fin_prueba_sin_cobro") {
    return {
      id, tipo: "transactional",
      asuntoA: "Tu prueba de Audite ha terminado",
      asuntoB: "La prueba ha acabado; aquí estamos si vuelves",
      preheader: "No se ha hecho ningún cargo. Puedes volver cuando quieras.",
      cta: "Volver a Audite",
      ctaUrl: URL_WEB,
      cuerpo: [hola, "Tu prueba de 7 días de Audite ha terminado y no se ha realizado ningún cargo.", "Si un día quieres volver a escuchar, nos encuentras en https://audite.tv y en la app. El plan es 1,99 € al mes u 8,00 € al año, otra vez con 7 días de prueba si tu cuenta de Apple o de Google aún lo permite.", "Gracias por habernos dado estos días.", "El equipo de Audite"].join("\n\n"),
    };
  }
  if (id === "inactividad_7") {
    const vuelta = datos.nombre_reto?.trim()
      ? f("Si te apetece volver, puedes retomar donde lo dejaste en https://audite.tv o en la app, con la misma cuenta. En estos días te puede acompañar el reto {nombre_reto}: un pasaje para cada día, sin prisa.")
      : "Si te apetece volver, puedes retomar donde lo dejaste en https://audite.tv o en la app, con la misma cuenta.";
    return {
      id, tipo: "marketing",
      asuntoA: "Te echamos de menos en Audite",
      asuntoB: "Hay un pasaje esperándote",
      preheader: "Vuelve cuando quieras. El reto de estos días puede ser un buen punto.",
      cta: "Continuar la escucha",
      ctaUrl: URL_APP,
      cuerpo: [hola, "Hace unos días que no te vemos por Audite. No pasa nada: la Escritura sabe esperar.", vuelta, "Que la escucha, cuando vuelvas, te haga bien.", "El equipo de Audite"].join("\n\n"),
    };
  }
  if (id === "inactividad_14") {
    const reto = datos.nombre_reto?.trim() ? [f("El reto {nombre_reto} es un camino sencillo: un pasaje al día, en el ritmo de la Iglesia. Lo encuentras en {url_reto}.")] : [];
    return {
      id, tipo: "marketing",
      asuntoA: "Un camino sencillo para volver a escuchar",
      asuntoB: "Te invitamos a retomar el reto",
      preheader: "Un pasaje al día, sin prisa, en el ritmo del año cristiano.",
      cta: "Abrir el reto",
      ctaUrl: urlReto(datos.reto_id ?? ""),
      cuerpo: [hola, "Solo una nota, con calma. Seguimos aquí si quieres retomar la escucha.", ...reto, f("Si ahora no es el momento, no hay ningún problema. Y si prefieres no recibir más correos como este, puedes darte de baja en {url_baja}."), "Un abrazo,\nEl equipo de Audite"].join("\n\n"),
    };
  }
  if (id === "recuperacion") {
    const acceso = datos.fecha_fin_acceso?.trim() ? [f("Si tu acceso sigue abierto, puedes usar Audite en la app y en la web hasta el {fecha_fin_acceso}. Después no se hará ningún cargo nuevo.")] : [];
    return {
      id, tipo: "marketing",
      asuntoA: "Gracias por haberte detenido en Audite",
      asuntoB: "Si un día quieres volver a escuchar",
      preheader: "Sigues teniendo acceso hasta el final del periodo que ya tenías.",
      cta: "Volver a Audite",
      ctaUrl: URL_WEB,
      cuerpo: [hola, "Hemos registrado la cancelación de tu suscripción. Gracias por el tiempo que has pasado escuchando con nosotros.", ...acceso, "Si un día deseas volver, nos encuentras en https://audite.tv y en la app. La suscripción se vuelve a contratar en el App Store o en Google Play. Estaremos encantados de acompañarte otra vez.", "Que la Palabra te siga haciendo bien.", "El equipo de Audite"].join("\n\n"),
    };
  }
  if (id === "adviento_servicio") {
    return {
      id, tipo: "transactional",
      asuntoA: "El Adviento empieza el 29 de noviembre",
      asuntoB: "Adviento con Isaías, un pasaje cada día",
      preheader: "Un camino de escucha hasta Nochebuena, en Audite.",
      cta: "Abrir el reto de Adviento",
      ctaUrl: "https://audite.tv/reto/adviento-isaias",
      cuerpo: [hola, "El 29 de noviembre comienza el Adviento. En Audite te invitamos a recorrerlo con el reto Adviento con Isaías: un pasaje del profeta para cada día, hasta Nochebuena, en español.", "No sustituye la liturgia de tu parroquia: es un acompañamiento para escuchar la Escritura en estos días de espera.", "El primer domingo puedes abrirlo en la app o en https://audite.tv, con tu cuenta. Si ese día se te pasa, puedes incorporarte cuando te vaya bien.", "Que este Adviento te encuentre en paz.", "El equipo de Audite"].join("\n\n"),
    };
  }
  if (id === "confirmacion_boletin" || id === "confirmacion_lanzamiento") {
    return {
      id, tipo: "transactional",
      asuntoA: "Confirma que quieres correos de Audite",
      asuntoB: "Un paso más para la lista de Audite",
      preheader: "Abre el enlace y pulsa «Confirmar suscripción». Si no has sido tú, ignora este mensaje.",
      cta: "Confirmar suscripción",
      ctaUrl: f("{url_confirmar}"),
      cuerpo: ["Hola:", f("Hemos recibido una petición para enviarte correos de Audite a {correo}."), "Si has sido tú, abre este enlace y pulsa «Confirmar suscripción»:", f("{url_confirmar}"), "Si no has sido tú, ignora este mensaje y no te apuntaremos.", "En esos correos te hablaremos de la escucha y de los tiempos litúrgicos, con calma. Puedes darte de baja cuando quieras. Más detalle en https://audite.tv/privacidad.", "El equipo de Audite"].join("\n\n"),
    };
  }
  if (id === "bienvenida_lista") {
    return {
      id, tipo: "marketing",
      asuntoA: "Bienvenido a los correos de Audite",
      asuntoB: "Ya estás en la lista",
      preheader: "Gracias por confirmar. Puedes darte de baja cuando quieras.",
      cta: "Ir a Audite",
      ctaUrl: URL_WEB,
      cuerpo: ["Hola:", "Gracias por confirmar. A partir de ahora podrás recibir correos de Audite: avisos de la escucha y de los tiempos del año, sin prisa.", "El 29 de noviembre empieza el Adviento. Si te viene bien, ese día abre el reto Adviento con Isaías, en español, en https://audite.tv.", f("Si no quieres seguir recibiéndolos, puedes darte de baja aquí: {url_baja}"), "El detalle de cómo tratamos tus datos está en https://audite.tv/privacidad.", "Un abrazo,\nEl equipo de Audite"].join("\n\n"),
    };
  }
  if (id === "acuse_soporte") {
    return {
      id, tipo: "transactional",
      asuntoA: "Hemos recibido tu mensaje",
      asuntoB: "Tu consulta ha llegado a Audite",
      preheader: "Gracias por escribirnos. Te responderemos como máximo en 48 horas laborables.",
      cta: "Ver la ayuda",
      ctaUrl: URL_AYUDA,
      cuerpo: [hola, "Hemos recibido tu mensaje y te damos las gracias por escribirnos.", "Atendemos de lunes a viernes, de 9:00 a 18:00 (hora de Madrid), salvo festivos nacionales. Te responderemos a este mismo correo como máximo en 48 horas laborables; lo habitual es que contestemos en el día. Mientras tanto, puede que encuentres respuesta en https://audite.tv/ayuda.", "Si nos has escrito por un cargo, una cancelación o un acceso, ten a mano si te suscribiste en el App Store o en Google Play.", "Un abrazo,\nEl equipo de Audite"].join("\n\n"),
    };
  }
  return {
    id: "adviento_campana", tipo: "marketing",
    asuntoA: "Te invitamos a escuchar el Adviento en Audite",
    asuntoB: "Adviento con Isaías — 7 días de prueba",
    preheader: "Un pasaje al día hasta Nochebuena. 7 días gratis; luego 1,99 € al mes u 8,00 € al año.",
    cta: "Empezar 7 días gratis",
    ctaUrl: URL_APP,
    cuerpo: [hola, "El 29 de noviembre comienza el Adviento. Te invitamos a escucharlo con Audite, en el reto Adviento con Isaías: un pasaje del profeta para cada día, hasta Nochebuena, en español.", "Audite es la Biblia en audio, en el canon católico, para oírla de principio a fin, en la app y en la web. Puedes probarla 7 días gratis. Después, 1,99 € al mes u 8,00 € al año, y cancelas cuando quieras, desde el App Store o Google Play, que es donde se contrata la suscripción.", "Empieza, si te apetece, en https://audite.tv.", "Que este Adviento te haga bien.", "El equipo de Audite"].join("\n\n"),
  };
}

export const IDS_CORREO: IdCorreo[] = [
  "bienvenida",
  "aviso_fin_prueba",
  "primer_cobro",
  "fin_prueba_sin_cobro",
  "inactividad_7",
  "inactividad_14",
  "recuperacion",
  "adviento_servicio",
  "adviento_campana",
  "confirmacion_boletin",
  "bienvenida_lista",
  "acuse_soporte",
  "confirmacion_lanzamiento",
];
