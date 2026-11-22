import { defineConfig } from "vitest/config";
import { loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
/** Lets the page talk to the AI worker by adding its origin to the CSP. */
function aiCsp(endpoint?: string): Plugin {
  return {
    name: "heartpop-ai-csp",
    transformIndexHtml(html) {
      if (!endpoint) return html;
      const origin = new URL(endpoint).origin;
      return html.replace("connect-src 'self'", `connect-src 'self' ${origin}`);
    },
  };
}
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [
    react(),
    aiCsp(loadEnv(mode, process.cwd(), "VITE_").VITE_AI_ENDPOINT),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["heart.svg"],
      manifest: {
        name: "HeartPop â€” Little Surprises, Big Smiles",
        short_name: "HeartPop",
        description: "Personal surprises and playful moments",
        theme_color: "#fff9f5",
        background_color: "#fff9f5",
        display: "standalone",
        start_url: "./",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "heart.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2,png}"],
        navigateFallback: "index.html",
      },
    }),
  ],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test-setup.ts"],
  },
}));
