// Genera las láminas de despiece en SVG. Cada pieza es un <g id="parte-NN">, de modo
// que el visor puede iluminarla al pasar el ratón o al elegirla en la tabla.
// Estilo técnico: líneas de plano, azul marino sobre papel cuadriculado.
const fs = require("node:fs");
const path = require("node:path");

const W = 1200, H = 800;
const INK = "#0b2a5b", MID = "#4a6b96", LIGHT = "#c9d8ea", PAPER = "#f4f7fb", ACCENT = "#0a84ff";

const defs = `
  <defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M24 0H0V24" fill="none" stroke="#dbe6f3" stroke-width="1"/>
    </pattern>
    <pattern id="grid-lg" width="120" height="120" patternUnits="userSpaceOnUse">
      <path d="M120 0H0V120" fill="none" stroke="#c6d7ea" stroke-width="1.2"/>
    </pattern>
    <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#eef4fb"/><stop offset="1" stop-color="#d3e0ef"/>
    </linearGradient>
    <linearGradient id="volt" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3aa0ff"/><stop offset="1" stop-color="#0b5fd0"/>
    </linearGradient>
    <marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
      <path d="M0 0l7 3-7 3z" fill="${MID}"/>
    </marker>
  </defs>`;

const frame = (title, sub) => `
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#grid-lg)"/>
  <rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="${LIGHT}" stroke-width="2"/>
  <g font-family="ui-monospace, SFMono-Regular, Menlo, monospace">
    <text x="40" y="58" font-size="19" font-weight="700" fill="${INK}" letter-spacing="2">${title}</text>
    <text x="40" y="80" font-size="12" fill="${MID}" letter-spacing="1.4">${sub}</text>
    <text x="${W - 40}" y="58" font-size="12" fill="${MID}" text-anchor="end" letter-spacing="1.4">KVITOVA · DDS-OD</text>
    <text x="${W - 40}" y="80" font-size="11" fill="#8fa6c2" text-anchor="end">LÁMINA ${sub.split("·")[0].trim()}</text>
  </g>
  <line x1="40" y1="94" x2="${W - 40}" y2="94" stroke="${LIGHT}" stroke-width="1.5"/>`;

// Etiqueta de pieza: globo numerado + nombre, unido por una guía al punto de anclaje.
const callout = (n, label, ax, ay, lx, ly) => `
  <g class="callout" font-family="ui-monospace, SFMono-Regular, Menlo, monospace">
    <path d="M${ax} ${ay} L${lx} ${ly}" stroke="${MID}" stroke-width="1.1" stroke-dasharray="4 3"/>
    <circle cx="${ax}" cy="${ay}" r="3.2" fill="${MID}"/>
    <circle cx="${lx}" cy="${ly}" r="13" fill="${INK}"/>
    <text x="${lx}" y="${ly + 4.6}" font-size="13" font-weight="700" fill="#fff" text-anchor="middle">${n}</text>
    <text x="${lx + (lx > W / 2 ? -22 : 22)}" y="${ly + 4.4}" font-size="12.5" fill="${INK}"
          text-anchor="${lx > W / 2 ? "end" : "start"}">${label}</text>
  </g>`;

const note = (t, x, y) => `<text x="${x}" y="${y}" font-size="11.5" fill="${MID}" font-family="ui-monospace, monospace">${t}</text>`;

// Cada lámina se dibuja y luego se encaja en el área útil: así, cuando se quitan
// piezas, el dibujo no queda arrinconado con medio lienzo vacío.
const AREA = { x: 60, y: 112, w: 1080, h: 640 };
const FIT = {
  propulsion: { s: 1.45, tx: -10.4, ty: -196.4 },
  electronica: { s: 1.102, tx: -72.2, ty: -100.3 },
  ruedas: { s: 1.309, tx: -80.0, ty: -93.1 },
  suspension: { s: 1.383, tx: -186.2, ty: -105.6 },
  frenos: { s: 1.406, tx: -240.8, ty: -171.3 },
  carroceria: { s: 1.08, tx: -48.0, ty: 8.4 },
  mandos: { s: 1.456, tx: -158.6, ty: -77.2 },
};

const svg = (title, sub, body, key) => {
  const t = FIT[key];
  const g = t && t !== 1 ? `<g id="sheet-body" transform="translate(${t.tx} ${t.ty}) scale(${t.s})">${body}</g>` : `<g id="sheet-body">${body}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${title}">${defs}${frame(title, sub)}${g}\n</svg>\n`;
};

