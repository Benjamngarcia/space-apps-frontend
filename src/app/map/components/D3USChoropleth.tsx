"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

type ByState = Record<string, { name?: string; NO2?: number|null; O3?: number|null; PM?: number|null; CH2O?: number|null; ai: number }>;

export default function D3USChoropleth(){
  const ref = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<{ byState: ByState; json?: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try{
        const res = await fetch("/map/api/states");
        const d = await res.json();
        if(!res.ok || d?.error){ setErr(d?.error || `HTTP ${res.status}`); setData(null); return; }
        setErr(null); setData(d);
      }catch(e:any){ setErr(e?.message || "Error"); setData(null); }
    })();
  }, []);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";

    if (!data?.byState || Object.keys(data.byState).length === 0) {
      const div = document.createElement("div");
      div.style.padding = "12px";
      div.textContent = err ? `Sin datos: ${err}` : "Sin datos para mostrar.";
      ref.current.appendChild(div);
      return;
    }

    const width = ref.current.clientWidth || 960;
    const height = 600;

    const svg = d3.select(ref.current).append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", height)
      .style("background", "#fff");

    const gMap = svg.append("g");

    const projection = d3.geoAlbersUsa().translate([width/2, height/2]).scale(Math.min(width, height) * 1.2);
    const path = d3.geoPath(projection);

    const tooltip = d3.select(ref.current).append("div")
      .style("position","absolute").style("pointer-events","none")
      .style("background","#111").style("color","#fff")
      .style("padding","6px 8px").style("border-radius","6px")
      .style("font-size","12px").style("opacity","0");

    const aiVals = Object.values(data.byState).map(s => s.ai);
    const min = d3.min(aiVals) ?? 0, max = d3.max(aiVals) ?? 200;

    const color = d3.scaleQuantize<string>()
      .domain([min, max])
      .range(["#2DC937","#99C140","#E7B416","#DB7B2B","#CC3232","#660000"]);

    (async ()=>{
      const topo = await (await fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")).json();
      const states: any = feature(topo, topo.objects.states);

      gMap.selectAll("path")
        .data(states.features)
        .join("path")
        .attr("d", path as any)
        .attr("fill", (d:any) => {
          const fips = String(d.id).padStart(2, "0");
          const s = data.byState[fips];
          return s ? color(s.ai) : "#eee";
        })
        .attr("stroke", "#999")
        .style("cursor","pointer")
        .on("mouseenter", function(e:any, d:any){
          const fips = String(d.id).padStart(2, "0");
          const s = data.byState[fips];
          tooltip.style("opacity","1")
            .html(s ? `
              <b>${s.name ?? 'Estado'}</b> (FIPS ${fips})<br/>
              <b>AI:</b> ${s.ai}<br/>
              NO2: ${s.NO2 ?? '—'} | O3: ${s.O3 ?? '—'}<br/>
              PM:  ${s.PM  ?? '—'} | CH2O: ${s.CH2O ?? '—'}
            ` : `FIPS ${fips}<br/>Sin datos`);
        })
        .on("mousemove", (e:any)=> tooltip.style("left", (e.offsetX+12)+"px").style("top", (e.offsetY+12)+"px"))
        .on("mouseleave", ()=> tooltip.style("opacity","0"));

      svg.call(
        d3.zoom<SVGSVGElement,unknown>()
          .scaleExtent([1, 8])
          .on("zoom", (ev) => { gMap.attr("transform", ev.transform.toString()); }) as any
      );
    })();

    return ()=> { tooltip.remove(); };
  }, [data, err]);

  
  return (
    <div className="space-y-2">
      <div className="text-sm opacity-70">JSON usado: <b>{data?.json ?? "—"}</b></div>
      <div ref={ref} style={{ width:"100%", height: 600, position:"relative" }} />
      <div className="flex items-center gap-3 text-sm">
        <span className="inline-block w-4 h-3 border" style={{background:'#2DC937'}}></span> Bueno
        <span className="inline-block w-4 h-3 border" style={{background:'#99C140'}}></span> Moderado (bajo)
        <span className="inline-block w-4 h-3 border" style={{background:'#E7B416'}}></span> Moderado
        <span className="inline-block w-4 h-3 border" style={{background:'#DB7B2B'}}></span> USG
        <span className="inline-block w-4 h-3 border" style={{background:'#CC3232'}}></span> Dañino
        <span className="inline-block w-4 h-3 border" style={{background:'#660000'}}></span> Muy dañino+
      </div>
    </div>
  );
}
