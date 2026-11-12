#!/usr/bin/env node
/**
 * Prints the SHA-256 of each legal page's source file, used as `legal_documents.body_sha256`.
 * Pre-launch: the texts live in page components, so the hash covers the source file that renders
 * them (decision D3-11). Any edit to a page needs a new legal_documents version row.
 *   node scripts/legal-hashes.mjs            -> JSON
 *   node scripts/legal-hashes.mjs --sql VER  -> insert statements for version VER
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const LEGAL_SOURCES = {
  privacy_notice: { file: "src/app/privacy/page.tsx", url: "/privacy" },
  terms: { file: "src/app/terms/page.tsx", url: "/terms" },
};

export function legalHashes() {
  return Object.fromEntries(
    Object.entries(LEGAL_SOURCES).map(([kind, s]) => [kind, { ...s, sha256: createHash("sha256").update(readFileSync(join(ROOT, s.file))).digest("hex") }]),
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const h = legalHashes();
  const i = process.argv.indexOf("--sql");
  if (i > 0) {
    const ver = process.argv[i + 1];
    if (!/^[\w.-]{1,40}$/.test(ver ?? "")) throw new Error("version required");
    for (const [kind, v] of Object.entries(h)) {
      console.log(`insert into public.legal_documents (kind, version, effective_from, body_sha256, url) values ('${kind}', '${ver}', now(), '${v.sha256}', '${v.url}');`);
    }
  } else console.log(JSON.stringify(h, null, 2));
}