/* ───────── 1 · PROPULSIÓN ───────── */
const propulsion = `
  <!-- eje de explosión -->
  <g opacity=".4">
    <path d="M120 470H1080" stroke="${MID}" stroke-width="1.6" stroke-dasharray="10 8"/>
  </g>

  <!-- motor -->
  <g id="parte-01">
    <rect x="150" y="392" width="176" height="152" rx="26" fill="url(#steel)" stroke="${INK}" stroke-width="3"/>
    <g stroke="${INK}" stroke-width="2.2" fill="none">
      <path d="M176 418h124M176 446h124M176 474h124M176 502h124"/>
    </g>
    <circle cx="238" cy="468" r="40" fill="${PAPER}" stroke="${INK}" stroke-width="2.5"/>
    <circle cx="238" cy="468" r="14" fill="${ACCENT}"/>
    <path d="M326 468h58" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
    <text x="238" y="580" font-size="12" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">MOTOR 72V · 1200W</text>
  </g>

  <!-- diferencial -->
  <g id="parte-02">
    <ellipse cx="580" cy="468" rx="112" ry="92" fill="url(#steel)" stroke="${INK}" stroke-width="3"/>
    <ellipse cx="580" cy="468" rx="68" ry="55" fill="none" stroke="${INK}" stroke-width="2"/>
    <circle cx="580" cy="468" r="26" fill="${PAPER}" stroke="${INK}" stroke-width="2.5"/>
    <g stroke="${INK}" stroke-width="2"><path d="M580 442v-13M580 507v13M554 468h-13M619 468h13"/></g>
    <text x="580" y="600" font-size="12" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">DIFERENCIAL · REDUCTORA</text>
  </g>


  <!-- selector de fuerza -->
  <g id="parte-03">
    <rect x="420" y="250" width="126" height="60" rx="12" fill="${PAPER}" stroke="${INK}" stroke-width="2.6"/>
    <path d="M452 310v-32" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="452" cy="272" r="11" fill="${ACCENT}" stroke="${INK}" stroke-width="2"/>
    <path d="M484 268h44M484 292h44" stroke="${MID}" stroke-width="2" stroke-dasharray="5 4"/>
    <text x="484" y="344" font-size="11" fill="${MID}" font-family="ui-monospace, monospace">ALTA / BAJA</text>
  </g>

  ${callout(1, "Motor sin escobillas", 238, 468, 150, 300)}
  ${callout(2, "Eje con diferencial", 580, 468, 640, 690)}
  ${callout(3, "Selector de fuerza", 452, 280, 340, 190)}
  ${note("ACOPLE DIRECTO AL DIFERENCIAL · CAJA REDUCTORA DE DOBLE FUERZA", 40, 762)}
`;

