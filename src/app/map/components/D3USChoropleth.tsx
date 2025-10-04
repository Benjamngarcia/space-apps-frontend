"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

type ByState = Record<
  string,
  { name?: string; NO2?: number | null; O3?: number | null; PM?: number | null; CH2O?: number | null; ai: number }
>;

// ⛳ Ajusta si tu carpeta es /mapa
const API_BASE = "/map/api";

/** Catálogo de colores por severidad (EPA-like), usado para crear un degradado continuo */
const colorCatalog = [
  { upTo: 50,  label: "Bueno",            color: "#2DC937" }, // verde
  { upTo: 100, label: "Moderado",         color: "#99C140" },
  { upTo: 150, label: "USG",              color: "#E7B416" },
  { upTo: 200, label: "Dañino",           color: "#DB7B2B" },
  { upTo: 300, label: "Muy dañino",       color: "#CC3232" },
  { upTo: 500, label: "Peligroso",        color: "#660000" }
];

/** Construye una escala secuencial (degradado) a partir del catálogo y el dominio [min, max] */
function makeSequentialScale(min: number, max: number) {
  const stops = colorCatalog.map(c => c.upTo);
  const uniqueStops = Array.from(new Set([min, ...stops.filter(s => s >= min && s <= Math.max(max, min)), max])).sort((a, b) => a - b);

  const stopColors = uniqueStops.map(v => {
    const item = colorCatalog.find(c => v <= c.upTo) ?? colorCatalog[colorCatalog.length - 1];
    return item.color;
  });

  const piecewise = d3.scaleLinear<string>().domain(uniqueStops).range(stopColors).clamp(true);

  return d3.scaleSequential((t: number) => {
    const v = min + t * (max - min);
    return piecewise(v);
  }).domain([0, 1]);
}

