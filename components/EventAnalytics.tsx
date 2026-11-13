'use client';
// ภาพรวมของกิจกรรม 1 งาน (แท็บ "ภาพรวม" ในแดชบอร์ด) แบ่งเป็นหมวดชัดเจน อ่านจากบนลงล่าง:
//   1) ตัวเลขสรุป  2) การลงทะเบียนและการเข้างาน  3) ข้อมูลผู้ลงทะเบียน (+ ความเคลื่อนไหวล่าสุด)  4) ผลแบบสอบถาม
import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { BarChart, Donut, HBar, LineChart } from './Charts';
import { Segmented } from './Controls';
import Icon from './Icon';
import Kpi from './Kpi';
import SurveyResults from './SurveyResults';
import { countByDay, countByTimeSlot, countByWeekday, cumulative, groupCount, percent, summarize } from '@/lib/analytics';
import { formatDate } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { EventItem, Registration, Response } from '@/lib/types';

type Props = { event: EventItem; regs: Registration[]; responses: Response[]; days: number };

// หัวข้อของแต่ละหมวด: ไอคอน + ชื่อ + คำอธิบายสั้น + ของด้านขวา (ไม่บังคับ)
function Section({ icon, title, hint, right, children }: { icon: string; title: string; hint: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="dash-sec">
      <header className="dash-sec-head">
        <span className="dash-sec-icon"><Icon name={icon} size={18} /></span>
        <div className="dash-sec-title"><h2>{title}</h2><p className="hint">{hint}</p></div>
        {right}
      </header>
      {children}
    </section>
  );
}

