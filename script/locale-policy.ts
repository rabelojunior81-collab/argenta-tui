#!/usr/bin/env bun

import { readdir, rm } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const app = new Set(["br.ts", "en.ts", "es.ts", "parity.test.ts"])
const desktop = new Set(["br.ts", "en.ts", "es.ts", "index.ts"])
const electron = new Set(["br.ts", "en.ts", "es.ts", "index.ts"])
const consoleI18n = new Set(["br.ts", "en.ts", "es.ts", "index.ts"])
const webI18n = new Set(["pt-BR.json", "en.json", "es.json"])
const webDocs = new Set(["pt-br", "es"])

async function list(dir: string) {
  return readdir(path.join(root, dir), { withFileTypes: true })
}

async function purge(dir: string, keep: Set<string>) {
  const items = await list(dir)
  const drop = items.filter((item) => !keep.has(item.name)).map((item) => path.join(root, dir, item.name))
  for (const file of drop) {
    await rm(file, { recursive: true, force: true })
  }
  return drop
}

async function purgeDocs() {
  const items = await list("packages/web/src/content/docs")
  const drop = items
    .filter((item) => item.isDirectory())
    .filter((item) => !webDocs.has(item.name))
    .map((item) => path.join(root, "packages/web/src/content/docs", item.name))

  for (const file of drop) {
    await rm(file, { recursive: true, force: true })
  }
  return drop
}

async function main() {
  const mode = process.argv[2] ?? "check"
  const removed = {
    app: [] as string[],
    desktop: [] as string[],
    electron: [] as string[],
    consoleI18n: [] as string[],
    webI18n: [] as string[],
    webDocs: [] as string[],
  }

  if (mode === "purge") {
    removed.app = await purge("packages/app/src/i18n", app)
    removed.desktop = await purge("packages/desktop/src/i18n", desktop)
    removed.electron = await purge("packages/desktop-electron/src/renderer/i18n", electron)
    removed.consoleI18n = await purge("packages/console/app/src/i18n", consoleI18n)
    removed.webI18n = await purge("packages/web/src/content/i18n", webI18n)
    removed.webDocs = await purgeDocs()
  }

  const appNow = (await list("packages/app/src/i18n")).map((item) => item.name)
  const desktopNow = (await list("packages/desktop/src/i18n")).map((item) => item.name)
  const electronNow = (await list("packages/desktop-electron/src/renderer/i18n")).map((item) => item.name)
  const consoleI18nNow = (await list("packages/console/app/src/i18n")).map((item) => item.name)
  const webI18nNow = (await list("packages/web/src/content/i18n")).map((item) => item.name)
  const webDocsNow = (await list("packages/web/src/content/docs")).map((item) => item.name)

  const extra = {
    app: appNow.filter((item) => !app.has(item)),
    desktop: desktopNow.filter((item) => !desktop.has(item)),
    electron: electronNow.filter((item) => !electron.has(item)),
    consoleI18n: consoleI18nNow.filter((item) => !consoleI18n.has(item)),
    webI18n: webI18nNow.filter((item) => !webI18n.has(item)),
    webDocs: webDocsNow.filter((item) => !item.endsWith(".mdx") && !webDocs.has(item)),
  }

  console.log(JSON.stringify({ mode, removed, extra }, null, 2))
  if (extra.app.length || extra.desktop.length || extra.electron.length || extra.consoleI18n.length || extra.webI18n.length || extra.webDocs.length) process.exit(1)
}

await main()
