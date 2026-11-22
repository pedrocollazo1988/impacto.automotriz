import type { DetailedHTMLProps, HTMLAttributes } from "react";

// El paquete @google/model-viewer registra el custom element en tiempo de
// ejecución, pero no amplía JSX, así que TS no conoce <model-viewer>.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        alt?: string;
        poster?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "touch-action"?: string;
        "interaction-prompt"?: string;
        "shadow-intensity"?: string;
        exposure?: string;
      };
    }
  }
}
