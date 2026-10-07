/**
 * README 用スクリーンショット（本番 https://oshihaven.com）。
 * 公開画面 + ゲスト開始後の主要画面。
 */
import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../../../docs/readme/screenshots");
const prod = "https://oshihaven.com";

fs.mkdirSync(outDir, { recursive: true });

async function shot(page, name) {
  await page.screenshot({
    path: path.join(outDir, name),
    fullPage: false,
  });
  console.log("saved", name);
}

async function gotoReady(page, url) {
  const res = await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  await page.waitForTimeout(2500);
  return res;
}

const browser = await chromium.launch({ headless: true });

const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: "ja-JP",
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
const desktop = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  locale: "ja-JP",
});

const m = await mobile.newPage();
m.setDefaultTimeout(60000);

await gotoReady(m, `${prod}/`);
await shot(m, "01-home-mobile.png");

await gotoReady(m, `${prod}/auth/login`);
await shot(m, "02-login-mobile.png");

try {
  await gotoReady(m, `${prod}/auth/sign-up`);
  await shot(m, "03-signup-mobile.png");
} catch (e) {
  console.log("skip signup", String(e.message || e));
}

const d = await desktop.newPage();
d.setDefaultTimeout(60000);
try {
  await gotoReady(d, `${prod}/`);
  await shot(d, "01-home-desktop.png");
} catch (e) {
  console.log("skip desktop home", String(e.message || e));
}

await gotoReady(m, `${prod}/auth/login`);
// 文言ゆれに備え、部分一致でクリック
const guest = m.locator("button").filter({ hasText: "ゲスト" }).first();
await guest.waitFor({ state: "visible", timeout: 20000 });
console.log("guest label", await guest.innerText());
await guest.click();
await m.waitForTimeout(6000);

const bodyText = await m.locator("body").innerText();
if (/Anonymous sign-ins are disabled/i.test(bodyText)) {
  console.error("guest still disabled");
  console.log(bodyText.slice(0, 500));
  await shot(m, "_debug-guest-error.png");
} else {
  console.log("after guest url", m.url());
  // ゲスト後の着地が登録ならそれを README 用に保存（CF 1102 回避のため追加遷移は控えめ）
  if (m.url().includes("/register")) {
    await shot(m, "05-register-guest.png");
  } else {
    await shot(m, "04-after-guest.png");
    try {
      await m.waitForTimeout(3000);
      await gotoReady(m, `${prod}/register`);
      if (!m.url().includes("/auth/login")) {
        const body = await m.locator("body").innerText();
        if (!/Error 1102|Worker exceeded/i.test(body)) {
          await shot(m, "05-register-guest.png");
        }
      }
    } catch (e) {
      console.log("skip register", String(e.message || e));
    }
  }
}

await mobile.close();
await desktop.close();
await browser.close();

// デバッグ用は README に載せない
for (const f of fs.readdirSync(outDir)) {
  if (f.startsWith("_debug")) {
    fs.unlinkSync(path.join(outDir, f));
    console.log("removed", f);
  }
}

console.log("done ->", outDir);
console.log(fs.readdirSync(outDir).join(", "));
