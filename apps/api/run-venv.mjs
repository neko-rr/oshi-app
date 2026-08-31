/**
 * apps/api/.venv の Python でコマンドを実行する（Win/macOS/Linux）。
 * 用法: node run-venv.mjs -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const isWin = process.platform === "win32";
const python = path.join(
  root,
  ".venv",
  isWin ? "Scripts" : "bin",
  isWin ? "python.exe" : "python",
);

if (!existsSync(python)) {
  console.error(
    "[api] .venv がありません。README の「セットアップ」で venv を作成してください。",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("[api] 引数が空です。例: node run-venv.mjs -m pytest tests -q");
  process.exit(1);
}

const child = spawn(python, args, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 1);
});
