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
    console.log("GOOGLE_API_KEY:", key);
    if(key){
      const genAI = new GoogleGenerativeAI(key);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `
Eres un asistente experto en salud ambiental, especializado en calidad del aire y su impacto en las actividades al aire libre. Tu objetivo es proporcionar recomendaciones detalladas y personalizadas al usuario, basándote en los datos de calidad del aire proporcionados.

### Datos de calidad del aire (AQI) actuales del estado de ${st.name}:
- Dióxido de nitrógeno (NO₂): ${st.NO2 ?? "N/D"}
- Ozono (O₃): ${st.O3 ?? "N/D"}
- Material particulado (PM₂.₅/PM₁₀): ${st.PM ?? "N/D"}
- Formaldehído (CH₂O): ${st.CH2O ?? "N/D"}
- Índice global (AI, máximo de los anteriores): ${AI ?? "N/D"}

### Solicitud del usuario:
"${user_text}"

---

### Instrucciones para tu respuesta:

1.  **Evaluación de riesgo**: Inicia tu respuesta con una frase que resuma la situación actual, mencionando el nivel de riesgo según la escala AQI y el contaminante principal que lo causa.
    * **0-50 (Bueno):** La calidad del aire es excelente.
    * **51-100 (Moderado):** La calidad del aire es aceptable, pero algunas personas sensibles deben tomar precauciones.
    * **101-150 (Insalubre para Grupos Sensibles):** La calidad del aire es insalubre para grupos sensibles (niños, adultos mayores, personas con enfermedades respiratorias como asma).
    * **151-200 (Insalubre):** La calidad del aire es insalubre para todos. Se deben limitar las actividades al aire libre.
    * **>200 (Muy Insalubre/Peligroso):** La calidad del aire es muy insalubre. Evita cualquier actividad al aire libre.

2.  **Recomendaciones personalizadas**: Proporciona consejos prácticos y concretos.
    * **Momento y duración**: Recomienda la mejor hora del día para realizar la actividad (generalmente cuando los niveles de NO₂ y O₃ son más bajos, como temprano en la mañana o por la noche). Sugiere una duración máxima para la actividad para minimizar la exposición.
    * **Indumentaria y equipo**: Describe la ropa más adecuada (por ejemplo, transpirable, que cubra la piel) y el equipo de protección (como el uso de una mascarilla N95 si la calidad del aire es insalubre, especialmente si el contaminante principal es PM).
    * **Precauciones de salud**: Menciona acciones específicas como mantenerse hidratado, hacer pausas frecuentes y evitar zonas de alto tráfico vehicular, ya que el NO₂ y el PM son más altos en esas áreas.
    * **Alternativas seguras**: Si la calidad del aire no es favorable para la actividad deseada, sugiere alternativas seguras en interiores (por ejemplo, gimnasio, piscina cubierta, etc.).

3.  **Tono y formato**: Mantén un tono empático y de cuidado. Utiliza un formato claro con viñetas o listas numeradas para que la información sea fácil de digerir. La respuesta debe ser concisa y no sustituir el consejo médico.
`.trim();

      const resp = await model.generateContent(prompt);
      summary = resp.response.text();
    }

    return NextResponse.json({ fips: st.fips, name: st.name, NO2: st.NO2, O3: st.O3, PM: st.PM, CH2O: st.CH2O, AI, summary });
  }catch(e:any){
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
