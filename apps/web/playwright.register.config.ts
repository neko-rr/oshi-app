import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 3010);
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${port}`;

/**
 * 登録ウィザード E2E（フィクスチャ画像 + API mock + 認証 stub）。
 * 既定 Playwright 設定（スクショ）とは分離。Secrets は使わない。
 */
export default defineConfig({
  testDir: "./e2e/register",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-register" }]],
  outputDir: "test-results-register",
  use: {
    baseURL,
    locale: "ja-JP",
    extraHTTPHeaders: { "Accept-Language": "ja" },
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  timeout: 60_000,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: `pnpm exec next start -H localhost -p ${port}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          ...process.env,
          NEXT_PUBLIC_E2E_AUTH_STUB_ENABLED: "1",
          E2E_AUTH_STUB_ENABLED: "1",
          NEXT_PUBLIC_SUPABASE_URL:
            process.env.NEXT_PUBLIC_SUPABASE_URL ||
            "https://example.supabase.co",
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder",
          NEXT_PUBLIC_API_BASE_URL:
            process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000",
        },
      },
});
