import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const E2E_AUTH_COOKIE = "oshi_e2e_auth";

const API_PATHS = {
  assistBarcodeLookup: "/assist/barcode/lookup",
  assistVisionDescribe: "/assist/vision/describe",
  photos: "/photos",
  products: "/products",
  productsDuplicateHints: "/products/duplicate-hints",
} as const;
import {
  apiCallsOf,
  installNetworkGuards,
} from "./network_guards";
import {
  fixtureFile,
  loadRegisterManifest,
} from "./register_manifest";

const manifest = loadRegisterManifest();
const fixtureCase = manifest.cases[0];
if (!fixtureCase) {
  throw new Error("register fixtures が空です");
}

async function openRegisterAs(
  page: Page,
  context: BrowserContext,
  role: "guest" | "permanent",
): Promise<ReturnType<typeof installNetworkGuards>> {
  const port = Number(process.env.PLAYWRIGHT_PORT || 3010);
  const urls = [
    `http://127.0.0.1:${port}/`,
    `http://localhost:${port}/`,
  ];
  await context.addCookies(
    urls.map((url) => ({
      name: E2E_AUTH_COOKIE,
      value: role,
      url,
    })),
  );
  await page.addInitScript(() => {
    localStorage.setItem(
      "oshihaven:displaySettings",
      JSON.stringify({ register_start_step: "barcode" }),
    );
  });
  const guards = await installNetworkGuards(page, role);
  const res = await page.goto("/register", { waitUntil: "domcontentloaded" });
  expect(res, " /register に到達できません").not.toBeNull();
  expect(res!.status()).toBeLessThan(500);
  await expect(
    page.getByRole("heading", { name: /製品登録|Register product/i }),
  ).toBeVisible();
  return guards;
}

async function dismissStartNudge(page: Page) {
  const dismiss = page.getByRole("button", { name: /今はしない|Not now/i });
  if (await dismiss.isVisible().catch(() => false)) {
    await dismiss.click();
  }
}

