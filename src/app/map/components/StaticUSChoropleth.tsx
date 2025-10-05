'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';

type ByState = Record<string, { name?: string; NO2?: number|null; O3?: number|null; PM?: number|null; CH2O?: number|null; ai: number }>;

const API_BASE = '/map/api';
const PURPLE_PRIMARY = '#BB4DFF';  // Purple theme color
const WHITE = '#FFFFFF';

// Degraded purple theme: light purple -> purple -> dark purple
function makePurpleScale(min: number, max: number) {
  const domain = [min, (min + max) / 2, max];
  const range = ['#E9D5FF', '#BB4DFF', '#7C3AED']; // Light purple -> Primary purple -> Dark purple
  const piece = d3.scaleLinear<string>().domain(domain).range(range).clamp(true);
  return d3.scaleSequential((t: number) => piece(min + t * (max - min))).domain([0, 1]);
}

type Props = {
  /** Altura total del componente (contenedor) */
  height?: string;              // p.ej. "clamp(360px, 82vh, 900px)"
  /** Padding en px para que el mapa no toque bordes */
  mapPadding?: number;          // p.ej. 16
  /** Altura de la leyenda (SVG) en px */
  legendSvgHeight?: number;     // p.ej. 60
};

export default function StaticUSChoropleth({
  height = 'clamp(360px, 82vh, 900px)',
  mapPadding = 16,
  legendSvgHeight = 60,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<{ byState: ByState; json?: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/states`);
        const d = await res.json();
        if (!res.ok || d?.error) { setErr(d?.error || `HTTP ${res.status}`); setData(null); return; }
        setErr(null); setData(d);
      } catch (e: any) { setErr(e?.message || 'Error'); setData(null); }
    })();
  }, []);

  useEffect(() => {
    if (!ref.current) return;

    const host = ref.current;
    const ro = new ResizeObserver(draw);
    ro.observe(host);

    async function draw() {
      if (!ref.current) return;
      const mount = ref.current;
      mount.innerHTML = '';

      // ====== Layout en grid: Mapa (fila 1) + Leyenda (fila 2) ======
      const root = d3.select(mount)
        .style('width', '100%')
        .style('height', '100%')
        .style('display', 'grid')
        .style('gridTemplateRows', '1fr auto')
        .style('rowGap', '8px')
        .style('background', 'transparent'); // Transparent background to show gradient

      const mapWrap = root.append('div')
        .style('width', '100%')
        .style('height', '100%')
        .style('display', 'flex')
        .style('alignItems', 'center')
        .style('justifyContent', 'center')
        .style('minHeight', '0') // importante para grid
        .node() as HTMLDivElement;

      const legendWrap = root.append('div')
        .style('width', '100%')
        .style('display', 'flex')
        .style('alignItems', 'center')
        .style('justifyContent', 'center')
        .style('padding', '0 16px 12px')
        .node() as HTMLDivElement;

      if (!data?.byState || Object.keys(data.byState).length === 0) {
        d3.select(mapWrap).append('div').style('color', WHITE).text(err ? `No data: ${err}` : 'No data.');
        return;
      }

      const mapW = mapWrap.clientWidth || 1200;
      const mapH = mapWrap.clientHeight || 700;

      // ====== SVG del mapa (centrado) ======
      const svg = d3.select(mapWrap)
        .append('svg')
        .attr('viewBox', `0 0 ${mapW} ${mapH}`)
        .attr('width', '100%')
        .attr('height', '100%')
        // 👇 centra el contenido dentro del viewBox en cualquier aspecto
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('display', 'block')
        .style('background', 'transparent');

      const gMap = svg.append('g');

      const aiVals = Object.values(data.byState).map((s) => s.ai);
      const min = d3.min(aiVals) ?? 0;
      const max = d3.max(aiVals) ?? 200;
      const colorSequential = makePurpleScale(min, Math.max(max, min + 1));

      // Geo datos
      const topo = await (await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')).json();
      const statesFC: any = feature(topo, topo.objects.states);

      // Proyección: que entre COMPLETO dentro del área (con padding)
      const projection = d3.geoAlbersUsa().precision(0.1);
      projection.fitExtent([[mapPadding, mapPadding], [mapW - mapPadding, mapH - mapPadding]], statesFC);
      const path = d3.geoPath(projection);

      gMap.selectAll('path')
        .data(statesFC.features)
        .join('path')
        .attr('d', path as any)
        .attr('fill', (d: any) => {
          const fips = String(d.id).padStart(2, '0');
          const s = data.byState[fips];
          if (!s) return '#F3F4F6'; // Light gray for no data
          const t = (s.ai - min) / (Math.max(max, min + 1) - min);
          return colorSequential(Math.max(0, Math.min(1, t)));
        })
        .attr('stroke', '#E5E7EB') // Light gray border
        .attr('stroke-width', 1)
        .style('transition', 'fill 0.3s ease, stroke 0.3s ease')
        .style('cursor', 'pointer')
        .on('mouseenter', function() {
          d3.select(this).attr('stroke', PURPLE_PRIMARY).attr('stroke-width', 2);
        })
        .on('mouseleave', function() {
          d3.select(this).attr('stroke', '#E5E7EB').attr('stroke-width', 1);
        });

      // ====== LEYENDA SIEMPRE ABAJO (HORIZONTAL) ======
      const Lw = Math.min(640, Math.max(260, Math.round(mapW * 0.66))); // ancho responsive
      const Lh = Math.max(14, Math.min(28, legendSvgHeight - 26));      // alto barra dentro del svg

      const legendSvg = d3.select(legendWrap)
        .append('svg')
        .attr('width', Lw + 80)         // espacio para eje y padding
        .attr('height', Math.max(legendSvgHeight, Lh + 34));

      const defs = legendSvg.append('defs');
      const gradientId = 'aqi-horizontal';
      const linear = defs.append('linearGradient')
        .attr('id', gradientId).attr('x1', '0').attr('y1', '0').attr('x2', '1').attr('y2', '0');

      const stops = d3.range(0, 1.0001, 0.04).map(t => ({ offset: `${t * 100}%`, color: colorSequential(t) }));
      linear.selectAll('stop').data(stops).join('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color);

      const gL = legendSvg.append('g').attr('transform', `translate(40, 10)`);

      // Título de la leyenda
      gL.append('text')
        .attr('x', Lw / 2)
        .attr('y', -2)
        .attr('text-anchor', 'middle')
        .style('fill', '#374151') // Slate-700 color for better readability
        .style('font-size', '14px')
        .style('font-weight', 600)
        .text('Air Quality Index');

      // Barra
      gL.append('rect')
        .attr('width', Lw)
        .attr('height', Lh)
        .attr('fill', `url(#${gradientId})`)
        .attr('rx', 8).attr('ry', 8)
        .attr('stroke', '#E5E7EB') // Light gray border
        .attr('stroke-width', 1);

      // Eje
      const scale = d3.scaleLinear().domain([min, Math.max(max, min + 1)]).range([0, Lw]);
      const axisG = gL.append('g')
        .attr('transform', `translate(0, ${Lh + 8})`)
        .call(d3.axisBottom(scale).ticks(6).tickSize(4).tickPadding(6) as any);

      axisG.selectAll('text').style('fill', '#6B7280').style('font-size', '12px').style('font-weight', 500); // Slate-500
      axisG.selectAll('line, path').style('stroke', '#D1D5DB').style('stroke-width', 1); // Slate-300
    }

    draw();

    return () => {
      ro.disconnect();
      if (ref.current) ref.current.innerHTML = '';
    };
  }, [data, err, mapPadding, legendSvgHeight]);

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height,          // lo controlas desde Page (ya lo estás pasando como "100%")
        minHeight: 300,  // seguridad
      }}
      aria-label="US Air Quality Choropleth"
    />
  );
}
