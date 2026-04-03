import { $ } from "bun"
import { cp, readdir } from "node:fs/promises"
import * as path from "node:path"

import { RUST_TARGET } from "./utils"

if (!RUST_TARGET) throw new Error("RUST_TARGET not defined")

const BUNDLE_DIR = `src-tauri/target/${RUST_TARGET}/release/bundle`
const BUNDLES_OUT_DIR = path.join(process.cwd(), `src-tauri/target/bundles`)

await $`mkdir -p ${BUNDLES_OUT_DIR}`

const dirs = await readdir(BUNDLE_DIR, { withFileTypes: true })
for (const dir of dirs.filter((item) => item.isDirectory())) {
  const root = path.join(BUNDLE_DIR, dir.name)
  const files = await readdir(root)
  for (const file of files.filter((item) => item.startsWith("Argenta-Tui") || item.startsWith("OpenCode"))) {
    await cp(path.join(root, file), path.join(BUNDLES_OUT_DIR, file), { recursive: true })
  }
}
