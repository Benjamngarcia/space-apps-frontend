import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { findLatestCsv, readCsvRows, toNum } from "../../lib/csv";

export async function POST(req: Request){
  try{
    const { zip, user_text } = await req.json();
    if(!zip) return NextResponse.json({ error: "zip is required" }, { status: 400 });

    const csvPath = findLatestCsv();
    if(!csvPath) return NextResponse.json({ error: "No CSV found" }, { status: 404 });

    const row = readCsvRows(csvPath).find(r => r.zip === String(zip));
    if(!row) return NextResponse.json({ error: "ZIP not found in CSV" }, { status: 404 });

    const NO2 = toNum(row.NO2), O3 = toNum(row.O3), PM = toNum(row.PM), CH2O = toNum(row.CH2O);
    const AI  = toNum(row.AI) ?? Math.max(...[NO2, O3, PM, CH2O].filter((x): x is number => x != null));

    let summary = "Configura GOOGLE_API_KEY en .env.local para usar Gemini.";
    const key = process.env.GOOGLE_API_KEY;
    if(key){
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
Eres un asistente ambiental. Usa estrictamente estos valores (AQI) para ZIP ${zip}:
- NO2: ${NO2 ?? "N/D"}
- O3 : ${O3 ?? "N/D"}
- PM : ${PM ?? "N/D"}
- CH2O: ${CH2O ?? "N/D"}
- AI (global): ${AI ?? "N/D"}

Usuario: "${user_text ?? "Dame recomendaciones de actividades"}"

Responde con:
1) Riesgo general (bajo/medio/alto) y por qué.
2) Recomendaciones por actividad (correr, bici, niños, adultos mayores).
3) Acciones de mitigación (horarios, mascarilla, rutas menos transitadas).
4) Si el usuario pidió algo específico, adáptalo.
      `.trim();
      const resp = await model.generateContent(prompt);
      summary = resp.response.text();
    }

    return NextResponse.json({ zip, NO2, O3, PM, CH2O, AI, summary });
  }catch(e:any){
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