export default function EventAnalytics({ event, regs, responses, days }: Props) {
  const { t, lang } = useLang();
  const [trend, setTrend] = useState<'cumulative' | 'daily'>('cumulative');
  const s = summarize(event, regs, responses);

  const weekdayLabels = [t('อา.', 'Sun'), t('จ.', 'Mon'), t('อ.', 'Tue'), t('พ.', 'Wed'), t('พฤ.', 'Thu'), t('ศ.', 'Fri'), t('ส.', 'Sat')];
  const slotLabels = ['00–06', '06–12', '12–18', '18–24'];

  // รวมชื่อหน่วยงาน และนับคนที่ลงทะเบียนผ่าน Kiosk
  const orgNames: string[] = [];
  let kiosk = 0;
  for (const r of regs) {
    orgNames.push(r.org);
    if (r.source === 'kiosk') kiosk++;
  }
  const orgs = groupCount(orgNames, 5);

  // ผู้ลงทะเบียนล่าสุด 5 คน (เรียงจากใหม่ไปเก่า)
  const sorted = regs.slice();
  sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const latest = sorted.slice(0, 5);

  // ตัวเลขยอดสะสม 10 วัน ใช้วาดเส้นเล็ก ๆ ในการ์ด KPI
  const sparkValues: number[] = [];
  for (const d of cumulative(regs, 10, lang)) {
    sparkValues.push(d.value);
  }

  // งานเปิดใช้คำว่า "ผู้ลงชื่อเข้างาน" ส่วนงานปิดใช้ "ผู้ลงทะเบียน"
  let regLabel = t('ผู้ลงทะเบียน', 'Registrants');
  if (event.access === 'open') regLabel = t('ผู้ลงชื่อเข้างาน', 'Signed in');

  let trendHint = t('ผู้ลงทะเบียนใหม่แต่ละวัน', 'New sign-ups each day');
  if (trend === 'cumulative') trendHint = t('ยอดสะสมในช่วงที่เลือก', 'Running total over the selected period');

  const steps = [
    { label: t('ลงทะเบียน', 'Registered'), value: s.total },
    { label: t('เช็คอิน', 'Checked in'), value: s.checkedIn },
    { label: t('ตอบแบบสอบถาม', 'Answered survey'), value: s.responseCount },
  ];

  return (
    <div className="dash">
      {/* ---- 1) ตัวเลขสรุป ---- */}
      <div className="kpis kpis-3">
        <Kpi icon="users" label={regLabel} value={s.total} spark={sparkValues} progress={s.capacityPercent} sub={s.capacityPercent + '% ' + t('ของ ', 'of ') + event.capacity + ' · ' + t('วันนี้ +', 'today +') + s.today} />
        <Kpi icon="check" label={t('เช็คอินแล้ว', 'Checked in')} value={s.checkedIn} progress={s.checkInRate} sub={t('อัตราการเข้างาน ', 'Check-in rate ') + s.checkInRate + '%'} />
        <Kpi icon="clipboard" label={t('ตอบแบบสอบถาม', 'Survey responses')} value={s.responseCount} progress={s.responseRate} sub={t('อัตราการตอบ ', 'Response rate ') + s.responseRate + '%'} />
      </div>

      {/* ---- 2) การลงทะเบียนและการเข้างาน ---- */}
      <Section icon="trend" title={t('การลงทะเบียนและการเข้างาน', 'Registrations & attendance')} hint={t('ยอดลงทะเบียนตามช่วงเวลา และสัดส่วนคนที่มาเข้างาน', 'Sign-ups over time and how many actually attended')}>
        <div className="bento">
          <div className="card span-8 stack-sm">
            <div className="card-head">
              <div>
                <h3>{t('แนวโน้มการลงทะเบียน', 'Registration trend')}</h3>
                <p className="hint">{trendHint}</p>
              </div>
              <Segmented label={t('ชนิดกราฟ', 'Chart type')} value={trend} onChange={setTrend} options={[{ value: 'cumulative', label: t('สะสม', 'Total') }, { value: 'daily', label: t('รายวัน', 'Daily') }]} />
            </div>
            {trend === 'cumulative' && <LineChart id={'cum-' + event.id} data={cumulative(regs, days, lang)} />}
            {trend === 'daily' && <BarChart data={countByDay(regs, days, lang).slice(-14)} />}
          </div>

          <div className="card span-4 stack-sm">
            <h3>{t('การเข้างาน', 'Attendance')}</h3>
            <div className="attend">
              <Donut percent={s.checkInRate} text={t('เช็คอิน', 'checked in')} />
              <ul className="legend">
                <li><i className="dot accent" />{t('เช็คอินแล้ว', 'Checked in')} <b>{s.checkedIn}</b></li>
                <li><i className="dot muted-dot" />{t('ยังไม่มา', 'Not arrived')} <b>{s.total - s.checkedIn}</b></li>
                <li><i className="dot dot-kiosk" />{t('ผ่าน Kiosk', 'Via kiosk')} <b>{kiosk}</b></li>
              </ul>
            </div>
            <div className="steps">
              {steps.map((st, i) => (
                <div key={st.label} className="step-row">
                  <span className="step-n">{i + 1}</span>
                  <span className="step-l">{st.label}</span>
                  <b>{st.value}</b>
                  <span className="muted small">{percent(st.value, s.total)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ---- 3) ข้อมูลผู้ลงทะเบียน ---- */}
      <Section icon="users" title={t('ข้อมูลผู้ลงทะเบียน', 'About your registrants')} hint={t('ลงทะเบียนวันไหน เวลาไหน มาจากหน่วยงานใด และใครลงทะเบียนล่าสุด', 'When they sign up, where they come from, and who signed up last')}
        right={<Link className="btn small-btn" href="/registrants">{t('ดูรายชื่อทั้งหมด', 'View all registrants')} <Icon name="chevron-right" size={14} /></Link>}>
        <div className="bento">
          <div className="card span-4"><h3>{t('ตามวันในสัปดาห์', 'By weekday')}</h3><BarChart data={countByWeekday(regs, weekdayLabels)} /></div>
          <div className="card span-4"><h3>{t('ตามช่วงเวลา (น.)', 'By time of day')}</h3><BarChart data={countByTimeSlot(regs, slotLabels)} /></div>
          <div className="card span-4 stack-sm">
            <h3>{t('หน่วยงานสูงสุด', 'Top organizations')}</h3>
            {orgs.length === 0 && <p className="muted small">{t('ยังไม่มีข้อมูล', 'No data yet')}</p>}
            {orgs.map((o) => <HBar key={o.label} label={o.label} value={o.value} total={s.total} unit={t('คน', 'people')} />)}
          </div>
          <div className="card span-12 stack-sm">
            <h3>{t('ลงทะเบียนล่าสุด', 'Latest registrations')}</h3>
            {latest.length === 0 && <p className="muted small">{t('ยังไม่มีผู้ลงทะเบียน', 'No registrants yet')}</p>}
            <ul className="activity">
              {latest.map((r) => (
                <li key={r.id}>
                  <span className="avatar sm">{r.name.slice(0, 1)}</span>
                  <span className="act-text"><b className="ellipsis">{r.name}</b><small className="muted ellipsis">{r.org || '-'} · {r.source === 'kiosk' ? 'Kiosk' : t('ออนไลน์', 'Online')}</small></span>
                  <span className="act-time small muted">{formatDate(r.createdAt, lang)}</span>
                  {r.checkedIn ? <span className="badge ok">{t('เช็คอินแล้ว', 'Checked in')}</span> : <span className="badge">{t('รอเช็คอิน', 'Pending')}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ---- 4) ผลแบบสอบถาม ---- */}
      <Section icon="clipboard" title={t('ผลแบบสอบถาม', 'Survey results')} hint={t('สรุปคำตอบทีละข้อ', 'Answers summarised question by question')}
        right={<span className="pill">{responses.length} {t('คนตอบ', 'responses')}</span>}>
        <SurveyResults event={event} responses={responses} hideRating />
      </Section>
    </div>
  );
}
