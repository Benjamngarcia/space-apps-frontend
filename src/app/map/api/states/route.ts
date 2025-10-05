import { NextResponse } from "next/server";
import { findLatestJson, readJson } from "../../lib/files";

type StateItem = {
  fips: string;
  name?: string;
  NO2?: number | null;
  O3?: number | null;
  PM?: number | null;
  CH2O?: number | null;
};

type Payload = {
  states: StateItem[];
  // opcional en tu JSON:
  tags?: string[]; // p.ej. ["Running,Outdoor Activities","Elderly,Vulnerability and Health", ...]
  meta?: any;
};

/** Normaliza lista de tags:
 * ["Running,Outdoor Activities","Elderly,Vulnerability and Health"]
 * -> ["Running","Outdoor Activities","Elderly","Vulnerability and Health"]
 */
function normalizeTagList(input?: string[]): string[] {
  if (!Array.isArray(input)) return [];
  const out = new Set<string>();
  for (const raw of input) {
    String(raw)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((t) => out.add(t));
  }
  return Array.from(out);
}

export async function GET() {
  const jsonPath = findLatestJson();
  if (!jsonPath) {
    return NextResponse.json({ error: "No JSON found" }, { status: 404 });
  }

  const payload = readJson<Payload>(jsonPath);

  const byState: Record<
    string,
    { name?: string; NO2?: number | null; O3?: number | null; PM?: number | null; CH2O?: number | null; ai: number }
  > = {};

  for (const s of payload.states || []) {
    const vals = [s.NO2, s.O3, s.PM, s.CH2O].filter(
      (v): v is number => typeof v === "number" && Number.isFinite(v)
    );
    if (!s.fips || !vals.length) continue;

    byState[String(s.fips).padStart(2, "0")] = {
      name: s.name,
      NO2: s.NO2 ?? null,
      O3: s.O3 ?? null,
      PM: s.PM ?? null,
      CH2O: s.CH2O ?? null,
      ai: Math.max(...vals), // máximo de contaminantes
    };
  }

  // tags originales del JSON (si existen)
  const tags_raw = Array.isArray(payload.tags) ? payload.tags : undefined;
  // versión normalizada y sin duplicados (útil para pintar chips)
  const tags = normalizeTagList(tags_raw);

  return NextResponse.json({
    byState,
    json: jsonPath.split(/[/\\]/).pop(),
    // devolvemos ambos para que el front decida qué usar
    tags_raw,
    tags,
  });
}