test.describe("register wizard fixtures", () => {
  test("guest: バーコード画像読取後にゲートし、業務 API に届かない", async ({
    page,
    context,
  }) => {
    const { calls } = await openRegisterAs(page, context, "guest");
    await page
      .locator("#barcode_image_upload")
      .setInputFiles(fixtureFile(fixtureCase.barcode_image));
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /本登録が必要/ })).toBeVisible();
    await expect(page.locator("#wizard_barcode")).toHaveValue(
      fixtureCase.expected_barcode,
      { timeout: 15_000 },
    );
    const business = calls.filter((c) =>
      [
        API_PATHS.assistBarcodeLookup,
        API_PATHS.assistVisionDescribe,
        API_PATHS.photos,
        API_PATHS.products,
        API_PATHS.productsDuplicateHints,
      ].includes(c.pathname),
    );
    expect(business, "ゲストで業務 API が呼ばれた").toEqual([]);
  });

  test("permanent: 別製品フィクスチャで読取・正面プレビュー・本保存（mock）", async ({
    page,
    context,
  }) => {
    const { calls } = await openRegisterAs(page, context, "permanent");
    await page
      .locator("#barcode_image_upload")
      .setInputFiles(fixtureFile(fixtureCase.barcode_image));
    await expect(page.locator("#wizard_barcode")).toHaveValue(
      fixtureCase.expected_barcode,
      { timeout: 15_000 },
    );
    await page.getByRole("button", { name: /次へ（照合）|Next \(lookup\)/i }).click();
    await expect(page.locator("#wizard_photo")).toBeVisible();
    await page
      .locator("#wizard_photo")
      .setInputFiles(fixtureFile(fixtureCase.front_image));
    await expect(
      page.getByRole("img", {
        name: /正面写真のプレビュー|Preview of the selected front photo/i,
      }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^次へ$|^Next$/ }).click();
    await expect(page.locator("#product_name")).toBeVisible();
    const name = page.locator("#product_name");
    if (!(await name.inputValue()).trim()) {
      await name.fill("E2E Fallback Name");
    }
    await page.getByRole("button", { name: /登録する|^Register$/i }).click();
    await expect(page.getByRole("button", { name: /続けて登録|Register another/i })).toBeVisible({
      timeout: 15_000,
    });

    const photos = apiCallsOf(calls, "POST", API_PATHS.photos);
    expect(photos).toHaveLength(1);
    expect(photos[0]?.bodyText).toContain(fixtureCase.front_image);
    expect(photos[0]?.bodyText).not.toContain(fixtureCase.barcode_image);

    const products = apiCallsOf(calls, "POST", API_PATHS.products);
    expect(products).toHaveLength(1);
    const created = JSON.parse(products[0]?.bodyText || "{}") as {
      barcode_number?: string;
      photo_id?: number;
    };
    expect(created.barcode_number).toBe(fixtureCase.expected_barcode);
    expect(created.photo_id).toBe(101);
  });

  test("読めない画像: 失敗案内が出て番号入力欄が残る", async ({
    page,
    context,
  }) => {
    await openRegisterAs(page, context, "permanent");
    await page
      .locator("#barcode_image_upload")
      .setInputFiles(fixtureFile(manifest.unreadable_image));
    await expect(
      page.getByText(/画像から読めません|Could not read barcode/),
    ).toBeVisible();
    await expect(page.locator("#wizard_barcode")).toBeVisible();
    await expect(page.locator("#wizard_barcode")).toHaveValue("");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("permanent: 正面をスキップして名前だけ本保存", async ({
    page,
    context,
  }) => {
    const { calls } = await openRegisterAs(page, context, "permanent");
    await page.getByRole("button", { name: /^スキップ$|^Skip$/ }).click();
    await dismissStartNudge(page);
    await expect(page.locator("#wizard_photo")).toBeVisible();
    await page.getByRole("button", { name: /^スキップ$|^Skip$/ }).click();
    await expect(page.locator("#product_name")).toBeVisible();
    await page.locator("#product_name").fill("E2E Photo Skip");
    await page.getByRole("button", { name: /登録する|^Register$/i }).click();
    await expect(
      page.getByRole("button", { name: /続けて登録|Register another/i }),
    ).toBeVisible({ timeout: 15_000 });

    expect(apiCallsOf(calls, "POST", API_PATHS.photos)).toHaveLength(0);
    const products = apiCallsOf(calls, "POST", API_PATHS.products);
    expect(products).toHaveLength(1);
    const created = JSON.parse(products[0]?.bodyText || "{}") as {
      product_name?: string;
      photo_id?: number | null;
    };
    expect(created.product_name).toBe("E2E Photo Skip");
    expect(created.photo_id == null).toBe(true);
  });

  test("guest: 正面の次へでゲートし、本保存でもゲートする", async ({
    page,
    context,
  }) => {
    const { calls } = await openRegisterAs(page, context, "guest");
    await page.getByRole("button", { name: /^スキップ$|^Skip$/ }).click();
    await dismissStartNudge(page);
    await expect(page.locator("#wizard_photo")).toBeVisible();
    await page
      .locator("#wizard_photo")
      .setInputFiles(fixtureFile(fixtureCase.front_image));
    await page.getByRole("button", { name: /^次へ$|^Next$/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByText(/アシスト機能には本登録|assist features/i),
    ).toBeVisible();
    expect(apiCallsOf(calls, "POST", API_PATHS.assistVisionDescribe)).toHaveLength(
      0,
    );
    expect(apiCallsOf(calls, "POST", API_PATHS.photos)).toHaveLength(0);

    await page.getByRole("button", { name: /閉じる|Close/i }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("#product_name")).toBeVisible();
    await page.locator("#product_name").fill("E2E Guest Save");
    await page.getByRole("button", { name: /登録する|^Register$/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByText(/製品を保存するには本登録|save products/i),
    ).toBeVisible();
    expect(apiCallsOf(calls, "POST", API_PATHS.products)).toHaveLength(0);
  });
});
