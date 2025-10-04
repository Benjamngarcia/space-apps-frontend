import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

export type CsvRow = {
  zip: string;
  NO2: string; O3: string; AI: string; CH2O: string; PM: string;
  lat?: string; lon?: string;
};

export function getUploadsDir(){
  return process.env.CSV_UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
}

/** Encuentra el CSV más reciente por patrón YYYYMMDD_hhmm.csv */
export function findLatestCsv(): string | null {
  const dir = getUploadsDir();
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f => /^\d{8}_\d{4}\.csv$/i.test(f));
  if (!files.length) return null;
  files.sort();                               // funciona por orden lexicográfico
  return path.join(dir, files[files.length-1]);
}

export function readCsvRows(p: string): CsvRow[] {
  const raw = fs.readFileSync(p, "utf-8");
  const recs = parse(raw, { columns: true, skip_empty_lines: true }) as CsvRow[];
  return recs.map(r => ({
    zip: String(r.zip || "").trim(),
    NO2: String(r.NO2 ?? "").trim(),
    O3: String(r.O3 ?? "").trim(),
    AI: String(r.AI ?? "").trim(),
    CH2O: String(r.CH2O ?? "").trim(),
    PM: String(r.PM ?? "").trim(),
    lat: r.lat ? String(r.lat).trim() : undefined,
    lon: r.lon ? String(r.lon).trim() : undefined,
  }));
}

export function toNum(v?: string): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
