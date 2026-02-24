/**
 * Import op_items from Excel or CSV.
 * Usage:
 *   node --env-file=.env scripts/import-op-items.js path/to/items.xlsx
 *   node --env-file=.env scripts/import-op-items.js path/to/items.csv
 *
 * Excel/CSV format:
 *   - Column A: type (שם הפריט) - can be "[סקציה] סוג" or just "סוג"
 *   - Column B: price (מחיר ליום)
 *   - Column C (optional): section name (1. צוות, 2. הוצאות הפקה, 3. ארט סטיילינג ומשתתפים, 4. פוסט פרודקשן)
 */
import { createClient } from "@supabase/supabase-js";
import ExcelJS from "exceljs";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL and SERVICE_ROLE_KEY. Add to .env and run: node --env-file=.env scripts/import-op-items.js <file>");
  process.exit(1);
}

const supabase = createClient(url, key);

async function getSectionMap() {
  const { data, error } = await supabase.from("op_budget_sections").select("id, name");
  if (error) throw error;
  const map = {};
  for (const s of data ?? []) {
    map[s.name.trim().toLowerCase()] = s.id;
    if (s.name.includes("צוות")) map["1. צוות"] = s.id;
    if (s.name.includes("הוצאות")) map["2. הוצאות הפקה"] = s.id;
    if (s.name.includes("ארט")) map["3. ארט סטיילינג ומשתתפים"] = s.id;
    if (s.name.includes("פוסט")) map["4. פוסט פרודקשן"] = s.id;
  }
  return map;
}

function getPriceFromCell(cell) {
  const v = cell?.value;
  if (typeof v === "number") return v;
  if (v != null && typeof v === "object" && "result" in v) return Number(v.result);
  if (v != null && typeof v === "object" && "value" in v) return Number(v.value);
  return parseFloat(String(v ?? "0").replace(",", ".")) || 0;
}

async function importFromExcel(path) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("No worksheet found");

  const sectionMap = await getSectionMap();
  const rows = [];
  let currentSection = null;

  for (let r = 1; r <= (ws.rowCount || 200); r++) {
    const row = ws.getRow(r);
    const typeVal = row.getCell(3)?.value;
    const type = String(typeVal ?? "").trim();
    if (!type) continue;
    if (/^[1-4]\.\s/.test(type)) {
      currentSection = type;
      continue;
    }
    if (type === "תפקיד" || type === "סוג") continue;
    const price = getPriceFromCell(row.getCell(5)) || getPriceFromCell(row.getCell(6)) || getPriceFromCell(row.getCell(4));
    if (price <= 0) continue;
    const sectionId = currentSection ? (sectionMap[currentSection.toLowerCase()] ?? sectionMap[currentSection]) : null;
    rows.push({ type, price, section_id: sectionId });
  }
  return rows;
}

async function importFromCsv(path) {
  const text = readFileSync(path, "utf-8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const sectionMap = await getSectionMap();
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(/[,;\t]/).map((p) => p.trim().replace(/^["']|["']$/g, ""));
    const type = parts[0] ?? "";
    if (!type) continue;
    const price = parseFloat(String(parts[1] ?? "0").replace(",", ".")) || 0;
    const sectionName = parts[2] ?? "";
    const sectionId = sectionName ? (sectionMap[sectionName.toLowerCase()] ?? sectionMap[sectionName]) : null;
    rows.push({ type, price, section_id: sectionId });
  }
  return rows;
}

async function main() {
  const inputPath = process.argv[2] ?? join(process.cwd(), "data", "op-items-import.xlsx");
  if (!existsSync(inputPath)) {
    console.error("File not found:", inputPath);
    console.error("Usage: node scripts/import-op-items.js path/to/items.xlsx");
    console.error("Or place file at data/op-items-import.xlsx");
    console.error("");
    console.error("Expected format:");
    console.error("  Column A: type (name), Column B: price, Column C: section (optional)");
    process.exit(1);
  }

  const ext = inputPath.toLowerCase();
  const rows = ext.endsWith(".csv")
    ? await importFromCsv(inputPath)
    : await importFromExcel(inputPath);

  if (rows.length === 0) {
    console.error("No rows to import. Check file format.");
    process.exit(1);
  }

  const { data: existing } = await supabase.from("op_items").select("id, type, price");
  const existingByType = new Map((existing ?? []).map((e) => [e.type.toLowerCase(), e]));

  let inserted = 0;
  let updated = 0;
  for (const row of rows) {
    const key = row.type.toLowerCase();
    const ex = existingByType.get(key);
    if (ex) {
      const { error } = await supabase.from("op_items").update({ price: row.price, section_id: row.section_id }).eq("id", ex.id);
      if (error) console.error("Update error for", row.type, error.message);
      else updated++;
    } else {
      const { error } = await supabase.from("op_items").insert(row);
      if (error) console.error("Insert error for", row.type, error.message);
      else inserted++;
    }
  }

  console.log(`Done. Inserted: ${inserted}, Updated: ${updated}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
