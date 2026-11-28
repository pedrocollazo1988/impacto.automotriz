// Traducciones de fábrica del catálogo: los textos con los que se sembró la
// tienda, para que un visitante en inglés vea algo legible aunque el negocio
// todavía no haya rellenado la versión inglesa desde el panel.
//
// Manda siempre la base de datos. Esto solo rellena el hueco, y solo si el
// texto español sigue siendo el original (si el negocio lo reescribió, su
// versión manda y no se traduce nada por su cuenta).

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export type ProductoEn = { name: string; description: string; specs: Record<string, string> };

type ProductoDeFabrica = ProductoEn & { es: string };

const PRODUCTOS: Record<string, ProductoDeFabrica> = {
  "pastillas-freno-delanteras": { es: "Pastillas de freno delanteras", name: "Front Brake Pads", description: "Set of 4 front brake pads with a ceramic compound. Low dust and noise, with stable braking hot or cold.", specs: {"Axles": "Front", "Pieces": "4", "Thickness": "17 mm", "Composition": "Ceramic"} },
  "discos-freno-ventilados": { es: "Discos de freno ventilados", name: "Vented Brake Discs", description: "Pair of vented high-strength cast iron brake discs with an anti-corrosion coating.", specs: {"Axles": "Front", "Diameter": "280 mm", "Vented": "Yes"} },
  "liquido-frenos-dot4": { es: "Líquido de frenos DOT-4", name: "DOT-4 Brake Fluid", description: "DOT-4 brake fluid with a high boiling point, 500 ml.", specs: {"Standard": "DOT-4", "Content": "500 ml"} },
  "amortiguador-trasero": { es: "Amortiguador trasero", name: "Rear Shock Absorber", description: "Rear gas shock absorber that improves stability and reduces bounce.", specs: {"Axles": "Rear", "Type": "Gas"} },
  "amortiguadores-delanteros-par": { es: "Amortiguadores delanteros (par)", name: "Front Shock Absorbers (Pair)", description: "Pair of front shock absorbers for city and highway driving.", specs: {"Axles": "Front", "Type": "Gas", "Pieces": "2"} },
  "rotulas-direccion": { es: "Rótulas de dirección", name: "Tie Rod Ends", description: "Tie rod ends with rubber dust boots and lifetime lubrication.", specs: {"Pieces": "2", "Material": "Forged steel"} },
  "bateria-12v-60ah": { es: "Batería 12V 60Ah", name: "12V 60Ah Battery", description: "Maintenance-free 60Ah battery with reliable starting in hot climates.", specs: {"CCA": "540 A", "Voltage": "12 V", "Capacity": "60 Ah"} },
  "alternador-12v-70a": { es: "Alternador 12V 70A", name: "12V 70A Alternator", description: "Remanufactured alternator with a new voltage regulator and warranty.", specs: {"Voltage": "12 V", "Amperage": "70 A"} },
  "motor-arranque": { es: "Motor de arranque", name: "Starter Motor", description: "High-torque starter motor with a reinforced pinion and windings.", specs: {"Voltage": "12 V", "Power": "1.2 kW"} },
  "bujias-iridio-juego": { es: "Bujías de iridio (juego 4)", name: "Iridium Spark Plugs (set of 4)", description: "Set of 4 iridium spark plugs: easier starting, better fuel economy and longer life.", specs: {"Pieces": "4", "Electrode": "Iridium"} },
  "triciclo-electrico-cargo": { es: "Triciclo eléctrico de carga Kvitova DDS-OD", name: "Kvitova DDS-OD Electric Cargo Tricycle", description: "Kvitova DDS-OD electric cargo tricycle with a 1600 × 1100 mm tilting dump bed. The full parts listing by system is available in the interactive exploded view.", specs: {"Motor": "1200 W brushless", "Dump Bed": "1600 × 1100 mm", "Battery": "72 V (6 × 12 V 58 Ah)", "Payload": "500–800 kg", "Transmission": "Axle with differential and reduction gear"} },
  "bicicleta-electrica-plegable": { es: "Bicicleta eléctrica plegable", name: "Folding Electric Bicycle", description: "Folding electric bicycle with a 350 W motor and removable battery.", specs: {"Motor": "350 W", "Battery": "36 V / 10 Ah", "Folding": "Yes", "Range": "45 km"} },
  "patinete-electrico-urbano": { es: "Patinete eléctrico urbano", name: "Urban Electric Scooter", description: "Lightweight electric scooter for city riding, with an electric brake and LED lights.", specs: {"Weight": "12 kg", "Range": "30 km", "Max. Speed": "25 km/h"} },
  "motor-1-6-16v-completo": { es: "Motor 1.6 16V completo", name: "1.6 16V Complete Engine", description: "Reconditioned 1.6 16V engine, guaranteed to run.", specs: {"Valves": "16V", "Displacement": "1.6 L", "Fuel": "Gasoline"} },
  "kit-distribucion": { es: "Kit de distribución", name: "Timing Belt Kit", description: "Complete kit: belt, tensioner and idler pulleys. Recommended replacement every 60,000 km.", specs: {"Components": "Belt + tensioner + idler pulleys"} },
  "bomba-agua": { es: "Bomba de agua", name: "Water Pump", description: "Water pump with gasket included, for the cooling system.", specs: {"Gasket Included": "Yes"} },
  "filtro-aceite": { es: "Filtro de aceite", name: "Oil Filter", description: "High-efficiency oil filter with anti-drain-back valve.", specs: {"Thread": "3/4-16 UNF", "Height": "95 mm"} },
  "filtro-aire": { es: "Filtro de aire", name: "Air Filter", description: "Panel air filter that protects the engine and improves fuel economy.", specs: {"Type": "Panel"} },
  "filtro-combustible": { es: "Filtro de combustible", name: "Fuel Filter", description: "Fuel filter that protects the injection system from dirt and water.", specs: {"Type": "Inline"} },
  "faro-led-delantero": { es: "Faro LED delantero", name: "Front LED Headlight", description: "High-output front LED headlight with a wide beam and low power draw.", specs: {"Voltage": "12 V", "Color Temperature": "6000 K"} },
  "kit-bombillas-h4": { es: "Kit de bombillas H4", name: "H4 Bulb Kit", description: "Pair of long-life H4 halogen bulbs with white light.", specs: {"Pieces": "2", "Base": "H4"} },
  "espejo-retrovisor-electrico": { es: "Espejo retrovisor eléctrico", name: "Power Side Mirror", description: "Side mirror with power adjustment and foldable housing.", specs: {"Side": "Left", "Adjustment": "Power"} },
  "parachoques-delantero": { es: "Parachoques delantero", name: "Front Bumper", description: "ABS front bumper, ready to paint.", specs: {"Painted": "No", "Material": "ABS"} },
  "alfombrillas-goma-juego": { es: "Alfombrillas de goma (juego)", name: "Rubber Floor Mats (Set)", description: "Set of 4 non-slip rubber floor mats, easy to clean.", specs: {"Pieces": "4", "Material": "Rubber"} },
  "soporte-telefono-auto": { es: "Soporte de teléfono para auto", name: "Car Phone Mount", description: "Adjustable magnetic air vent mount with a non-slip base.", specs: {"Type": "Magnetic", "Mounting": "Air Vent"} },
  "cargador-usb-doble": { es: "Cargador USB doble 12V", name: "Dual USB Car Charger 12V", description: "Dual USB charger with fast charging and overcharge protection.", specs: {"Output": "3.1 A", "Ports": "2"} },
};

