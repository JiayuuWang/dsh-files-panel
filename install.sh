#!/usr/bin/env bash
# One-command installer for the dsh-files-panel plugin.
#
# Usage:
#   ./install.sh [<path-to-deepseek-harness-checkout>]   (default: current directory)
#   ./install.sh <path> --apply-only                      (debug: apply the patch only)
#
# Runs, in the target checkout: git apply patch/dsh-files-panel.patch (or the
# latest c*-*.dsh.diff) -> pnpm install -> pnpm run build.

set -euo pipefail

BASE_COMMIT=47f943859b
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# The single cumulative patch when present; otherwise the latest chapter
# checkpoint (c*-*.dsh.diff, newest number wins — `sort -V` orders chapter
# numbers numerically, c9 < c13).
if [[ -f "$REPO_ROOT/patch/dsh-files-panel.patch" ]]; then
  PATCH="$REPO_ROOT/patch/dsh-files-panel.patch"
else
  PATCH="$(printf '%s\n' "$REPO_ROOT"/patch/c*-*.dsh.diff 2>/dev/null | sort -V -r | head -n 1)"
fi

TARGET=""
APPLY_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --apply-only) APPLY_ONLY=true ;;
    *) TARGET="$arg" ;;
  esac
done
if [[ -z "$TARGET" ]]; then TARGET="$(pwd)"; fi

[[ -n "$PATCH" && -f "$PATCH" ]] || { echo "error: 找不到检查点补丁($REPO_ROOT/patch 下没有 dsh-files-panel.patch 或 c*-*.dsh.diff)。" >&2; exit 1; }

# --- validate the target is a deepseek-harness checkout ---
[[ -f "$TARGET/pnpm-workspace.yaml" ]] || {
  echo "error: $TARGET 不是 deepseek-harness 检出目录(缺少 pnpm-workspace.yaml)。请传入 harness 仓库根目录,或在 harness 仓库根目录运行本脚本。" >&2
  exit 1
}
NAME="$(sed -n 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$TARGET/package.json" | head -n 1)"
if [[ "$NAME" != "@deepseek-ai/dsh-root" ]]; then
  echo "error: $TARGET 的 package.json 不是 @deepseek-ai/dsh-root,请确认传入了 deepseek-harness 检出目录。" >&2
  exit 1
fi

# --- git checks ---
HEAD="$(git -C "$TARGET" rev-parse HEAD 2>/dev/null || true)"
if [[ -z "$HEAD" ]]; then
  echo "error: $TARGET 不是 git 仓库,无法应用补丁。请先 git clone https://github.com/deepseek-ai/deepseek-harness 并 checkout 基线 $BASE_COMMIT。" >&2
  exit 1
fi
BASE_FULL="$(git -C "$TARGET" rev-parse "$BASE_COMMIT" 2>/dev/null || true)"
if [[ "$HEAD" != "$BASE_FULL" ]]; then
  echo "warning: HEAD 是 $HEAD,不是补丁对应的基线 $BASE_COMMIT —— 补丁可能无法干净应用。若失败请先: git checkout $BASE_COMMIT" >&2
fi

# --- apply the patch (skip when a patch-added file already exists) ---
MARKER="$TARGET/packages/client/ui-conversation/src/client/pane-store.ts"
if [[ -f "$MARKER" ]]; then
  echo "[ok] 已检测到补丁已应用,跳过 git apply。"
else
  echo "[*] 应用补丁: $PATCH"
  if ! git -C "$TARGET" apply --check "$PATCH"; then
    echo "error: 补丁无法干净应用到当前检出。请确认基线 commit 是 $BASE_COMMIT(或手动运行 git apply 查看详细错误)。" >&2
    exit 1
  fi
  git -C "$TARGET" apply "$PATCH"
  echo "[ok] 补丁应用完成。"
fi

if [[ "$APPLY_ONLY" == true ]]; then
  echo "[done] --apply-only:补丁已应用,跳过 pnpm install 与 build。"
  exit 0
fi

# --- install & build ---
echo "[*] pnpm install ..."
(cd "$TARGET" && pnpm install)
echo "[*] pnpm run build ..."
(cd "$TARGET" && pnpm run build)

echo ""
echo "✅ 安装完成!启动方式:"
echo "   cd $TARGET"
echo "   pnpm dsh --profile web"
echo "打开打印的地址(默认 http://127.0.0.1:3080)后,硬刷新 Ctrl+F5。"
