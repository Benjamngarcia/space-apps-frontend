import { NextResponse } from "next/server";
import { findLatestCsv, readCsvRows, toNum } from "./../../lib/csv";

export async function GET(){
  const csvPath = findLatestCsv();
  if(!csvPath) return NextResponse.json({ error: "No CSV found" }, { status: 404 });

  const rows = readCsvRows(csvPath);

  const features = rows.map(r => {
    const lat = toNum(r.lat), lon = toNum(r.lon);
    if (lat == null || lon == null) return null;

    const NO2 = toNum(r.NO2), O3 = toNum(r.O3), PM = toNum(r.PM), CH2O = toNum(r.CH2O);
    const AI  = toNum(r.AI) ?? Math.max(...[NO2, O3, PM, CH2O].filter((x): x is number => x != null));

    return {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [lon, lat] },
      properties: { zip: r.zip, NO2, O3, PM, CH2O, AI }
    };
  }).filter(Boolean);

  return NextResponse.json({
    type: "FeatureCollection",
    features,
    csv: csvPath.split(/[/\\]/).pop(),
  });
}
