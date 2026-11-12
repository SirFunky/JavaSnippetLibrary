import { chromium } from "@playwright/test";
import { preview } from "vite";
const server = await preview({
  preview: { host: "127.0.0.1", port: 1420, strictPort: true },
});
const browser = await chromium.launch({ channel: "msedge" });
const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });
await page.goto("http://127.0.0.1:1420");
await page.getByRole("textbox", { name: "Search snippets" }).fill("file");
await page.getByRole("option").filter({ hasText: "Read a text file" }).click();
await page.locator(".shiki").waitFor();
await page.screenshot({ path: "artifacts/preview-dark.png" });
await page.getByRole("button", { name: "Settings", exact: true }).click();
await page.getByRole("button", { name: "light", exact: true }).click();
await page.getByRole("button", { name: "Close settings" }).click();
await page.screenshot({ path: "artifacts/preview-light.png" });
await browser.close();
await new Promise((resolve, reject) =>
  server.httpServer.close((error) => (error ? reject(error) : resolve())),
);