export default function D3USChoropleth() {
  const ref = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<{ byState: ByState; json?: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [activity, setActivity] = useState("Quiero salir a correr en la tarde");
  const [panel, setPanel] = useState<{ title: string; body: string } | null>(null);
  const [loadingGemini, setLoadingGemini] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/states`);
        const d = await res.json();
        if (!res.ok || d?.error) {
          setErr(d?.error || `HTTP ${res.status}`);
          setData(null);
          return;
        }
        setErr(null);
        setData(d);
      } catch (e: any) {
        setErr(e?.message || "Error");
        setData(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";

    // Contenedor principal flexible: mapa centrado + leyenda a la derecha
    const root = d3
      .select(ref.current)
      .style("display", "flex")
      .style("gap", "16px")
      .style("alignItems", "center")
      .style("justifyContent", "center")
      .style("width", "100%")
      .style("height", "600px")
      .style("background", "#F7FAFF"); // azul muy claro, minimal

    const mapWrap = root
      .append("div")
      .style("flex", "1 1 auto")
      .style("height", "100%")
      .style("display", "flex")
      .style("alignItems", "center")
      .style("justifyContent", "center")
      .style("background", "white")
      .style("borderRadius", "16px")
      .style("boxShadow", "0 6px 18px rgba(0,0,0,0.06)")
      .style("padding", "8px");

    const legendWrap = root
      .append("div")
      .style("width", "96px") // columna para la leyenda vertical
      .style("height", "100%")
      .style("display", "flex")
      .style("alignItems", "center")
      .style("justifyContent", "center")
      .style("background", "white")
      .style("borderRadius", "16px")
      .style("boxShadow", "0 6px 18px rgba(0,0,0,0.06)");

    if (!data?.byState || Object.keys(data.byState).length === 0) {
      mapWrap
        .append("div")
        .style("padding", "12px")
        .style("color", "#3B82F6")
        .style("fontFamily", "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial")
        .text(err ? `Sin datos: ${err}` : "Sin datos para mostrar.");
      return;
    }

    const containerWidth = (mapWrap.node() as HTMLDivElement).clientWidth || 960;
    const containerHeight = (mapWrap.node() as HTMLDivElement).clientHeight || 560;

    const width = Math.min(900, containerWidth - 16);
    const height = Math.min(560, containerHeight - 16);

    const svg = mapWrap
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%")
      .style("borderRadius", "12px")
      .style("background", "#FFFFFF");

    const gMap = svg.append("g");

    const projection = d3.geoAlbersUsa().translate([width / 2, height / 2]).scale(Math.min(width, height) * 1.2);
    const path = d3.geoPath(projection);

    const tooltip = mapWrap
      .append("div")
      .style("position", "absolute")
      .style("pointerEvents", "none")
      .style("background", "rgba(255,255,255,0.95)")
      .style("backdropFilter", "blur(6px)")
      .style("border", "1px solid #E5EAF3")
      .style("color", "#0F172A")
      .style("padding", "8px 10px")
      .style("borderRadius", "12px")
      .style("fontSize", "12px")
      .style("boxShadow", "0 6px 16px rgba(0,0,0,0.08)")
      .style("opacity", "0");

    // dominio y escala de color (degradado)
    const aiVals = Object.values(data.byState).map((s) => s.ai);
    const min = d3.min(aiVals) ?? 0;
    const max = d3.max(aiVals) ?? 200;
    const colorSequential = makeSequentialScale(min, Math.max(max, min + 1));

    (async () => {
      const topo = await (await fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")).json();
      const states: any = feature(topo, topo.objects.states);

      gMap
        .selectAll("path")
        .data(states.features)
        .join("path")
        .attr("d", path as any)
        .attr("fill", (d: any) => {
          const fips = String(d.id).padStart(2, "0");
          const s = data.byState[fips];
          if (!s) return "#EEF2FF"; // azul grisáceo muy suave si no hay datos
          // mapear ai al [0,1] para la escala secuencial
          const t = (s.ai - min) / (Math.max(max, min + 1) - min);
          return colorSequential(Math.max(0, Math.min(1, t)));
        })
        .attr("stroke", "#CBD5E1")
        .attr("stroke-width", 0.8)
        .style("cursor", "pointer")
        .on("mouseenter", function (e: any, d: any) {
          const fips = String(d.id).padStart(2, "0");
          const s = data.byState[fips];
          tooltip.style("opacity", "1").html(
            s
              ? `
              <div style="font-weight:600; margin-bottom:4px">${s.name ?? "Estado"} <span style="opacity:.7">(FIPS ${fips})</span></div>
              <div><b>AI:</b> ${s.ai}</div>
              <div>NO2: ${s.NO2 ?? "—"} | O3: ${s.O3 ?? "—"}</div>
              <div>PM: ${s.PM ?? "—"} | CH2O: ${s.CH2O ?? "—"}</div>
            `
              : `FIPS ${fips}<br/>Sin datos`
          );
        })
        .on("mousemove", (e: any) => {
          const bounds = (mapWrap.node() as HTMLDivElement).getBoundingClientRect();
          tooltip.style("left", e.clientX - bounds.left + 14 + "px").style("top", e.clientY - bounds.top + 14 + "px");
        })
        .on("mouseleave", () => tooltip.style("opacity", "0"))
        .on("click", async (_e: any, d: any) => {
          const fips = String(d.id).padStart(2, "0");
          setLoadingGemini(true);
          setPanel({ title: "Consultando IA…", body: "Un momento por favor." });
          try {
            const r = await fetch(`${API_BASE}/state-recommendations`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fips,
                user_text: activity || "Dame recomendaciones de actividades",
              }),
            });
            const out = await r.json();
            if (out.error) {
              setPanel({ title: "Error", body: String(out.error) });
            } else {
              // limpiar intro si el modelo saluda
              let text = out.summary || "";
              text = text.replace(/^hola[^\n]*\n?/i, "").replace(/basándome estrictamente.*proporcionados[:\.]\s*/i, "");
              text +=
                "\n\n_Estas recomendaciones se basan en la información climatológica y de calidad del aire del estado seleccionado._";

              setPanel({
                title: `${out.name ?? "Estado"} (FIPS ${out.fips}) · AI≈${out.AI ?? "N/D"}`,
                body: text.trim(),
              });
            }
          } catch (e: any) {
            setPanel({ title: "Error", body: e?.message || "Fallo al consultar IA" });
          } finally {
            setLoadingGemini(false);
          }
        });

      // zoom/pan
      svg.call(
        d3
          .zoom<SVGSVGElement, unknown>()
          .scaleExtent([1, 8])
          .on("zoom", (ev) => {
            gMap.attr("transform", ev.transform.toString());
          }) as any
      );

      // === Leyenda vertical con degradado ===
      const legendWidth = 32;
      const legendHeight = Math.min(480, height - 40);

      const legendSvg = legendWrap
        .append("svg")
        .attr("width", 72)
        .attr("height", height - 32)
        .style("display", "block");

      const defs = legendSvg.append("defs");
      const gradientId = "aqi-gradient";
      const linear = defs.append("linearGradient").attr("id", gradientId).attr("x1", "0").attr("x2", "0").attr("y1", "1").attr("y2", "0");

      // construir stops a partir del catálogo y del dominio
      const gradStops = d3.range(0, 1.0001, 0.05).map((t) => {
        const v = min + t * (Math.max(max, min + 1) - min);
        return { offset: `${t * 100}%`, color: colorSequential(t) };
      });

      linear
        .selectAll("stop")
        .data(gradStops)
        .join("stop")
        .attr("offset", (d) => d.offset)
        .attr("stop-color", (d) => d.color);

      const legendG = legendSvg.append("g").attr("transform", `translate(24,16)`);

      legendG
        .append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .attr("fill", `url(#${gradientId})`)
        .attr("rx", 8)
        .attr("ry", 8)
        .attr("stroke", "#E5EAF3");

      // eje de valores (derecha)
      const scale = d3.scaleLinear().domain([min, Math.max(max, min + 1)]).range([legendHeight, 0]);
      const axis = d3.axisRight(scale).ticks(6).tickSize(6).tickPadding(6);

      legendG
        .append("g")
        .attr("transform", `translate(${legendWidth + 8},0)`)
        .call(axis as any)
        .call((g) => g.selectAll("text").style("fontSize", "11px").style("fill", "#334155"))
        .call((g) => g.selectAll("line,path").style("stroke", "#CBD5E1"));

      // etiquetas del catálogo (opcional)
      const labelG = legendG.append("g").attr("transform", `translate(${-(8)},0)`);
      colorCatalog.forEach((c) => {
        if (c.upTo < min || c.upTo > Math.max(max, min + 1)) return;
        const y = scale(c.upTo);
        labelG
          .append("line")
          .attr("x1", -6)
          .attr("x2", 0)
          .attr("y1", y)
          .attr("y2", y)
          .attr("stroke", "#94A3B8");
        labelG
          .append("text")
          .attr("x", -10)
          .attr("y", y + 3)
          .attr("text-anchor", "end")
          .style("fontSize", "10px")
          .style("fill", "#64748B")
          .text(c.label);
      });
    })();

    // cleanup: tooltips
    return () => {
      mapWrap.remove();
      legendWrap.remove();
    };
  }, [data, err, activity]);

  return (
    <div className="space-y-4">
      {/* Encabezado minimal azul */}
      <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "#E8F1FF" }}>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: "#0F172A" }}>
            Coropleta por estado (JSON) — Máximo NO₂/O₃/PM/CH₂O
          </h2>
          <p className="text-sm" style={{ color: "#3B82F6" }}>
            JSON usado: <b>{data?.json ?? "—"}</b>
          </p>
        </div>
        {/* Entrada de actividad — redondeada, tono azul suave */}
        <div className="flex items-center gap-2">
          <label className="text-sm" style={{ color: "#0F172A" }}>
            Actividad:
          </label>
          <input
            className="px-3 py-2 rounded-full border"
            style={{ borderColor: "#BFDBFE", background: "#FFFFFF", color: "#0F172A" }}
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="p.ej., Quiero salir a caminar en Central Park"
          />
        </div>
      </div>

      {/* Contenedor mapa + leyenda (D3 lo rellena) */}
      <div ref={ref} />

      {/* Panel de recomendaciones — redondeado, minimal, azul/blanco */}
      {panel && (
        <div
          className="p-4 rounded-2xl"
          style={{ background: "#FFFFFF", border: "1px solid #E5EAF3", boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
        >
          <div className="font-semibold mb-2" style={{ color: "#0F172A" }}>
            {panel.title}
          </div>
          <div className="whitespace-pre-wrap text-sm" style={{ color: "#0F172A" }}>
            {panel.body}
          </div>
          {loadingGemini && (
            <div className="text-xs mt-2" style={{ color: "#3B82F6" }}>
              Consultando modelo…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
