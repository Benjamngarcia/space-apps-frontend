"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

type ByState = Record<
  string,
  { name?: string; NO2?: number | null; O3?: number | null; PM?: number | null; CH2O?: number | null; ai: number }
>;

// Solo cambia si tu API vive en /mapa/api
const API_BASE = "/map/api";

// Paleta UI (solo azul y blanco)
const BLUE = "#6ec9f4";
const WHITE = "#FFFFFF";

// Degradado de contaminación (verde -> naranja -> morado)
function makeGreenOrangePurpleScale(min: number, max: number) {
  const domain = [min, (min + max) / 2, max];
  const range = ["#22C55E", "#F59E0B", "#a01dec"];
  const piece = d3.scaleLinear<string>().domain(domain).range(range).clamp(true);
  return d3
    .scaleSequential((t: number) => piece(min + t * (max - min)))
    .domain([0, 1]);
}

export default function D3USChoropleth() {
  const ref = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<{ byState: ByState; json?: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // actividad (no re-render del mapa al escribir)
  const [activity, setActivity] = useState("Quiero salir a caminar en la tarde");

  // panel de resultado Gemini (oculto hasta respuesta)
  const [panel, setPanel] = useState<{ title: string; body: string } | null>(null);
  const [loadingGemini, setLoadingGemini] = useState(false);

  // Carga única de estados
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

  // Render D3 (NO depende de activity ni panel; solo data/err)
  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";

    // Contenedor principal (azul)
    const root = d3
      .select(ref.current)
      .style("display", "flex")
      .style("gap", "20px")
      .style("alignItems", "center")
      .style("justifyContent", "center")
      .style("width", "100%")
      .style("minHeight", "70vh")
      .style("background", BLUE);

    const mapWrap = root
      .append("div")
      .style("flex", "1 1 auto")
      .style("height", "600px")
      .style("display", "flex")
      .style("alignItems", "center")
      .style("justifyContent", "center")
      .style("background", "transparent")
      .style("padding", "8px")
      .style("position", "relative");

    const legendWrap = root
      .append("div")
      .style("width", "110px")
      .style("height", "600px")
      .style("display", "flex")
      .style("alignItems", "center")
      .style("justifyContent", "center")
      .style("background", "transparent");

    if (!data?.byState || Object.keys(data.byState).length === 0) {
      mapWrap
        .append("div")
        .style("padding", "12px")
        .style("color", WHITE)
        .style(
          "fontFamily",
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial"
        )
        .text(err ? `Sin datos: ${err}` : "Sin datos para mostrar.");
      return;
    }

    const containerWidth = (mapWrap.node() as HTMLDivElement).clientWidth || 960;
    const containerHeight = (mapWrap.node() as HTMLDivElement).clientHeight || 560;

    const width = Math.min(980, containerWidth - 16);
    const height = Math.min(560, containerHeight - 16);

    const svg = mapWrap
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%")
      .style("background", "transparent");

    const gMap = svg.append("g");

    const projection = d3.geoAlbersUsa().translate([width / 2, height / 2]).scale(Math.min(width, height) * 1.2);
    const path = d3.geoPath(projection);

    const tooltip = mapWrap
      .append("div")
      .style("position", "absolute")
      .style("pointerEvents", "none")
      .style("background", WHITE)
      .style("border", `1px solid ${WHITE}80`)
      .style("color", BLUE)
      .style("padding", "8px 10px")
      .style("borderRadius", "12px")
      .style("fontSize", "12px")
      .style("boxShadow", `0 6px 16px ${BLUE}66`)
      .style("opacity", "0");

    // Escala de color (verde → naranja → morado)
    const aiVals = Object.values(data.byState).map((s) => s.ai);
    const min = d3.min(aiVals) ?? 0;
    const max = d3.max(aiVals) ?? 200;
    const maxSafe = Math.max(max, min + 1);
    const colorSequential = makeGreenOrangePurpleScale(min, maxSafe);

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
          if (!s) return `${WHITE}26`; // sin datos: blanco translúcido sobre azul
          const t = (s.ai - min) / (maxSafe - min);
          return colorSequential(Math.max(0, Math.min(1, t)));
        })
        .attr("stroke", `${WHITE}8C`)
        .attr("stroke-width", 0.8)
        .style("cursor", "pointer")
        .on("mouseenter", function (e: any, d: any) {
          const fips = String(d.id).padStart(2, "0");
          const s = data.byState[fips];
          tooltip.style("opacity", "1").html(
            s
              ? `
              <div style="font-weight:600; margin-bottom:4px">${s.name ?? "Estado"} <span style="opacity:.7">(FIPS ${fips})</span></div>
              <div><b>AI (máx):</b> ${s.ai}</div>
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

      // Zoom/pan
      svg.call(
        d3
          .zoom<SVGSVGElement, unknown>()
          .scaleExtent([1, 8])
          .on("zoom", (ev) => {
            gMap.attr("transform", ev.transform.toString());
          }) as any
      );

      // Leyenda vertical (marco y textos solo azul/blanco)
      const legendWidth = 30;
      const legendHeight = Math.min(480, height - 40);

      const legendSvg = legendWrap
        .append("svg")
        .attr("width", 96)
        .attr("height", height - 32)
        .style("display", "block")
        .style("background", "transparent");

      const defs = legendSvg.append("defs");
      const gradientId = "aqi-g2o2p";
      const linear = defs
        .append("linearGradient")
        .attr("id", gradientId)
        .attr("x1", "0")
        .attr("x2", "0")
        .attr("y1", "1")
        .attr("y2", "0");

      const colorSeq = makeGreenOrangePurpleScale(min, maxSafe);
      const gradStops = d3.range(0, 1.0001, 0.04).map((t) => ({ offset: `${t * 100}%`, color: colorSeq(t) }));

      linear
        .selectAll("stop")
        .data(gradStops)
        .join("stop")
        .attr("offset", (d) => d.offset)
        .attr("stop-color", (d) => d.color);

      const legendG = legendSvg.append("g").attr("transform", `translate(28,16)`);

      legendG
        .append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .attr("fill", `url(#${gradientId})`)
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("stroke", `${WHITE}8C`);

      const scale = d3.scaleLinear().domain([min, maxSafe]).range([legendHeight, 0]);
      const axis = d3.axisRight(scale).ticks(6).tickSize(6).tickPadding(6);

      legendG
        .append("g")
        .attr("transform", `translate(${legendWidth + 8},0)`)
        .call(axis as any)
        .call((g) => g.selectAll("text").style("fontSize", "11px").style("fill", WHITE))
        .call((g) => g.selectAll("line,path").style("stroke", `${WHITE}8C`));

      const labels = [
        { y: legendHeight, text: "Más sano" },
        { y: 0, text: "Más tóxico" },
      ];
      legendG
        .selectAll("text.legend-label")
        .data(labels)
        .join("text")
        .attr("class", "legend-label")
        .attr("x", legendWidth / 2)
        .attr("y", (d) => d.y + (d.y === 0 ? -6 : 16))
        .attr("text-anchor", "middle")
        .style("fontSize", "11px")
        .style("fill", WHITE)
        .text((d) => d.text);
    })();

    // cleanup
    return () => {
      // d3 ya eliminó internos al limpiar el contenedor
    };
  }, [data, err]); // NO incluye activity ni panel

  return (
    <div className="space-y-4" style={{ background: BLUE, minHeight: "100vh", padding: "16px" }}>
      {/* Animaciones de carga de Gemini (solo azul/blanco) */}
      <style>{`
        @keyframes floatPulse {
          0% { transform: scale(1); opacity: .15; }
          50% { transform: scale(1.02); opacity: .30; }
          100% { transform: scale(1); opacity: .15; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Encabezado */}
      <div
        className="flex items-center justify-between p-4 rounded-xl"
        style={{ background: WHITE, border: `1px solid ${WHITE}`, color: BLUE }}
      >
        <div>
          <h2 className="text-xl font-semibold" style={{ color: BLUE }}>
            Coropleta por estado — Máximo NO₂/O₃/PM/CH₂O
          </h2>
          <p className="text-sm" style={{ color: BLUE }}>
            JSON usado: <b>{data?.json ?? "—"}</b>
          </p>
        </div>

        {/* Entrada de actividad — pill redondeada (blanco/azul) */}
        <div className="flex items-center gap-2">
          <label className="text-sm" style={{ color: BLUE }}>
            Actividad:
          </label>
          <input
            className="px-4 py-2 rounded-full border"
            style={{
              borderColor: BLUE,
              background: WHITE,
              color: BLUE,
              minWidth: 320,
              outline: "none",
            }}
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="p.ej., Quiero salir a caminar en Central Park"
          />
          <span className="text-xs" style={{ color: WHITE }}>
            * Da clic en un estado para ver recomendaciones
          </span>
        </div>
      </div>

      {/* Mapa + leyenda (D3 renderiza dentro) */}
      <div ref={ref} />

      {/* Overlay animado durante consulta a Gemini */}
      {loadingGemini && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backdropFilter: "blur(2px)",
            animation: "floatPulse 2s ease-in-out infinite",
            background: `radial-gradient(1200px 800px at 50% 40%, ${WHITE}26, ${BLUE}66 60%, ${BLUE})`,
            pointerEvents: "none",
            zIndex: 40,
          }}
        />
      )}

      {/* Spinner (blanco/azul) */}
      {loadingGemini && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "9999px",
              border: `4px solid ${WHITE}66`,
              borderTopColor: WHITE,
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      )}

      {/* Panel de recomendaciones — solo aparece con respuesta; blanco/azul */}
      {panel && !loadingGemini && (
        <div
          className="p-4 rounded-2xl"
          style={{
            background: WHITE,
            border: `1px solid ${WHITE}`,
            boxShadow: `0 10px 30px ${BLUE}80`,
            color: BLUE,
          }}
        >
          <div className="font-semibold mb-2" style={{ color: BLUE }}>
            {panel.title}
          </div>
          <div className="whitespace-pre-wrap text-sm" style={{ color: BLUE }}>
            {panel.body}
          </div>
        </div>
      )}
    </div>
  );
}
