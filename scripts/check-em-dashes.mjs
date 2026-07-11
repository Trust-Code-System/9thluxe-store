#!/usr/bin/env node
/**
 * Guard against em dash (U+2014 "—") in customer-facing content.
 *
 * The em dash is banned from all rendered/customer-visible source trees. This
 * check fails linting, testing and the production build when a new em dash is
 * introduced, so it can never silently reach customers again.
 *
 * En dash (U+2013 "–") is intentionally allowed for numeric ranges (e.g. "2–5
 * business days") and is NOT flagged.
 *
 * Scope: the directories/files below are the ones that render customer-facing
 * text (pages, components, email templates, journal + quiz content, seed data).
 * Reference-only trees (docs/, tests/, scripts/, FRONTEND/, integrations/,
 * contracts/) are deliberately excluded.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const ROOT = process.cwd()
const EM_DASH = '\u2014'

const SCAN_DIRS = ['app', 'components', 'emails', 'lib']
const SCAN_FILES = ['prisma/seed.ts']
const EXCLUDE_DIRS = new Set(['node_modules', '.next', 'dist', 'build', 'FRONTEND'])
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.mdx', '.css', '.html'])

function extname(file) {
  const i = file.lastIndexOf('.')
  return i === -1 ? '' : file.slice(i)
}

function walk(dir, out) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue
      walk(full, out)
    } else if (EXTS.has(extname(entry.name))) {
      out.push(full)
    }
  }
}

const files = []
for (const d of SCAN_DIRS) walk(join(ROOT, d), files)
for (const f of SCAN_FILES) {
  const full = join(ROOT, f)
  try {
    if (statSync(full).isFile()) files.push(full)
  } catch {
    /* file may not exist in every checkout */
  }
}

const violations = []
for (const file of files) {
  const text = readFileSync(file, 'utf8')
  if (!text.includes(EM_DASH)) continue
  const lines = text.split(/\r?\n/)
  lines.forEach((line, idx) => {
    if (line.includes(EM_DASH)) {
      violations.push({ file: relative(ROOT, file).split(sep).join('/'), line: idx + 1, text: line.trim() })
    }
  })
}

if (violations.length > 0) {
  console.error(`\n\u2716 Em dash check failed: ${violations.length} occurrence(s) of "\u2014" in customer-facing content.\n`)
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  ${v.text}`)
  }
  console.error('\nRewrite the sentence with a comma, full stop, colon, semicolon, parentheses or a normal hyphen where appropriate.\n')
  process.exit(1)
}

console.log(`\u2714 Em dash check passed (${files.length} files scanned, no "\u2014" found).`)
