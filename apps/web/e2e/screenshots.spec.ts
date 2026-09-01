import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * 公開寄り画面のスクリーンショット撮影（E2E アサーションは最小）。
 * 認証が必要な画面はここでは撮らない。
 */
const SHOT_DIR = path.join("test-results", "screenshots");

const PAGES: { name: string; path: string }[] = [
  { name: "home", path: "/" },
  { name: "auth-login", path: "/auth/login" },
  { name: "auth-sign-up", path: "/auth/sign-up" },
  { name: "auth-forgot-password", path: "/auth/forgot-password" },
];

test.beforeAll(() => {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
});

for (const page of PAGES) {
  test(`screenshot ${page.name}`, async ({ page: browserPage }) => {
    const res = await browserPage.goto(page.path, {
      waitUntil: "domcontentloaded",
    });
    expect(res, `navigation failed: ${page.path}`).not.toBeNull();
    expect(res!.status(), `bad status for ${page.path}`).toBeLessThan(500);
    await expect(browserPage.locator("body")).toBeVisible();
    await browserPage.screenshot({
      path: path.join(SHOT_DIR, `${page.name}.png`),
      fullPage: true,
    });
  });
}
