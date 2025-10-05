'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';
import { authService } from '../../../services/auth';

type ByState = Record<string, {
  name?: string; NO2?: number|null; O3?: number|null; PM?: number|null; CH2O?: number|null; ai: number; maxPollutant?: string
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
  const adjustedWidth = isMobile ? Math.min(240, width * 0.9) : width;
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
    <div style={{display:'flex', justifyContent:'center', width:'100%', padding: isMobile ? '0 4px' : '0'}}>
      <svg
        width={W}
        height={H}
        style={{flex: '0 0 auto', maxWidth: '100%', overflow: 'visible'}}
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
  const [dataSource, setDataSource] = useState<'s3' | 'api' | null>(null);

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

  // Carga datos desde S3
  useEffect(() => {
    (async () => {
      try {
        // First try to get data from /files/map-data
        const response = await authService.getS3Data();
        
        if (response && response.success && Array.isArray(response.data)) {
          // Transform response data to the expected format
          const byState: ByState = {};
          
          // Map state abbreviations to FIPS codes
          const stateAbbreviationToFips: { [stateAbbr: string]: string } = {
            'AL': '01', 'AK': '02', 'AZ': '04', 'AR': '05', 'CA': '06', 'CO': '08', 
            'CT': '09', 'DE': '10', 'FL': '12', 'GA': '13', 'HI': '15', 'ID': '16',
            'IL': '17', 'IN': '18', 'IA': '19', 'KS': '20', 'KY': '21', 'LA': '22', 
            'ME': '23', 'MD': '24', 'MA': '25', 'MI': '26', 'MN': '27', 'MS': '28',
            'MO': '29', 'MT': '30', 'NE': '31', 'NV': '32', 'NH': '33', 'NJ': '34', 
            'NM': '35', 'NY': '36', 'NC': '37', 'ND': '38', 'OH': '39', 'OK': '40',
            'OR': '41', 'PA': '42', 'RI': '44', 'SC': '45', 'SD': '46', 'TN': '47', 
            'TX': '48', 'UT': '49', 'VT': '50', 'VA': '51', 'WA': '53', 'WV': '54',
            'WI': '55', 'WY': '56', 'DC': '11'
          };

          // Map state abbreviations to full names
          const stateAbbreviationToName: { [stateAbbr: string]: string } = {
            'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 
            'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
            'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
            'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
            'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
            'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
            'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
            'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
            'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
            'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
            'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
            'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
            'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
          };
          
          response.data.forEach((record: any) => {
            const stateAbbr = record.State;
            const fips = stateAbbreviationToFips[stateAbbr];
            const stateName = stateAbbreviationToName[stateAbbr];
            
            if (fips && stateName) {
              byState[fips] = {
                name: stateName,
                NO2: null,
                O3: null,
                PM: null,
                CH2O: null,
                ai: record.MaxPollutant || 0,
                maxPollutant: record.Pollutant || 'Unknown'
              };
            }
          });
          
          // If we got valid data, use it
          if (Object.keys(byState).length > 0) {
            setErr(null);
            setData({ byState });
            setDataSource('s3');
            return;
          }
        }
        
        // Fallback to the original API if S3 data is not available
        console.log('S3 data not available, falling back to states API');
        const res = await fetch(`${API_BASE}/states`);
        const d = await res.json();
        if (!res.ok || d?.error) { 
          setErr(d?.error || `HTTP ${res.status}`); 
          setData(null); 
          return; 
        }
        setErr(null); 
        setData(d);
        setDataSource('api');
        
      } catch (e: any) { 
        console.warn('Failed to load S3 data:', e.message);
        
        // If it's an authentication error, don't show error to user
        const isAuthError = e.message.includes('401') || e.message.includes('unauthorized') || e.message.includes('forbidden');
        
        // Fallback to original API
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
          setDataSource('api');
        } catch (fallbackError: any) {
          setErr(fallbackError?.message || 'Error loading data'); 
          setData(null);
        }
      }
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

      // Create tooltip
      const tooltip = d3.select('body').append('div')
        .attr('class', 'map-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '8px 12px')
        .style('border-radius', '6px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', 1000);

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
        .on('mouseenter', function (event, d: any) {
          const fips = String(d.id).padStart(2, '0');
          const stateData = data.byState[fips];
          
          d3.select(this)
            .attr('stroke', PURPLE_PRIMARY)
            .attr('stroke-width', hoverStrokeWidth);

          if (stateData) {
            const content = `
              <div style="font-weight: bold; margin-bottom: 4px;">${stateData.name}</div>
              <div>AQI: ${Math.round(stateData.ai)}</div>
              ${stateData.maxPollutant ? `<div>Max Pollutant: ${stateData.maxPollutant} (${stateData.ai.toFixed(2)})</div>` : ''}
              ${(stateData.NO2 !== null && stateData.NO2 !== undefined) ? `<div>NO₂: ${stateData.NO2.toFixed(2)} ppm</div>` : ''}
              ${(stateData.O3 !== null && stateData.O3 !== undefined) ? `<div>O₃: ${stateData.O3.toFixed(2)} ppm</div>` : ''}
              ${(stateData.PM !== null && stateData.PM !== undefined) ? `<div>PM2.5: ${stateData.PM.toFixed(2)} µg/m³</div>` : ''}
              ${(stateData.CH2O !== null && stateData.CH2O !== undefined) ? `<div>CH₂O: ${stateData.CH2O.toFixed(2)} ppm</div>` : ''}
            `;
            
            tooltip.html(content)
              .style('opacity', 1)
              .style('left', (event.pageX + 10) + 'px')
              .style('top', (event.pageY - 10) + 'px');
          }
        })
        .on('mousemove', function (event) {
          tooltip
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseleave', function () {
          d3.select(this)
            .attr('stroke', STROKE_BASE)
            .attr('stroke-width', strokeWidth);
          
          tooltip.style('opacity', 0);
        });

      // Cleanup function to remove tooltip
      return () => {
        tooltip.remove();
      };
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
            {err ? (
              <div>
                <div style={{ marginBottom: 8 }}>Unable to load air quality data</div>
                <div style={{ fontSize: isMobile ? '12px' : '14px', opacity: 0.7 }}>
                  {err}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 8 }}>Loading air quality data...</div>
                <div style={{ fontSize: isMobile ? '12px' : '14px', opacity: 0.7 }}>
                  Getting latest concentration data
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Leyenda responsive */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: isMobile ? 4 : 8,
        width: '100%',
        overflow: 'hidden',
        padding: isMobile ? '0 8px' : '0 16px'
      }}>
        <LegendAQI
          min={aiStats.min}
          max={aiStats.max}
          width={isMobile ? 240 : 420}
          height={isMobile ? 12 : 16}
        />
        
        {/* Data source indicator */}
        {dataSource && (
          <div style={{
            fontSize: isMobile ? '10px' : '11px',
            color: SLATE_AXIS,
            textAlign: 'center',
            opacity: 0.8
          }}>
            {dataSource === 's3' ? 'Live data from S3' : 'Sample data'}
          </div>
        )}
      </div>
    </div>
  );
}