/* ───────── 2 · ELECTRÓNICA ───────── */
const electronica = `
  <!-- controlador -->
  <g id="parte-01">
    <rect x="120" y="300" width="230" height="150" rx="16" fill="url(#steel)" stroke="${INK}" stroke-width="3"/>
    <g stroke="${INK}" stroke-width="2" fill="none">
      <path d="M148 336h174M148 366h174M148 396h174M148 426h120"/>
    </g>
    <rect x="286" y="336" width="42" height="60" rx="6" fill="${ACCENT}" opacity=".85"/>
    <path d="M350 330h70M350 360h70M350 390h70M350 420h70" stroke="${MID}" stroke-width="3.4"/>
    <circle cx="430" cy="330" r="6" fill="${INK}"/><circle cx="430" cy="360" r="6" fill="${INK}"/>
    <circle cx="430" cy="390" r="6" fill="${INK}"/><circle cx="430" cy="420" r="6" fill="${INK}"/>
    <text x="235" y="490" font-size="12" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">72V24Q60A · 24 MOSFET</text>
  </g>
  <!-- baterías: banco de 6 -->
  <g id="parte-02">
    ${[0, 1, 2, 3, 4, 5].map((i) => {
      const x = 620 + (i % 3) * 130, y = 300 + Math.floor(i / 3) * 132;
      return `<g><rect x="${x}" y="${y}" width="108" height="104" rx="9" fill="url(#steel)" stroke="${INK}" stroke-width="2.6"/>
      <rect x="${x + 14}" y="${y + 12}" width="80" height="16" rx="3" fill="${INK}" opacity=".8"/>
      <circle cx="${x + 30}" cy="${y + 46}" r="7" fill="#b91c1c"/><circle cx="${x + 78}" cy="${y + 46}" r="7" fill="${INK}"/>
      <text x="${x + 54}" y="${y + 84}" font-size="10.5" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">12V 58Ah</text></g>`;
    }).join("")}
    <path d="M620 268h368" stroke="${MID}" stroke-width="2" stroke-dasharray="6 4"/>
    <text x="804" y="256" font-size="11.5" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">SERIE · 72V TOTAL</text>
  </g>
  <!-- cargador -->
  <g id="parte-03">
    <rect x="120" y="560" width="150" height="112" rx="14" fill="url(#steel)" stroke="${INK}" stroke-width="2.8"/>
    <rect x="142" y="582" width="106" height="42" rx="6" fill="${PAPER}" stroke="${INK}" stroke-width="2"/>
    <path d="M270 616h56" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <rect x="326" y="602" width="34" height="28" rx="5" fill="${INK}"/>
    <text x="195" y="700" font-size="11.5" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">72V · 7A</text>
  </g>
  <!-- convertidor -->
  <g id="parte-04">
    <rect x="430" y="576" width="128" height="86" rx="11" fill="${PAPER}" stroke="${INK}" stroke-width="2.6"/>
    <path d="M446 596h96M446 616h96" stroke="${MID}" stroke-width="2"/>
    <text x="494" y="648" font-size="11" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">72V→12V</text>
  </g>
  <!-- extensor de rango -->
  <g id="parte-05">
    <rect x="920" y="560" width="180" height="112" rx="14" fill="${PAPER}" stroke="${MID}" stroke-width="2.4" stroke-dasharray="7 5"/>
    <text x="1010" y="606" font-size="11.5" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">GENERADOR</text>
    <text x="1010" y="626" font-size="11" fill="#8fa6c2" text-anchor="middle" font-family="ui-monospace, monospace">OPCIONAL · HÍBRIDO</text>
  </g>
  ${callout(1, "Controlador", 235, 375, 250, 190)}
  ${callout(2, "Banco de baterías", 804, 404, 1010, 200)}
  ${callout(3, "Cargador", 195, 616, 120, 740)}
  ${callout(4, "Convertidor DC-DC", 494, 618, 560, 730)}
  ${callout(5, "Extensor de rango", 1010, 616, 1060, 740)}
`;

/* ───────── 3 · RUEDAS (vista explosionada) ───────── */
// Las piezas de una rueda son círculos concéntricos: si se dibujan montadas,
// los pines se amontonan en el centro. Se separan a lo largo de un eje, que es
// como se presenta un despiece de verdad.
const ruedas = `
  <!-- eje de explosión -->
  <g opacity=".45">
    <path d="M150 392H1090" stroke="${MID}" stroke-width="1.6" stroke-dasharray="10 8"/>
    <path d="M150 660H1090" stroke="${MID}" stroke-width="1.6" stroke-dasharray="10 8"/>
  </g>

  <!-- 1 · neumático -->
  <g id="parte-01">
    <circle cx="250" cy="392" r="128" fill="none" stroke="${INK}" stroke-width="30"/>
    <circle cx="250" cy="392" r="143" fill="none" stroke="${MID}" stroke-width="1.6" stroke-dasharray="8 6"/>
    <circle cx="250" cy="392" r="113" fill="none" stroke="${MID}" stroke-width="1.6"/>
    ${Array.from({ length: 20 }, (_, i) => {
      const a = (i / 20) * Math.PI * 2;
      return `<path d="M${250 + Math.cos(a) * 128} ${392 + Math.sin(a) * 128}l${Math.cos(a) * 13} ${Math.sin(a) * 13}" stroke="${INK}" stroke-width="6"/>`;
    }).join("")}
    <text x="250" y="556" font-size="12" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">3.75-12 / 4.50-12</text>
  </g>

  <!-- 2 · cámara -->
  <g id="parte-02">
    <circle cx="540" cy="392" r="112" fill="none" stroke="${ACCENT}" stroke-width="15" opacity=".65"/>
    <path d="M540 280v-30" stroke="${INK}" stroke-width="6"/>
    <rect x="526" y="228" width="28" height="24" rx="5" fill="${INK}"/>
    <text x="540" y="556" font-size="11" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">VÁLVULA</text>
  </g>

  <!-- 3 · rin -->
  <g id="parte-03">
    <circle cx="820" cy="392" r="112" fill="none" stroke="${INK}" stroke-width="12"/>
    <circle cx="820" cy="392" r="34" fill="url(#steel)" stroke="${INK}" stroke-width="4"/>
    ${Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      return `<circle cx="${820 + Math.cos(a) * 33}" cy="${392 + Math.sin(a) * 33}" r="8" fill="${PAPER}" stroke="${INK}" stroke-width="2.4"/>`;
    }).join("")}
    <text x="820" y="556" font-size="11" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">ARO 12\"</text>
  </g>



  <!-- detalle de perfil -->
  <g transform="translate(940,600)" opacity=".9">
    <ellipse cx="80" cy="60" rx="72" ry="72" fill="none" stroke="${LIGHT}" stroke-width="20"/>
    <ellipse cx="80" cy="60" rx="46" ry="46" fill="none" stroke="${LIGHT}" stroke-width="2" stroke-dasharray="7 5"/>
    <circle cx="80" cy="60" r="16" fill="none" stroke="${LIGHT}" stroke-width="3"/>
  </g>

  ${callout(1, "Neumático reforzado", 250, 264, 250, 150)}
  ${callout(2, "Cámara de aire", 540, 392, 700, 170)}
  ${callout(3, "Rin metálico 12\"", 820, 392, 1010, 250)}
