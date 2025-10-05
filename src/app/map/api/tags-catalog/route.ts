// src/app/map/api/tags-catalog/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
// Ajusta la ruta si tu carpeta de uploads cambia
const CATALOG_PATH = path.join(ROOT, "data", "uploads", "tags_catalog.json");

export async function GET() {
  try {
    const raw = fs.readFileSync(CATALOG_PATH, "utf8");
    const json = JSON.parse(raw);
    // Validación mínima
    const out = {
      Activity: Array.isArray(json?.Activity) ? json.Activity : [],
      Vulnerability: Array.isArray(json?.Vulnerability) ? json.Vulnerability : [],
      Lifestyle: Array.isArray(json?.Lifestyle) ? json.Lifestyle : [],
    };
    return NextResponse.json(out);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Catalog not found" },
      { status: 404 }
    );
  }
}
