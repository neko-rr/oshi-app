/** API パス定数（snake_case レスポンスと合わせて共有） */
export const API_PATHS = {
  health: "/health",
  me: "/me",
  products: "/products",
} as const;

export type MeResponse = {
  members_id: string;
  email: string | null;
};

export type HealthResponse = {
  status: "ok";
};