`;

/* ───────── 4 · SUSPENSIÓN ───────── */
const suspension = `
  <!-- barras telescópicas -->
  <g id="parte-01">
    <rect x="196" y="196" width="34" height="330" rx="15" fill="url(#steel)" stroke="${INK}" stroke-width="3"/>
    <rect x="300" y="196" width="34" height="330" rx="15" fill="url(#steel)" stroke="${INK}" stroke-width="3"/>
    <rect x="178" y="180" width="70" height="34" rx="9" fill="${INK}"/>
    <rect x="282" y="180" width="70" height="34" rx="9" fill="${INK}"/>
    <path d="M230 300h54" stroke="${MID}" stroke-width="2.4" stroke-dasharray="6 4"/>
    <path d="M213 470v40M317 470v40" stroke="${INK}" stroke-width="4"/>
    <text x="265" y="560" font-size="11.5" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">HORQUILLA HIDRÁULICA</text>
  </g>
  <!-- ballestas -->
  <g id="parte-02">
    ${[0, 1, 2, 3].map((i) => `<path d="M470 ${470 + i * 17}q170 ${-46 - i * 8} 340 0" fill="none" stroke="${INK}" stroke-width="${7 - i}" stroke-linecap="round"/>`).join("")}
    <path d="M500 470v-34M780 470v-34" stroke="${MID}" stroke-width="3"/>
    <text x="640" y="580" font-size="11.5" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">PAQUETE DE BALLESTAS · 500–800 kg</text>
  </g>
  <!-- amortiguadores -->
  <g id="parte-03">
    <rect x="880" y="250" width="34" height="150" rx="12" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
    <path d="M897 400v96" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>
    <path d="M897 400v96" stroke="${LIGHT}" stroke-width="4"/>
    <circle cx="897" cy="240" r="13" fill="${INK}"/><circle cx="897" cy="506" r="13" fill="${INK}"/>
    <text x="897" y="560" font-size="11.5" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">RESORTE HIDRÁULICO</text>
  </g>
  <!-- bastidor de referencia -->
  <g id="parte-04" opacity=".5">
    <path d="M120 640h960" stroke="${MID}" stroke-width="3" stroke-dasharray="12 8"/>
  </g>
  ${callout(1, "Barras telescópicas", 213, 260, 120, 160)}
  ${callout(2, "Ballestas traseras", 640, 440, 700, 340)}
  ${callout(3, "Amortiguadores", 897, 330, 1020, 220)}
  ${note("CARGA ÚTIL DE DISEÑO: 500–800 kg · DOBLE CRISTO DELANTERO", 40, 770)}
