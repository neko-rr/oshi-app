"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "oshiapp:design-lab:mobile-origin";
const LAB_PATH = "/dev/design-lab";

function isLoopbackHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h === "::1";
}

function buildLabUrl(origin: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${LAB_PATH}`;
}

/**
 * ブラウザから見える候補（WebRTC）。失敗しても空配列。
 * 169.254.*（リンクローカル）は実機ではほぼ使えないので除外。
 */
async function discoverCandidateHosts(): Promise<string[]> {
  const found = new Set<string>();
  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    pc.createDataChannel("");
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await new Promise<void>((resolve) => {
      const timer = window.setTimeout(() => resolve(), 1200);
      pc.onicecandidate = (ev) => {
        const cand = ev.candidate?.candidate;
        if (!cand) {
          if (ev.candidate === null) {
            window.clearTimeout(timer);
            resolve();
          }
          return;
        }
        const m = /([0-9]{1,3}(?:\.[0-9]{1,3}){3})/.exec(cand);
        if (!m) return;
        const ip = m[1];
        if (ip.startsWith("127.") || ip.startsWith("169.254.")) return;
        found.add(ip);
      };
    });
    pc.close();
  } catch {
    /* ignore */
  }
  return [...found];
}

type LabMobileQrProps = {
  /** いまブラウザで開いている origin（参考表示用） */
  pageOrigin: string;
};

/**
 * 実機用 QR。localhost の QR はスマホから届かないため、LAN origin を手入力／候補選択する。
 */
export default function LabMobileQr({ pageOrigin }: LabMobileQrProps) {
  const pageHost = useMemo(() => {
    try {
      return new URL(pageOrigin).hostname;
    } catch {
      return "";
    }
  }, [pageOrigin]);

  const [originInput, setOriginInput] = useState("");
  const [candidates, setCandidates] = useState<string[]>([]);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setOriginInput(saved);
        return;
      }
    } catch {
      /* ignore */
    }
    if (pageOrigin && !isLoopbackHost(pageHost)) {
      setOriginInput(pageOrigin);
    } else {
      setOriginInput("http://192.168.0.0:3000");
    }
  }, [pageOrigin, pageHost]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ips = await discoverCandidateHosts();
      if (!cancelled) setCandidates(ips);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const labUrl = useMemo(() => {
    try {
      const u = new URL(originInput.includes("://") ? originInput : `http://${originInput}`);
      if (!u.port) u.port = "3000";
      return buildLabUrl(u.origin);
    } catch {
      return "";
    }
  }, [originInput]);

  const loopbackQr = useMemo(() => {
    try {
      return isLoopbackHost(new URL(labUrl).hostname);
    } catch {
      return true;
    }
  }, [labUrl]);

  useEffect(() => {
    if (!labUrl || loopbackQr) {
      setDataUrl(null);
      setError(
        loopbackQr
          ? "localhost / 127.0.0.1 はスマホから届きません。下で PC の LAN アドレスを指定してください。"
          : null,
      );
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const next = await QRCode.toDataURL(labUrl, {
          margin: 1,
          width: 168,
          color: { dark: "#18181b", light: "#ffffff" },
        });
        if (!cancelled) {
          setDataUrl(next);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setDataUrl(null);
          setError("QR を生成できませんでした。URL を手入力してください。");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [labUrl, loopbackQr]);

  const persistOrigin = (value: string) => {
    setOriginInput(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  };

  return (
    <section
      className="rounded-lg border border-zinc-200 bg-white p-3 text-sm"
      aria-label="モバイル実機用 QR"
    >
      <p className="text-xs font-semibold text-zinc-800">モバイル実機</p>
      <p className="mt-0.5 text-[11px] text-zinc-500">
        スマホは <strong className="font-medium text-zinc-700">同じ Wi‑Fi</strong>{" "}
        で、PC の LAN IP（例 192.168.x.x）へアクセスします。
        localhost の QR では「サイトにアクセスできません」になります。
      </p>

      <label className="mt-2 block text-[11px] text-zinc-600">
        PC の URL（ホスト）
        <input
          type="text"
          value={originInput}
          onChange={(e) => persistOrigin(e.target.value)}
          placeholder="http://192.168.1.10:3000"
          className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 font-mono text-[11px] text-zinc-800"
          spellCheck={false}
          autoComplete="off"
        />
      </label>

      {candidates.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="w-full text-[10px] text-zinc-500">候補（タップでセット）:</span>
          {candidates.map((ip) => {
            const origin = `http://${ip}:3000`;
            return (
              <button
                key={ip}
                type="button"
                onClick={() => persistOrigin(origin)}
                className="rounded border border-zinc-300 px-2 py-0.5 font-mono text-[10px] hover:bg-zinc-50"
              >
                {origin}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="mt-2 text-[10px] text-zinc-500">
          候補が出ないときは、PC の設定 → ネットワークで IPv4
          を確認し、上に <span className="font-mono">http://（そのIP）:3000</span>{" "}
          を入れてください。
        </p>
      )}

      <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-[10px] text-zinc-600">
        <li>
          Web は <span className="font-mono">pnpm dev:web</span>（0.0.0.0
          待ち受け）で起動
        </li>
        <li>スマホと PC を同じ Wi‑Fi に接続</li>
        <li>Windows ファイアウォールで Node / ポート 3000 を許可</li>
        <li>下の QR を読み取り（または URL を手入力）</li>
      </ol>

      <div className="mt-2 flex flex-wrap items-start gap-3">
        {dataUrl && !loopbackQr ? (
          // eslint-disable-next-line @next/next/no-img-element -- data URL
          <img
            src={dataUrl}
            alt="Design Lab を開く QR コード"
            className="size-40 rounded border border-zinc-200 bg-white"
          />
        ) : (
          <div className="flex size-40 items-center justify-center rounded border border-dashed border-amber-300 bg-amber-50 px-2 text-center text-[11px] text-amber-900">
            {error ?? "LAN アドレスを設定すると QR が出ます"}
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <p className="break-all font-mono text-[10px] text-zinc-700">
            {labUrl || "（URL 不正）"}
          </p>
          {loopbackQr ? (
            <p className="text-[11px] font-medium text-amber-800" role="status">
              いまの指定はスマホから届きません。LAN IP に変えてください。
            </p>
          ) : null}
          <button
            type="button"
            disabled={!labUrl || loopbackQr}
            className="rounded border border-zinc-300 px-2 py-1 text-[11px] hover:bg-zinc-50 disabled:opacity-40"
            onClick={() => {
              void navigator.clipboard?.writeText(labUrl).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
              });
            }}
          >
            {copied ? "コピーしました" : "URL をコピー"}
          </button>
          {pageHost && isLoopbackHost(pageHost) ? (
            <p className="text-[10px] text-zinc-500">
              このタブは {pageHost}{" "}
              で開いています。QR 用には別ホストが必要です。
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
