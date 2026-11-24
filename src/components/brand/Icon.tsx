import type { SVGProps } from "react";

// Set de iconos de trazo (stroke) coherentes con la identidad. Heredan color y tamaño (1em).
const paths: Record<string, React.ReactNode> = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></>,
  cart: <><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2.5 3h2.2l2.3 12.2a1.6 1.6 0 0 0 1.6 1.3h9.2a1.6 1.6 0 0 0 1.6-1.3L21 7H5.2" /></>,
  user: <><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close: <><path d="M6 6l12 12M18 6 6 18" /></>,
  chevronRight: <><path d="m9 6 6 6-6 6" /></>,
  chevronLeft: <><path d="m15 6-6 6 6 6" /></>,
  arrowRight: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  cube: <><path d="M12 2.5 21 7v10l-9 4.5L3 17V7z" /><path d="M3 7l9 4.5L21 7M12 21.5V11.5" /></>,
  car: <><path d="M4 13l1.6-4.4A2 2 0 0 1 7.5 7h9a2 2 0 0 1 1.9 1.6L20 13" /><path d="M3 13h18v4a1 1 0 0 1-1 1h-1.5M3 13v4a1 1 0 0 0 1 1h1.5" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="17" cy="17.5" r="1.6" /></>,
  bolt: <><path d="M13 2 4.5 13H11l-1 9 8.5-11H12z" /></>,
  wrench: <><path d="M15.5 3a5 5 0 0 0-4.3 7.6L3 18.8 5.2 21l8.2-8.2A5 5 0 1 0 15.5 3z" /></>,
  shield: <><path d="M12 3 5 6v5.5c0 4.3 3 7.6 7 9.5 4-1.9 7-5.2 7-9.5V6z" /><path d="m9.2 12 2 2 3.6-3.8" /></>,
  truck: <><path d="M3 7h11v9H3zM14 10h3.6l2.4 2.6V16h-6z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" /></>,
  card: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3 10h18" /></>,
  bank: <><path d="M3 9.5 12 4l9 5.5" /><path d="M5 10v7M9.5 10v7M14.5 10v7M19 10v7" /><path d="M3 20h18" /></>,
  cash: <><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6.5 9.5h.01M17.5 14.5h.01" /></>,
  crypto: <><circle cx="12" cy="12" r="8.5" /><path d="M9.5 8h3.2a2.2 2.2 0 0 1 0 4.4H9.5zM9.5 12.4h3.8a2.3 2.3 0 0 1 0 4.6H9.5zM11 6v2M11 17v2M14 6v2M14 17v2" /></>,
  link: <><path d="M10 13.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5L11 7.5" /><path d="M14 10.5a3.5 3.5 0 0 0-5 0L6.5 13a3.5 3.5 0 0 0 5 5l1.5-1.5" /></>,
  send: <><path d="M21 3 10.5 13.5" /><path d="M21 3l-6.5 18-4-8-8-4z" /></>,
  wallet: <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H19a1 1 0 0 1 1 1v13H6.5A2.5 2.5 0 0 1 4 16.5z" /><path d="M4 8h16M15 12h5v4h-5a2 2 0 0 1 0-4z" /></>,
  mobile: <><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.2 3.6 8.5S14.4 18.2 12 20.5c-2.4-2.3-3.6-5.2-3.6-8.5S9.6 5.8 12 3.5z" /></>,
  eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" /><circle cx="12" cy="12" r="2.8" /></>,
  eyeOff: <><path d="M3 3l18 18" /><path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16.6 16.6 0 0 1-3.3 3.8M6.2 6.8A16.4 16.4 0 0 0 2.5 12s3.5 6 9.5 6a9.7 9.7 0 0 0 3.3-.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  star: <><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8L3.5 9.7l5.9-.9z" /></>,
  heart: <><path d="M12 20s-7-4.3-7-9a3.8 3.8 0 0 1 7-2.3A3.8 3.8 0 0 1 19 11c0 4.7-7 9-7 9z" /></>,
  compare: <><path d="M7 4v12M4 13l3 3 3-3M17 20V8M14 11l3-3 3 3" /></>,
  check: <><path d="m5 12.5 4.5 4.5L19 7" /></>,
  phone: <><path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5z" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 5.5L20 7" /></>,
  pin: <><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  box: <><path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16z" /><path d="M3.5 8 12 12.5 20.5 8M12 12.5v8" /></>,
  gauge: <><path d="M12 13.5 15.5 9" /><path d="M4 18a9 9 0 1 1 16 0" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  minus: <><path d="M5 12h14" /></>,
  trash: <><path d="M4.5 7h15M9 7V5h6v2M6.5 7l1 13h9l1-13" /></>,
  filter: <><path d="M4 6h16M7 12h10M10 18h4" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  tag: <><path d="M4 4h7l9 9-7 7-9-9z" /><circle cx="8" cy="8" r="1.4" /></>,
  spark: <><path d="M12 3v5M12 16v5M3 12h5M16 12h5M6.3 6.3l3.5 3.5M14.2 14.2l3.5 3.5M17.7 6.3l-3.5 3.5M9.8 14.2l-3.5 3.5" /></>,
  whatsapp: <><path d="M12 3.2a8.8 8.8 0 0 0-7.5 13.4L3.2 20.8l4.3-1.2A8.8 8.8 0 1 0 12 3.2z" /><path d="M8.8 8.3c.3-.7.9-.6 1.2-.2l.9 1.4c.2.4.1.7-.2 1l-.6.6c.5 1 1.3 1.8 2.3 2.3l.6-.6c.3-.3.6-.4 1-.2l1.4.9c.4.3.5.9-.2 1.2-1.4.7-3-.1-4.6-1.7s-2.4-3.2-1.8-4.7z" /></>,
  instagram: <><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="17" cy="7" r="1" /></>,
  facebook: <><path d="M14.5 8.5H17V5.2h-2.6c-2 0-3.2 1.3-3.2 3.3v1.6H9v3.2h2.2V21h3.3v-7.7h2.3l.5-3.2h-2.8V8.9c0-.3.2-.4.5-.4z" /></>,
  chart: <><path d="M4 20V5M4 20h16M8 20v-6M12 20v-9M16 20v-4" /></>,
  image: <><rect x="3" y="4.5" width="18" height="15" rx="2.5" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="m4 17 4.8-4.4a2 2 0 0 1 2.7 0L20 19.5" /></>,
  play: <><circle cx="12" cy="12" r="8.5" /><path d="m10.5 8.8 5 3.2-5 3.2z" /></>,
  upload: <><path d="M12 16V4M7.5 8.5 12 4l4.5 4.5" /><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" /></>,
  download: <><path d="M12 4v12M7.5 11.5 12 16l4.5-4.5" /><path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" /></>,
  cubeScan: <><path d="M12 7.5 16 10v4l-4 2.2L8 14v-4z" /><path d="M8 10l4 2.2L16 10M12 12.2V16" /><path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" /></>,
  spinner: <><path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></>,
  refresh: <><path d="M20 11a8 8 0 1 0-1.6 5.6" /><path d="M20 5v6h-6" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8.2v.1" /></>,
  ruler: <><path d="M3 15 15 3l6 6L9 21z" /><path d="m7.5 13.5 2 2M10.5 10.5l2 2M13.5 7.5l2 2" /></>,
  battery: <><rect x="3" y="8" width="15" height="8" rx="2" /><path d="M21 11v2M6.5 11h6" /></>,
  edit: <><path d="M4 20h4l10-10a2.5 2.5 0 0 0-3.5-3.5L4.5 16.5z" /><path d="M13.5 6.5 17.5 10.5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" /></>,
  moon: <><path d="M20 14.5A8 8 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" /></>,
  monitor: <><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>,
};

/** Nombres válidos, para que el panel ofrezca un selector en vez de texto libre. */
export const NOMBRES_ICONO = Object.keys(paths);

export default function Icon({ name, size = "1em", strokeWidth = 2, className, style, ...rest }: { name: keyof typeof paths | string; size?: number | string; strokeWidth?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      shapeRendering="geometricPrecision"
      aria-hidden="true"
      focusable="false"
      className={className ? `shrink-0 ${className}` : "shrink-0"}
      style={{ display: "inline-block", verticalAlign: "-0.125em", ...style }}
      {...rest}
    >
      {paths[name] ?? paths.info}
    </svg>
  );
}
