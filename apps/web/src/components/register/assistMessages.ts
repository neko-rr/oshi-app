/** アシスト soft status を利用者向け短文に変換（登録は止めない） */
export function assistStatusMessage(
  status: string | undefined,
  fallback?: string | null,
): string {
  switch (status) {
    case "live_disabled":
      return "外部照合は現在オフです。手入力で続行できます。";
    case "missing_credentials":
      return "外部照合の設定がありません。手入力で続行できます。";
    case "not_ready":
      return "入力が不足しています。スキップするか番号を入れてください。";
    case "error":
      return fallback?.trim() || "照合に失敗しました。手入力で続行できます。";
    case "success":
      return fallback?.trim() || "候補を取得しました。";
    default:
      return fallback?.trim() || "照合結果を取得できませんでした。手入力で続行できます。";
  }
}
