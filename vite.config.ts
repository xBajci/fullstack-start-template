import postgresPlugin from "@neondatabase/vite-plugin-postgres";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

dotenv.config();

export default defineConfig({
  optimizeDeps: {
    entries: ["src/**/*.tsx", "src/**/*.ts"],
    exclude: ["pdfjs", "pdf-parse"],
  },
  server: {
    port: 3000,
  },
  plugins: [
    devtools(),
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    postgresPlugin({
      // env: ".env.local", // Path to your .env file (default: ".env")
      // envKey: "DATABASE_URL", // Name of the env variable (default: "DATABASE_URL")
    }),
    tailwindcss(),
    tanstackStart({
      router: {
        routeToken: "layout",
      },
      srcDirectory: "src",
      start: { entry: "./start.tsx" },
      server: { entry: "./server.ts" },
    }),
    viteReact(),
    sentryVitePlugin({
      org: process.env.VITE_SENTRY_ORG,
      project: process.env.VITE_SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Only print logs for uploading source maps in CI
      // Set to `true` to suppress logs
      // silent: !process.env.CI,
      // disable: process.env.NODE_ENV === "development",
    }),
  ],
});
