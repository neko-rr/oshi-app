import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// ISR 用 R2 は Dashboard でバケットを用意してから足す。初期はメモリ相当の既定で足りる。
export default defineCloudflareConfig();
