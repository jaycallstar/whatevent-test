'use client';
// รายงานสรุปของกิจกรรม 1 งาน (แบบเอกสาร พร้อมพิมพ์/บันทึกเป็น PDF และส่งออก Excel/CSV)
// ใช้ในแท็บ "รายงาน" ของแดชบอร์ด (ทุก role) และหน้ารายงานรายกิจกรรมของ admin
import { useState } from 'react';
import { BarChart } from './Charts';
import Icon from './Icon';
import { answersOf, choiceCounts, countByDay, groupCount, insights, percent, ratingCounts, summarize, within } from '@/lib/analytics';
import { downloadCsv, downloadExcel, insightRows, registrantRows, safeName, summaryRows, surveyRows } from '@/lib/export';
import { formatDate, secondColor } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { EventItem, Registration, Response } from '@/lib/types';

type Props = { event: EventItem; regs: Registration[]; responses: Response[] };

export default function EventReport({ event, regs: allRegs, responses: allResponses }: Props) {
  const { t, lang } = useLang();
  const [days, setDays] = useState(0); // 0 = ทั้งหมด
  const [showAll, setShowAll] = useState(false);

  const regs = within(allRegs, days);
  const responses = within(allResponses, days);
  const s = summarize(event, regs, responses);
  const notes = insights(event, regs, responses, t);
  const orgs = groupCount(regs.map((r) => r.org), 8);
  const kiosk = regs.filter((r) => r.source === 'kiosk').length;
  const file = safeName(event.title);
  const periodText = days ? t(days + ' วันล่าสุด', 'Last ' + days + ' days') : t('ข้อมูลทั้งหมด', 'All data');
  const list = [...regs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  function exportExcel() {
    downloadExcel(file + '-report.xlsx', [
      { name: 'Summary', rows: summaryRows(event, regs, responses, t, lang) },
      { name: 'Insights', rows: insightRows(event, regs, responses, t) },
      { name: 'Registrants', rows: registrantRows(regs, t, lang) },
      { name: 'Survey', rows: surveyRows(event, responses, t, lang) },
    ]);
  }

  const metrics: [string, string][] = [
    [event.access === 'open' ? t('ผู้ลงชื่อเข้างาน', 'Signed in') : t('ผู้ลงทะเบียน', 'Registrants'), s.total + ' / ' + event.capacity + ' (' + s.capacityPercent + '%)'],
    [t('เช็คอินแล้ว', 'Checked in'), s.checkedIn + ' (' + s.checkInRate + '%)'],
    [t('ไม่มาเข้างาน', 'No-show'), String(s.total - s.checkedIn)],
    [t('ลงทะเบียนผ่าน Kiosk', 'Kiosk sign-ups'), String(kiosk)],
    [t('ตอบแบบสอบถาม', 'Survey responses'), s.responseCount + ' (' + s.responseRate + '%)'],
    [t('คะแนนเฉลี่ย', 'Average rating'), s.average === null ? '–' : s.average.toFixed(2) + ' / 5'],
  ];

  return (
    <div className="stack">
      <div className="card report-toolbar no-print">
        <label className="inline-label">{t('ช่วงข้อมูล', 'Period')}
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={0}>{t('ทั้งหมด', 'All time')}</option>
            <option value={7}>{t('7 วันล่าสุด', 'Last 7 days')}</option>
            <option value={14}>{t('14 วันล่าสุด', 'Last 14 days')}</option>
            <option value={30}>{t('30 วันล่าสุด', 'Last 30 days')}</option>
          </select>
        </label>
        <div className="row">
          <button className="btn" onClick={() => window.print()}><Icon name="print" size={16} /> {t('พิมพ์ / PDF', 'Print / PDF')}</button>
          <button className="btn" onClick={() => downloadCsv(file + '-registrants.csv', registrantRows(regs, t, lang))}><Icon name="download" size={16} /> CSV</button>
          <button className="btn primary" onClick={exportExcel}><Icon name="download" size={16} /> Excel</button>
        </div>
      </div>

      <article className="card report">
        <header className="report-head">
          <div className="report-logo" style={{ background: 'linear-gradient(135deg,' + event.color + ',' + secondColor(event) + ')' }}>{event.logo ? <img src={event.logo} alt="" /> : (event.title || 'W').slice(0, 1)}</div>
          <div>
            <p className="eyebrow">{t('รายงานสรุปกิจกรรม', 'Event summary report')}</p>
            <h2>{event.title}</h2>
            <p className="small muted">{formatDate(event.startAt, lang)} – {formatDate(event.endAt, lang)} · {event.location || '-'}</p>
          </div>
          <div className="report-meta small muted">
            <span>{t('ช่วงข้อมูล: ', 'Period: ')}{periodText}</span>
            <span>{t('ออกรายงาน: ', 'Generated: ')}{formatDate(new Date().toISOString(), lang)}</span>
          </div>
        </header>

        <section>
          <h3 className="report-h">1. {t('ตัวเลขสำคัญ', 'Key figures')}</h3>
          <div className="metric-grid">
            {metrics.map(([k, v]) => <div key={k} className="metric"><span>{k}</span><b>{v}</b></div>)}
          </div>
        </section>

        <section>
          <h3 className="report-h">2. {t('ข้อสังเกตอัตโนมัติ', 'Automatic insights')}</h3>
          <ul className="insights">{notes.map((n, i) => <li key={i}><Icon name="sparkle" size={15} /> <span>{n}</span></li>)}</ul>
        </section>

        <section>
          <h3 className="report-h">3. {t('การลงทะเบียน 14 วันล่าสุด', 'Registrations, last 14 days')}</h3>
          <BarChart data={countByDay(regs, 14, lang)} />
        </section>

        <section>
          <h3 className="report-h">4. {t('ผู้เข้าร่วมแยกตามหน่วยงาน', 'Attendees by organization')}</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>{t('หน่วยงาน', 'Organization')}</th><th>{t('จำนวน', 'Count')}</th><th>{t('สัดส่วน', 'Share')}</th></tr></thead>
              <tbody>
                {orgs.length === 0 && <tr><td colSpan={3} className="muted">{t('ไม่มีข้อมูล', 'No data')}</td></tr>}
                {orgs.map((o) => <tr key={o.label}><td>{o.label}</td><td>{o.value}</td><td>{percent(o.value, s.total)}%</td></tr>)}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="report-h">5. {t('สรุปแบบสอบถาม', 'Survey summary')}</h3>
          {event.questions.length === 0 && <p className="muted small">{t('กิจกรรมนี้ไม่มีแบบสอบถาม', 'This event has no survey')}</p>}
          <div className="stack-sm">
            {event.questions.map((q, i) => {
              const answers = answersOf(responses, q.id);
              return (
                <div key={q.id} className="report-q">
                  <b>{i + 1}. {q.text || t('(ไม่มีข้อความคำถาม)', '(untitled question)')}</b> <span className="muted small">· {answers.length} {t('คำตอบ', 'answers')}</span>
                  {q.type === 'rating' && (
                    <p className="small">{ratingCounts(answers).map((r) => t(r.label + ' คะแนน: ', r.label + ' pts: ') + r.value).join('  ·  ')}{answers.length > 0 && <> — <b>{t('เฉลี่ย ', 'avg ')}{(answers.reduce((a, b) => a + Number(b), 0) / answers.length).toFixed(2)}</b></>}</p>
                  )}
                  {q.type === 'choice' && <p className="small">{choiceCounts(q.options, answers).map((c) => c.label + ' ' + c.value + ' (' + percent(c.value, answers.length) + '%)').join('  ·  ')}</p>}
                  {q.type === 'text' && (answers.length === 0 ? <p className="small muted">{t('ไม่มีความคิดเห็น', 'No comments')}</p> : <ul className="quotes">{answers.slice(0, 8).map((a, k) => <li key={k}>“{a}”</li>)}</ul>)}
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="report-h">6. {t('รายชื่อผู้ลงทะเบียน', 'Registrant list')} ({list.length})</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>{t('ชื่อ', 'Name')}</th><th>{t('หน่วยงาน', 'Organization')}</th><th>{t('ช่องทาง', 'Channel')}</th><th>{t('ลงทะเบียนเมื่อ', 'Registered')}</th><th>{t('สถานะ', 'Status')}</th></tr></thead>
              <tbody>
                {/* แถวที่เกิน 15 ซ่อนบนจอ แต่ยังพิมพ์ออกมาครบ */}
                {list.map((r, i) => (
                  <tr key={r.id} className={!showAll && i >= 15 ? 'print-only-row' : undefined}>
                    <td className="muted">{i + 1}</td><td><b>{r.name}</b></td><td>{r.org || '-'}</td>
                    <td>{r.source === 'kiosk' ? 'Kiosk' : t('ออนไลน์', 'Online')}</td>
                    <td className="small">{formatDate(r.createdAt, lang)}</td>
                    <td>{r.checkedIn ? <span className="badge ok">{t('เช็คอินแล้ว', 'Checked in')}</span> : <span className="badge">{t('ยังไม่เช็คอิน', 'Not checked in')}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length > 15 && <button className="btn small-btn no-print" style={{ marginTop: 10 }} onClick={() => setShowAll(!showAll)}>{showAll ? t('แสดงน้อยลง', 'Show less') : t('แสดงทั้งหมด ', 'Show all ') + list.length}</button>}
        </section>
      </article>
    </div>
  );
}