const CATEGORIAS: Record<string, string> = {
  "Frenos": "Brakes",
  "Sistema eléctrico": "Electrical system",
  "Suspensión": "Suspension",
  "Triciclos eléctricos": "Electric tricycles",
  "Motor": "Engine",
  "Filtros": "Filters",
  "Luces e iluminación": "Lighting",
  "Carrocería": "Body parts",
  "Accesorios": "Accessories",
  "Repuestos": "Spare parts",
};

const MARCAS: Record<string, string> = {
  "brembo": "Brembo",
  "bosch": "Bosch",
  "monroe": "Monroe",
  "trw": "TRW",
  "varta": "Varta",
  "ngk": "NGK",
  "kvitova": "Kvitova",
  "impacto-ev": "Impacto EV",
  "marca-demo": "Demo brand",
  "gates": "Gates",
  "skf": "SKF",
  "mann": "Mann",
  "philips": "Philips",
  "osram": "Osram",
};

const ENTREGAS: Record<string, { name: string; description: string }> = {
  "DOMICILIO": {"name": "Home delivery", "description": ""} ,
  "RECOGIDA": {"name": "Store pickup", "description": ""} ,
  "MENSAJERIA": {"name": "Shipping to another province (courier)", "description": ""} ,
  "PUNTO": {"name": "Delivery to an agreed point", "description": ""} ,
};

