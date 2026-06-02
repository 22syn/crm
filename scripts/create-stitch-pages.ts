#!/usr/bin/env npx tsx
/**
 * Create all hadaryaCRM pages as screens in Stitch (Desktop + Mobile).
 *
 * Design system: shared sidebar, table, kanban — same across all pages.
 *
 * Prerequisites:
 * - Stitch MCP configured (see docs/stitch-mcp-setup-guide.md)
 * - gcloud auth application-default login
 *
 * Usage:
 *   npx tsx scripts/create-stitch-pages.ts
 *   npx tsx scripts/create-stitch-pages.ts --json   # output as JSON for automation
 *
 * Consistency workflow:
 *   1. Generate Dashboard (DESKTOP) first
 *   2. extract_design_context(screenId) → save as designContext
 *   3. For each subsequent screen: generate_screen_from_text with designContext
 */

import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, "stitch-prompts.json"), "utf-8"));

function buildPrompt(
  page: { desktop?: string; mobile?: string; noSidebar?: boolean },
  device: "DESKTOP" | "MOBILE"
): string {
  const content = device === "DESKTOP" ? page.desktop : page.mobile;
  if (!content) return "";

  const ds = config.designSystem;
  const noSidebar = page.noSidebar;

  // For auth, 404, modal: minimal design system (colors only), no sidebar/table/kanban
  const themeNote = "Design for both light (neutral accent) and dark (blue #1337ec accent) modes. ";
  const shared = noSidebar
    ? `Colors: accent #1337ec, cards #151938. `
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

function main() {
  const jsonOut = process.argv.includes("--json");
  const devices = config.devices || ["DESKTOP", "MOBILE"];
  let total = 0;

  if (jsonOut) {
    const out: Array<{ route: string; name: string; device: string; prompt: string }> = [];
    for (const page of config.pages) {
      for (const device of devices) {
        const prompt = buildPrompt(page, device);
        if (prompt) {
          out.push({
            route: page.route,
            name: page.name,
            device,
            prompt,
          });
          total++;
        }
      }
    }
    console.log(JSON.stringify({ projectId: config.projectId, screens: out }, null, 2));
    return;
  }

  console.log("hadaryaCRM → Stitch: Create all pages (Desktop + Mobile)\n");
  console.log(`Project ID: ${config.projectId}`);
  console.log(`Devices: ${devices.join(", ")}`);
  console.log("\nDesign system: shared sidebar, table, kanban — same on every page.\n");

  config.pages.forEach((page: { route: string; name: string; desktop?: string; mobile?: string }, i: number) => {
    for (const device of devices) {
      const prompt = buildPrompt(page, device);
      if (!prompt) continue;
      total++;
      console.log(`--- ${total}. ${page.name} (${page.route}) [${device}] ---`);
      console.log(`Prompt: ${prompt}`);
      console.log("");
    }
  });

  console.log(`\nTotal: ${total} screens to generate.`);
  console.log("\nConsistency workflow:");
  console.log("  1. Generate Dashboard DESKTOP first → get screenId");
  console.log("  2. extract_design_context(screenId) → use for all later generations");
  console.log("  3. generate_screen_from_text({ projectId, prompt, deviceType })");
  console.log("\nSee docs/stitch-create-all-pages.md");
}

main();
