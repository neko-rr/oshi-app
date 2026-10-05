import { expect, test } from "@playwright/test";

/**
 * スマホ幅シェルの smoke（下部タブ可視・認証では非表示・横向きでも body 可視）。
 * 端末は playwright.config の mobile-chrome プロジェクト側で指定。
 */
test.describe("responsive_web shell", () => {
  test("home shows bottom tabs", async ({ page }) => {
    const res = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(res?.status() ?? 500).toBeLessThan(500);
    const tabs = page.getByRole("navigation", {
      name: /メイン（タブ）|Main tabs/i,
    });
    await expect(tabs).toBeVisible();
    await expect(
      tabs.getByRole("link", { name: /ギャラリー|Gallery/i }),
    ).toBeVisible();
    await expect(
      tabs.getByRole("link", { name: /登録|Register/i }),
    ).toBeVisible();
    await expect(
      tabs.getByRole("link", { name: /その他|More/i }),
    ).toBeVisible();
    // 検索はギャラリー内。独立タブは置かない
    await expect(
      tabs.getByRole("link", { name: /検索|Search/i }),
    ).toHaveCount(0);
  });

  test("auth login hides bottom tabs", async ({ page }) => {
    const res = await page.goto("/auth/login", {
      waitUntil: "domcontentloaded",
    });
    expect(res?.status() ?? 500).toBeLessThan(500);
    await expect(
      page.getByRole("navigation", { name: /メイン（タブ）|Main tabs/i }),
    ).toHaveCount(0);
  });

  test("landscape still shows tabs on home", async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    const res = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(res?.status() ?? 500).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: /メイン（タブ）|Main tabs/i }),
    ).toBeVisible();
  });
});