`;

/* ───────── 5 · FRENOS ───────── */
const frenos = `
  <!-- tambor trasero -->
  <g id="parte-01">
    <circle cx="360" cy="420" r="146" fill="url(#steel)" stroke="${INK}" stroke-width="4"/>
    <circle cx="360" cy="420" r="104" fill="none" stroke="${INK}" stroke-width="2.4"/>
    ${[0, 1, 2, 3].map((i) => {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      return `<path d="M${360 + Math.cos(a) * 104} ${420 + Math.sin(a) * 104}L${360 + Math.cos(a) * 146} ${420 + Math.sin(a) * 146}" stroke="${MID}" stroke-width="3"/>`;
    }).join("")}
    <circle cx="360" cy="420" r="40" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
    <path d="M320 400q40 -22 80 0" fill="none" stroke="${ACCENT}" stroke-width="10" stroke-linecap="round"/>
    <path d="M320 440q40 22 80 0" fill="none" stroke="${ACCENT}" stroke-width="10" stroke-linecap="round"/>
    <text x="360" y="620" font-size="12" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">TAMBOR · ZAPATAS</text>
  </g>
  <!-- pedal y varilla -->
  <g id="parte-02">
    <rect x="640" y="470" width="150" height="34" rx="8" fill="url(#steel)" stroke="${INK}" stroke-width="3"/>
    <path d="M640 487H520" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    <circle cx="512" cy="487" r="12" fill="${INK}"/>
    <path d="M790 487h140" stroke="${MID}" stroke-width="4" stroke-dasharray="8 5"/>
    <rect x="930" y="452" width="52" height="70" rx="9" fill="${PAPER}" stroke="${INK}" stroke-width="2.6"/>
    <text x="956" y="540" font-size="10.5" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">SENSOR</text>
  </g>
  <!-- estacionamiento -->
  <g id="parte-03">
    <rect x="640" y="250" width="26" height="120" rx="10" fill="${INK}"/>
    <circle cx="653" cy="238" r="17" fill="${ACCENT}" stroke="${INK}" stroke-width="2.5"/>
    <path d="M666 370h84" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <text x="708" y="404" font-size="11" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">BLOQUEO</text>
  </g>
  <!-- detalle de zapatas -->
  <g transform="translate(880,150)">
    <rect x="0" y="0" width="240" height="230" rx="10" fill="#fff" stroke="${LIGHT}" stroke-width="2"/>
    ${note("DETALLE · ZAPATA", 16, 28)}
    <path d="M40 150q80 -74 160 0" fill="none" stroke="${INK}" stroke-width="22" stroke-linecap="round"/>
    <path d="M40 150q80 74 160 0" fill="none" stroke="${MID}" stroke-width="14" stroke-linecap="round"/>
    <circle cx="120" cy="150" r="16" fill="${ACCENT}"/>
  </g>
  ${callout(1, "Zapatas / bandas", 360, 420, 250, 190)}
  ${callout(2, "Pedal y varilla", 715, 487, 700, 640)}
  ${callout(3, "Freno de estacionamiento", 653, 300, 520, 210)}
  ${note("ACCIONAMIENTO MECÁNICO POR VARILLA · CORTE ELÉCTRICO AL FRENAR", 40, 770)}
`;

/* ───────── 6 · CARROCERÍA ───────── */
const carroceria = `
  <!-- tolva -->
  <g id="parte-01">
    <path d="M300 250h600l-46 300H346z" fill="url(#steel)" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M360 300h480M380 370h440M400 440h400" stroke="${MID}" stroke-width="2" stroke-dasharray="8 6"/>
    <path d="M300 250l46 300M900 250l-46 300" stroke="${INK}" stroke-width="2.4"/>
    <path d="M262 250h676" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
    <text x="600" y="600" font-size="12" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">TOLVA 1600 × 1100 mm · VOLTEO MANUAL</text>
  </g>
  <!-- asientos y escalera -->
  <g id="parte-02">
    <rect x="380" y="120" width="230" height="24" rx="9" fill="${INK}"/>
    <rect x="380" y="120" width="24" height="86" rx="9" fill="${INK}"/>
    <rect x="586" y="120" width="24" height="86" rx="9" fill="${INK}"/>
    <path d="M760 560v110M800 560v110M840 560v110M880 560v110" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
    <path d="M746 570h148" stroke="${INK}" stroke-width="5"/>
    <text x="470" y="176" font-size="11" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">BANCA</text>
  </g>
  <!-- cabina -->
  <g id="parte-03">
    <path d="M300 250V120a24 24 0 0124-24h152a24 24 0 0124 24v130" fill="none" stroke="${MID}" stroke-width="3.4" stroke-dasharray="9 6"/>
    <path d="M326 250V140h150v110" fill="#e8f1fb" stroke="${INK}" stroke-width="2.4" opacity=".9"/>
    <text x="401" y="200" font-size="10.5" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">PARABRISAS</text>
  </g>
  ${callout(1, "Cama / tolva de carga", 600, 400, 1010, 330)}
  ${callout(2, "Asientos y escalera", 495, 132, 300, 120)}
  ${callout(3, "Parabrisas y techo", 401, 200, 700, 130)}
