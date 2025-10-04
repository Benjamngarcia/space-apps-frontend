"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

type FC = {
  type: "FeatureCollection";
  features: { type:"Feature"; geometry:{ type:"Point"; coordinates:[number,number] }; properties:any }[];
  csv?: string;
};

const API_BASE = "/map/api"; 

export default function D3USMap({ onSelectZip }:{ onSelectZip:(zip:string)=>void }){
  const ref = useRef<HTMLDivElement>(null);
  const [fc, setFc] = useState<FC | null>(null);
  const [err, setErr] = useState<string | null>(null);

//   const [loading, setLoading] = useState(true);
// useEffect(() => {
//   (async () => {
//     setLoading(true); // empieza cargando
//     try {
//       const res = await fetch(`${API_BASE}/cities`);
//       const data = await res.json();
//       if (!res.ok || data?.error) {
//         setErr(data?.error || `HTTP ${res.status}`);
//         setFc(null);
//       } else {
//         setErr(null);
//         setFc(data);
//       }
//     } catch (e: any) {
//       setErr(e?.message || "Error cargando datos");
//       setFc(null);
//     } finally {
//       setLoading(false); // termina el fetch
//     }
//   })();
// }, []);

// if (loading) {
//   return (
//     <div className="w-full h-[600px] flex items-center justify-center text-gray-600">
//       Cargando datos del mapa...
//     </div>
//   );
// }

  // Carga de datos
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/cities`);
        const data = await res.json();
        if (!res.ok || data?.error) {
          setErr(data?.error || `HTTP ${res.status}`);
          setFc(null);
          return;
        }
        if (!data || !Array.isArray(data.features)) {
          setErr("Respuesta inválida del API: falta 'features'.");
          setFc(null);
          return;
        }
        setErr(null);
        setFc(data);
      } catch (e: any) {
        setErr(e?.message || "Error cargando datos");
        setFc(null);
      }
    })();
  }, []);

  // Render D3
  useEffect(() => {
    if (!ref.current) return;
    // limpia lienzo anterior
    ref.current.innerHTML = "";

    if (!fc || !Array.isArray(fc.features) || fc.features.length === 0) {
      // Mensaje vacío o de error
      const div = document.createElement("div");
      div.style.padding = "12px";
      div.textContent = err ? `Sin datos: ${err}` : "Sin datos para mostrar.";
      ref.current.appendChild(div);
      return;
    }

    const width = ref.current.clientWidth || 900;
    const height = 580;

    const svg = d3.select(ref.current).append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", height)
      .style("background", "#fff");

    const gMap = svg.append("g");
    const gPts = svg.append("g");

    const projection = d3.geoAlbersUsa()
      .translate([width / 2, height / 2])
      .scale(Math.min(width, height) * 1.2);
    const path = d3.geoPath(projection);

    const tooltip = d3.select(ref.current).append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "#111")
      .style("color", "#fff")
      .style("padding", "6px 8px")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("opacity", "0");

    const safeAI = (p: any) =>
      p?.AI ?? Math.max(...["NO2","O3","PM","CH2O"].map(k => p?.[k]).filter((v: number) => Number.isFinite(v)));

    const vals = (fc.features ?? []).map(f => safeAI(f.properties)).filter((v: number) => Number.isFinite(v));
    const min = d3.min(vals) ?? 0;
    const max = d3.max(vals) ?? 200;

    const color = d3.scaleQuantize<string>()
      .domain([min, max])
      .range(["#2DC937","#99C140","#E7B416","#DB7B2B","#CC3232","#660000"]);

    const r = d3.scaleSqrt<number,number>()
      .domain([min, max])
      .range([3, 9]);

    (async () => {
      const topo = await (await fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")).json();
      const states: any = feature(topo, topo.objects.states);

      gMap.selectAll("path")
        .data(states.features)
        .join("path")
        .attr("d", path as any)
        .attr("fill", "#f5f5f5")
        .attr("stroke", "#aaa");

      gPts.selectAll("circle")
        .data(fc.features)
        .join("circle")
        .attr("cx", d => (projection(d.geometry.coordinates) ?? [-9999, -9999])[0])
        .attr("cy", d => (projection(d.geometry.coordinates) ?? [-9999, -9999])[1])
        .attr("r", d => r(safeAI(d.properties)))
        .attr("fill", d => color(safeAI(d.properties)))
        .attr("stroke", "#333")
        .attr("stroke-width", 0.6)
        .style("cursor", "pointer")
        .on("mouseenter", function (e, d: any) {
          const p = d.properties;
          const ai = safeAI(p);
          tooltip.style("opacity", "1")
            .html(
              `<b>ZIP:</b> ${p.zip}<br/>
               <b>AI:</b> ${ai}<br/>
               <b>NO2:</b> ${p.NO2 ?? "N/D"} | <b>O3:</b> ${p.O3 ?? "N/D"}<br/>
               <b>PM:</b> ${p.PM ?? "N/D"} | <b>CH2O:</b> ${p.CH2O ?? "N/D"}`
            );
        })
        .on("mousemove", (e: any) => {
          tooltip.style("left", e.offsetX + 12 + "px").style("top", e.offsetY + 12 + "px");
        })
        .on("mouseleave", () => tooltip.style("opacity", "0"))
        .on("click", (_e, d: any) => onSelectZip(d.properties.zip));

      svg.call(
        d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([1, 8])
          .on("zoom", (ev) => {
            gMap.attr("transform", ev.transform.toString());
            gPts.attr("transform", ev.transform.toString());
          }) as any
      );
    })();

    return () => { tooltip.remove(); };
  }, [fc, err, onSelectZip]);

  return <div ref={ref} style={{ width: "100%", height: 600, position: "relative" }} />;
}
