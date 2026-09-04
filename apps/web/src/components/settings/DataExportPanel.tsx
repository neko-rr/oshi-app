"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { API_PATHS } from "@oshi/shared";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";

type ExportKind = "text" | "media";

type ExportJob = {
  export_id: string;
  kind: ExportKind;
  status: "pending" | "running" | "ready" | "failed";
  error_code: string | null;
  created_at?: string;
  expires_at?: string;
};

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000"
  );
}

async function authHeader(): Promise<HeadersInit> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("unauthorized");
  }
  return { Authorization: `Bearer ${data.session.access_token}` };
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function DataExportPanel() {
  const t = useTranslations("DataExport");
  const [busyKind, setBusyKind] = useState<ExportKind | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const downloadFile = useCallback(
    async (exportId: string) => {
      const headers = await authHeader();
      const res = await fetch(
        `${apiBase()}${API_PATHS.exports}/${exportId}/file`,
        { headers },
      );
      if (!res.ok) {
        throw new Error("download_failed");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") || "";
      const match = /filename="([^"]+)"/.exec(disposition);
      const filename = match?.[1] || `oshi-export-${exportId.slice(0, 8)}.zip`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    [],
  );

  const runExport = useCallback(
    async (kind: ExportKind) => {
      setBusyKind(kind);
      setErrorText(null);
      setStatusText(kind === "text" ? t("statusPreparing") : t("statusQueued"));
      try {
        const headers = {
          ...(await authHeader()),
          "Content-Type": "application/json",
        };
        const createRes = await fetch(`${apiBase()}${API_PATHS.exports}`, {
          method: "POST",
          headers,
          body: JSON.stringify({ kind }),
        });
        if (createRes.status === 409) {
          setErrorText(t("errorBusy"));
          return;
        }
        if (!createRes.ok) {
          setErrorText(t("errorGeneric"));
          return;
        }
        let job = (await createRes.json()) as ExportJob;

        if (kind === "media") {
          // 準備完了まで短くポーリング
          for (let i = 0; i < 90; i += 1) {
            if (job.status === "ready") break;
            if (job.status === "failed") {
              setErrorText(t("errorFailed"));
              return;
            }
            setStatusText(
              job.status === "running" ? t("statusRunning") : t("statusQueued"),
            );
            await sleep(2000);
            const statusRes = await fetch(
              `${apiBase()}${API_PATHS.exports}/${job.export_id}`,
              { headers: await authHeader() },
            );
            if (!statusRes.ok) {
              setErrorText(t("errorGeneric"));
              return;
            }
            job = (await statusRes.json()) as ExportJob;
          }
          if (job.status !== "ready") {
            setErrorText(t("errorTimeout"));
            return;
          }
        }

        if (job.status !== "ready") {
          setErrorText(t("errorFailed"));
          return;
        }

        setStatusText(t("statusDownloading"));
        await downloadFile(job.export_id);
        setStatusText(t("statusDone"));
      } catch {
        setErrorText(t("errorGeneric"));
      } finally {
        setBusyKind(null);
      }
    },
    [downloadFile, t],
  );

  return (
    <div className="stack-density-lg">
      <section className="flex flex-col gap-3 rounded-md border border-border bg-card px-4 py-density text-card-foreground">
        <div>
          <h2 className="text-base font-semibold">{t("textTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("textHint")}</p>
        </div>
        <Button
          type="button"
          disabled={busyKind !== null}
          onClick={() => void runExport("text")}
        >
          {busyKind === "text" ? t("working") : t("textAction")}
        </Button>
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-border bg-card px-4 py-density text-card-foreground">
        <div>
          <h2 className="text-base font-semibold">{t("mediaTitle")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("mediaHint")}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={busyKind !== null}
          onClick={() => void runExport("media")}
        >
          {busyKind === "media" ? t("working") : t("mediaAction")}
        </Button>
      </section>

      <p className="text-sm text-muted-foreground">{t("noteNoImport")}</p>

      {statusText ? (
        <p className="text-sm text-foreground" role="status">
          {statusText}
        </p>
      ) : null}
      {errorText ? (
        <p className="text-sm text-destructive" role="alert">
          {errorText}
        </p>
      ) : null}
    </div>
  );
}
