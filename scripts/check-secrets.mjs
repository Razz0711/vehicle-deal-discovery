#!/usr/bin/env node
/**
 * Fails (exit 1) if a privileged credential is found in:
 *   1. files tracked or staged in Git (what a push would publish), and
 *   2. the built browser bundle in .next/static (what every visitor downloads), if present.
 *
 * Detects: Supabase secret keys (sb_secret_…), service_role JWTs, private-key blocks,
 * database URLs with an embedded password, and tracked .env files other than .env.example.
 * Publishable keys (sb_publishable_…) and anon JWTs are public by design and allowed.
 *
 *   node scripts/check-secrets.mjs            # repo + bundle
 *   node scripts/check-secrets.mjs --bundle   # bundle only (after next build)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const JWT = /eyJ[A-Za-z0-9_-]{8,}\.(eyJ[A-Za-z0-9_-]{8,})\.[A-Za-z0-9_-]{8,}/g;

/** Server-only values configured on this machine (never committed). Their presence anywhere scanned is a leak. */
const EXTRA_VALUES = (() => {
  const vals = [process.env.OTP_LIMITER_TOKEN];
  try {
    const local = readFileSync(join(ROOT, ".env.local"), "utf8");
    const m = /^OTP_LIMITER_TOKEN=(.+)$/m.exec(local);
    if (m) vals.push(m[1].trim());
  } catch {
    /* no .env.local */
  }
  return vals.filter((v) => typeof v === "string" && v.length >= 32);
})();

/** @returns {{ rule: string, match: string }[]} */
export function findSecrets(text) {
  const hits = [];
  for (const m of text.matchAll(/sb_secret_[A-Za-z0-9_-]{10,}/g)) hits.push({ rule: "supabase-secret-key", match: m[0] });
  for (const m of text.matchAll(JWT)) {
    try {
      const payload = JSON.parse(Buffer.from(m[1], "base64url").toString("utf8"));
      if (payload && payload.role === "service_role") hits.push({ rule: "service-role-jwt", match: m[0] });
    } catch {
      /* not a JWT */
    }
  }
  for (const m of text.matchAll(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g)) hits.push({ rule: "private-key", match: m[0] });
  for (const m of text.matchAll(/OTP_LIMITER_TOKEN\s*=\s*["']?([A-Za-z0-9_-]{16,})/g)) hits.push({ rule: "otp-limiter-token", match: m[1] });
  for (const extra of EXTRA_VALUES) if (extra && text.includes(extra)) hits.push({ rule: "configured-server-secret", match: extra });
  for (const m of text.matchAll(/postgres(?:ql)?:\/\/[^:\s/"'`]+:([^@\s"'`]+)@/g)) {
    // Allow obvious placeholders such as [YOUR-PASSWORD] or ${PASSWORD} and the local stack default.
    if (!/^(\[.*\]|\$\{.*\}|<.*>|postgres)$/.test(m[1])) hits.push({ rule: "database-url-with-password", match: m[0] });
  }
  return hits;
}

/** A tracked env file is a leak unless it is the template. */
export function isForbiddenEnvFile(path) {
  const name = basename(path);
  return /^\.env(\..+)?$/.test(name) && name !== ".env.example";
}

function redact(s) {
  return s.length <= 16 ? "[redacted]" : `${s.slice(0, 12)}…[redacted]`;
}

function gitFiles() {
  const out = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: ROOT });
  return out.toString("utf8").split("\0").filter(Boolean);
}

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) files.push(...walk(p));
    else files.push(p);
  }
  return files;
}

const BINARY = /\.(png|jpe?g|webp|avif|gif|ico|woff2?|ttf|otf|mp4|webm|pdf|zip)$/i;

function scan(files, label) {
  const problems = [];
  for (const rel of files) {
    const abs = rel.startsWith("/") ? rel : join(ROOT, rel);
    if (label === "repo" && isForbiddenEnvFile(rel)) problems.push(`${rel}: env file would be committed`);
    if (BINARY.test(rel) || !existsSync(abs) || statSync(abs).size > 5_000_000) continue;
    for (const hit of findSecrets(readFileSync(abs, "utf8"))) problems.push(`${rel}: ${hit.rule} (${redact(hit.match)})`);
  }
  return problems;
}

function main() {
  const bundleOnly = process.argv.includes("--bundle");
  const problems = [];
  let scanned = 0;
  if (!bundleOnly) {
    const files = gitFiles();
    scanned += files.length;
    problems.push(...scan(files, "repo"));
  }
  const bundleDir = join(ROOT, ".next", "static");
  if (existsSync(bundleDir)) {
    const files = walk(bundleDir);
    scanned += files.length;
    problems.push(...scan(files, "bundle"));
  } else if (bundleOnly) {
    console.error("check-secrets: .next/static not found. Run `npm run build` first.");
    process.exit(1);
  }
  if (problems.length) {
    console.error(`check-secrets: ${problems.length} problem(s) found:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  console.log(`check-secrets: OK (${scanned} files scanned, no privileged credentials found)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
