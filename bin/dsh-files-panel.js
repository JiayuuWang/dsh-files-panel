#!/usr/bin/env node
/**
 * One-command installer for the dsh-files-panel plugin (npm distribution).
 *
 * Usage:
 *   npx @jiayuw/dsh-files-panel [<path-to-deepseek-harness-checkout>]
 *   npx @jiayuw/dsh-files-panel <path> --apply-only     (debug: apply the patch only)
 *
 * Runs, in the target checkout: git apply <the shipped patch> -> pnpm install
 * -> pnpm run build. The plugin modifies core DeepSeek Harness packages, so it
 * must be built with the app — this installer applies the source patch and
 * builds, mirroring the repository's install.ps1 / install.sh.
 */
'use strict'

const { spawnSync } = require('node:child_process')
const { existsSync, readdirSync, readFileSync } = require('node:fs')
const path = require('node:path')

const BASE_COMMIT = '47f943859b'
const PKG_ROOT = path.join(__dirname, '..')

/** The patch to apply: the single cumulative patch, else the newest c*-*.dsh.diff. */
function resolvePatch() {
  const single = path.join(PKG_ROOT, 'patch', 'dsh-files-panel.patch')
  if (existsSync(single)) return single
  const dir = path.join(PKG_ROOT, 'patch')
  if (!existsSync(dir)) return null
  const chapter = readdirSync(dir)
    .filter(name => /^c\d+-.*\.dsh\.diff$/.test(name))
    .sort((left, right) => chapterOf(right) - chapterOf(left))
  return chapter.length > 0 ? path.join(dir, chapter[0]) : null
}

/** Chapter number of a c<N>-... filename. */
function chapterOf(name) {
  const match = /^c(\d+)-/.exec(name)
  return match === null ? 0 : Number.parseInt(match[1], 10)
}

function run(cmd, args, cwd, inherit) {
  return spawnSync(cmd, args, {
    cwd,
    stdio: inherit ? 'inherit' : 'pipe',
    encoding: 'utf8',
    shell: process.platform === 'win32' && cmd === 'pnpm',
  })
}

function fail(message) {
  console.error(`error: ${message}`)
  process.exit(1)
}

function main() {
  const args = process.argv.slice(2)
  const applyOnly = args.includes('--apply-only')
  const targetArg = args.find(arg => !arg.startsWith('--'))
  const target = targetArg === undefined ? process.cwd() : path.resolve(targetArg)

  const patch = resolvePatch()
  if (patch === null) fail('找不到补丁(package 内 patch/dsh-files-panel.patch 或 c*-*.dsh.diff)。')

  // --- validate the target is a deepseek-harness checkout ---
  if (!existsSync(path.join(target, 'pnpm-workspace.yaml'))) {
    fail(`${target} 不是 deepseek-harness 检出目录(缺少 pnpm-workspace.yaml)。请传入 harness 仓库根目录,或在 harness 仓库根目录里运行本命令。`)
  }
  try {
    const manifest = JSON.parse(readFileSync(path.join(target, 'package.json'), 'utf8'))
    if (manifest.name !== '@deepseek-ai/dsh-root') {
      fail(`${target} 的 package.json 不是 @deepseek-ai/dsh-root,请确认传入了 deepseek-harness 检出目录。`)
    }
  } catch {
    fail(`${target} 缺少合法的 package.json。`)
  }

  // --- git checks ---
  const head = run('git', ['rev-parse', 'HEAD'], target, false)
  if (head.status !== 0) {
    fail(`${target} 不是 git 仓库,无法应用补丁。请先 git clone https://github.com/deepseek-ai/deepseek-harness 并 checkout 基线 ${BASE_COMMIT}。`)
  }
  const headSha = head.stdout.trim()
  const baseSha = run('git', ['rev-parse', BASE_COMMIT], target, false).stdout.trim()
  if (headSha !== baseSha) {
    console.warn(`[warn] HEAD 是 ${headSha},不是补丁对应的基线 ${BASE_COMMIT} —— 补丁可能无法干净应用。若失败请先: git checkout ${BASE_COMMIT}`)
  }

  // --- apply the patch (skip when a patch-added file already exists) ---
  const marker = path.join(target, 'packages', 'client', 'ui-conversation', 'src', 'client', 'pane-store.ts')
  if (existsSync(marker)) {
    console.log('[ok] 已检测到补丁已应用,跳过 git apply。')
  } else {
    console.log(`[*] 应用补丁: ${patch}`)
    const check = run('git', ['apply', '--check', patch], target, true)
    if (check.status !== 0) {
      fail(`补丁无法干净应用到当前检出。请确认基线 commit 是 ${BASE_COMMIT}(或手动运行 git apply 查看详细错误)。`)
    }
    const apply = run('git', ['apply', patch], target, true)
    if (apply.status !== 0) fail('git apply 失败。')
    console.log('[ok] 补丁应用完成。')
  }

  if (applyOnly) {
    console.log('[done] --apply-only:补丁已应用,跳过 pnpm install 与 build。')
    return
  }

  // --- install & build ---
  console.log('[*] pnpm install ...')
  if (run('pnpm', ['install'], target, true).status !== 0) fail('pnpm install 失败。')
  console.log('[*] pnpm run build ...')
  if (run('pnpm', ['run', 'build'], target, true).status !== 0) fail('pnpm run build 失败。')

  console.log('')
  console.log('✅ 安装完成!启动方式:')
  console.log(`   cd ${target}`)
  console.log('   pnpm dsh --profile web')
  console.log('打开打印的地址(默认 http://127.0.0.1:3080)后,硬刷新 Ctrl+F5。')
}

main()
