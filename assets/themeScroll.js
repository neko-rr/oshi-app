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

    // localStorage(theme-store) に保存された theme から bootswatch CSS を即時適用する。
    // - data: {"theme": "sandstone"} のような形を想定
    // - 何も無い場合は no_update で既存CSSを維持
    applyThemeHref: function (data) {
      try {
        if (!data || !data.theme) {
          return window.dash_clientside.no_update;
        }
        const theme = String(data.theme);
        const href =
          "https://cdn.jsdelivr.net/npm/bootswatch@5.3.3/dist/" +
          theme +
          "/bootstrap.min.css";
        return href;
      } catch (e) {
        console.warn("applyThemeHref error", e);
        return window.dash_clientside.no_update;
      }
    },
  },
});


