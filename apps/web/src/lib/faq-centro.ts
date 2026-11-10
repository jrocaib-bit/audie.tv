export type PreguntaFaq = { id: string; pregunta: string; respuesta: string };
export type SeccionFaq = {
  id: string;
  titulo: string;
  intro?: string;
  cierre?: string;
  preguntas: PreguntaFaq[];
};

const LOGIN = `Puedes entrar de estas formas:

- **Iniciar sesión con Apple**
- Un **enlace mágico** enviado a tu correo (sin contraseña)

La web y la app eligen el idioma según el dispositivo o el navegador.`;

const LOGIN_GOOGLE = `Puedes entrar de estas formas:

- **Iniciar sesión con Apple**
- **Iniciar sesión con Google**
- Un **enlace mágico** enviado a tu correo (sin contraseña)

La web y la app eligen el idioma según el dispositivo o el navegador.`;

const SECCIONES: SeccionFaq[] = [
  {
    id: "que-es-audite",
    titulo: "Qué es Audite",
    preguntas: [
      {
        id: "que-es-audite-pregunta",
        pregunta: "¿Qué es Audite?",
        respuesta: "Audite es la Biblia en audio, para escucharla de principio a fin. Nace para acompañarte en la fe con una lectura íntegra, serena y fiel al canon católico, en la app (iOS y Android), en la web [audite.tv](https://audite.tv) y en el canal de YouTube [@auditetv](https://www.youtube.com/@auditetv).",
      },
      {
        id: "que-textos-incluye",
        pregunta: "¿Qué textos incluye?",
        respuesta: "El canon católico completo: 73 libros (46 del Antiguo Testamento y 27 del Nuevo, con los deuterocanónicos). La lectura es íntegra, partida en episodios de unos 8 a 15 minutos, sin romper la unidad del relato.\n\nEl catálogo de la app y de la web se va ampliando a medida que cada episodio queda listo para escuchar.",
      },
      {
        id: "audite-es-catolico",
        pregunta: "¿Audite es católico?",
        respuesta: "Sí. Audite se sitúa en la fe católica: el canon de 73 libros y, en español, la *Sagrada Biblia*, versión oficial de la Conferencia Episcopal Española (CEE). El respeto al texto y a la Iglesia guía cada decisión.",
      },
      {
        id: "voz-y-musica",
        pregunta: "¿La voz y la música son de una persona?",
        respuesta: "La voz y la música están generadas con IA.",
      },
    ],
  },
  {
    id: "suscripcion-y-precios",
    titulo: "Suscripción y precios",
    preguntas: [
      {
        id: "cuanto-cuesta",
        pregunta: "¿Cuánto cuesta Audite?",
        respuesta: "Hay dos planes:\n\n- **Mensual:** 1,99 € al mes.\n- **Anual:** 8,00 € al año.\n\nLos dos incluyen 7 días de prueba gratis. Puedes cancelar cuando quieras.",
      },
      {
        id: "que-incluye",
        pregunta: "¿Qué incluye la suscripción?",
        respuesta: "Una sola suscripción, ligada a tu cuenta de Audite, te da acceso en el iPhone, en Android y en la web [audite.tv](https://audite.tv): la Biblia en audio según el catálogo publicado y los retos del tiempo litúrgico.\n\nAl principio, la suscripción se contrata solo en el App Store o en Google Play. La web sirve para escuchar con la misma cuenta, no para comprar.\n\nEl canal de YouTube [@auditetv](https://www.youtube.com/@auditetv) se puede ver sin suscripción, cuando haya vídeos publicados.",
      },
      {
        id: "otros-planes",
        pregunta: "¿Hay otros planes (familiar, estudiante, de por vida)?",
        respuesta: "De momento, solo el plan mensual y el anual.",
      },
    ],
  },
  {
    id: "prueba-gratis",
    titulo: "Prueba gratis",
    preguntas: [
      {
        id: "como-funciona-la-prueba",
        pregunta: "¿Cómo funciona la prueba de 7 días?",
        respuesta: "Al suscribirte por primera vez puedes escuchar Audite durante 7 días sin coste. Si no cancelas antes de que termine la prueba, se cobra el plan que hayas elegido (1,99 € al mes u 8,00 € al año) y la suscripción se renueva sola hasta que la canceles.\n\nPara no ser cargado, cancela la prueba al menos 24 horas antes de que acabe, desde la cuenta de Apple o de Google con la que la contrataste (ver [Cancelar la suscripción](#cancelar-la-suscripción)).",
      },
      {
        id: "prueba-mas-de-una-vez",
        pregunta: "¿La prueba se puede usar más de una vez?",
        respuesta: "Si te suscribes a través de **Apple**, la prueba gratis se puede usar **una sola vez por grupo de suscripción y por Cuenta de Apple**. Si esa cuenta ya ha usado la prueba de Audite, no se vuelve a ofrecer.",
      },
      {
        id: "metodo-de-pago",
        pregunta: "¿Tengo que poner un método de pago para empezar la prueba?",
        respuesta: "En el **App Store**, sí: para empezar la prueba hace falta un método de pago en esa Cuenta de Apple. No se cobra nada si cancelas a tiempo, al menos 24 horas antes de que termine la prueba.",
      },
    ],
  },
  {
    id: "cancelar-la-suscripción",
    titulo: "Cancelar la suscripción",
    intro: "La suscripción se cancela siempre en la tienda donde la contrataste (App Store o Google Play). Borrar la app no basta, y en la web no se compra ni se cancela.",
    cierre: "**Importante:** borrar la app no cancela la suscripción. Hay que hacerlo en Ajustes de Apple o en Google Play, según donde la contrataste.",
    preguntas: [
      {
        id: "cancelar-iphone",
        pregunta: "¿Cómo cancelo si me suscribí en el iPhone o el iPad?",
        respuesta: "La suscripción de iOS la gestiona Apple. En tu iPhone o iPad:\n\n1. Abre **Ajustes**.\n2. Pulsa tu nombre (tu Cuenta de Apple).\n3. Pulsa **Suscripciones**.\n4. Pulsa **Audite**.\n5. Pulsa **Cancelar suscripción**. Puede que tengas que desplazarte hacia abajo para ver el botón. Si no aparece, o ves un aviso de caducidad en rojo, la suscripción ya está cancelada.\n\nTambién puedes gestionarla en [account.apple.com](https://account.apple.com) iniciando sesión con la misma Cuenta de Apple.",
      },
      {
        id: "cancelar-android",
        pregunta: "¿Cómo cancelo si me suscribí en Android?",
        respuesta: "La suscripción de Android la gestiona Google Play. En tu dispositivo Android:\n\n1. Abre la app **Google Play Store**.\n2. Arriba a la derecha, pulsa el icono de tu perfil.\n3. Pulsa **Pagos y suscripciones** y, después, **Suscripciones**.\n4. Elige la suscripción de **Audite**.\n5. Pulsa **Cancelar suscripción** y sigue las indicaciones.\n\nAsegúrate de haber iniciado sesión en la cuenta de Google con la que contrataste Audite.",
      },
      {
        id: "cancelar-web",
        pregunta: "¿Puedo cancelar desde la web?",
        respuesta: "No. La web es para escuchar con tu cuenta. La cancelación (y un eventual reembolso) se hace siempre en el App Store o en Google Play, según donde compraste.",
      },
      {
        id: "que-ocurre-al-cancelar",
        pregunta: "¿Qué ocurre cuando cancelo?",
        respuesta: "Dejas de renovar. Sigues pudiendo escuchar Audite —en la app y en la web— hasta el final del periodo ya pagado (o hasta el final de la prueba, si cancelas durante esos 7 días). Al terminar ese plazo, no se hace un cargo nuevo.",
      },
    ],
  },
  {
    id: "restaurar-compras",
    titulo: "Restaurar compras",
    preguntas: [
      {
        id: "reinstalar",
        pregunta: "¿Qué hago si reinstalé la app o cambié de móvil y no me reconoce la suscripción?",
        respuesta: "Entra en Audite con la misma cuenta. La suscripción está ligada a esa cuenta y vale en iOS, Android y la web.\n\nSi pagaste en el App Store, usa también la misma Cuenta de Apple; si pagaste en Google Play, la misma cuenta de Google. Después, en la app: **Ajustes › Restaurar compras** (la opción está también en la pantalla de planes). En la web no se restauran compras.\n\nSi sigue sin aparecer, comprueba que no hayas iniciado sesión con otra cuenta de tienda o de Audite, y escríbenos a [soporte@audite.tv](mailto:soporte@audite.tv).",
      },
      {
        id: "escuchar-en-otro-aparato",
        pregunta: "¿Puedo escuchar en Android o en la web una suscripción que pagué en el iPhone?",
        respuesta: "Sí. Con la misma cuenta de Audite puedes escuchar en el iPhone, en Android y en [audite.tv](https://audite.tv). Para cancelar o pedir un reembolso, sigue usando la tienda donde compraste (en este caso, Apple).",
      },
    ],
  },
  {
    id: "cuenta-e-inicio-de-sesion",
    titulo: "Cuenta e inicio de sesión",
    preguntas: [
      {
        id: "crear-cuenta",
        pregunta: "¿Cómo creo una cuenta o inicio sesión?",
        respuesta: LOGIN,
      },
      {
        id: "no-llega-el-enlace",
        pregunta: "No me llega el enlace para entrar.",
        respuesta: "Revisa la bandeja de entrada y la carpeta de correo no deseado del mismo email que indicaste. El mensaje sale desde `no-reply@audite.tv` y no admite respuesta. Si no aparece en unos minutos, pide un enlace nuevo. Si el problema continúa, escríbenos a [soporte@audite.tv](mailto:soporte@audite.tv).",
      },
      {
        id: "borrar-cuenta",
        pregunta: "¿Puedo cambiar el correo de mi cuenta o borrar la cuenta?",
        respuesta: "Puedes borrar tu cuenta así:\n\n- En la app: **Ajustes › Eliminar cuenta**.\n- En la web: **Cuenta › Borrar cuenta** (entra en [audite.tv/cuenta](https://audite.tv/cuenta) y pulsa **Borrar cuenta**).\n\nTambién puedes escribirnos a [soporte@audite.tv](mailto:soporte@audite.tv). El detalle está en [audite.tv/privacidad](https://audite.tv/privacidad).",
      },
    ],
  },
  {
    id: "idiomas-y-traducciones",
    titulo: "Idiomas y traducciones",
    preguntas: [
      {
        id: "en-que-idiomas",
        pregunta: "¿En qué idiomas está Audite?",
        respuesta: "**Audio:** Disponible en español; más idiomas pronto.\n\nLa **interfaz** de la app y de la web está en siete idiomas: español, inglés, italiano, portugués, francés, alemán y chino. Si no eliges uno, se toma el del dispositivo o del navegador.",
      },
      {
        id: "traduccion-espanol",
        pregunta: "¿Qué traducción se oye en español?",
        respuesta: "La *Sagrada Biblia*, versión oficial de la Conferencia Episcopal Española (CEE).\n\nCuando se abran otros idiomas de audio, se usarán versiones católicas ya elegidas (por ejemplo, RSV-2CE en inglés o la CEI 2008 en italiano). No las anunciamos como disponibles todavía, ni ponemos fecha.",
      },
      {
        id: "cambiar-idioma",
        pregunta: "¿Cómo cambio el idioma de la interfaz?",
        respuesta: "- En la app: **Ajustes › Idioma**.\n- En la web: el selector de idioma está en el pie de página (y se recuerda en este navegador).\n\nEso cambia la interfaz, no el audio. El audio: disponible en español; más idiomas pronto.",
      },
    ],
  },
  {
    id: "descargas-y-escucha-sin-conexion",
    titulo: "Descargas y escucha sin conexión",
    preguntas: [
      {
        id: "descargar",
        pregunta: "¿Puedo descargar episodios y escucharlos sin conexión?",
        respuesta: "De momento se escucha con conexión a internet. Si en el futuro se pueden descargar episodios para oírlos sin red, te avisaremos. No lo prometemos ahora.",
      },
      {
        id: "varios-aparatos",
        pregunta: "¿Puedo escuchar Audite en la web o en varios aparatos?",
        respuesta: "Sí. Con tu cuenta puedes escuchar en la web [audite.tv](https://audite.tv) y en la app para iOS y Android. La suscripción es la misma.",
      },
    ],
  },
  {
    id: "retos",
    titulo: "Retos",
    preguntas: [
      {
        id: "que-son-los-retos",
        pregunta: "¿Qué son los retos?",
        respuesta: "Los retos son un camino de escucha para el tiempo litúrgico: un pasaje cada día, para acompañar Adviento, Navidad, Cuaresma, Semana Santa, Pascua o el Tiempo ordinario. No sustituyen la liturgia de la Iglesia: te invitan a escuchar la Escritura en el ritmo del año cristiano.",
      },
      {
        id: "adviento-2026",
        pregunta: "¿Cuál es el reto de Adviento 2026?",
        respuesta: "El 29 de noviembre de 2026, primer domingo de Adviento, empieza el reto **Adviento con Isaías**: un pasaje de Isaías para cada día, hasta Nochebuena. La insignia prevista de este reto se llama **Centinela**.\n\nLos dos últimos días, según el calendario del reto en la app, son:\n\n- 23 de diciembre: *Dios con nosotros* (Is 8,8–10).\n- 24 de diciembre: *Ya llega* (Is 62,11–12).",
      },
      {
        id: "navidad",
        pregunta: "¿Qué reto hay en Navidad?",
        respuesta: "Del 25 de diciembre de 2026 al 10 de enero de 2027 (Bautismo del Señor) está el reto **Navidad: los relatos de la infancia**, en 17 días, con pasajes de Lucas, Mateo y Juan. La insignia prevista se llama **Belén**. Este recorrido está aprobado.",
      },
      {
        id: "mas-retos",
        pregunta: "¿Habrá más retos después?",
        respuesta: "En la app están previstos también: **Cuaresma en 40 días** (desde el Miércoles de Ceniza, 10 de febrero de 2027), **Semana Santa: la Pasión**, **50 días de Pascua: Hechos** (hasta Pentecostés, 16 de mayo de 2027) y un recorrido de **Tiempo ordinario** por el evangelio de Marcos. Los retos de fiestas y santoral aún no están definidos.",
      },
      {
        id: "dia-perdido",
        pregunta: "¿Qué pasa si me pierdo un día?",
        respuesta: "Puedes incorporarte cuando te vaya bien: lo importante es escuchar.",
      },
    ],
  },
  {
    id: "problemas-de-reproduccion",
    titulo: "Problemas de reproducción",
    preguntas: [
      {
        id: "no-se-oye",
        pregunta: "No se oye el episodio, se corta o no carga.",
        respuesta: "De momento, Audite se escucha con conexión a internet. Prueba, por este orden:\n\n1. Comprueba la conexión.\n2. Cierra Audite y vuelve a abrirla, o reinicia el teléfono.\n3. Asegúrate de haber iniciado sesión y de que la prueba o la suscripción sigan activas.\n4. Actualiza la app (App Store o Google Play) o recarga la página en [audite.tv](https://audite.tv).\n5. Prueba con otro episodio: si solo falla uno, puede que ese audio aún no esté disponible.\n\nSi sigue sin ir, escríbenos a [soporte@audite.tv](mailto:soporte@audite.tv) e indica, si puedes, el aparato (iPhone o Android), el episodio y si estás en la app o en la web.",
      },
      {
        id: "audio-y-texto",
        pregunta: "El audio y el texto no coinciden, o creo que hay un error en un pasaje.",
        respuesta: "Gracias por avisarnos. En español seguimos la versión oficial de la CEE; si hay una errata o un desajuste, queremos corregirlo. Escríbenos a [soporte@audite.tv](mailto:soporte@audite.tv) con el libro, el capítulo y, si puedes, el minuto. No cambiamos el texto sagrado por preferencia personal: si algo suena distinto, lo cotejamos con la traducción de referencia.",
      },
    ],
  },
  {
    id: "privacidad-y-datos",
    titulo: "Privacidad y datos",
    preguntas: [
      {
        id: "que-datos",
        pregunta: "¿Qué datos guarda Audite y para qué?",
        respuesta: "Para crear tu cuenta usamos el inicio de sesión con Apple o el correo al que te enviamos el enlace de acceso. Los avisos de alta y de cuenta salen desde `no-reply@audite.tv`.\n\nEl detalle de qué datos tratamos, con qué fin y cómo puedes ejercer tus derechos está en nuestra política de privacidad: [audite.tv/privacidad](https://audite.tv/privacidad).",
      },
      {
        id: "baja-y-supresion",
        pregunta: "¿Cómo pido la baja de correos o la supresión de mi cuenta?",
        respuesta: "Puedes borrar tu cuenta desde la app (**Ajustes › Eliminar cuenta**) o desde la web (**Cuenta › Borrar cuenta**, en [audite.tv/cuenta](https://audite.tv/cuenta)). También puedes escribirnos a [soporte@audite.tv](mailto:soporte@audite.tv).\n\nSi te apuntas a la lista de correo con el formulario **Avísame**, marcas la casilla de consentimiento y confirmas el alta en el enlace que te enviamos (doble opt-in). Los correos comerciales llevan un enlace de baja (también en [audite.tv/correo/baja](https://audite.tv/correo/baja), con el enlace personal que te enviamos). Úsalo si no quieres seguir recibiéndolos, o escríbenos a la misma dirección. El correo `no-reply@audite.tv` no admite respuestas.",
      },
    ],
  },
  {
    id: "contacto-con-soporte",
    titulo: "Contacto con soporte",
    preguntas: [
      {
        id: "como-os-escribo",
        pregunta: "¿Cómo os escribo?",
        respuesta: "Estaremos encantados de ayudarte. Puedes escribirnos de estas dos formas:\n\n- Con el **formulario de contacto** en [audite.tv/contacto](https://audite.tv/contacto) (nombre, correo, mensaje y la casilla de privacidad).\n- Por correo, a **[soporte@audite.tv](mailto:soporte@audite.tv)**.\n\nEste centro de ayuda está también en [audite.tv/ayuda](https://audite.tv/ayuda). Cuéntanos, si puedes, si usas iPhone, Android o la web, y en qué podemos echarte una mano.\n\nEl correo `no-reply@audite.tv` es solo de envío (altas y avisos de cuenta): no leas ni contestes por esa dirección, porque no recibimos lo que llega ahí.",
      },
    ],
  },
];

export function seccionesAyuda(google = false): SeccionFaq[] {
  return SECCIONES.map((seccion) => ({
    ...seccion,
    preguntas: seccion.preguntas.map((pregunta) =>
      pregunta.id === "crear-cuenta" ? { ...pregunta, respuesta: google ? LOGIN_GOOGLE : LOGIN } : pregunta,
    ),
  }));
}

export function textoAyuda(google = false): string {
  return seccionesAyuda(google)
    .flatMap((seccion) => [seccion.titulo, seccion.intro ?? "", ...seccion.preguntas.flatMap((pregunta) => [pregunta.pregunta, pregunta.respuesta]), seccion.cierre ?? ""])
    .join("\n");
}
