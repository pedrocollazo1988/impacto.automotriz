export type BlogBrandLink = { name: string; slug: string };

export type BlogArticle = {
  slug: string;
  title: string;
  excerpt: string;
  /** Fecha en formato ISO (YYYY-MM-DD). */
  date: string;
  /** Marca o marcas protagonistas, para mostrar en la tarjeta. */
  brand: string;
  image: string;
  imageAlt: string;
  /** Minutos de lectura estimados. */
  readingTime: number;
  paragraphs: string[];
  highlights: string[];
  /** Enlaces al catálogo filtrado por marca. */
  brandLinks: BlogBrandLink[];
};

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "brembo-pastillas-y-discos",
    title: "Brembo: cómo elegir pastillas y discos que frenen bien de verdad",
    excerpt:
      "Del tacto del pedal a la referencia exacta: una guía práctica para comprar frenos Brembo sin caer en imitaciones ni sobredimensionar el sistema.",
    date: "2026-11-12",
    brand: "Brembo",
    image: "/products/brake-pad.webp",
    imageAlt: "Pastillas de freno delanteras sobre una superficie de taller",
    readingTime: 6,
    paragraphs: [
      "Los frenos son el sistema en el que más rápido se nota un cambio de calidad. Una pastilla correcta devuelve un pedal firme, frena sin chirridos y ensucia menos la llanta; una pastilla equivocada puede vibrar, calentarse de más o desgastar el disco antes de tiempo. Brembo es uno de los nombres más copiados del aftermarket, así que la primera regla es comprar por referencia y no por precio.",
      "Antes de elegir, identifica el eje y el uso. No es lo mismo un coche que hace trayectos cortos en ciudad que uno que carga peso o baja puertos a menudo. Las pastillas cerámicas suelen ser silenciosas y limpias para el uso diario; las semi-metálicas aguantan mejor el calor y el trabajo exigente, a cambio de más polvo y ruido. Si el fabricante indica una referencia concreta, respétala: cambiar el compuesto sin cambiar el disco puede desequilibrar la frenada.",
      "El disco también cuenta. Un disco rayado, con labio en el borde o por debajo del espesor mínimo no se arregla con pastillas nuevas. Lo correcto es medir espesor y alabeo en el taller y sustituir por eje completo. Mezclar una pastilla nueva con un disco muy gastado acorta la vida de ambas piezas y puede producir vibraciones al frenar.",
      "Las señales de aviso no siempre son acústicas. Un pedal esponjoso suele apuntar a aire o líquido viejo; una vibración en el volante al frenar puede ser un disco deformado; un chirrido constante puede ser la chapa testigo o una pastilla cristalizada. Ninguna de esas señales se resuelve comprando a ciegas: primero se diagnostica, después se compra.",
      "Desconfía de envases sin holograma, referencias que no coinciden o precios muy por debajo del mercado. Brembo tiene una red de distribución amplia; comprar en un canal fiable vale más que ahorrar unos pesos en una pieza crítica. Al montar, limpia las guías, revisa el líquido y respeta el rodaje suave de los primeros kilómetros.",
    ],
    highlights: [
      "Compra por referencia exacta y por eje: mezclar compuestos o cambiar solo una rueda desequilibra la frenada.",
      "Si el pedal está esponjoso, el disco vibra o aparece un labio profundo, diagnostica antes de sustituir.",
      "El precio anormalmente bajo es la señal más habitual de una imitación; prioriza canales con garantía.",
    ],
    brandLinks: [{ name: "Brembo", slug: "brembo" }],
  },
  {
    slug: "bosch-alternador-y-filtros",
    title: "Bosch: alternador, filtros y el equilibrio eléctrico del coche",
    excerpt:
      "Qué revisar cuando la batería no carga, cómo distinguir un alternador agotado de una batería vieja y por qué el filtro correcto importa más de lo que parece.",
    date: "2026-10-28",
    brand: "Bosch",
    image: "/products/car-alternator-on-a-workbench.webp",
    imageAlt: "Alternador de coche desmontado sobre una mesa de taller",
    readingTime: 5,
    paragraphs: [
      "Bosch fabrica desde bujías y filtros hasta alternadores y motores de arranque. Esa amplitud hace que sea fácil encontrar una pieza con su nombre, pero también fácil equivocarse de referencia. En componentes eléctricos, el aspecto exterior puede ser idéntico y el conector, la polea o el regulador no serlo. La comprobación empieza por el número de pieza y por la ficha técnica del vehículo.",
      "Cuando la luz de batería se enciende, el problema no siempre es la batería. Un alternador que carga de menos deja el coche arrancando cada vez más lento, luces que bajan de intensidad al ralentí y, en casos avanzados, un zumbido o un olor a goma. El taller puede medir la tensión de carga y el consumo parásito; cambiar el alternador sin esa prueba puede dejar la avería intacta.",
      "En alternadores remanufacturados, mira la garantía y qué se ha sustituido: rodamientos, regulador, escobillas y polea son las piezas que envejecen. Un remanufacturado serio puede ser una opción sensata frente a uno nuevo, siempre que la carcasa y el bobinado hayan pasado control. La polea desacoplada, cuando el coche la lleva, también debe revisarse: un fallo ahí imita los síntomas de un alternador muerto.",
      "Los filtros son la otra cara de Bosch. El de aire protege el motor y condiciona el consumo; el de combustible protege la inyección; el de aceite retiene partículas que aceleran el desgaste. Los intervalos del manual son una referencia, no una promesa: en zonas polvorientas o con mucho tráfico urbano conviene adelantar la sustitución. Un filtro de aire obstruido se nota en respuesta y humo, no solo en potencia.",
      "Al montar, desconecta la batería con el contacto quitado, revisa el estado de la correa y no fuerces conectores. En vehículos modernos, algunos cambios de batería requieren registrar la nueva unidad en la centralita para que la gestión de carga no la sobrecargue. Si no tienes la herramienta, el taller lo resuelve en minutos y evita una avería cara.",
    ],
    highlights: [
      "Antes de cambiar el alternador, mide la carga y descarta batería, correa, polea y conexiones.",
      "Filtros: respeta la referencia y adelanta el cambio si circulas por zonas polvorientas o mucho tráfico.",
      "En coches modernos, registrar la batería nueva evita que la centralita la cargue de más.",
    ],
    brandLinks: [{ name: "Bosch", slug: "bosch" }],
  },
  {
    slug: "kyb-amortiguadores-estabilidad",
    title: "KYB: amortiguadores que devuelven estabilidad sin endurecer el coche",
    excerpt:
      "Cómo detectar un amortiguador agotado, por qué se cambian por pares y qué mirar antes de elegir una suspensión de reemplazo.",
    date: "2026-10-09",
    brand: "KYB",
    image: "/products/ohlins.webp",
    imageAlt: "Amortiguador de suspensión de gas para automóvil",
    readingTime: 5,
    paragraphs: [
      "Un amortiguador gastado no siempre hace ruido. Lo que hace es permitir que la carrocería siga moviéndose después de un bache, aumentar la distancia de frenado en curva y desgastar los neumáticos de forma irregular. KYB es un fabricante de equipo original y de reemplazo; su catálogo distingue por aplicación, así que la referencia y la motorización son tan importantes como la marca.",
      "Las señales típicas son un rebote excesivo al empujar una esquina, balanceo en curvas, hundimiento al frenar, fugas de aceite en el cuerpo del amortiguador y copelas o topes en mal estado. Un neumático con desgaste en dientes de sierra también apunta a suspensión, aunque conviene comprobar alineación y presión antes de culpar a la pieza.",
      "Se sustituyen por pares en el mismo eje. Cambiar solo uno deja un lado nuevo y otro vencido, y el coche transmite sensaciones distintas al girar o frenar. En muchos conjuntos hay que reutilizar el muelle, la copela o el tope; si están agrietados o deformados, se cambian también. Montar un amortiguador nuevo sobre una copela vieja acorta la vida del conjunto.",
      "No todo amortiguador sirve para todo uso. Los de gas presurizado suelen dar más control y estabilidad; los de aceite priorizan confort. Si bajas la suspensión o cambias muelles, necesitas una combinación pensada para ello: un amortiguador de longitud estándar trabajando fuera de su recorrido se degrada rápido. Para uso urbano, la gama de reemplazo equivalente al original suele ser la decisión más equilibrada.",
      "La instalación importa tanto como la pieza. Hay que comprimir muelles con herramienta adecuada, respetar el par de apriete y hacer la alineación después. En algunos vehículos, los silentblocks del brazo se aprietan con el coche apoyado en el suelo para que no queden precargados. Si no tienes elevador y herramientas, el taller evita un montaje inseguro.",
    ],
    highlights: [
      "Cambia los amortiguadores por pares en el mismo eje y revisa copelas, topes y muelles.",
      "Rebote, balanceo, fugas y desgaste irregular de neumáticos son señales de suspensión vencida.",
      "Si modificas altura o muelles, elige una combinación compatible; no reutilices amortiguadores fuera de rango.",
    ],
    brandLinks: [{ name: "KYB", slug: "kyb" }],
  },
  {
    slug: "varta-y-monroe-bateria-y-suspension",
    title: "Varta y Monroe: batería y suspensión, el dúo que aguanta el día a día",
    excerpt:
      "Dos consumibles que fallan sin avisar y que comparten síntomas con otras averías. Cómo elegir batería y amortiguadores con criterio y sin improvisar.",
    date: "2026-09-22",
    brand: "Varta y Monroe",
    image: "/products/car-battery.webp",
    imageAlt: "Batería de coche de 12 V con bornes y etiqueta de especificaciones",
    readingTime: 6,
    paragraphs: [
      "La batería y los amortiguadores tienen poco en común en el catálogo, pero mucho en la vida real: ambos se desgastan de forma gradual y ambos avisan tarde. Una batería que pierde capacidad hace que el coche arranque con pereza; un amortiguador vencido hace que la carrocería flote y que los frenos trabajen con menos apoyo. Sustituirlos a tiempo es mantenimiento, no lujo.",
      "Para la batería, no basta con mirar los amperios. Hay que respetar el tamaño de caja, la polaridad, la capacidad en Ah y la corriente de arranque en frío que pide el vehículo. Una batería más pequeña puede arrancar un día y fallar en frío al siguiente. Varta etiqueta sus gamas por uso; si el coche tiene Start-Stop o muchos consumidores, la tecnología debe ser la adecuada, no la más barata.",
      "Antes de comprar, prueba la batería con un equipo de carga o conductancia. Una lectura baja no siempre significa batería muerta: un alternador que no carga o un consumo parásito la descargan cada noche. Si la batería tiene años y el coche ya arrancó lento en varias ocasiones, el cambio es razonable; si es nueva, investiga el sistema de carga.",
      "En suspensión, Monroe cubre desde reemplazo de confort hasta conjuntos más firmes para carga. La elección depende de cómo usas el coche, no de la estética. Un amortiguador agotado se nota en badenes, en frenadas y en el desgaste de los neumáticos. Al igual que con KYB, se cambian por pares y se revisan copelas, topes y muelles.",
      "El montaje de la batería exige cuidado: contacto quitado, bornes limpios, polaridad correcta y sujeción firme. En coches con gestión inteligente de carga, la batería nueva se registra en la centralita; si no, puede cargarse de más o de menos. La batería usada se entrega en un punto de reciclaje, nunca se tira con la basura doméstica.",
      "Comprar Varta y Monroe en un mismo pedido no ahorra solo envío: permite revisar el conjunto. Si cambias batería, comprueba la carga; si cambias amortiguadores, revisa neumáticos y alineación. Esa mirada de sistema evita sustituir una pieza dos veces por no haber visto la causa real.",
    ],
    highlights: [
      "Batería: respeta caja, polaridad, Ah y corriente de arranque; no solo el precio.",
      "Amortiguadores: cambia por pares, revisa copelas y topes y alinea después del montaje.",
      "Si la batería nueva se descarga, revisa carga y consumos antes de cambiarla otra vez.",
    ],
    brandLinks: [
      { name: "Varta", slug: "varta" },
      { name: "Monroe", slug: "monroe" },
    ],
  },
];
