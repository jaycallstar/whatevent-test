// กราฟที่สร้างเองจาก <div> และ <svg> (ไม่ต้องติดตั้งไลบรารีกราฟ)
import type { ChartItem } from '@/lib/analytics';

// ---------- กราฟแท่งแนวตั้ง ----------
export function BarChart({ data }: { data: ChartItem[] }) {
  let max = 1;
  for (const d of data) {
    if (d.value > max) max = d.value;
  }
  return (
    <div className="bars">
      {data.map((d, i) => (
        <div key={d.label + i} className="bar-col">
          <span className="bar-value">{d.value}</span>
          <div className="bar-track">
            <div className="bar" style={{ height: (d.value / max) * 100 + '%' }} />
          </div>
          <span className="bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ---------- กราฟเส้นแบบมีพื้นที่สี (วาดด้วย SVG) ----------
// id ต้องไม่ซ้ำกันในหน้าเดียวกัน (ใช้ตั้งชื่อ gradient)
export function LineChart({ data, id }: { data: ChartItem[]; id: string }) {
  if (data.length === 0) return null;
  const w = 640, h = 220, padX = 24, padTop = 18, padBottom = 30;
  let max = 1;
  for (const d of data) {
    if (d.value > max) max = d.value;
  }
  const stepX = data.length > 1 ? (w - padX * 2) / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: padX + i * stepX,
    y: padTop + (1 - d.value / max) * (h - padTop - padBottom),
    label: d.label, value: d.value,
  }));
  const linePoints = points.map((p) => p.x + ',' + p.y).join(' ');
  const baseY = h - padBottom;
  const areaPath = 'M' + points[0].x + ',' + baseY + ' L' + linePoints.replace(/ /g, ' L') + ' L' + points[points.length - 1].x + ',' + baseY + ' Z';
  const labelEvery = Math.ceil(data.length / 7); // แสดงป้ายวันที่ไม่แน่นเกินไป

  return (
    <svg viewBox={'0 0 ' + w + ' ' + h} className="line-chart" role="img">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map((i) => {
        const y = padTop + (i / 3) * (h - padTop - padBottom);
        return <line key={i} x1={padX} x2={w - padX} y1={y} y2={y} className="grid-line" />;
      })}
      <path d={areaPath} fill={'url(#' + id + ')'} />
      <polyline points={linePoints} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2.5"><title>{p.label + ': ' + p.value}</title></circle>
          {i % labelEvery === 0 && <text x={p.x} y={h - 8} textAnchor="middle" className="axis-text">{p.label}</text>}
        </g>
      ))}
      <text x={padX} y={padTop - 4} className="axis-text">{max}</text>
    </svg>
  );
}

// ---------- แท่งแนวนอน (แสดงเปอร์เซ็นต์ของทั้งหมด) ----------
export function HBar({ label, value, total, unit }: { label: string; value: number; total: number; unit: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="hbar">
      <div className="row between small">
        <span>{label}</span>
        <span className="muted">{value} {unit} · {pct}%</span>
      </div>
      <div className="track"><div className="fill" style={{ width: pct + '%' }} /></div>
    </div>
  );
}

// ---------- วงกลมแสดงเปอร์เซ็นต์ ----------
export function Donut({ percent, text }: { percent: number; text: string }) {
  return (
    <div className="donut" style={{ ['--p' as string]: percent }}>
      <div><b>{percent}%</b><span className="small muted">{text}</span></div>
    </div>
  );
}

// ---------- Funnel: ลงทะเบียน -> เช็คอิน -> ตอบแบบสอบถาม ----------
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const first = steps[0] ? steps[0].value : 0;
  return (
    <div className="funnel">
      {steps.map((s, i) => {
        const pct = first > 0 ? Math.round((s.value / first) * 100) : 0;
        return (
          <div key={s.label} className="funnel-step" style={{ width: Math.max(pct, 18) + '%', opacity: 1 - i * 0.18 }}>
            <b>{s.value}</b> <span>{s.label}</span> <small>{pct}%</small>
          </div>
        );
      })}
    </div>
  );
}

// ---------- เส้นเล็ก ๆ ในการ์ด KPI (sparkline) ----------
export function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 96, h = 32;
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1; // ใช้ช่วงต่ำสุด-สูงสุด เพื่อให้เห็นการเปลี่ยนแปลงชัด
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => (i * step).toFixed(1) + ',' + (h - 3 - ((v - min) / range) * (h - 6)).toFixed(1));
  return (
    <svg className="spark" viewBox={'0 0 ' + w + ' ' + h} width={w} height={h} aria-hidden>
      <polyline points={'0,' + h + ' ' + pts.join(' ') + ' ' + w + ',' + h} fill="var(--accent-soft)" stroke="none" />
      <polyline points={pts.join(' ')} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
