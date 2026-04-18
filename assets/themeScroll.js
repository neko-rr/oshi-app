window.dash_clientside = Object.assign({}, window.dash_clientside, {
  themeScroll: {
    saveScroll: function (_nClicks, containerId) {
      try {
        const el = document.getElementById(containerId);
        if (el) {
          const pos = el.scrollLeft || 0;
          sessionStorage.setItem("themeScrollPos", pos);
          return pos;
        }
      } catch (e) {
        console.warn("saveScroll error", e);
      }
      return 0;
    },
    restoreScroll: function (pos, currentStyle) {
      try {
        const cached = sessionStorage.getItem("themeScrollPos");
        if (cached !== null) {
          pos = Number(cached);
        }
        const el = document.getElementById("theme-card-container");
        if (el && typeof pos === "number") {
          // レイアウト安定後に復元（2フレーム遅延）
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              el.scrollLeft = pos;
            });
          });
        }
      } catch (e) {
        console.warn("restoreScroll error", e);
      }
      return currentStyle || {};
    },

    // theme-store（{theme}）/ 設定の theme-preview-store（文字列）/ pathname から Bootswatch href を決める。
    // /settings ではプレビュー Store を優先（未保存の選択と DB 同期後の見た目を一致させる）。
    // 許可リストは components/theme_utils.BOOTSWATCH_THEMES と一致（任意 URL 読込防止）。
    applyBootswatchFromStores: function (themeStoreData, previewData, pathname) {
      try {
        const allowed = new Set([
          "cerulean", "cosmo", "cyborg", "darkly", "flatly", "journal", "litera",
          "lumen", "lux", "materia", "minty", "morph", "pulse", "quartz", "sandstone",
          "simplex", "sketchy", "slate", "solar", "spacelab", "superhero", "united",
          "vapor", "yeti", "zephyr",
        ]);
        let theme = null;
        if (pathname === "/settings" && previewData != null && String(previewData).trim() !== "") {
          theme = String(previewData).trim();
        } else if (themeStoreData && themeStoreData.theme) {
          theme = String(themeStoreData.theme);
        }
        if (!theme || !allowed.has(theme)) {
          return window.dash_clientside.no_update;
        }
        const href =
          "https://cdn.jsdelivr.net/npm/bootswatch@5.3.3/dist/" +
          theme +
          "/bootstrap.min.css";
        const el = document.getElementById("bootswatch-theme");
        if (el) {
          const cur = el.getAttribute("href") || "";
          if (cur === href) {
            return window.dash_clientside.no_update;
          }
        }
        return href;
      } catch (e) {
        console.warn("applyBootswatchFromStores error", e);
        return window.dash_clientside.no_update;
      }
    },
  },
});


