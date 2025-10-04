import fs from "node:fs";
import path from "node:path";

export function getUploadsDir() {
  return process.env.JSON_UPLOAD_DIR || process.env.CSV_UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
}

/** Devuelve la ruta del archivo .json más reciente con patrón YYYYMMDD_hhmm.json */
export function findLatestJson(): string | null {
  const dir = getUploadsDir();
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter(f => /^\d{8}_\d{4}\.json$/i.test(f));
  if (!files.length) return null;
  files.sort(); // con ese patrón, el orden lexicográfico sirve
  return path.join(dir, files[files.length - 1]);
}

export function readJson<T = any>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}
