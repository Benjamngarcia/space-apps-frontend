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
Eres un asistente ambiental especializado en calidad del aire y salud humana. 
Tu tarea es ayudar al usuario a realizar actividades al aire libre de forma segura, 
considerando los niveles de contaminación atmosférica actuales del estado ${st.name || "desconocido"} [FIPS ${st.fips}].

### Datos de calidad del aire (AQI) actuales:
- Dióxido de nitrógeno (NO₂): ${st.NO2 ?? "N/D"}
- Ozono (O₃): ${st.O3 ?? "N/D"}
- Material particulado (PM₂.₅/PM₁₀): ${st.PM ?? "N/D"}
- Formaldehído (CH₂O): ${st.CH2O ?? "N/D"}
- Índice global (AI, máximo de los anteriores): ${AI ?? "N/D"}

### Solicitud del usuario:
"${user_text ?? "Dame recomendaciones de actividades"}"

---

### Instrucciones para tu respuesta:

1. **Analiza el tipo de actividad** (por ejemplo: correr, caminar, andar en bici, ir de picnic, visitar un parque, etc.).  
   Si menciona un **lugar específico** dentro del estado (como una ciudad, parque, playa o montaña), adáptate a las condiciones típicas de ese entorno.

2. **Evalúa el riesgo** en función del AI:
   - 0–50 → bueno
   - 51–100 → moderado
   - 101–150 → insalubre para grupos sensibles
   - 151–200 → insalubre
   - >200 → muy insalubre o peligroso

3. **Indica claramente** si la actividad es recomendable o no, y **por cuánto tiempo máximo** puede realizarse sin riesgo (en minutos u horas), según la calidad del aire.

4. **Da recomendaciones personalizadas**, incluyendo:
   - Mejor horario para realizar la actividad.
   - Precauciones de salud (hidratación, mascarilla, pausas, evitar zonas con tráfico, etc.).
   - Alternativas seguras si el aire no es favorable.
   - Mención explícita a grupos sensibles (niños, adultos mayores, asmáticos, embarazadas).

5. **Termina siempre con un tono empático y de cuidado**, recordando que estas son recomendaciones basadas en la información de contaminación atmosférica y no sustituyen la orientación médica o institucional.

Tu respuesta debe ser breve, clara y estructurada, con secciones numeradas o por guiones, evitando repeticiones o frases introductorias genéricas.
`.trim();

      const resp = await model.generateContent(prompt);
      summary = resp.response.text();
    }

    return NextResponse.json({ fips: st.fips, name: st.name, NO2: st.NO2, O3: st.O3, PM: st.PM, CH2O: st.CH2O, AI, summary });
  }catch(e:any){
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
