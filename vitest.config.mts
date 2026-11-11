import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

const nodeTestGlobs = [
  "**/app/api/**/*.test.ts",
  "**/app/auth/**/*.test.ts",
  "**/lib/api/**/*.test.ts",
  "**/lib/validations/**/*.test.ts",
];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": root,
    },
  },
  test: {
    setupFiles: ["./vitest.setup.ts"],
    pool: "forks",
    testTimeout: 10000,
    projects: [
      {
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: ["**/*.test.{ts,tsx}"],
          exclude: nodeTestGlobs,
        },
      },
      {
        test: {
          name: "node",
          environment: "node",
          include: nodeTestGlobs,
        },
      },
    ],
  },
});
