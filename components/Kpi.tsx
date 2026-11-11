// การ์ดตัวเลขสรุป (KPI) 1 ใบ: ไอคอน + ชื่อ + ตัวเลข + เส้นแนวโน้ม + แถบความคืบหน้า (ไม่บังคับ)
import { Sparkline } from './Charts';
import Icon from './Icon';

type Props = { icon: string; label: string; value: string | number; sub?: string; tone?: string; progress?: number; spark?: number[] };

export default function Kpi({ icon, label, value, sub, tone = 'blue', progress, spark }: Props) {
  return (
    <div className="card kpi">
      <div className="kpi-top">
        <div className={'kpi-icon ' + tone}><Icon name={icon} size={18} /></div>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-mid">
        <b className="kpi-value">{value}</b>
        {spark && <Sparkline values={spark} />}
      </div>
      {progress !== undefined && <div className="track" role="progressbar" aria-valuenow={Math.min(100, progress)} aria-valuemin={0} aria-valuemax={100} aria-label={label}><div className="fill" style={{ width: Math.min(100, progress) + '%' }} /></div>}
      {sub && <span className="small muted">{sub}</span>}
    </div>
  );
}
