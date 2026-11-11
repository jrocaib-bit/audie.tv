export type DiaAnio = { es: string; en: string; cita: string };
export type RetoAnioDato = { id: string; tiempo: string; slug: { es: string; en: string }; titulo: { es: string; en: string }; explica: { es: string; en: string }; fijo: boolean; dias: DiaAnio[] };

export const RETOS_ANIO: RetoAnioDato[] = [
  {
    "id": "adviento-isaias",
    "tiempo": "adviento",
    "slug": {
      "es": "adviento",
      "en": "advent"
    },
    "titulo": {
      "es": "Adviento con Isaías",
      "en": "Advent with Isaiah"
    },
    "explica": {
      "es": "Un pasaje de Isaías cada día, hasta Nochebuena.",
      "en": "A passage from Isaiah each day, until Christmas Eve."
    },
    "fijo": true,
    "dias": [
      {
        "es": "La montaña",
        "en": "The mountain",
        "cita": "Is 2,1–5"
      },
      {
        "es": "Aquí estoy",
        "en": "Here I am",
        "cita": "Is 6,1–8"
      },
      {
        "es": "El Enmanuel",
        "en": "The Emmanuel",
        "cita": "Is 7,10–14"
      },
      {
        "es": "Un niño",
        "en": "A child",
        "cita": "Is 9,1–6"
      },
      {
        "es": "El retoño",
        "en": "The shoot",
        "cita": "Is 11,1–9"
      },
      {
        "es": "El cántico",
        "en": "The song",
        "cita": "Is 12,1–6"
      },
      {
        "es": "El banquete",
        "en": "The banquet",
        "cita": "Is 25,6–9"
      },
      {
        "es": "Ciudad fuerte",
        "en": "A strong city",
        "cita": "Is 26,1–6"
      },
      {
        "es": "El desierto florece",
        "en": "The desert blooms",
        "cita": "Is 35,1–10"
      },
      {
        "es": "Preparad el camino",
        "en": "Prepare the way",
        "cita": "Is 40,1–11"
      },
      {
        "es": "Los que esperan",
        "en": "Those who wait",
        "cita": "Is 40,27–31"
      },
      {
        "es": "No temas",
        "en": "Do not fear",
        "cita": "Is 41,8–13"
      },
      {
        "es": "El siervo",
        "en": "The servant",
        "cita": "Is 42,1–7"
      },
      {
        "es": "Yo te redimí",
        "en": "I have redeemed you",
        "cita": "Is 43,1–7"
      },
      {
        "es": "Luz de las naciones",
        "en": "A light to the nations",
        "cita": "Is 49,1–6"
      },
      {
        "es": "Qué hermosos los pies",
        "en": "How beautiful the feet",
        "cita": "Is 52,7–10"
      },
      {
        "es": "El siervo herido",
        "en": "The wounded servant",
        "cita": "Is 53,1–12"
      },
      {
        "es": "Ensancha la tienda",
        "en": "Enlarge the tent",
        "cita": "Is 54,1–10"
      },
      {
        "es": "Venid a las aguas",
        "en": "Come to the waters",
        "cita": "Is 55,1–11"
      },
      {
        "es": "El ayuno",
        "en": "The fast",
        "cita": "Is 58,6–12"
      },
      {
        "es": "Levántate",
        "en": "Arise",
        "cita": "Is 60,1–6"
      },
      {
        "es": "El espíritu",
        "en": "The spirit",
        "cita": "Is 61,1–4"
      },
      {
        "es": "No callaré",
        "en": "I will not keep silent",
        "cita": "Is 62,1–5"
      },
      {
        "es": "Alegraos",
        "en": "Rejoice",
        "cita": "Is 66,10–14"
      },
      {
        "es": "Un rey justo",
        "en": "A righteous king",
        "cita": "Is 32,1–4"
      },
      {
        "es": "Mira a tu salvador",
        "en": "See your savior",
        "cita": "Is 62,10–12"
      }
    ]
  },
  {
    "id": "navidad-infancia",
    "tiempo": "navidad",
    "slug": {
      "es": "navidad",
      "en": "christmas"
    },
    "titulo": {
      "es": "Navidad: los relatos de la infancia",
      "en": "Christmas: the infancy accounts"
    },
    "explica": {
      "es": "Los relatos del nacimiento, día a día.",
      "en": "The nativity accounts, day by day."
    },
    "fijo": true,
    "dias": [
      {
        "es": "Zacarías",
        "en": "Zechariah",
        "cita": "Lc 1,5–25"
      },
      {
        "es": "La anunciación",
        "en": "The annunciation",
        "cita": "Lc 1,26–38"
      },
      {
        "es": "La visitación",
        "en": "The visitation",
        "cita": "Lc 1,39–45"
      },
      {
        "es": "El cántico de María",
        "en": "Mary's song",
        "cita": "Lc 1,46–55"
      },
      {
        "es": "El nombre de Juan",
        "en": "The name of John",
        "cita": "Lc 1,57–66"
      },
      {
        "es": "El cántico de Zacarías",
        "en": "Zechariah's song",
        "cita": "Lc 1,67–79"
      },
      {
        "es": "El sueño de José",
        "en": "Joseph's dream",
        "cita": "Mt 1,18–25"
      },
      {
        "es": "Belén",
        "en": "Bethlehem",
        "cita": "Lc 2,1–7"
      },
      {
        "es": "Los pastores",
        "en": "The shepherds",
        "cita": "Lc 2,8–20"
      },
      {
        "es": "La luz que vino al mundo",
        "en": "The light that came into the world",
        "cita": "Jn 1,1–18"
      },
      {
        "es": "Simeón y Ana",
        "en": "Simeon and Anna",
        "cita": "Lc 2,22–38"
      },
      {
        "es": "El camino de Egipto",
        "en": "The road to Egypt",
        "cita": "Mt 2,13–23"
      },
      {
        "es": "Una estrella en Oriente",
        "en": "A star in the East",
        "cita": "Mt 2,1–12"
      },
      {
        "es": "Una voz en el desierto",
        "en": "A voice in the desert",
        "cita": "Mt 3,1–12"
      },
      {
        "es": "En la casa de mi Padre",
        "en": "In my Father's house",
        "cita": "Lc 2,41–52"
      },
      {
        "es": "Las tinajas de Caná",
        "en": "The jars at Cana",
        "cita": "Jn 2,1–11"
      },
      {
        "es": "Los cielos abiertos",
        "en": "The heavens opened",
        "cita": "Mt 3,13–17"
      }
    ]
  },
  {
    "id": "cuaresma-40",
    "tiempo": "cuaresma",
    "slug": {
      "es": "cuaresma",
      "en": "lent"
    },
    "titulo": {
      "es": "Cuaresma en 40 días",
      "en": "Lent in 40 days"
    },
    "explica": {
      "es": "Cuarenta días de escucha hacia la Pascua.",
      "en": "Forty days of listening toward Easter."
    },
    "fijo": true,
    "dias": [
      {
        "es": "Un pueblo esclavo",
        "en": "A people enslaved",
        "cita": "Ex 1,8–14"
      },
      {
        "es": "El niño del río",
        "en": "The child of the river",
        "cita": "Ex 2,1–10"
      },
      {
        "es": "Moisés huye",
        "en": "Moses flees",
        "cita": "Ex 2,11–22"
      },
      {
        "es": "La zarza ardiente",
        "en": "The burning bush",
        "cita": "Ex 3,1–15"
      },
      {
        "es": "La vara",
        "en": "The staff",
        "cita": "Ex 4,1–17"
      },
      {
        "es": "Deja ir a mi pueblo",
        "en": "Let my people go",
        "cita": "Ex 5,1–9"
      },
      {
        "es": "Yo soy el Señor",
        "en": "I am the Lord",
        "cita": "Ex 6,2–8"
      },
      {
        "es": "El Nilo",
        "en": "The Nile",
        "cita": "Ex 7,14–25"
      },
      {
        "es": "La cena",
        "en": "The supper",
        "cita": "Ex 12,1–14"
      },
      {
        "es": "La salida",
        "en": "The departure",
        "cita": "Ex 12,29–42"
      },
      {
        "es": "La columna",
        "en": "The pillar",
        "cita": "Ex 13,17–22"
      },
      {
        "es": "El mar",
        "en": "The sea",
        "cita": "Ex 14,10–31"
      },
      {
        "es": "El cántico",
        "en": "The song",
        "cita": "Ex 15,1–18"
      },
      {
        "es": "El maná",
        "en": "The manna",
        "cita": "Ex 16,1–18"
      },
      {
        "es": "Agua de la roca",
        "en": "Water from the rock",
        "cita": "Ex 17,1–7"
      },
      {
        "es": "En el Sinaí",
        "en": "At Sinai",
        "cita": "Ex 19,1–8"
      },
      {
        "es": "Las diez palabras",
        "en": "The ten words",
        "cita": "Ex 20,1–17"
      },
      {
        "es": "La sangre de la alianza",
        "en": "The blood of the covenant",
        "cita": "Ex 24,3–11"
      },
      {
        "es": "El becerro",
        "en": "The calf",
        "cita": "Ex 32,1–14"
      },
      {
        "es": "El nombre",
        "en": "The name",
        "cita": "Ex 34,4–10"
      },
      {
        "es": "El bautismo",
        "en": "The baptism",
        "cita": "Mt 3,13–17"
      },
      {
        "es": "Cuarenta días",
        "en": "Forty days",
        "cita": "Mt 4,1–11"
      },
      {
        "es": "Bienaventuranzas",
        "en": "The beatitudes",
        "cita": "Mt 5,1–12"
      },
      {
        "es": "Sal y luz",
        "en": "Salt and light",
        "cita": "Mt 5,13–16"
      },
      {
        "es": "El enemigo",
        "en": "The enemy",
        "cita": "Mt 5,38–48"
      },
      {
        "es": "La oración",
        "en": "The prayer",
        "cita": "Mt 6,5–15"
      },
      {
        "es": "Los pájaros",
        "en": "The birds",
        "cita": "Mt 6,25–34"
      },
      {
        "es": "La casa en la roca",
        "en": "The house on the rock",
        "cita": "Mt 7,24–29"
      },
      {
        "es": "La tempestad",
        "en": "The storm",
        "cita": "Mt 8,23–27"
      },
      {
        "es": "La mesa",
        "en": "The table",
        "cita": "Mt 9,9–13"
      },
      {
        "es": "Venid a mí",
        "en": "Come to me",
        "cita": "Mt 11,25–30"
      },
      {
        "es": "El sembrador",
        "en": "The sower",
        "cita": "Mt 13,1–9"
      },
      {
        "es": "Sobre las aguas",
        "en": "Upon the waters",
        "cita": "Mt 14,22–33"
      },
      {
        "es": "Tú eres Pedro",
        "en": "You are Peter",
        "cita": "Mt 16,13–20"
      },
      {
        "es": "El monte",
        "en": "The mountain",
        "cita": "Mt 17,1–9"
      },
      {
        "es": "Setenta veces",
        "en": "Seventy times",
        "cita": "Mt 18,21–35"
      },
      {
        "es": "Los jornaleros",
        "en": "The laborers",
        "cita": "Mt 20,1–16"
      },
      {
        "es": "El gran mandamiento",
        "en": "The great commandment",
        "cita": "Mt 22,34–40"
      },
      {
        "es": "Tuve hambre",
        "en": "I was hungry",
        "cita": "Mt 25,31–46"
      },
      {
        "es": "Getsemaní",
        "en": "Gethsemane",
        "cita": "Mt 26,36–46"
      }
    ]
  },
  {
    "id": "semana-santa-pasion",
    "tiempo": "semana-santa",
    "slug": {
      "es": "semana-santa",
      "en": "holy-week"
    },
    "titulo": {
      "es": "Semana Santa: la Pasión",
      "en": "Holy Week: the Passion"
    },
    "explica": {
      "es": "La Pasión, en los días de esa semana.",
      "en": "The Passion, across that week."
    },
    "fijo": true,
    "dias": [
      {
        "es": "La entrada",
        "en": "The entry",
        "cita": "Mt 21,1–11"
      },
      {
        "es": "La cena",
        "en": "The supper",
        "cita": "Mc 14,12–25"
      },
      {
        "es": "El olivar",
        "en": "The olive grove",
        "cita": "Lc 22,39–46"
      },
      {
        "es": "El lavatorio",
        "en": "The washing of feet",
        "cita": "Jn 13,1–15"
      },
      {
        "es": "Ante el consejo",
        "en": "Before the council",
        "cita": "Mt 26,57–68"
      },
      {
        "es": "La cruz",
        "en": "The cross",
        "cita": "Mc 15,16–32"
      },
      {
        "es": "En tus manos",
        "en": "Into your hands",
        "cita": "Lc 23,33–46"
      },
      {
        "es": "Todo está cumplido",
        "en": "It is finished",
        "cita": "Jn 19,28–37"
      }
    ]
  },
  {
    "id": "pascua-hechos",
    "tiempo": "pascua",
    "slug": {
      "es": "pascua",
      "en": "easter"
    },
    "titulo": {
      "es": "50 días de Pascua: Hechos",
      "en": "50 days of Easter: Acts"
    },
    "explica": {
      "es": "Cincuenta días con el libro de los Hechos.",
      "en": "Fifty days with the book of Acts."
    },
    "fijo": true,
    "dias": [
      {
        "es": "La espera",
        "en": "The waiting",
        "cita": "Hch 1,1–11"
      },
      {
        "es": "Matías",
        "en": "Matthias",
        "cita": "Hch 1,12–26"
      },
      {
        "es": "El viento",
        "en": "The wind",
        "cita": "Hch 2,1–13"
      },
      {
        "es": "Pedro se levanta",
        "en": "Peter stands up",
        "cita": "Hch 2,14–21"
      },
      {
        "es": "Qué hemos de hacer",
        "en": "What shall we do",
        "cita": "Hch 2,37–41"
      },
      {
        "es": "La casa común",
        "en": "The common house",
        "cita": "Hch 2,42–47"
      },
      {
        "es": "En su nombre",
        "en": "In his name",
        "cita": "Hch 3,1–10"
      },
      {
        "es": "La piedra",
        "en": "The stone",
        "cita": "Hch 4,1–12"
      },
      {
        "es": "La oración",
        "en": "The prayer",
        "cita": "Hch 4,23–31"
      },
      {
        "es": "Un solo corazón",
        "en": "One heart",
        "cita": "Hch 4,32–37"
      },
      {
        "es": "Los pórticos",
        "en": "The porticoes",
        "cita": "Hch 5,12–16"
      },
      {
        "es": "Hay que obedecer",
        "en": "We must obey",
        "cita": "Hch 5,17–32"
      },
      {
        "es": "Los siete",
        "en": "The seven",
        "cita": "Hch 6,1–7"
      },
      {
        "es": "El rostro",
        "en": "The face",
        "cita": "Hch 6,8–15"
      },
      {
        "es": "Esteban",
        "en": "Stephen",
        "cita": "Hch 7,54–60"
      },
      {
        "es": "Samaría",
        "en": "Samaria",
        "cita": "Hch 8,4–8"
      },
      {
        "es": "El camino de Gaza",
        "en": "The road to Gaza",
        "cita": "Hch 8,26–40"
      },
      {
        "es": "Saulo",
        "en": "Saul",
        "cita": "Hch 9,1–19"
      },
      {
        "es": "En Jerusalén",
        "en": "In Jerusalem",
        "cita": "Hch 9,26–31"
      },
      {
        "es": "Tabita",
        "en": "Tabitha",
        "cita": "Hch 9,36–43"
      },
      {
        "es": "La visión",
        "en": "The vision",
        "cita": "Hch 10,1–16"
      },
      {
        "es": "Sin acepción",
        "en": "No partiality",
        "cita": "Hch 10,34–43"
      },
      {
        "es": "En casa de Cornelio",
        "en": "In Cornelius's house",
        "cita": "Hch 10,44–48"
      },
      {
        "es": "Antioquía",
        "en": "Antioch",
        "cita": "Hch 11,19–26"
      },
      {
        "es": "La puerta",
        "en": "The gate",
        "cita": "Hch 12,1–17"
      },
      {
        "es": "Enviados",
        "en": "Sent out",
        "cita": "Hch 13,1–3"
      },
      {
        "es": "El discurso",
        "en": "The speech",
        "cita": "Hch 13,16–25"
      },
      {
        "es": "Se vuelven a las naciones",
        "en": "They turn to the nations",
        "cita": "Hch 13,44–52"
      },
      {
        "es": "Listra",
        "en": "Lystra",
        "cita": "Hch 14,8–18"
      },
      {
        "es": "La gracia",
        "en": "Grace",
        "cita": "Hch 15,1–11"
      },
      {
        "es": "La carta",
        "en": "The letter",
        "cita": "Hch 15,22–29"
      },
      {
        "es": "Macedonia",
        "en": "Macedonia",
        "cita": "Hch 16,6–10"
      },
      {
        "es": "Lidia",
        "en": "Lydia",
        "cita": "Hch 16,11–15"
      },
      {
        "es": "El canto",
        "en": "The song",
        "cita": "Hch 16,25–34"
      },
      {
        "es": "El Areópago",
        "en": "The Areopagus",
        "cita": "Hch 17,16–28"
      },
      {
        "es": "Algunos creyeron",
        "en": "Some believed",
        "cita": "Hch 17,32–34"
      },
      {
        "es": "Corinto",
        "en": "Corinth",
        "cita": "Hch 18,1–11"
      },
      {
        "es": "Apolo",
        "en": "Apollos",
        "cita": "Hch 18,24–28"
      },
      {
        "es": "Éfeso",
        "en": "Ephesus",
        "cita": "Hch 19,1–7"
      },
      {
        "es": "El alboroto",
        "en": "The uproar",
        "cita": "Hch 19,23–28"
      },
      {
        "es": "Tróade",
        "en": "Troas",
        "cita": "Hch 20,7–12"
      },
      {
        "es": "El adiós",
        "en": "The farewell",
        "cita": "Hch 20,17–27"
      },
      {
        "es": "En la playa",
        "en": "On the shore",
        "cita": "Hch 20,32–38"
      },
      {
        "es": "Ágabo",
        "en": "Agabus",
        "cita": "Hch 21,10–14"
      },
      {
        "es": "Cuenta el camino",
        "en": "Tell the way",
        "cita": "Hch 22,6–16"
      },
      {
        "es": "Ánimo",
        "en": "Take courage",
        "cita": "Hch 23,11"
      },
      {
        "es": "Ante Agripa",
        "en": "Before Agrippa",
        "cita": "Hch 26,12–23"
      },
      {
        "es": "La tormenta",
        "en": "The storm",
        "cita": "Hch 27,21–26"
      },
      {
        "es": "Malta",
        "en": "Malta",
        "cita": "Hch 28,1–10"
      },
      {
        "es": "Roma",
        "en": "Rome",
        "cita": "Hch 28,23–31"
      }
    ]
  },
  {
    "id": "ordinario-evangelio",
    "tiempo": "ordinario",
    "slug": {
      "es": "ordinario",
      "en": "ordinary"
    },
    "titulo": {
      "es": "Tiempo ordinario: un evangelio entero",
      "en": "Ordinary Time: a whole Gospel"
    },
    "explica": {
      "es": "Un evangelio, de principio a fin, en Tiempo ordinario.",
      "en": "One Gospel, from beginning to end, in Ordinary Time."
    },
    "fijo": false,
    "dias": [
      {
        "es": "El principio",
        "en": "The beginning",
        "cita": "Mc 1,1–8"
      },
      {
        "es": "La hora",
        "en": "The hour",
        "cita": "Mc 1,9–15"
      },
      {
        "es": "Venid conmigo",
        "en": "Come with me",
        "cita": "Mc 1,16–20"
      },
      {
        "es": "El leproso",
        "en": "The leper",
        "cita": "Mc 1,40–45"
      },
      {
        "es": "Tus pecados",
        "en": "Your sins",
        "cita": "Mc 2,1–12"
      },
      {
        "es": "La mesa de Leví",
        "en": "Levi's table",
        "cita": "Mc 2,13–17"
      },
      {
        "es": "Los doce",
        "en": "The twelve",
        "cita": "Mc 3,13–19"
      },
      {
        "es": "El sembrador",
        "en": "The sower",
        "cita": "Mc 4,1–9"
      },
      {
        "es": "Calla",
        "en": "Be still",
        "cita": "Mc 4,35–41"
      },
      {
        "es": "La niña",
        "en": "The girl",
        "cita": "Mc 5,21–43"
      },
      {
        "es": "Los panes",
        "en": "The loaves",
        "cita": "Mc 6,30–44"
      },
      {
        "es": "Tú eres el Mesías",
        "en": "You are the Messiah",
        "cita": "Mc 8,27–33"
      },
      {
        "es": "El monte",
        "en": "The mountain",
        "cita": "Mc 9,2–8"
      },
      {
        "es": "El rico",
        "en": "The rich man",
        "cita": "Mc 10,17–22"
      },
      {
        "es": "Bartimeo",
        "en": "Bartimaeus",
        "cita": "Mc 10,46–52"
      },
      {
        "es": "El alba",
        "en": "The dawn",
        "cita": "Mc 16,1–8"
      }
    ]
  }
];
