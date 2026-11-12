import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:1420",
    browserName: "chromium",
    launchOptions: { channel: "msedge" },
    viewport: { width: 1440, height: 940 },
  },
  webServer: {
    command: "npm run preview -- --port 1420 --strictPort",
    url: "http://127.0.0.1:1420",
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
