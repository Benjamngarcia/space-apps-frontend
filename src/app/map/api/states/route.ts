import { NextResponse } from "next/server";
import { findLatestJson, readJson } from "../../lib/files";

type StateItem = { fips: string; name?: string; NO2?: number|null; O3?: number|null; PM?: number|null; CH2O?: number|null };

export async function GET() {
  const jsonPath = findLatestJson();
  if (!jsonPath) return NextResponse.json({ error: "No JSON found" }, { status: 404 });

  const payload = readJson<{ states: StateItem[] }>(jsonPath);
  const byState: Record<string, { name?: string; NO2?: number|null; O3?: number|null; PM?: number|null; CH2O?: number|null; ai: number }> = {};

  for (const s of payload.states || []) {
    const vals = [s.NO2, s.O3, s.PM, s.CH2O].filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    if (!s.fips || !vals.length) continue;
    byState[s.fips] = {
      name: s.name,
      NO2: s.NO2 ?? null,
      O3:  s.O3  ?? null,
      PM:  s.PM  ?? null,
      CH2O:s.CH2O?? null,
      ai:  Math.max(...vals) // 👈 valor para colorear (máximo de contaminantes)
    };
  }

  return NextResponse.json({ byState, json: jsonPath.split(/[/\\]/).pop() });
}