const PAGOS: Record<string, { name: string; description: string; instructions: string }> = {
  "TROPIPAY": {"name": "Tropipay", "description": "Pay with your Tropipay card or balance. Automatic confirmation.", "instructions": ""},
  "QVAPAY": {"name": "QvaPay", "description": "Pay with your QvaPay balance. Automatic confirmation.", "instructions": ""},
  "TRANSFER": {"name": "Bank transfer", "description": "Bank transfer or deposit. We confirm your payment manually.", "instructions": ""},
  "CASH": {"name": "Cash on delivery", "description": "Pay when you receive your order or pick it up at the store.", "instructions": ""},
};

// Despiece demo del triciclo Kvitova: piezas por SKU y sistemas por slug.
const PIEZAS: Record<string, ProductoDeFabrica & { label: string }> = {
  "KVI-MOT-01": { es: "Motor eléctrico sin escobillas 72V 1200W", name: "72V 1200W brushless electric motor", description: "Hub motor for the Kvitova DDS-OD cargo tricycle. It mounts directly to the rear differential, with no chain. Includes a 5-wire Hall sensor and a sealed Julet connector. Check the connector photo before buying: hybrid versions use a different harness.", specs: {"Voltage": "72 V", "Power": "1200 W", "Type": "Brushless · direct mount to differential", "Connector": "3-phase + 5 Hall (Julet)", "Rating": "IP54"}, label: "Motor 72V 1200W" },
  "KVI-MOT-02": { es: "Eje trasero con diferencial y reductora", name: "Rear axle with differential and reduction gear", description: "Rear axle assembly with dual-range reduction gearbox for heavy loads. This is the part that sets the Kvitova apart from a light-duty tricycle: it lets you haul loads up a slope using the low range.", specs: {"Material": "Forged steel", "Gear ratio": "Dual-range reduction gear", "Width": "980 mm between hubs", "Studs": "4/5 per wheel"}, label: "Axle with differential" },
  "KVI-MOT-03": { es: "Selector de fuerza alta/baja con guaya", name: "High/low range selector with cable", description: "Lever and shift mechanism for the high/low range. Includes cable and adjuster. If the lever will not stay locked in either position, the internal ratchet is worn: replace the complete assembly.", specs: {"Actuation": "Mechanical cable", "Positions": "2 (high / low)", "Length": "1.6 m", "Compatibility": "DDS-OD 2023 and later"}, label: "Range selector" },
  "KVI-ELE-01": { es: "Controlador 72V24Q60A (24 MOSFET)", name: "72V24Q60A controller (24 MOSFET)", description: "Original 72V24Q60A control unit. This is the part with the most variants on the tricycle: some versions use a 6-pin connector and others a soldered harness. The listing includes a close-up photo of each lead with its wire color so you can confirm yours before ordering.", specs: {"Voltage": "72 V", "Current": "60 A", "MOSFET": "24", "Leads": "Hall, reverse, brake cut-off, speedometer", "Connector": "6-pin plastic + Faston"}, label: "Controller" },
  "KVI-ELE-02": { es: "Banco de 6 baterías 12V 58Ah (kit 72V)", name: "6-battery bank 12V 58Ah (72V kit)", description: "Complete set of 6 gel batteries, 12V 58Ah each, wired in series for 72V. Includes connecting jumpers and terminals. Also sold individually for one-off repairs.", specs: {"Voltage": "72 V in series", "Capacity": "58 Ah", "Chemistry": "Gel / lead-acid", "Units": "6 × 12 V", "Dimensions": "230 × 138 × 227 mm (each)"}, label: "Battery bank 6×12V 58Ah" },
  "KVI-ELE-03": { es: "Cargador inteligente 72V 7A", name: "Smart charger 72V 7A", description: "72V 7A charger with automatic shut-off. 3-pin plug. Charging a 58Ah bank from empty takes 8 to 9 hours; if it takes much longer, check the internal resistance of the bank.", specs: {"Output": "72 V · 7 A", "Input": "110 V", "Connector": "3-pin (male)", "Protection": "Automatic shut-off at 100%"}, label: "Charger 72V 7A" },
  "KVI-ELE-04": { es: "Convertidor DC-DC 72V a 12V", name: "DC-DC converter 72V to 12V", description: "Step-down converter that powers the 12V lights, horn, and accessories from the 72V bank. If bulbs burn out often, this converter is delivering overvoltage.", specs: {"Input": "72 V", "Output": "12 V · 10 A", "Use": "Lights, horn, display", "Mounting": "2 screws"}, label: "Converter 72→12V" },
  "KVI-ELE-05": { es: "Extensor de rango a gasolina (versión híbrida)", name: "Gasoline range extender (hybrid version)", description: "Auxiliary generator for hybrid units. Not compatible with the pure electric version: the harness and chassis mounting points are different. Generator-specific parts (spark plug, carburetor, air filter) are sold separately.", specs: {"Power": "5000–5500 W", "Fuel": "Gasoline", "Starting": "Automatic", "Compatibility": "Hybrid DDS-OD versions only"}, label: "Range extender" },
  "KVI-RUE-01": { es: "Neumático 12\" reforzado", name: "12\" heavy-duty tire", description: "Heavy-duty casing with reinforced plies. Two widths circulate on the market: 3.75-12 and 4.50-12, the wider one being more common on the rear axle. Choose the exact size of your unit; they are not interchangeable on the same rim.", specs: {"Size": "3.75-12 or 4.50-12", "Rim": "12 inch", "Use": "Heavy load", "Plies": "8 PR (reinforced)"}, label: "Tire 12\"" },
  "KVI-RUE-02": { es: "Cámara de aire 12\" válvula reforzada", name: "12\" inner tube, reinforced valve", description: "Butyl inner tube with reinforced valve. Fits both tire widths. Also replace the tire if the puncture comes back at the same spot.", specs: {"Size": "3.75/4.50-12", "Valve": "Reinforced, straight", "Material": "Butyl"}, label: "Inner tube" },
  "KVI-RUE-03": { es: "Rin metálico 12\" (aro de acero)", name: "12\" steel rim (steel wheel)", description: "12-inch steel wheel. The front and rear rims are not the same: the stud count differs. State the position when ordering.", specs: {"Rim": "12 inch", "Material": "Steel", "Studs": "Front 4 · rear 5", "Finish": "Black painted"}, label: "Rim 12\"" },
  "KVI-SUS-01": { es: "Barras telescópicas delanteras (horquilla)", name: "Front telescopic fork tubes (fork)", description: "Dual-clamp hydraulic fork for the front end. If the tricycle dives when braking or leaks oil past the seals, the cartridge is worn out.", specs: {"Type": "Reinforced hydraulic", "Triple clamps": "Dual", "Travel": "120 mm", "Tube": "Ø 37 mm"}, label: "Telescopic forks" },
  "KVI-SUS-02": { es: "Juego de ballestas traseras 500–800 kg", name: "Rear leaf spring set 500–800 kg", description: "Steel leaf spring pack for the rear axle. This is what carries the load: if the tricycle leans to one side with the dump bed full, one of the leaves is broken.", specs: {"Load": "500–800 kg", "Leaves": "4 per pack", "Units": "2 packs", "Length": "1,100 mm"}, label: "Leaf springs" },
  "KVI-SUS-03": { es: "Amortiguadores traseros de apoyo", name: "Rear helper shocks", description: "Pair of hydraulic shocks that assist the leaf spring pack. Replace them as a pair so the axle does not become unbalanced.", specs: {"Type": "Hydraulic spring", "Units": "2", "Length": "340 mm", "Mounting": "Eye-to-eye"}, label: "Shocks" },
  "KVI-FRE-01": { es: "Zapatas y bandas de freno de tambor", name: "Drum brake shoes and linings", description: "Shoe and lining set for drum brakes. Replace them per axle: mixing new shoes with old ones unbalances braking.", specs: {"Type": "Mechanical drum", "Position": "Front and rear", "Units": "Set per wheel", "Size": "Ø 180 mm"}, label: "Brake shoes" },
  "KVI-FRE-02": { es: "Pedal y varilla de freno con sensor de corte", name: "Brake pedal and rod with cut-off sensor", description: "Pedal and rod assembly with cut-off switch. That sensor signals the controller to cut traction when braking; if the vehicle \"pushes\" while braking, check this contact.", specs: {"Actuation": "Mechanical rod", "Sensor": "Electric cut-off on braking", "Includes": "Pedal, rod, and spring"}, label: "Pedal and rod" },
  "KVI-FRE-03": { es: "Freno de estacionamiento (palanca de bloqueo)", name: "Parking brake (lock lever)", description: "Manual locking lever to leave the tricycle braked on a slope with a load. It does not replace the service brake.", specs: {"Type": "Manual lock", "Mounting": "Handlebar", "Function": "Emergency and parking"}, label: "Parking brake" },
  "KVI-CAR-01": { es: "Tolva de carga 1600 × 1100 mm con volteo", name: "Dump bed 1600 × 1100 mm with tilt", description: "Cargo bed with manual tilt system. Ships unassembled; includes hinges, pins, and hardware. This is the bulkiest part: ask about shipping cost before ordering.", specs: {"Dimensions": "1600 × 1100 mm", "Tilt": "Manual", "Material": "Galvanized steel", "Load": "Up to 800 kg"}, label: "Dump bed" },
  "KVI-CAR-02": { es: "Asientos plegables y escalera trasera", name: "Folding seats and rear ladder", description: "Folding interior benches and rear step. This is the passenger configuration for the DDS-OD; it mounts and removes without tools on the dump bed anchor points.", specs: {"Capacity": "Up to 8 passengers", "Seating": "Folding benches", "Ladder": "2-leaf rear step"}, label: "Seats and ladder" },
  "KVI-CAR-03": { es: "Parabrisas y techo de cabina", name: "Windshield and cab roof", description: "Cab kit for versions with a top canopy. Acrylic scratches easily: clean with water and a soft cloth, never with a scouring pad.", specs: {"Includes": "Windshield, roof, and brackets", "Material": "Acrylic + steel", "Compatibility": "Versions with canopy"}, label: "Windshield and roof" },
  "KVI-MAN-01": { es: "Puño acelerador con reversa y 3 velocidades", name: "Throttle grip with reverse and 3 speeds", description: "Throttle grip with reverse button and three-speed selector. The 3-pin Julet connector is the most common, but some units use 4 pins: compare the connector photo.", specs: {"Voltage": "72 V", "Functions": "Reverse + 3 speeds", "Connector": "3-pin Julet", "Diameter": "22 mm"}, label: "Throttle grip" },
  "KVI-MAN-02": { es: "Display digital LCD (velocímetro y odómetro)", name: "LCD digital display (speedometer and odometer)", description: "LCD screen with speedometer, battery bank voltage level, and odometer. If it reads below 63V at rest on a full charge, the problem is in the batteries, not the display.", specs: {"Voltage": "72 V", "Display": "LCD", "Shows": "Speed, voltage, odometer", "Connector": "5-pin"}, label: "LCD display" },
  "KVI-MAN-03": { es: "Switch de encendido con 2 llaves", name: "Ignition switch with 2 keys", description: "Ignition cylinder with two keys and handlebar lock. If the tricycle cuts out over bumps, check the connector before replacing the switch.", specs: {"Keys": "2", "Positions": "Off / On", "Lock": "Handlebar", "Connector": "2-pin"}, label: "Ignition" },
};

