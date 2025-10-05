'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';

type ByState = Record<string, { name?: string; NO2?: number|null; O3?: number|null; PM?: number|null; CH2O?: number|null; ai: number }>;
type Props = { onClose: () => void };

const API_BASE = '/map/api';
const PURPLE_PRIMARY = '#BB4DFF';
const PURPLE_LIGHT = '#E9D5FF';
const WHITE = '#FFFFFF';
const SLATE_600 = '#475569';
const SLATE_700 = '#334155';
const SLATE_900 = '#0F172A';

function RiskBadge({ label }: { label?: string }) {
  const map: Record<string, string> = {
    Good:          'bg-green-100 text-green-700 border-green-300',
    Moderate:      'bg-yellow-100 text-yellow-700 border-yellow-300',
    USG:           'bg-amber-100 text-amber-800 border-amber-300',
    Unhealthy:     'bg-orange-100 text-orange-800 border-orange-300',
    VeryUnhealthy: 'bg-red-100 text-red-700 border-red-300',
    'Very Unhealthy': 'bg-red-100 text-red-700 border-red-300',
    Hazardous:     'bg-purple-100 text-purple-700 border-purple-300',
    Unknown:       'bg-slate-100 text-slate-700 border-slate-300',
  };
  const cls = map[label || 'Unknown'] || map.Unknown;
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${cls}`}>
      {label || 'Unknown'}
    </span>
  );
}

function makePurpleScale(min: number, max: number) {
  const domain = [min, (min + max) / 2, max];
  const range = ['#E9D5FF', '#BB4DFF', '#7C3AED'];
  const piece = d3.scaleLinear<string>().domain(domain).range(range).clamp(true);
  return d3.scaleSequential((t: number) => piece(min + t * (max - min))).domain([0, 1]);
}

/** Normalizes list like ["Running,Outdoor Activities", ...] to unique flat tags */
function normalizeTagList(input?: string[]): string[] {
  if (!Array.isArray(input)) return [];
  const out = new Set<string>();
  for (const raw of input) {
    String(raw)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .forEach(t => out.add(t));
  }
  return Array.from(out);
}

/** Buckets tags by a simple keyword heuristic */
function bucketize(tags: string[]) {
  const buckets = { Activity: [] as string[], Vulnerability: [] as string[], Lifestyle: [] as string[] };
  for (const t of tags) {
    const k = t.toLowerCase();
    if (/(run|outdoor|walk|bike|sport)/.test(k)) buckets.Activity.push(t);
    else if (/(elderly|child|asthma|sensitive|health|pregnan|respiratory|cardio)/.test(k)) buckets.Vulnerability.push(t);
    else buckets.Lifestyle.push(t);
  }
  (Object.keys(buckets) as (keyof typeof buckets)[]).forEach((k) => {
    buckets[k] = Array.from(new Set(buckets[k])).filter(Boolean);
  });
  return buckets;
}

type Catalog = { Activity: string[]; Vulnerability: string[]; Lifestyle: string[] };

/* =====================  TIME SERIES CHART  ===================== */
function AirQualityTimeSeriesChart({
  stateData,
  stateName
}: {
  stateData: any;
  stateName: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<any[]>([]);

  useEffect(() => {
    const generateSampleData = () => {
      const pollutants = ['NO2', 'O3', 'PM', 'CH2O', 'AI'];
      const series: any[] = [];
      const baseDate = new Date('2024-01-01');
      for (let i = 0; i < 30; i++) {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + i);
        const point: any = { Date: date };
        pollutants.forEach(p => {
          const baseValue = stateData?.[p] ?? 50;
          const variation = (Math.random() - 0.5) * 20;
          point[p] = Math.max(0, baseValue + variation);
        });
        series.push(point);
      }
      return series;
    };
    setTimeSeriesData(generateSampleData());
  }, [stateData]);

  useEffect(() => {
    if (!svgRef.current || timeSeriesData.length === 0) return;
    const svgSel = d3.select(svgRef.current);
    svgSel.selectAll('*').remove();

    const width = 800;
    const height = 500;
    const marginTop = 40;
    const marginRight = 140;
    const marginBottom = 40;
    const marginLeft = 60;

    const stocks = timeSeriesData.flatMap(d =>
      ['NO2', 'O3', 'PM', 'CH2O', 'AI'].map(Symbol => ({
        Symbol,
        Date: d.Date,
        Close: d[Symbol]
      }))
    );

    const x = d3.scaleUtc()
      .domain(d3.extent(stocks, d => d.Date) as [Date, Date])
      .range([marginLeft, width - marginRight])
      .clamp(true);

    const series = d3.groups(stocks, d => d.Symbol).map(([key, values]) => {
      const v = values[0].Close;
      return {
        key,
        values: values.map(({ Date, Close }) => ({
          Date,
          value: Close / v,
          originalValue: Close
        }))
      };
    });

    const allValues = stocks.map(d => d.Close);
    const y = d3.scaleLinear()
      .domain([0, d3.max(allValues) || 100])
      .range([height - marginBottom, marginTop]);

    const colorScale = d3.scaleOrdinal<string>()
      .domain(['NO2', 'O3', 'PM', 'CH2O', 'AI'])
      .range(['#10B981', '#F59E0B', '#EF4444', '#3B82F6', PURPLE_PRIMARY]);

    const svg = svgSel
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('maxWidth', '100%')
      .style('height', 'auto')
      .style('background', WHITE)
      .style('borderRadius', '12px')
      .style('border', `2px solid ${PURPLE_LIGHT}`);

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('fontSize', '18px')
      .style('fontWeight', 'bold')
      .style('fill', SLATE_700)
      .text(`Air Quality Trends — ${stateName}`);

    svg.append('g')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(width / 100).tickSizeOuter(0) as any)
      .call(g => g.selectAll('text').style('fill', SLATE_600).style('fontSize', '12px'))
      .call(g => g.selectAll('line,path').style('stroke', PURPLE_LIGHT));

    svg.append('g')
      .attr('transform', `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y) as any)
      .call(g => g.selectAll('text').style('fill', SLATE_600).style('fontSize', '12px'))
      .call(g => g.selectAll('line,path').style('stroke', PURPLE_LIGHT));

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 15)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('fill', SLATE_600)
      .style('fontSize', '14px')
      .text('Concentration');

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 5)
      .attr('text-anchor', 'middle')
      .style('fill', SLATE_600)
      .style('fontSize', '14px')
      .text('Date');

    const line = d3.line<any>()
      .x(d => x(d.Date))
      .y(d => y(d.originalValue))
      .curve(d3.curveMonotoneX);

    const serie = svg.append('g')
      .selectAll('g')
      .data(series)
      .join('g');

    serie.append('path')
      .attr('fill', 'none')
      .attr('strokeWidth', 2.5)
      .attr('strokeLinejoin', 'round')
      .attr('strokeLinecap', 'round')
      .attr('stroke', d => colorScale(d.key))
      .attr('d', d => line(d.values));

    serie.append('text')
      .datum(d => ({
        key: d.key,
        value: d.values[d.values.length - 1].originalValue
      }))
      .attr('fill', d => colorScale(d.key))
      .attr('paint-order', 'stroke')
      .attr('stroke', WHITE)
      .attr('strokeWidth', 3)
      .attr('x', width - marginRight + 10)
      .attr('y', d => y(d.value))
      .attr('dy', '0.35em')
      .style('fontWeight', 'bold')
      .style('fontSize', '12px')
      .text(d => {
        const units: Record<string, string> = { NO2: 'ppm', O3: 'ppm', PM: 'µg/m³', CH2O: 'ppm', AI: 'index' };
        return `${d.key}: ${d.value.toFixed(2)}${units[d.key] ? ' ' + units[d.key] : ''}`;
      });

    const tooltip = svg.append('g').style('display', 'none');
    tooltip.append('rect').attr('fill', WHITE).attr('stroke', PURPLE_PRIMARY).attr('rx', 4).attr('ry', 4);
    tooltip.append('text').attr('font-size', '12px').attr('fill', SLATE_700);

    const bisect = d3.bisector((d: any) => d.Date).left;

    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointerEvents', 'all')
      .on('mouseover', () => tooltip.style('display', null))
      .on('mouseout', () => tooltip.style('display', 'none'))
      .on('mousemove', (event) => {
        const mouseX = d3.pointer(event)[0];
        const date = x.invert(mouseX);
        const closest: Record<string, number> = {};

        series.forEach(({ key, values }) => {
          const i = bisect(values, date, 0, values.length - 1);
          const d0 = values[Math.max(0, i - 1)];
          const d1 = values[Math.min(values.length - 1, i)];
          const d = Math.abs(date.getTime() - d0.Date.getTime()) > Math.abs(d1.Date.getTime() - date.getTime()) ? d1 : d0;
          closest[key] = d.originalValue;
        });

        const lines = Object.entries(closest).map(([k, v]) => `${k}: ${v.toFixed(2)}`);
        const tspans = tooltip.select('text')
          .selectAll('tspan')
          .data(lines)
          .join('tspan')
          .attr('x', 5)
          .attr('y', (_d, i) => 20 + i * 15)
          .text(d => d);

        const bbox = (tooltip.select('text').node() as SVGTextElement)?.getBBox();
        if (bbox) {
          tooltip.select('rect').attr('width', bbox.width + 10).attr('height', bbox.height + 10);
        }
        tooltip.attr('transform', `translate(${Math.min(mouseX + 10, width - 150)}, 30)`);
      });
  }, [timeSeriesData, stateName]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-sm text-gray-600 mb-4 text-center">
        Historical trends of air quality indicators (sample data)
      </div>
      <svg ref={svgRef} />
      <div className="mt-4 text-xs text-gray-500 text-center">
        Hover over the chart to see detailed values
      </div>
    </div>
  );
}