`;

/* ───────── 7 · MANDOS ───────── */
const mandos = `
  <!-- puño acelerador -->
  <g id="parte-01">
    <rect x="150" y="300" width="250" height="60" rx="30" fill="url(#steel)" stroke="${INK}" stroke-width="3"/>
    <g stroke="${MID}" stroke-width="2">
      ${Array.from({ length: 7 }, (_, i) => `<path d="M${186 + i * 26} 306v48"/>`).join("")}
    </g>
    <circle cx="368" cy="330" r="22" fill="${ACCENT}" stroke="${INK}" stroke-width="2.6"/>
    <text x="368" y="336" font-size="10" fill="#fff" text-anchor="middle" font-family="ui-monospace, monospace">REV</text>
    <text x="275" y="400" font-size="11.5" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">PUÑO · 3 VELOCIDADES</text>
  </g>
  <!-- display -->
  <g id="parte-02">
    <rect x="470" y="250" width="210" height="150" rx="18" fill="${INK}"/>
    <rect x="490" y="272" width="170" height="86" rx="9" fill="#0f2c52" stroke="${ACCENT}" stroke-width="2"/>
    <text x="575" y="312" font-size="24" font-weight="700" fill="${ACCENT}" text-anchor="middle" font-family="ui-monospace, monospace">72.0</text>
    <text x="575" y="336" font-size="10" fill="#8fc2ff" text-anchor="middle" font-family="ui-monospace, monospace">VOLT · ODO</text>
    <circle cx="528" cy="382" r="8" fill="#1f7a3f"/><circle cx="575" cy="382" r="8" fill="${MID}"/><circle cx="622" cy="382" r="8" fill="${MID}"/>
    <text x="575" y="430" font-size="11.5" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">DISPLAY LCD</text>
  </g>
  <!-- llave de encendido -->
  <g id="parte-03">
    <circle cx="840" cy="310" r="52" fill="url(#steel)" stroke="${INK}" stroke-width="3"/>
    <circle cx="840" cy="310" r="30" fill="${PAPER}" stroke="${INK}" stroke-width="2.4"/>
    <path d="M840 310l24 -18" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <text x="840" y="392" font-size="11" fill="${MID}" text-anchor="middle" font-family="ui-monospace, monospace">2 LLAVES</text>
  </g>
  ${callout(1, "Puño acelerador", 275, 330, 210, 210)}
  ${callout(2, "Display digital", 575, 325, 640, 180)}
  ${callout(3, "Switch de encendido", 840, 310, 1010, 240)}
`;

const files = [
  ["propulsion.svg", "SISTEMA DE PROPULSIÓN", "01 · MOTOR, DIFERENCIAL Y SELECTOR", propulsion],
  ["electronica.svg", "SISTEMA ELECTRÓNICO", "02 · CONTROLADOR, BATERÍAS Y CARGA", electronica],
  ["ruedas.svg", "TRANSMISIÓN Y RUEDAS", "03 · NEUMÁTICO, RIN Y EJE", ruedas],
  ["suspension.svg", "SUSPENSIÓN", "04 · HORQUILLA, BALLESTAS Y AMORTIGUADORES", suspension],
  ["frenos.svg", "SISTEMA DE FRENOS", "05 · TAMBOR, VARILLA Y ESTACIONAMIENTO", frenos],
  ["carroceria.svg", "CHASIS Y CARROCERÍA", "06 · TOLVA, ASIENTOS Y CABINA", carroceria],
  ["mandos.svg", "MANDOS Y CONTROL", "07 · ACELERADOR, DISPLAY Y ENCENDIDO", mandos],
];

const out = path.join(__dirname, "..", "public", "despiece");
for (const [file, title, sub, body] of files) {
  fs.writeFileSync(path.join(out, file), svg(title, sub, body, file.replace(".svg", "")), "utf8");
  console.log("escrito", file);
}
