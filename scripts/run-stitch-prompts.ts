#!/usr/bin/env npx tsx
/**
 * Run Stitch prompts to generate screens via Stitch API (direct).
 *
 * Prerequisites:
 *   gcloud auth application-default login
 *   gcloud config set project democrm-489100
 *
 * Usage:
 *   npx tsx scripts/run-stitch-prompts.ts           # run first 1 (dry run)
 *   npx tsx scripts/run-stitch-prompts.ts --all    # run all 46
 *   npx tsx scripts/run-stitch-prompts.ts --limit 5
 *   npx tsx scripts/run-stitch-prompts.ts --all --skip-existing
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, "stitch-prompts.json"), "utf-8"));
const STITCH_URL = "https://stitch.googleapis.com/mcp";
const GCP_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "democrm-489100";

function buildPrompt(
  page: { desktop?: string; mobile?: string; noSidebar?: boolean },
  device: "DESKTOP" | "MOBILE"
): string {
  const content = device === "DESKTOP" ? page.desktop : page.mobile;
  if (!content) return "";

  const ds = config.designSystem;
  const noSidebar = page.noSidebar;

  const themeNote = "Design for dark mode. Sidebar #0f1025, cards #151938, accent #1337ec. ";
  const shared = noSidebar
    ? `Dark mode. Colors: accent #1337ec, cards #151938. `
    : [
        themeNote,
        `Design system: Sidebar ${ds.sharedComponents.sidebar}`,
        `Header: ${ds.sharedComponents.header}`,
        `Table: ${ds.sharedComponents.table}`,
        `Kanban: ${ds.sharedComponents.kanban}`,
        `Toolbar: ${ds.sharedComponents.entityToolbar}`,
        `Colors: sidebar #0f1025, cards #151938, accent #1337ec.`,
      ].join(" ");

  const suffix = noSidebar ? "" : device === "DESKTOP" ? ds.desktopPromptSuffix : ds.mobilePromptSuffix;
  return `${shared} ${content} ${suffix}`.trim();
}

function collectScreens(): Array<{ route: string; name: string; device: string; prompt: string }> {
  const devices = config.devices || ["DESKTOP", "MOBILE"];
  const out: Array<{ route: string; name: string; device: string; prompt: string }> = [];
  for (const page of config.pages) {
    for (const device of devices) {
      const prompt = buildPrompt(page, device);
      if (prompt) {
        out.push({ route: page.route, name: page.name, device, prompt });
      }
    }
  }
  return out;
}

function getAccessToken(): string {
  return execSync("gcloud auth application-default print-access-token", {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

function loadPriorResults(): Array<{ route: string; name: string; device: string; sessionId?: string }> {
  const outPath = join(__dirname, "..", "stitch-results.json");
  try {
    const data = JSON.parse(readFileSync(outPath, "utf-8")) as {
      results?: Array<{ route: string; name: string; device: string; sessionId?: string }>;
    };
    return data.results ?? [];
  } catch {
    return [];
  }
}

async function callStitchAPI(
  method: string,
  params: object,
  token: string
): Promise<{ result?: unknown; error?: { code: number; message: string } }> {
  const res = await fetch(STITCH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Goog-User-Project": GCP_PROJECT,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stitch API HTTP ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { result?: unknown; error?: { code: number; message: string } };
  if (data.error) throw new Error(data.error.message);
  return data;
}

async function main() {
  const runAll = process.argv.includes("--all");
  const skipExisting = process.argv.includes("--skip-existing");
  const limitIdx = process.argv.indexOf("--limit");
  const limit = limitIdx >= 0 && process.argv[limitIdx + 1]
    ? parseInt(process.argv[limitIdx + 1], 10)
    : runAll ? 999 : 1;

  const screens = collectScreens();
  const projectId = String(config.projectId);

  let toRun = screens;
  const priorResults = skipExisting ? loadPriorResults() : [];
  const priorSet = new Set(
    priorResults
      .filter((r) => r.sessionId)
      .map((r) => `${r.route}|${r.name}|${r.device}`)
  );

  if (skipExisting && priorSet.size > 0) {
    toRun = toRun.filter((s) => !priorSet.has(`${s.route}|${s.name}|${s.device}`));
    console.log(`\nSkipping ${priorSet.size} existing. ${toRun.length} remaining.\n`);
  }

  toRun = toRun.slice(0, limit);

  console.log(`hadaryaCRM → Run Stitch prompts\n`);
  console.log(`Project: ${projectId}`);
  console.log(`Total: ${screens.length}`);
  console.log(`Will run: ${toRun.length}\n`);

  let token: string;
  try {
    token = getAccessToken();
  } catch {
    console.error("❌ gcloud auth not configured. Run:");
    console.error("   gcloud auth application-default login");
    console.error("   gcloud config set project democrm-489100");
    process.exit(1);
  }

  const results: Array<{ route: string; name: string; device: string; sessionId?: string; error?: string }> = [];

  for (let i = 0; i < toRun.length; i++) {
    const s = toRun[i];
    console.log(`[${i + 1}/${toRun.length}] ${s.name} (${s.route}) [${s.device}]`);
    try {
      const data = await callStitchAPI(
        "tools/call",
        {
          name: "generate_screen_from_text",
          arguments: {
            projectId,
            prompt: s.prompt,
            deviceType: s.device,
          },
        },
        token
      );

      const raw = data.result as { content?: Array<{ type: string; text?: string }> } | undefined;
      const text = raw?.content?.[0]?.text;
      let sessionId: string | undefined;
      if (text) {
        try {
          const parsed = JSON.parse(text) as { sessionId?: string; outputComponents?: Array<{ design?: { screens?: Array<{ name?: string }> } }> };
          sessionId = parsed.sessionId ?? parsed.outputComponents?.[0]?.design?.screens?.[0]?.name;
        } catch {
          sessionId = undefined;
        }
      }
      results.push({ route: s.route, name: s.name, device: s.device, sessionId });
      console.log(`  → sessionId: ${sessionId ?? "(see output)"}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ route: s.route, name: s.name, device: s.device, error: msg });
      console.log(`  → error: ${msg}`);
    }
  }

  const merged = skipExisting
    ? [
        ...priorResults.filter(
          (pr) => !results.some((r) => r.route === pr.route && r.name === pr.name && r.device === pr.device)
        ),
        ...results,
      ]
    : results;

  const outPath = join(__dirname, "..", "stitch-results.json");
  writeFileSync(outPath, JSON.stringify({ generated: new Date().toISOString(), results: merged }, null, 2));
  console.log(`\nResults saved to ${outPath} (${merged.length} total)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