/* =====================  MODAL  ===================== */
export default function ModalAirQuality({ onClose }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const gMapRef = useRef<SVGGElement | null>(null);

  const [data, setData] = useState<{ byState: ByState; json?: string; tags?: string[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [geminiLoading, setGeminiLoading] = useState(false);

  const [statesList, setStatesList] = useState<{ fips: string; name: string }[]>([]);
  const [selectedFips, setSelectedFips] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Catalog>({ Activity: [], Vulnerability: [], Lifestyle: [] });
  const [showChart, setShowChart] = useState(true);

  const buckets = useMemo(() => bucketize(selectedTags), [selectedTags]);

type GeminiScores = {
  outdoor_suitability: number;
  health_risk: number;
  confidence: number;
};

type GeminiModel = {
  state: { name: string; fips: string; country: string; date: string };
  dominant_pollutant: 'NO2' | 'O3' | 'PM' | 'CH2O' | 'Unknown';
  risk_level_label: 'Good' | 'Moderate' | 'USG' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous' | 'Unknown';
  scores: GeminiScores;
  pollutants: { NO2: number|null; O3: number|null; PM: number|null; CH2O: number|null; AI: number|null };
  tailored_notes: string[];
  recommendations: string[];
  indoor_alternatives: string[];
  disclaimer: string;
};

const [geminiRaw, setGeminiRaw] = useState<any|null>(null);      // respuesta cruda del endpoint
const [geminiModel, setGeminiModel] = useState<GeminiModel|null>(null); // JSON parseado (si vino bien)


  const selectedStateData = useMemo(() => {
    if (!data?.byState || !selectedFips) return null;
    return data.byState[selectedFips];
  }, [data?.byState, selectedFips]);

  const selectedStateName = useMemo(() => {
    if (!selectedStateData) return '';
    return selectedStateData.name || statesList.find(s => s.fips === selectedFips)?.name || 'Unknown State';
  }, [selectedStateData, selectedFips, statesList]);

  // Función para llamar a Gemini
  const callGemini = async () => {
  if (!selectedFips || !selectedStateData) {
    console.warn('Select a state first.');
    return;
  }

  const body = {
    fips: selectedFips,
    state_name: selectedStateName,
    country: 'United States',
    date: selectedDate,
    user_text: `Consider my tags and preferences.`,
    tags: selectedTags,
    pollutants: {
      NO2: selectedStateData.NO2 ?? null,
      O3: selectedStateData.O3 ?? null,
      PM: selectedStateData.PM ?? null,
      CH2O: selectedStateData.CH2O ?? null,
      AI: selectedStateData.ai ?? null,
    },
  };

  console.log('🚀 Sending to Gemini:', body);

  setGeminiLoading(true);
  setGeminiModel(null);
  setGeminiRaw(null);

  try {
    const res = await fetch(`${API_BASE}/state-recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const out = await res.json();
    console.log('✅ Gemini response:', out);

    setGeminiRaw(out);
    if (out?.model && typeof out.model === 'object') {
      setGeminiModel(out.model as GeminiModel);
    }
  } catch (e) {
    console.error('Gemini fetch error:', e);
  } finally {
    setGeminiLoading(false);
  }
};


  // Load states & default user tags
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/states`);
        const d = await res.json();
        if (!res.ok || d?.error) { setErr(d?.error || `HTTP ${res.status}`); setData(null); return; }
        setErr(null);
        setData(d);

        const initial = normalizeTagList(d?.tags);
        if (initial.length) setSelectedTags(initial);
      } catch (e: any) { setErr(e?.message || 'Error'); setData(null); }
    })();
  }, []);

  // Load catalog
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/tags-catalog`);
        const j = await r.json();
        if (!r.ok || j?.error) return;
        setCatalog({
          Activity: Array.isArray(j.Activity) ? j.Activity : [],
          Vulnerability: Array.isArray(j.Vulnerability) ? j.Vulnerability : [],
          Lifestyle: Array.isArray(j.Lifestyle) ? j.Lifestyle : [],
        });
      } catch {}
    })();
  }, []);

  /* ------------------- MAP RENDER ------------------- */
  useEffect(() => {
    if (!wrapRef.current || !data?.byState) return;
    const mount = wrapRef.current;
    mount.innerHTML = '';

    const root = d3.select(mount)
      .style('display', 'grid')
      .style('gridTemplateColumns', '1fr')
      .style('gap', '16px')
      .style('width', '100%');

    const mapBox = root.append('div')
      .style('width', '100%')
      .style('height', 'clamp(300px, 55vh, 640px)')
      .style('background', 'transparent')
      .style('position', 'relative')
      .node() as HTMLDivElement;

    const legendBox = root.append('div')
      .style('width', '100%')
      .style('display', 'flex')
      .style('justifyContent', 'center')
      .style('alignItems', 'center')
      .node() as HTMLDivElement;

    const w = mapBox.clientWidth;
    const h = mapBox.clientHeight;

    const svg = d3.select(mapBox).append('svg')
      .attr('viewBox', `0 0 ${w} ${h}`)
      .attr('width', '100%').attr('height', '100%')
      .style('background', 'transparent');
    svgRef.current = svg.node();

    const gMap = svg.append('g');
    gMapRef.current = gMap.node();

    const aiVals = Object.values(data.byState).map((s) => s.ai);
    const min = d3.min(aiVals) ?? 0;
    const max = d3.max(aiVals) ?? 200;
    const maxSafe = Math.max(max, min + 1);
    const colorSequential = makePurpleScale(min, maxSafe);

    const projection = d3.geoAlbersUsa().translate([w / 2, h / 2]).scale(Math.min(w, h) * 1.2);
    const path = d3.geoPath(projection);

    (async () => {
      const topo = await (await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')).json();
      const statesFC: any = feature(topo, topo.objects.states);

      const list = statesFC.features
        .map((f: any) => {
          const fips = String(f.id).padStart(2, '0');
          const name = data.byState[fips]?.name || f.properties?.name || `FIPS ${fips}`;
          return { fips, name };
        })
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      setStatesList(list);
      if (!selectedFips && list.length) setSelectedFips(list[0].fips);

      gMap.selectAll('path')
        .data(statesFC.features)
        .join('path')
        .attr('d', path as any)
        .attr('fill', (d: any) => {
          const fips = String(d.id).padStart(2, '0');
          const s = data.byState[fips];
          if (!s) return '#F3F4F6';
          const t = (s.ai - min) / (maxSafe - min);
          return colorSequential(Math.max(0, Math.min(1, t)));
        })
        .attr('stroke', PURPLE_LIGHT)
        .attr('stroke-width', 1)
        .style('transition', 'all 0.3s ease')
        .style('cursor', 'pointer')
        .on('mouseenter', function() {
          d3.select(this).attr('stroke', PURPLE_PRIMARY).attr('stroke-width', 2);
        })
        .on('mouseleave', function() {
          d3.select(this).attr('stroke', PURPLE_LIGHT).attr('stroke-width', 1);
        });

      /* ---------- ALWAYS HORIZONTAL LEGEND ---------- */
      const Lw = Math.min(520, Math.max(260, Math.round(w * 0.75)));
      const Lh = 22;

      const legendBox = root.append('div')
  .style('width', '100%')
  .style('display', 'flex')
  .style('justifyContent', 'center')
  .style('alignItems', 'center')
  // ⬇️ separa la barra del mapa y evita solapamiento
  .style('marginTop', '34px')
  .style('paddingBottom', '80px')
  .node() as HTMLDivElement;

      const legendSvg = d3.select(legendBox)
        .append('svg')
        .attr('width', Lw + 60)
        .attr('height', Lh + 42);

      const defs = legendSvg.append('defs');
      const gradientId = 'aqi-modal-horizontal';
      const linear = defs.append('linearGradient')
        .attr('id', gradientId)
        .attr('x1', '0').attr('y1', '0').attr('x2', '1').attr('y2', '0');

      const stops = d3.range(0, 1.0001, 0.04).map(t => ({ offset: `${t * 100}%`, color: colorSequential(t) }));
      linear.selectAll('stop')
        .data(stops)
        .join('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color);

      const gL = legendSvg.append('g').attr('transform', `translate(30, 16)`);

      gL.append('text')
        .attr('x', Lw / 2)
        .attr('y', -2)
        .attr('text-anchor', 'middle')
        .style('fill', SLATE_700)
        .style('fontSize', '18px')
        .style('fontWeight', '600')
        .text('Air Quality Index');

      gL.append('rect')
        .attr('y', 4)
        .attr('width', Lw)
        .attr('height', Lh)
        .attr('fill', `url(#${gradientId})`)
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('stroke', PURPLE_LIGHT)
        .attr('stroke-width', 1);

const scale = d3.scaleLinear()
  .domain([0, 100])
  .range([0, Lw]);

gL.append('g')
  .attr('transform', `translate(0, ${Lh + 12})`)
  .call(
    d3.axisBottom(scale)
      .tickValues([0, 20, 40, 60, 80, 100]) // marcas claras
      .tickSize(4)
      .tickPadding(6) as any
  )
  .call(g => g.selectAll('text').style('fill', SLATE_600).style('fontSize', '12px'))
  .call(g => g.selectAll('line,path').style('stroke', PURPLE_LIGHT));

    })();

    return () => { mount.innerHTML = ''; };
  }, [data?.byState]);

  // interpolateZoom
  let currentTransform: [number, number, number] = [0, 0, 1];
  function transformTo([x, y, r]: [number, number, number]) {
    const vb = svgRef.current?.viewBox.baseVal;
    if (!vb) return '';
    return `
      translate(${vb.width / 2}, ${vb.height / 2})
      scale(${vb.height / r})
      translate(${-x}, ${-y})
    `;
  }

  function animateZoom(to: [number, number, number]) {
    if (!gMapRef.current) return;
    const i = d3.interpolateZoom(currentTransform, to);
    // @ts-ignore
    d3.select(gMapRef.current)
      .transition()
      .delay(120)
      .duration(i.duration)
      .attrTween('transform', () => (t: number) => {
        const k = i(t) as [number, number, number];
        currentTransform = k;
        return transformTo(k);
      });
  }

  useEffect(() => {
    if (!svgRef.current || !gMapRef.current || !data?.byState || !selectedFips) return;
    (async () => {
      const vb = svgRef.current!.viewBox.baseVal;
      const w = vb.width, h = vb.height;

      const topo = await (await fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')).json();
      const statesFC: any = feature(topo, topo.objects.states);

      const projection = d3.geoAlbersUsa().translate([w / 2, h / 2]).scale(Math.min(w, h) * 1.2);
      const path = d3.geoPath(projection);

      const target = statesFC.features.find((f: any) => String(f.id).padStart(2, '0') === selectedFips);
      if (!target) return;

      const b = path.bounds(target);
      const cx = (b[0][0] + b[1][0]) / 2;
      const cy = (b[0][1] + b[1][1]) / 2;
      const dx = b[1][0] - b[0][0];
      const dy = b[1][1] - b[0][1];
      const r = Math.max(dx, dy) / 2 + 24;

      currentTransform = [w / 2, h / 2, h];
      animateZoom([cx, cy, Math.max(r, 120)]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFips]);

  /* ------------------- TAGS UI ------------------- */
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };
  const isSelected = (tag: string) => selectedTags.includes(tag);

  const Tag = ({ t }: { t: string }) => (
    <button
      type="button"
      onClick={() => toggleTag(t)}
      className={`text-xs px-3 py-2 rounded-full border transition-all duration-200 hover:scale-105 transform active:scale-95 ${
        isSelected(t) 
          ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
          : 'bg-white text-purple-600 border-purple-300 hover:border-purple-500 hover:bg-purple-50'
      }`}
      aria-pressed={isSelected(t)}
    >
      {t}
    </button>
  );

  const savePreferences = () => {
    console.log('Selected tags:', selectedTags);
  };

  return (
    <div
      className="fixed inset-0 z-50 animate-in fade-in duration-300"
      style={{ background: 'rgba(15, 23, 42, 0.4)', overflowY: 'auto', padding: '20px' }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative mx-auto w-[96vw] max-w-6xl rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-5 duration-500"
        style={{ 
          background: 'linear-gradient(to bottom right, rgb(250, 245, 255), rgb(237, 233, 254))', 
          borderColor: PURPLE_LIGHT, 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column' 
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 animate-in slide-in-from-top-3 duration-700 delay-100"
          style={{ 
            borderBottom: `1px solid ${PURPLE_LIGHT}`, 
            position: 'sticky', 
            top: 0, 
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 1,
            borderRadius: '16px 16px 0 0'
          }}
        >
          <div className="font-semibold text-xl text-slate-900">
            Search Air Quality Recommendations
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 hover:scale-105 transform active:scale-95 bg-white text-purple-600 border-purple-300 hover:border-purple-500 hover:bg-purple-50"
            aria-label="Close"
          >
            ✕ Close
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Query row */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-6 animate-in slide-in-from-left-5 duration-700 delay-200">
            <div className="font-semibold mb-4 text-xl text-slate-900">
              Select Location and Date
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-2 text-slate-700">State</label>
                <select
                  value={selectedFips}
                  onChange={(e) => setSelectedFips(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg border text-sm transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 border-slate-300 text-slate-700 bg-white hover:border-slate-400"
                >
                  {statesList.map((s) => <option key={s.fips} value={s.fips}>{s.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-2 text-slate-700">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-3 rounded-lg border text-sm transition-all duration-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 border-slate-300 text-slate-700 bg-white hover:border-slate-400"
                />
              </div>

              <div className="flex items-center sm:items-end">
                <div className="text-xs leading-relaxed text-slate-600">
                  Select a state to zoom; the map below will focus smoothly on it.
                </div>
              </div>
            </div>
          </div>

          {/* Map + (always horizontal) legend */}
          <div className="grid gap-4 md:grid-cols-[1fr] animate-in slide-in-from-right-5 duration-700 delay-300">
 <div
   ref={wrapRef}
   className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 overflow-visible pb-3"
 />
 <div></div>
          </div>

          {/* Chart section with toggle */}
          {selectedStateData && (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-6 animate-in slide-in-from-left-5 duration-700 delay-400">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-xl text-slate-900">
                  Air Quality Trends for {selectedStateName}
                </div>
                <button
                  onClick={() => setShowChart(v => !v)}
                  className="px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 hover:scale-105 transform active:scale-95 bg-white text-purple-600 border-purple-300 hover:border-purple-500 hover:bg-purple-50"
                >
                  {showChart ? 'Hide chart' : 'Show chart'}
                </button>
              </div>

              {showChart && (
                <div className="animate-in slide-in-from-bottom-3 duration-500">
                  <AirQualityTimeSeriesChart
                    stateData={selectedStateData}
                    stateName={selectedStateName}
                  />
                </div>
              )}
            </div>
          )}

          {/* Tags selection */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-6 space-y-6 animate-in slide-in-from-bottom-5 duration-700 delay-500">
            <div className="text-lg font-semibold text-slate-900">Your Preferences</div>

            {(['Activity','Vulnerability','Lifestyle'] as const).map((cat, index) => (
              <div key={cat} className="space-y-3 animate-in slide-in-from-left-3 duration-500">
                <div className="text-sm font-semibold text-slate-700">{cat}</div>
                <div className="flex flex-wrap gap-2">
                  {catalog[cat]?.length ? (
                    catalog[cat].map((t) => <Tag key={`${cat}-${t}`} t={t} />)
                  ) : (
                    <span className="text-xs text-slate-500 opacity-80">No options available</span>
                  )}
                </div>

                {buckets[cat].length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="text-xs text-slate-600 font-medium mr-2">Selected:</div>
                    {buckets[cat].map((t) => (
                      <button
                        key={`sel-${cat}-${t}`}
                        onClick={() => toggleTag(t)}
                        className="text-xs px-3 py-1 rounded-full transition-all duration-200 hover:scale-105 transform active:scale-95 bg-purple-600 text-white border border-purple-600 hover:bg-purple-700"
                        title="Remove"
                      >
                        {t} ✕
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Bottom action buttons */}
            <div className="pt-4 border-t border-slate-200 flex gap-3 flex-wrap">
              <button
                onClick={savePreferences}
                className="px-6 py-3 rounded-lg border text-sm font-medium transition-all duration-200 hover:scale-105 transform active:scale-95 bg-purple-600 text-white border-purple-600 hover:bg-purple-700 shadow-md"
              >
                Save Preferences
              </button>
              <button
                onClick={callGemini}
                disabled={geminiLoading}
                className="px-6 py-3 rounded-lg border text-sm font-medium transition-all duration-200 hover:scale-105 transform active:scale-95 bg-white text-purple-600 border-purple-300 hover:border-purple-500 hover:bg-purple-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {geminiLoading ? 'Asking Gemini...' : 'Ask Gemini'}
              </button>
            </div>
            {/* --- Gemini Recommendation Card --- */}
{(geminiLoading || geminiModel || geminiRaw) && (
  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-slate-200 p-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="text-lg font-semibold text-slate-900">
        Gemini Recommendation
      </div>

      {/* Label de Riesgo */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Risk:</span>
        <RiskBadge label={geminiModel?.risk_level_label || 'Unknown'} />
      </div>
    </div>

    {/* Subheader con contaminante dominante */}
    <div className="text-sm text-slate-600">
      <span className="font-medium text-slate-700">Dominant pollutant:</span>{' '}
      <span className="inline-flex items-center px-2 py-0.5 rounded border text-xs bg-purple-50 text-purple-700 border-purple-200">
        {geminiModel?.dominant_pollutant || 'Unknown'}
      </span>
    </div>

    {/* Puntajes rápidos */}
    {geminiModel?.scores && (
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center px-2 py-1 rounded border bg-slate-50 text-slate-700 border-slate-200">
          Outdoor suitability: <b className="ml-1">{geminiModel.scores.outdoor_suitability}</b>/100
        </span>
        <span className="inline-flex items-center px-2 py-1 rounded border bg-slate-50 text-slate-700 border-slate-200">
          Health risk: <b className="ml-1">{geminiModel.scores.health_risk}</b>/100
        </span>
        <span className="inline-flex items-center px-2 py-1 rounded border bg-slate-50 text-slate-700 border-slate-200">
          Confidence: <b className="ml-1">{geminiModel.scores.confidence}</b>/100
        </span>
      </div>
    )}

    {/* Recomendaciones */}
    {geminiModel?.recommendations?.length ? (
      <div className="space-y-1">
        <div className="text-sm font-medium text-slate-800">Recommendations</div>
        <ul className="list-disc pl-5 text-sm text-slate-700">
          {geminiModel.recommendations.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </div>
    ) : null}

    {/* Notas personalizadas */}
    {geminiModel?.tailored_notes?.length ? (
      <div className="space-y-1">
        <div className="text-sm font-medium text-slate-800">Tailored notes</div>
        <ul className="list-disc pl-5 text-sm text-slate-700">
          {geminiModel.tailored_notes.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </div>
    ) : null}

    {/* Alternativas indoor si aplica */}
    {geminiModel?.indoor_alternatives?.length ? (
      <div className="space-y-1">
        <div className="text-sm font-medium text-slate-800">Indoor alternatives</div>
        <ul className="list-disc pl-5 text-sm text-slate-700">
          {geminiModel.indoor_alternatives.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      </div>
    ) : null}

    {/* Disclaimer */}
    {geminiModel?.disclaimer ? (
      <div className="text-xs text-slate-500 border-t pt-3">
        {geminiModel.disclaimer}
      </div>
    ) : null}

    {/* Fallback si no se parseó JSON (te deja ver lo crudo) */}
    {!geminiModel && !geminiLoading && geminiRaw?.summary && (
      <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-200">
        <div className="font-medium mb-1">Raw model text:</div>
        <pre className="whitespace-pre-wrap">{geminiRaw.summary}</pre>
      </div>
    )}
  </div>
)}
          </div>

          <div className="text-xs text-center p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 animate-in slide-in-from-bottom-3 duration-700 delay-700">
            <span className="font-medium">ℹ️ Notice:</span> The visualization uses a continuous gradient (light purple → purple → dark purple). Higher values indicate higher potential health risk from air pollutants.
          </div>
        </div>
      </div>
    </div>
  );
}