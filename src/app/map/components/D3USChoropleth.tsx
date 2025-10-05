'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { feature } from 'topojson-client';

type ByState = Record<string, { name?: string; NO2?: number|null; O3?: number|null; PM?: number|null; CH2O?: number|null; ai: number }>;
type Props = { onClose: () => void };

const API_BASE = '/map/api';
const BLUE = '#6ec9f4';
const WHITE = '#FFFFFF';

function makeGreenOrangePurpleScale(min: number, max: number) {
  const domain = [min, (min + max) / 2, max];
  const range = ['#22C55E', '#F59E0B', '#a01dec'];
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
    // sample data generator (replace with your API later)
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
      .range(['#22C55E', '#F59E0B', '#a01dec', '#6ec9f4', '#EF4444']);

    const svg = svgSel
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('maxWidth', '100%')
      .style('height', 'auto')
      .style('background', WHITE)
      .style('borderRadius', '12px')
      .style('border', `2px solid ${BLUE}`);

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('fontSize', '18px')
      .style('fontWeight', 'bold')
      .style('fill', BLUE)
      .text(`Air Quality Trends — ${stateName}`);

    svg.append('g')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(width / 100).tickSizeOuter(0) as any)
      .call(g => g.selectAll('text').style('fill', BLUE).style('fontSize', '12px'))
      .call(g => g.selectAll('line,path').style('stroke', BLUE));

    svg.append('g')
      .attr('transform', `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y) as any)
      .call(g => g.selectAll('text').style('fill', BLUE).style('fontSize', '12px'))
      .call(g => g.selectAll('line,path').style('stroke', BLUE));

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 15)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('fill', BLUE)
      .style('fontSize', '14px')
      .text('Concentration');

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', height - 5)
      .attr('text-anchor', 'middle')
      .style('fill', BLUE)
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
    tooltip.append('rect').attr('fill', WHITE).attr('stroke', BLUE).attr('rx', 4).attr('ry', 4);
    tooltip.append('text').attr('font-size', '12px').attr('fill', BLUE);

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

  const [statesList, setStatesList] = useState<{ fips: string; name: string }[]>([]);
  const [selectedFips, setSelectedFips] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Catalog>({ Activity: [], Vulnerability: [], Lifestyle: [] });

  // NEW: chart toggle
  const [showChart, setShowChart] = useState(true);

  const buckets = useMemo(() => bucketize(selectedTags), [selectedTags]);

  const selectedStateData = useMemo(() => {
    if (!data?.byState || !selectedFips) return null;
    return data.byState[selectedFips];
  }, [data?.byState, selectedFips]);

  const selectedStateName = useMemo(() => {
    if (!selectedStateData) return '';
    return selectedStateData.name || statesList.find(s => s.fips === selectedFips)?.name || 'Unknown State';
  }, [selectedStateData, selectedFips, statesList]);

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
    const colorSequential = makeGreenOrangePurpleScale(min, maxSafe);

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
          if (!s) return `${WHITE}26`;
          const t = (s.ai - min) / (maxSafe - min);
          return colorSequential(Math.max(0, Math.min(1, t)));
        })
        .attr('stroke', `${WHITE}8C`)
        .attr('stroke-width', 0.8);

      /* ---------- ALWAYS HORIZONTAL LEGEND ---------- */
      const Lw = Math.min(520, Math.max(260, Math.round(w * 0.75)));
      const Lh = 22;

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

      const gL = legendSvg.append('g').attr('transform', `translate(30, 10)`);
const stateName =
  selectedStateData?.name ||
  statesList.find(s => s.fips === selectedFips)?.name ||
  'Unknown State';

async function callGemini() {
  if (!selectedFips || !selectedStateData) {
    console.warn('Select a state first.');
    return;
  }

  // Objeto que pides: estado, contaminantes y tags
  const payload = {
    state: { fips: selectedFips, name: stateName },
    date: selectedDate,
    pollutants: {
      NO2:  selectedStateData.NO2  ?? null,
      O3:   selectedStateData.O3   ?? null,
      PM:   selectedStateData.PM   ?? null,
      CH2O: selectedStateData.CH2O ?? null,
      AI:   selectedStateData.ai   ?? null,
    },
    tags: selectedTags, // array de strings ya normalizado
  };

  // 👀 Imprime el objeto completo
  console.log('Gemini payload →', payload);

  // (Opcional) Llamada a tu API para consultar Gemini
  try {
    const res = await fetch(`${API_BASE}/state-recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fips: selectedFips,
        user_text: `Consider my tags: ${selectedTags.join(', ')}. Date: ${selectedDate}`,
      }),
    });
    const out = await res.json();
    console.log('Gemini response →', out);
  } catch (e) {
    console.error('Gemini fetch error:', e);
  }
}
      gL.append('text')
        .attr('x', Lw / 2)
        .attr('y', -2)
        .attr('text-anchor', 'middle')
        .style('fill', WHITE)
        .style('fontSize', '12px')
        .style('fontWeight', '600')
        .text('Air Quality Index');

      gL.append('rect')
        .attr('width', Lw)
        .attr('height', Lh)
        .attr('fill', `url(#${gradientId})`)
        .attr('rx', 10)
        .attr('ry', 10)
        .attr('stroke', `${WHITE}8C`)
        .attr('stroke-width', 1.25);

      const scale = d3.scaleLinear().domain([min, maxSafe]).range([0, Lw]);
      gL.append('g')
        .attr('transform', `translate(0, ${Lh + 8})`)
        .call(d3.axisBottom(scale).ticks(6).tickSize(4).tickPadding(6) as any)
        .call(g => g.selectAll('text').style('fill', WHITE).style('fontSize', '11px'))
        .call(g => g.selectAll('line,path').style('stroke', `${WHITE}8C`));
      /* ---------- end horizontal legend ---------- */
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
      className="text-xs px-3 py-1.5 rounded-full border"
      style={{
        background: isSelected(t) ? BLUE : WHITE,
        color: isSelected(t) ? WHITE : BLUE,
        borderColor: BLUE,
        transition: 'all .15s ease',
      }}
      aria-pressed={isSelected(t)}
    >
      {t}
    </button>
  );

  const savePreferences = () => {
    // TODO: replace with your API call
    console.log('Selected tags:', selectedTags);
    // Example:
    // await fetch('/api/save-preferences', { method:'POST', body: JSON.stringify({ tags: selectedTags }) })
  };

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: 'rgba(0,0,0,0.25)', overflowY: 'auto', padding: '20px' }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative mx-auto w-[96vw] max-w-6xl rounded-2xl border"
        style={{ background: '#FFFFFF', borderColor: '#FFFFFF', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${BLUE}`, position: 'sticky', top: 0, background: WHITE, zIndex: 1 }}
        >
          <div className="font-semibold" style={{ color: BLUE }}>Search recommendations by state</div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-full border text-sm sm:text-base"
            style={{ borderColor: BLUE, color: BLUE, background: WHITE }}
            aria-label="Close"
          >
            Close
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="p-4 space-y-4" style={{ background: BLUE, overflowY: 'auto' }}>
          {/* Query row */}
          <div className="rounded-2xl p-4 sm:p-6" style={{ background: WHITE, border: `1px solid ${WHITE}` }}>
            <div className="font-medium mb-4 text-lg sm:text-xl" style={{ color: BLUE }}>
              I want to know the air quality in:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-sm sm:text-base font-medium mb-2" style={{ color: BLUE }}>State</label>
                <select
                  value={selectedFips}
                  onChange={(e) => setSelectedFips(e.target.value)}
                  className="w-full px-3 py-2 sm:py-3 rounded-lg border text-sm sm:text-base"
                  style={{ borderColor: BLUE, color: BLUE, background: WHITE }}
                >
                  {statesList.map((s) => <option key={s.fips} value={s.fips}>{s.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm sm:text-base font-medium mb-2" style={{ color: BLUE }}>Day</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 sm:py-3 rounded-lg border text-sm sm:text-base"
                  style={{ borderColor: BLUE, color: BLUE, background: WHITE }}
                />
              </div>

              <div className="flex items-center sm:items-end">
                <div className="text-xs sm:text-sm leading-relaxed" style={{ color: BLUE }}>
                  Select a state to zoom; the map below will focus smoothly on it.
                </div>
              </div>
            </div>
          </div>

          {/* Map + (always horizontal) legend */}
          <div className="grid gap-4 md:grid-cols-[1fr]">
            <div ref={wrapRef} />
          </div>

          {/* Chart section with toggle */}
          {selectedStateData && (
            <div className="rounded-2xl p-4 sm:p-6" style={{ background: WHITE, border: `1px solid ${WHITE}` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="font-medium text-lg sm:text-xl" style={{ color: BLUE }}>
                  Air Quality Trends for {selectedStateName}
                </div>
                <button
                  onClick={() => setShowChart(v => !v)}
                  className="px-3 py-1.5 rounded-full border text-xs sm:text-sm"
                  style={{ borderColor: BLUE, color: BLUE, background: WHITE }}
                >
                  {showChart ? 'Hide chart' : 'Show chart'}
                </button>
              </div>

              {showChart && (
                <AirQualityTimeSeriesChart
                  stateData={selectedStateData}
                  stateName={selectedStateName}
                />
              )}
            </div>
          )}

          {/* Tags selection */}
          <div className="rounded-2xl p-4 sm:p-6 space-y-6" style={{ background: WHITE, border: `1px solid ${WHITE}` }}>
            <div className="text-base font-semibold" style={{ color: BLUE }}>Your preferences</div>

            {(['Activity','Vulnerability','Lifestyle'] as const).map((cat) => (
              <div key={cat} className="space-y-2">
                <div className="text-sm font-semibold" style={{ color: BLUE }}>{cat}</div>
                <div className="flex flex-wrap gap-2">
                  {catalog[cat]?.length ? (
                    catalog[cat].map((t) => <Tag key={`${cat}-${t}`} t={t} />)
                  ) : (
                    <span className="text-xs" style={{ color: BLUE, opacity: .8 }}>No options</span>
                  )}
                </div>

                {buckets[cat].length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {buckets[cat].map((t) => (
                      <button
                        key={`sel-${cat}-${t}`}
                        onClick={() => toggleTag(t)}
                        className="text-[11px] px-2.5 py-1 rounded-full"
                        style={{ background: BLUE, color: WHITE, border: `1px solid ${BLUE}` }}
                        title="Remove"
                      >
                        {t} ✕
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Bottom action button */}
            <div className="pt-2">
              <button
                onClick={savePreferences}
                className="px-4 py-2 rounded-full border text-sm sm:text-base"
                style={{ borderColor: BLUE, color: BLUE, background: WHITE }}
              >
                Save preferences
              </button>
              {/* <button
  onClick={callGemini}
  className="px-4 py-2 rounded-full border text-sm sm:text-base"
  style={{ borderColor: BLUE, color: BLUE, background: WHITE }}
>
  Ask Gemini
</button> */}

            </div>
          </div>

          <div className="text-xs sm:text-sm text-center p-3 sm:p-4 rounded-lg"
               style={{ background: WHITE, color: BLUE, border: `1px solid ${WHITE}` }}>
            The visualization uses a continuous gradient (green → orange → purple). Higher values indicate higher
            potential health risk from air pollutants.
          </div>
        </div>
      </div>
    </div>
  );
}
