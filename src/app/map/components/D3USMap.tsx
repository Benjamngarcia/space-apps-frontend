"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";

type FC = {
  type: "FeatureCollection";
  features: { type:"Feature"; geometry:{ type:"Point"; coordinates:[number,number] }; properties:any }[];
  csv?: string;
};

export default function D3USMap({ onSelectZip }:{ onSelectZip:(zip:string)=>void }){
  const ref = useRef<HTMLDivElement>(null);
  const [fc, setFc] = useState<FC|null>(null);

  useEffect(()=>{ fetch("/mapa/api/cities").then(r=>r.json()).then(setFc).catch(console.error); }, []);

  useEffect(()=>{
    if(!ref.current || !fc) return;

    ref.current.innerHTML = "";
    const width = ref.current.clientWidth || 900;
    const height = 580;

    const svg = d3.select(ref.current).append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", height)
      .style("background", "#fff");

    const gMap = svg.append("g");
    const gPts = svg.append("g");

    const projection = d3.geoAlbersUsa().translate([width/2, height/2]).scale(Math.min(width, height)*1.2);
    const path = d3.geoPath(projection);

    const tooltip = d3.select(ref.current).append("div")
      .style("position","absolute").style("pointer-events","none")
      .style("background","#111").style("color","#fff")
      .style("padding","6px 8px").style("border-radius","6px")
      .style("font-size","12px").style("opacity",0);

    const vals = fc.features.map(f => f.properties.AI ?? Math.max(...["NO2","O3","PM","CH2O"].map(k=>f.properties[k]).filter((v:number)=>Number.isFinite(v))));
    const min = d3.min(vals) ?? 0, max = d3.max(vals) ?? 200;
    const color = d3.scaleQuantize<string>().domain([min, max]).range(["#2DC937","#99C140","#E7B416","#DB7B2B","#CC3232","#660000"]);
    const r = d3.scaleSqrt().domain([min, max]).range([3, 9]);

    (async ()=>{
      const topo = await (await fetch("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json")).json();
      const states = feature(topo, topo.objects.states) as any;

      gMap.selectAll("path")
        .data(states.features)
        .join("path")
        .attr("d", path as any)
        .attr("fill","#f5f5f5")
        .attr("stroke","#aaa");

      gPts.selectAll("circle")
        .data(fc.features)
        .join("circle")
        .attr("cx", d => (projection(d.geometry.coordinates) || [-9999,-9999])[0])
        .attr("cy", d => (projection(d.geometry.coordinates) || [-9999,-9999])[1])
        .attr("r", d => r(d.properties.AI ?? Math.max(...["NO2","O3","PM","CH2O"].map(k=>d.properties[k]).filter((v:number)=>Number.isFinite(v)))))
        .attr("fill", d => color(d.properties.AI ?? Math.max(...["NO2","O3","PM","CH2O"].map(k=>d.properties[k]).filter((v:number)=>Number.isFinite(v)))))
        .attr("stroke","#333").attr("stroke-width",0.6)
        .style("cursor","pointer")
        .on("mouseenter", function(e,d:any){
          const ai = d.properties.AI ?? Math.max(...["NO2","O3","PM","CH2O"].map(k=>d.properties[k]).filter((v:number)=>Number.isFinite(v)));
          tooltip.style("opacity",1)
            .html(`<b>ZIP:</b> ${d.properties.zip}<br/><b>AI:</b> ${ai}<br/><b>NO2:</b> ${d.properties.NO2 ?? "N/D"} | <b>O3:</b> ${d.properties.O3 ?? "N/D"}<br/><b>PM:</b> ${d.properties.PM ?? "N/D"} | <b>CH2O:</b> ${d.properties.CH2O ?? "N/D"}`);
        })
        .on("mousemove", (e)=>{
          tooltip.style("left", (e.offsetX+12)+"px").style("top", (e.offsetY+12)+"px");
        })
        .on("mouseleave", ()=> tooltip.style("opacity",0))
        .on("click", (_e,d:any)=> onSelectZip(d.properties.zip));

      svg.call(d3.zoom<SVGSVGElement,unknown>().scaleExtent([1,8]).on("zoom", (ev)=>{
        gMap.attr("transform", ev.transform.toString());
        gPts.attr("transform", ev.transform.toString());
      }) as any);
    })();

    return ()=> { tooltip.remove(); };
  }, [fc]);

  return <div ref={ref} style={{ width:"100%", height: 600, position:"relative" }} />;
}
