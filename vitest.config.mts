import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": root,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    environmentMatchGlobs: [
      ["**/app/api/**/*.test.ts", "node"],
      ["**/app/auth/**/*.test.ts", "node"],
      ["**/lib/api/**/*.test.ts", "node"],
      ["**/lib/validations/**/*.test.ts", "node"],
    ],
    pool: "forks",
    testTimeout: 10000,
  },
});
