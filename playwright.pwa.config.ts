import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "pwa.spec.ts",
  use: {
    ...devices["Desktop Chrome"],
    channel: "chromium",
    baseURL: "http://127.0.0.1:4173",
  },
  webServer: {
    command: `${process.platform === "win32" ? "npm.cmd" : "npm"} run preview -- --port 4173`,
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
