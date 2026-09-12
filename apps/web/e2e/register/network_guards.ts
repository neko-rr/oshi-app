import type { Page, Route } from "@playwright/test";

/** shared の API_PATHS と同じ（Playwright が dist 未ビルドでも動く） */
const API_PATHS = {
  colorTags: "/color-tags",
  categoryTags: "/category-tags",
  storageLocations: "/storage-locations",
  productsDuplicateHints: "/products/duplicate-hints",
  displaySettings: "/display-settings",
  assistBarcodeLookup: "/assist/barcode/lookup",
  assistVisionDescribe: "/assist/vision/describe",
  photos: "/photos",
  products: "/products",
} as const;

export type RecordedApiCall = {
  method: string;
  pathname: string;
  bodyText: string;
};

function pathnameOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export async function installNetworkGuards(
  page: Page,
  mode: "guest" | "permanent",
): Promise<{ calls: RecordedApiCall[] }> {
  const calls: RecordedApiCall[] = [];

  // ページ本体は通す。API と Supabase だけ差し替える（全abortすると Next が 500 になる）。
  await page.route("https://**/*", async (route) => {
    await route.abort();
  });
  async function handleApi(route: Route) {
    const req = route.request();
    const rec: RecordedApiCall = {
      method: req.method(),
      pathname: pathnameOf(req.url()),
      bodyText: req.postData() ?? "",
    };
    calls.push(rec);

    if (mode === "guest") {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          error: "REGISTRATION_REQUIRED",
          message: "e2e guest must not hit API",
        }),
      });
      return;
    }

    await fulfillPermanent(route, rec);
  }

  await page.route("http://127.0.0.1:8000/**", handleApi);
  await page.route("http://localhost:8000/**", handleApi);

  return { calls };
}

async function fulfillPermanent(
  route: { fulfill: (r: {
    status: number;
    contentType: string;
    body: string;
  }) => Promise<void> },
  rec: RecordedApiCall,
): Promise<void> {
  const { method, pathname } = rec;
  const json = (status: number, body: unknown) =>
    route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });

  if (method === "GET" && pathname === API_PATHS.colorTags) {
    await json(200, { items: [] });
    return;
  }
  if (method === "GET" && pathname === API_PATHS.categoryTags) {
    await json(200, { items: [] });
    return;
  }
  if (method === "GET" && pathname === API_PATHS.storageLocations) {
    await json(200, { items: [] });
    return;
  }
  if (method === "GET" && pathname === API_PATHS.productsDuplicateHints) {
    await json(200, { match_count: 0, total_quantity: 0, sample: null });
    return;
  }
  if (method === "GET" && pathname === API_PATHS.displaySettings) {
    await json(200, { register_start_step: "barcode" });
    return;
  }
  if (method === "POST" && pathname === API_PATHS.assistBarcodeLookup) {
    await json(200, {
      status: "success",
      items: [
        {
          name: "E2E Mock Item A",
          price: 500,
          product_url: "https://example.invalid/item-a",
          shop_name: "E2E Shop",
          external_item_code: "shop:e2e-a",
        },
      ],
    });
    return;
  }
  if (method === "POST" && pathname === API_PATHS.assistVisionDescribe) {
    await json(200, {
      status: "success",
      structured_data: {
        description: "front product b dummy",
        visual_tags: [],
      },
    });
    return;
  }
  if (method === "POST" && pathname === API_PATHS.photos) {
    await json(200, {
      photo_id: 101,
      photo_thumbnail_path: "e2e/thumb.jpg",
      photo_high_resolution_path: "e2e/high.jpg",
    });
    return;
  }
  if (method === "POST" && pathname === API_PATHS.products) {
    await json(200, {
      registered_product_id: 9001,
      product_name: "E2E Mock Item A",
      photo_id: 101,
    });
    return;
  }

  await json(404, { error: "e2e_unmocked", path: pathname });
}

export function apiCallsOf(
  calls: RecordedApiCall[],
  method: string,
  pathname: string,
): RecordedApiCall[] {
  return calls.filter((c) => c.method === method && c.pathname === pathname);
}

