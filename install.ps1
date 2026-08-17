# One-command installer for the dsh-files-panel plugin.
#
# Usage:
#   .\install.ps1 [<path-to-deepseek-harness-checkout>]   (default: current directory)
#   .\install.ps1 -ApplyOnly                               (debug: apply the patch only)
#
# Runs, in the target checkout: git apply patch/dsh-files-panel.patch (or the
# latest c*-*.dsh.diff) -> pnpm install -> pnpm run build.

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$Target,
    [switch]$ApplyOnly
)

$ErrorActionPreference = 'Stop'
$baseCommit = '47f943859b'

$repoRoot = $PSScriptRoot
# The single cumulative patch when present; otherwise the latest chapter
# checkpoint (c*-*.dsh.diff, newest number wins — each is a superset of all
# earlier ones).
$single = Join-Path $repoRoot 'patch\dsh-files-panel.patch'
if (Test-Path $single) {
    $patch = $single
} else {
    $patch = (Get-ChildItem -Path (Join-Path $repoRoot 'patch') -Filter 'c*-*.dsh.diff' -File |
        Sort-Object { [int]($_.BaseName -replace '^c(\d+).*', '$1') } -Descending | Select-Object -First 1).FullName
}
if ([string]::IsNullOrEmpty($patch)) { throw "找不到检查点补丁(在 $repoRoot\patch 下没有 dsh-files-panel.patch 或 c*-*.dsh.diff)。" }

if ([string]::IsNullOrWhiteSpace($Target)) { $Target = (Get-Location).Path }
$target = (Resolve-Path -LiteralPath $Target -ErrorAction Stop).Path

# --- validate the target is a deepseek-harness checkout ---
if (-not (Test-Path (Join-Path $target 'pnpm-workspace.yaml'))) {
    throw "「$target」不是 deepseek-harness 检出目录(缺少 pnpm-workspace.yaml)。请传入 harness 仓库根目录,或在 harness 仓库根目录里运行本脚本。"
}
$manifest = Join-Path $target 'package.json'
if (-not (Test-Path $manifest) -or ((Get-Content $manifest -Raw | ConvertFrom-Json).name -ne '@deepseek-ai/dsh-root')) {
    throw "「$target」的 package.json 不是 @deepseek-ai/dsh-root,请确认传入了 deepseek-harness 检出目录。"
}

# --- git checks ---
& git -C $target rev-parse HEAD 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw "「$target」不是 git 仓库,无法应用补丁。请先 git clone https://github.com/deepseek-ai/deepseek-harness 并 checkout 基线 $baseCommit。"
}
$head = (& git -C $target rev-parse HEAD).Trim()
$baseFull = (& git -C $target rev-parse $baseCommit).Trim()
if ($head -ne $baseFull) {
    Write-Host "[warn] HEAD 是 $head,不是补丁对应的基线 $baseCommit —— 补丁可能无法干净应用。若失败请先: git checkout $baseCommit" -ForegroundColor Yellow
}

# --- apply the patch (skip when a patch-added file already exists) ---
$marker = Join-Path $target 'packages\client\ui-conversation\src\client\pane-store.ts'
if (Test-Path $marker) {
    Write-Host '[ok] 已检测到补丁已应用,跳过 git apply。' -ForegroundColor Green
} else {
    Write-Host "[*] 应用补丁: $patch"
    & git -C $target apply --check $patch
    if ($LASTEXITCODE -ne 0) {
        throw 'git apply 检查失败:补丁无法干净应用到当前检出。请确认基线 commit 是 ' + $baseCommit + '(或手动运行 git apply 查看详细错误)。'
    }
    & git -C $target apply $patch
    if ($LASTEXITCODE -ne 0) { throw 'git apply 失败。' }
    Write-Host '[ok] 补丁应用完成。' -ForegroundColor Green
}

if ($ApplyOnly) {
    Write-Host '[done] --apply-only:补丁已应用,跳过 pnpm install 与 build。'
    exit 0
}

# --- install & build ---
Write-Host '[*] pnpm install ...'
& pnpm --dir $target install
if ($LASTEXITCODE -ne 0) { throw 'pnpm install 失败。' }

Write-Host '[*] pnpm run build ...'
& pnpm --dir $target run build
if ($LASTEXITCODE -ne 0) { throw 'pnpm run build 失败。' }

Write-Host ''
Write-Host '✅ 安装完成!启动方式:' -ForegroundColor Green
Write-Host "   cd $target"
Write-Host '   pnpm dsh --profile web'
Write-Host '打开打印的地址(默认 http://127.0.0.1:3080)后,硬刷新 Ctrl+F5。'
