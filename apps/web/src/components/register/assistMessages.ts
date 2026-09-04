/** アシスト soft status の翻訳キー（登録は止めない） */
export type AssistStatusKey =
  | "liveDisabled"
  | "missingCredentials"
  | "notReady"
  | "error"
  | "success"
  | "default";

export type AssistStatusMessage = {
  key: AssistStatusKey;
  /** error / success で API 等から渡された文言を優先表示 */
  fallback?: string;
};

export function assistStatusKey(status: string | undefined): AssistStatusKey {
  switch (status) {
    case "live_disabled":
      return "liveDisabled";
    case "missing_credentials":
      return "missingCredentials";
    case "not_ready":
      return "notReady";
    case "error":
      return "error";
    case "success":
      return "success";
    default:
      return "default";
  }
}

export function assistStatusDescriptor(
  status: string | undefined,
  fallback?: string | null,
): AssistStatusMessage {
  const key = assistStatusKey(status);
  const trimmed = fallback?.trim();
  if ((key === "error" || key === "success") && trimmed) {
    return { key, fallback: trimmed };
  }
  return { key };
}

export function resolveAssistMessage(
  translate: (key: AssistStatusKey) => string,
  descriptor: AssistStatusMessage,
): string {
  if (descriptor.fallback) return descriptor.fallback;
  return translate(descriptor.key);
}