const SISTEMAS: Record<string, { name: string; blurb: string }> = {
  "propulsion": { name: "Powertrain", blurb: "Motor, differential, and range selector." },
  "electronica": { name: "Electronics", blurb: "Controller, battery bank, charger, and converter." },
  "ruedas": { name: "Drivetrain and wheels", blurb: "Tire, inner tube, and steel rim." },
  "suspension": { name: "Suspension", blurb: "Fork, leaf springs, and load shocks." },
  "frenos": { name: "Brakes", blurb: "Drum, shoes, rod, and parking brake." },
  "carroceria": { name: "Chassis and body", blurb: "Dump bed, seats, ladder, and cab." },
  "mandos": { name: "Controls", blurb: "Throttle, display, and ignition switch." },
};

/** Traducción de fábrica de un producto, o nada si el español ya no es el original. */
export function productoDeFabrica(p: { slug?: string | null; sku?: string | null; name: string }): ProductoEn | undefined {
  const t = (p.slug ? PRODUCTOS[p.slug] : undefined) ?? (p.sku ? PIEZAS[p.sku] : undefined);
  if (!t) return undefined;
  if (sinAcentos(t.es) !== sinAcentos(p.name)) return undefined;
  return { name: t.name, description: t.description, specs: t.specs };
}

/** Etiqueta corta del pin en el dibujo del despiece, si la pieza es del demo. */
export function etiquetaPiezaDeFabrica(p: { sku?: string | null; name: string }): string | undefined {
  const t = p.sku ? PIEZAS[p.sku] : undefined;
  if (!t || !t.label) return undefined;
  return sinAcentos(t.es) === sinAcentos(p.name) ? t.label : undefined;
}

export function sistemaDeFabrica(slug: string): { name: string; blurb: string } | undefined {
  return SISTEMAS[slug];
}

export function categoriaDeFabrica(name: string): string | undefined {
  return CATEGORIAS[name.trim()];
}

export function marcaDeFabrica(name: string): string | undefined {
  return MARCAS[sinAcentos(name).replace(/\s+/g, "-")];
}

export function entregaDeFabrica(code: string): { name: string; description: string } | undefined {
  return ENTREGAS[code];
}

export function pagoDeFabrica(key: string): { name: string; description: string; instructions: string } | undefined {
  return PAGOS[key.toUpperCase()];
}
