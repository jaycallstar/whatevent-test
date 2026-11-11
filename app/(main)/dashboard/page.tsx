'use client';
// แดชบอร์ดของกิจกรรมที่เลือกอยู่ (user จะเข้าหน้านี้เป็นหน้าแรกหลัง login)
// มี 2 แท็บ: "ภาพรวม" (กราฟ) และ "รายงาน" (เอกสารสรุป พิมพ์/ส่งออกได้)
import { useEffect, useState } from 'react';
import Link from 'next/link';
import EventAnalytics from '@/components/EventAnalytics';
import EventReport from '@/components/EventReport';
import Icon from '@/components/Icon';
import NoEvent from '@/components/NoEvent';
import RegBadge from '@/components/RegBadge';
import { summarize } from '@/lib/analytics';
import { loadFont } from '@/lib/brand';
import { useStore } from '@/lib/db';
import { useEvents } from '@/lib/eventContext';
import { downloadExcel, registrantRows, safeName, summaryRows, surveyRows } from '@/lib/export';
import { brandStyle, formatDate, heroStyle } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { Registration, Response } from '@/lib/types';

type Tab = 'overview' | 'report';

export default function DashboardPage() {
  const { t, lang } = useLang();
  const { current } = useEvents();
  const [allRegs] = useStore<Registration>('registrations');
  const [allResponses] = useStore<Response>('responses');
  const [days, setDays] = useState(14); // ช่วงเวลาของกราฟแนวโน้ม
  const [tab, setTab] = useState<Tab>('overview');

  // เปิดจากลิงก์ /dashboard#report -> เข้าแท็บรายงานเลย
  useEffect(() => { if (window.location.hash === '#report') setTab('report'); }, []);
  useEffect(() => { if (current) loadFont(current.theme.font); }, [current]);

  if (!current) return <NoEvent />;
  const event = current;

  const regs = allRegs.filter((r) => r.eventId === event.id);
  const responses = allResponses.filter((r) => r.eventId === event.id);
  const s = summarize(event, regs, responses);
  const file = safeName(event.title);

  function exportExcel() {
    downloadExcel(file + '-report.xlsx', [
      { name: 'Summary', rows: summaryRows(event, regs, responses, t, lang) },
      { name: 'Registrants', rows: registrantRows(regs, t, lang) },
      { name: 'Survey', rows: surveyRows(event, responses, t, lang) },
    ]);
  }

  function changeTab(next: Tab) {
    setTab(next);
    history.replaceState(null, '', next === 'report' ? '#report' : window.location.pathname);
  }

  const countdown = s.daysLeft > 0 ? { n: s.daysLeft, l: t('วันก่อนเริ่มงาน', 'days to go') }
    : Date.now() <= Date.parse(event.endAt) ? { n: t('วันนี้', 'Live'), l: t('งานกำลังดำเนินอยู่', 'happening now') }
    : { n: Math.abs(s.daysLeft), l: t('วันที่แล้ว (จบงาน)', 'days ago (ended)') };

  return (
    <div className="stack">
      {/* ---------- หัวแดชบอร์ดตามแบรนด์ของงาน ---------- */}
      <section className="dash-hero brand-scope no-print" style={{ ...brandStyle(event), ...heroStyle(event) }}>
        <div className="dash-hero-main">
          <div className="logo">{event.logo ? <img src={event.logo} alt="" /> : (event.title || 'W').slice(0, 1)}</div>
          <div style={{ minWidth: 0 }}>
            <div className="row" style={{ gap: 8 }}>
              <span className="chip">{event.access === 'open' ? t('งานเปิด', 'Open event') : t('งานปิด', 'Closed event')}</span>
              <RegBadge event={event} count={regs.length} />
            </div>
            <h1>{event.title}</h1>
            <div className="chips">
              <span className="chip"><Icon name="calendar" size={14} /> {formatDate(event.startAt, lang)}</span>
              <span className="chip"><Icon name="pin" size={14} /> {event.location || t('ยังไม่ระบุสถานที่', 'No location yet')}</span>
            </div>
          </div>
        </div>
        <div className="dash-hero-side">
          <div className="countdown"><b>{countdown.n}</b><span>{countdown.l}</span></div>
          <div className="hero-actions">
            <Link className="hero-btn" href="/kiosk"><Icon name="kiosk" size={16} /> Kiosk</Link>
            <Link className="hero-btn" href="/share"><Icon name="qr" size={16} /> QR</Link>
            <Link className="hero-btn" href="/registrants"><Icon name="users" size={16} /> {t('รายชื่อ', 'List')}</Link>
          </div>
        </div>
      </section>

      {/* ---------- แถบเครื่องมือ ---------- */}
      <div className="dash-toolbar no-print">
        <div className="tabbar" role="tablist" aria-label={t('มุมมอง', 'View')}>
          <button role="tab" aria-selected={tab === 'overview'} className={tab === 'overview' ? 'tab on' : 'tab'} onClick={() => changeTab('overview')}><Icon name="chart" size={16} /> {t('ภาพรวม', 'Overview')}</button>
          <button role="tab" aria-selected={tab === 'report'} className={tab === 'report' ? 'tab on' : 'tab'} onClick={() => changeTab('report')}><Icon name="file" size={16} /> {t('รายงาน', 'Report')}</button>
        </div>
        {tab === 'overview' && (
          <div className="row">
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ width: 'auto' }} aria-label={t('ช่วงเวลา', 'Period')}>
              <option value={7}>{t('7 วันล่าสุด', 'Last 7 days')}</option>
              <option value={14}>{t('14 วันล่าสุด', 'Last 14 days')}</option>
              <option value={30}>{t('30 วันล่าสุด', 'Last 30 days')}</option>
            </select>
            <button className="btn primary" onClick={exportExcel}><Icon name="download" size={16} /> Excel</button>
          </div>
        )}
      </div>

      {tab === 'overview' ? (
        <EventAnalytics event={event} regs={regs} responses={responses} days={days} />
      ) : (
        <EventReport event={event} regs={regs} responses={responses} />
      )}
    </div>
  );
}
