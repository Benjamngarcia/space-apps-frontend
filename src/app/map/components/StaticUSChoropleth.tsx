'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';

type ByState = Record<string, {
  name?: string; NO2?: number|null; O3?: number|null; PM?: number|null; CH2O?: number|null; ai: number
}>;

const API_BASE = '/map/api';

// === Colores del Static original ===
const PURPLE_PRIMARY = '#BB4DFF';
const PURPLE_LIGHT   = '#E9D5FF';
const PURPLE_DARK    = '#7C3AED';
const SLATE_TEXT     = '#374151';
const SLATE_AXIS     = '#9CA3AF';
const STROKE_BASE    = '#E5E7EB';
const FILL_NO_DATA   = '#F3F4F6';

// Escala morada (igual que el Static original)
function makePurpleScale(min: number, max: number) {
  const domain = [min, (min + max) / 2, max];
  const range  = [PURPLE_LIGHT, PURPLE_PRIMARY, PURPLE_DARK];
  const piece  = d3.scaleLinear<string>().domain(domain).range(range).clamp(true);
  return d3.scaleSequential((t: number) => piece(min + t * (max - min))).domain([0, 1]);
}

/* ---------------- Legend (React, no D3) ---------------- */
function LegendAQI({
  min,
  max,
  width = 420,
  height = 16,
  title = 'Air Quality Index'
}: {
  min: number;
  max: number;
  width?: number;
  height?: number;
  title?: string;
}) {
  const [isMobile, setIsMobile] = useState(false);
  
  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ajustar dimensiones para móvil
  const adjustedWidth = isMobile ? Math.min(280, width) : width;
  const adjustedHeight = isMobile ? 12 : height;
  const fontSize = isMobile ? 10 : 12;
  const tickFontSize = isMobile ? 9 : 11;

  const margin = { top: 10, right: 20, bottom: 18, left: 20 };
  const W = adjustedWidth + margin.left + margin.right;
  const H = adjustedHeight + margin.top + margin.bottom + 14;

  const ticks = isMobile ? 5 : 6;

  // Genera stops para el gradiente
  const stops = Array.from({ length: 26 }, (_, i) => i / 25);

  // Mapea un valor a posición x
  const x = (v: number) => ((v - min) / (max - min)) * adjustedWidth;

  return (
    <div style={{display:'flex', justifyContent:'center', width:'100%', padding: isMobile ? '0 8px' : '0'}}>
      <svg
        width={W}
        height={H}
        style={{flex: '0 0 auto', maxWidth: '100%'}}
        aria-label="AQI legend"
      >
        <defs>
          <linearGradient id="aqiGradient" x1="0" y1="0" x2="1" y2="0">
            {stops.map((t) => (
              <stop key={t} offset={`${t*100}%`} stopColor={makePurpleScale(0, 1)(t)} />
            ))}
          </linearGradient>
        </defs>

        {/* Título */}
        <text
          x={margin.left + adjustedWidth / 2}
          y={margin.top - 2}
          textAnchor="middle"
          fill={SLATE_TEXT}
          fontSize={fontSize}
          fontWeight={600}
        >
          {title}
        </text>

        {/* Barra con gradiente */}
        <rect
          x={margin.left}
          y={margin.top + 6}
          width={adjustedWidth}
          height={adjustedHeight}
          rx={8}
          ry={8}
          fill="url(#aqiGradient)"
          stroke={STROKE_BASE}
        />

        {/* Eje con ticks adaptativos */}
        {Array.from({ length: ticks }, (_, i) => {
          const v = min + (i * (max - min)) / (ticks - 1);
          const xx = margin.left + x(v);
          return (
            <g key={i} transform={`translate(${xx}, ${margin.top + adjustedHeight + 8})`}>
              <line y1={-4} y2={0} stroke={SLATE_AXIS} strokeWidth={1} />
              <text
                y={12}
                textAnchor="middle"
                fontSize={tickFontSize}
                fontWeight={500}
                fill={SLATE_TEXT}
              >
                {Math.round(v)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------------- Main component ---------------- */
type Props = {
  height?: string;
  mapPadding?: number;
};

export default function StaticUSChoropleth({
  height = 'clamp(360px, 82vh, 900px)',
  mapPadding = 16,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mapRef  = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const [data, setData] = useState<{ byState: ByState; json?: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Detectar cambios en el tamaño de la pantalla
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Carga datos
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

  // Calcula min/max una sola vez para leyenda y mapa
  const aiStats = useMemo(() => {
    const vals = data?.byState ? Object.values(data.byState).map(s => s.ai) : [];
    const min = vals.length ? d3.min(vals)! : 0;
    const rawMax = vals.length ? d3.max(vals)! : 100;
    const max = Math.max(rawMax, min + 1);
    return { min, max };
  }, [data?.byState]);

  // Ajustar padding del mapa para móvil
  const adjustedMapPadding = isMobile ? Math.max(8, mapPadding - 4) : mapPadding;

  // Dibuja el mapa (solo D3 aquí)
  useEffect(() => {
    if (!mapRef.current || !data?.byState) return;

    const host = mapRef.current;
    const svgOld = host.querySelector('svg');
    if (svgOld) host.removeChild(svgOld);

    const mapW = host.clientWidth  || 1200;
    const mapH = host.clientHeight || 700;

    const svg = d3.select(host)
      .append('svg')
      .attr('viewBox', `0 0 ${mapW} ${mapH}`)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('display', 'block')
      .style('background', 'transparent');

    const gMap = svg.append('g');

    const colorSequential = makePurpleScale(aiStats.min, aiStats.max);

    (async () => {
      const topo = await (await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')).json();
      const statesFC: any = feature(topo, topo.objects.states);

      const projection = d3.geoAlbersUsa().precision(0.1);
      projection.fitExtent([[adjustedMapPadding, adjustedMapPadding], [mapW - adjustedMapPadding, mapH - adjustedMapPadding]], statesFC);
      const path = d3.geoPath(projection);

      // Ajustar grosor del stroke para móvil
      const strokeWidth = isMobile ? 0.5 : 1;
      const hoverStrokeWidth = isMobile ? 1.5 : 2;

      gMap.selectAll('path')
        .data(statesFC.features)
        .join('path')
        .attr('d', path as any)
        .attr('fill', (d: any) => {
          const fips = String(d.id).padStart(2, '0');
          const s = data.byState[fips];
          if (!s) return FILL_NO_DATA;
          const t = (s.ai - aiStats.min) / (aiStats.max - aiStats.min);
          return colorSequential(Math.max(0, Math.min(1, t)));
        })
        .attr('stroke', STROKE_BASE)
        .attr('stroke-width', strokeWidth)
        .style('transition', 'fill 0.3s ease, stroke 0.3s ease')
        .style('cursor', 'pointer')
        .on('mouseenter', function () {
          d3.select(this)
            .attr('stroke', PURPLE_PRIMARY)
            .attr('stroke-width', hoverStrokeWidth);
        })
        .on('mouseleave', function () {
          d3.select(this)
            .attr('stroke', STROKE_BASE)
            .attr('stroke-width', strokeWidth);
        });
    })();

    // cleanup
    return () => { if (host.firstChild) host.innerHTML = ''; };
  }, [data?.byState, aiStats.min, aiStats.max, adjustedMapPadding, isMobile]);

  return (
    <div
      ref={rootRef}
      style={{
        width: '100%',
        height,
        minHeight: 300,
        display: 'grid',
        gridTemplateRows: '1fr auto',
        rowGap: isMobile ? 4 : 8,
        padding: isMobile ? '4px 0' : '0'
      }}
      aria-label="US Air Quality Choropleth"
    >
      {/* Mapa */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
          padding: isMobile ? '0 4px' : '0'
        }}
      >
        {!data?.byState && (
          <div style={{ 
            color: SLATE_TEXT, 
            fontSize: isMobile ? '14px' : '16px',
            textAlign: 'center',
            padding: isMobile ? '0 16px' : '0'
          }}>
            {err ? `No data: ${err}` : 'Loading map…'}
          </div>
        )}
      </div>

      {/* Leyenda responsive */}
      <LegendAQI
        min={aiStats.min}
        max={aiStats.max}
        width={isMobile ? 280 : 420}
        height={isMobile ? 12 : 16}
      />
    </div>
  );
}