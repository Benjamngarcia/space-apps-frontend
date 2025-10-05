import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { findLatestJson, readJson } from "../../lib/files";

type StateItem = {
  fips: string;
  name?: string;
  NO2?: number | null;
  O3?: number | null;
  PM?: number | null;
  CH2O?: number | null;
};

type ReqBody = {
  fips: string;
  user_text?: string;
  tags?: string[];          // ✅ nuevo
  country?: string;         // ✅ nuevo (p.ej. "United States")
  date?: string;            // ✅ nuevo (YYYY-MM-DD)
  state_name?: string;      // opcional, si lo mandas desde el front
  pollutants?: {            // opcional; si no lo mandas, se toma del JSON del estado
    NO2?: number | null;
    O3?: number | null;
    PM?: number | null;
    CH2O?: number | null;
    AI?: number | null;
  };
};

export async function POST(req: Request) {
  try {
    const { fips, user_text, tags = [], country = "United States", date, state_name, pollutants }: ReqBody = await req.json();

    if (!fips) return NextResponse.json({ error: "fips is required" }, { status: 400 });

    // Lee el JSON base para asegurar datos del estado (y por si no mandan pollutants)
    const jsonPath = findLatestJson();
    if (!jsonPath) return NextResponse.json({ error: "No JSON found" }, { status: 404 });

    const payload = readJson<{ states: StateItem[]; tags?: string[] }>(jsonPath);
    const st = (payload.states || []).find(s => s.fips === String(fips).padStart(2, "0"));
    if (!st) return NextResponse.json({ error: "FIPS not found in JSON" }, { status: 404 });

    // Merge pollutants: prioridad a los que vengan del cliente; si no, toma del JSON
    const NO2 = pollutants?.NO2 ?? st.NO2 ?? null;
    const O3 = pollutants?.O3 ?? st.O3 ?? null;
    const PM = pollutants?.PM ?? st.PM ?? null;
    const CH2O = pollutants?.CH2O ?? st.CH2O ?? null;

    const vals = [NO2, O3, PM, CH2O].filter((v): v is number => typeof v === "number" && Number.isFinite(v));
    const AI = (pollutants?.AI ?? (vals.length ? Math.max(...vals) : null)) ?? null;

    const resolvedStateName = state_name || st.name || `FIPS ${st.fips}`;

    // Si no hay API key, devolvemos un mensaje amigable
    const key = process.env.GOOGLE_API_KEY;
    let modelJson: any = null;
    let summary = "Set GOOGLE_API_KEY in .env.local to use Gemini.";

    if (key) {
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // ---------------- PROMPT ESTRUCTURADO ----------------
      // Pedimos respuesta SOLO en JSON con un esquema claro y puntajes.
      const prompt = `
You are an environmental health assistant. Using the air quality data and user context below, produce a concise, actionable recommendation in **strict JSON** that follows the provided schema. Do not include any extra commentary—return **only** valid JSON.

## Context
- Country: ${country}
- State: ${resolvedStateName} (FIPS ${st.fips})
- Date (user-selected): ${date ?? "N/A"}
- User intent/free text: ${user_text ?? "N/A"}
- User tags (preferences & risk): ${tags.length ? tags.join(", ") : "N/A"}

## Pollutants (current best available; units vary by pollutant)
- NO2: ${NO2 ?? "N/A"}
- O3: ${O3 ?? "N/A"}
- PM: ${PM ?? "N/A"}
- CH2O: ${CH2O ?? "N/A"}
- AI (max of above): ${AI ?? "N/A"}

## Guidance
- Rate overall outdoor suitability and risk. Identify the *dominant* pollutant driving risk.
- If air is unhealthy, offer safer indoor alternatives.
- Tailor to user tags when relevant (e.g., “Elderly”, “Asthma”, “Outdoor Activities”, “Pet Owner”, etc.).
- Keep it practical and medically non-prescriptive.

## SCORING
- outdoor_suitability: 0–100 (higher = safer/more suitable to be outdoors).
- health_risk: 0–100 (higher = riskier).
- confidence: 0–100 (how confident are you given the inputs?).

## JSON SCHEMA (respond EXACTLY in this structure)
{
  "state": { "name": string, "fips": string, "country": string, "date": string },
  "dominant_pollutant": "NO2" | "O3" | "PM" | "CH2O" | "Unknown",
  "risk_level_label": "Good" | "Moderate" | "USG" | "Unhealthy" | "Very Unhealthy" | "Hazardous" | "Unknown",
  "scores": {
    "outdoor_suitability": number,    // 0-100
    "health_risk": number,            // 0-100
    "confidence": number              // 0-100
  },
  "pollutants": {
    "NO2": number | null,
    "O3": number | null,
    "PM": number | null,
    "CH2O": number | null,
    "AI": number | null
  },
  "tailored_notes": string[],         // short bullet points tailored to tags
  "recommendations": string[],        // practical, actionable bullets (time of day, duration, hydration, mask for PM, avoid high-traffic areas for NO2/PM, etc.)
  "indoor_alternatives": string[],    // if outdoors not suitable
  "disclaimer": string                // short safety note; not medical advice
}
      `.trim();

      const resp = await model.generateContent(prompt);
      const raw = resp.response.text() || "";

      // Intenta parsear JSON tal cual (a veces Gemini rodea con ```json)
      const jsonText = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      try {
        modelJson = JSON.parse(jsonText);
        summary = "OK";
      } catch (err) {
        // Si no pudo parsear, regresa el texto para que el front lo pueda revisar
        modelJson = null;
        summary = raw;
      }
    }

    return NextResponse.json({
      // eco de entrada/salida útil para el front
      input: {
        fips: st.fips,
        state: resolvedStateName,
        country,
        date,
        user_text: user_text ?? null,
        tags,
      },
      pollutants: { NO2, O3, PM, CH2O, AI },
      // salida del modelo (JSON parseado si fue posible)
      model: modelJson,
      summary, // "OK" si se parseó, o el texto crudo si no
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
