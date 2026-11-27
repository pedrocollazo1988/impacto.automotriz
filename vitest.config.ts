import { defineConfig } from "vitest/config";
// Los componentes usan el runtime automático de JSX (Next).
import path from "node:path";
export default defineConfig({ resolve: { alias: { "@": path.resolve(__dirname, "src") } }, esbuild: { jsx: "automatic" },
  test: { include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"] } });
