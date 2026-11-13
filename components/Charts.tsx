// กราฟที่สร้างเองจาก <div> และ <svg> (ไม่ต้องติดตั้งไลบรารีกราฟ)
import type { CSSProperties } from 'react';
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

  const w = 640;
  const h = 220;
  const padX = 24;
  const padTop = 18;
  const padBottom = 30;

  // ค่าสูงสุด (ใช้กำหนดความสูงของกราฟ)
  let max = 1;
  for (const d of data) {
    if (d.value > max) max = d.value;
  }

  // ระยะห่างแนวนอนของแต่ละจุด
  let stepX = 0;
  if (data.length > 1) stepX = (w - padX * 2) / (data.length - 1);

  // หาตำแหน่ง x, y ของแต่ละจุดบนกราฟ
  const points: { x: number; y: number; label: string; value: number }[] = [];
  for (let i = 0; i < data.length; i++) {
    points.push({
      x: padX + i * stepX,
      y: padTop + (1 - data[i].value / max) * (h - padTop - padBottom),
      label: data[i].label,
      value: data[i].value,
    });
  }

  // สร้างเส้นกราฟ (polyline) และพื้นที่สีใต้เส้น (path)
  const baseY = h - padBottom;
  const lastX = points[points.length - 1].x;
  let linePoints = '';
  let areaPath = 'M' + points[0].x + ',' + baseY;
  for (let i = 0; i < points.length; i++) {
    if (i > 0) linePoints += ' ';
    linePoints += points[i].x + ',' + points[i].y;
    areaPath += ' L' + points[i].x + ',' + points[i].y;
  }
  areaPath += ' L' + lastX + ',' + baseY + ' Z';

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
  let pct = 0;
  if (total > 0) pct = Math.round((value / total) * 100);
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
  // --p เป็นตัวแปร CSS ที่ใช้ระบายสีวงกลมตามเปอร์เซ็นต์
  const style = { '--p': percent } as CSSProperties;
  return (
    <div className="donut" style={style}>
      <div><b>{percent}%</b><span className="small muted">{text}</span></div>
    </div>
  );
}

// ---------- Funnel: ลงทะเบียน -> เช็คอิน -> ตอบแบบสอบถาม ----------
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  let first = 0;
  if (steps[0]) first = steps[0].value;
  return (
    <div className="funnel">
      {steps.map((s, i) => {
        let pct = 0;
        if (first > 0) pct = Math.round((s.value / first) * 100);
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
  const w = 96;
  const h = 32;

  // หาค่าต่ำสุดและสูงสุด
  let max = values[0];
  let min = values[0];
  for (const v of values) {
    if (v > max) max = v;
    if (v < min) min = v;
  }
  // ใช้ช่วงต่ำสุด-สูงสุด เพื่อให้เห็นการเปลี่ยนแปลงชัด (ถ้าเท่ากันหมดให้เป็น 1 กันหารด้วยศูนย์)
  let range = max - min;
  if (range === 0) range = 1;

  const step = w / (values.length - 1);
  const pts: string[] = [];
  for (let i = 0; i < values.length; i++) {
    const x = (i * step).toFixed(1);
    const y = (h - 3 - ((values[i] - min) / range) * (h - 6)).toFixed(1);
    pts.push(x + ',' + y);
  }

  return (
    <svg className="spark" viewBox={'0 0 ' + w + ' ' + h} width={w} height={h} aria-hidden>
      <polyline points={'0,' + h + ' ' + pts.join(' ') + ' ' + w + ',' + h} fill="var(--accent-soft)" stroke="none" />
      <polyline points={pts.join(' ')} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
