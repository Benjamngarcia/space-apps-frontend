import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { findLatestJson, readJson } from "../../lib/files";

type StateItem = { fips: string; name?: string; NO2?: number|null; O3?: number|null; PM?: number|null; CH2O?: number|null };

export async function POST(req: Request){
  try{
    const { fips, user_text } = await req.json();
    if(!fips) return NextResponse.json({ error: "fips is required" }, { status: 400 });

    const jsonPath = findLatestJson();
    if(!jsonPath) return NextResponse.json({ error: "No JSON found" }, { status: 404 });

    const payload = readJson<{ states: StateItem[] }>(jsonPath);
    const st = (payload.states || []).find(s => s.fips === String(fips).padStart(2,"0"));
    if(!st) return NextResponse.json({ error: "FIPS not found in JSON" }, { status: 404 });

    const vals = [st.NO2, st.O3, st.PM, st.CH2O].filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const AI = vals.length ? Math.max(...vals) : null;

    let summary = "Configura GOOGLE_API_KEY en .env.local para usar Gemini.";
    const key = process.env.GOOGLE_API_KEY;
    if(key){
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
Eres un asistente ambiental. Usa estrictamente estos datos (AQI) para ${st.name || 'el estado'} [FIPS ${st.fips}]:

- NO2: ${st.NO2 ?? "N/D"}
- O3 : ${st.O3 ?? "N/D"}
- PM : ${st.PM ?? "N/D"}
- CH2O: ${st.CH2O ?? "N/D"}
- AI (máximo de NO2/O3/PM/CH2O): ${AI ?? "N/D"}

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

    return NextResponse.json({ fips: st.fips, name: st.name, NO2: st.NO2, O3: st.O3, PM: st.PM, CH2O: st.CH2O, AI, summary });
  }catch(e:any){
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
