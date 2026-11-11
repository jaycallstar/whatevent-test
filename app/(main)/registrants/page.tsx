'use client';
// ผู้ลงทะเบียน: ค้นหา กรองสถานะ เช็คอิน ลบ และส่งออก CSV / Excel
import { useState } from 'react';
import Icon from '@/components/Icon';
import NoEvent from '@/components/NoEvent';
import PageHeader from '@/components/PageHeader';
import { useStore } from '@/lib/db';
import { useEvents } from '@/lib/eventContext';
import { downloadCsv, downloadExcel, registrantRows, safeName } from '@/lib/export';
import { formatDate } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { Registration } from '@/lib/types';

export default function RegistrantsPage() {
  const { t, lang } = useLang();
  const { current } = useEvents();
  const [allRegs, setAllRegs] = useStore<Registration>('registrations');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all'); // all / in / out
  if (!current) return <NoEvent />;

  const regs = allRegs.filter((r) => r.eventId === current.id);
  const text = search.toLowerCase();
  const list = regs.filter((r) => {
    if (status === 'in' && !r.checkedIn) return false;
    if (status === 'out' && r.checkedIn) return false;
    return (r.name + r.email + r.phone + r.org + r.ticket).toLowerCase().includes(text);
  });

  function toggleCheckIn(reg: Registration) {
    setAllRegs(allRegs.map((r) => (r.id === reg.id ? { ...r, checkedIn: !r.checkedIn, checkedInAt: r.checkedIn ? undefined : new Date().toISOString() } : r)));
  }
  function remove(reg: Registration) {
    if (confirm(t('ลบ ', 'Delete ') + reg.name + '?')) setAllRegs(allRegs.filter((r) => r.id !== reg.id));
  }
  const file = safeName(current.title) + '-registrants';

  return (
    <div className="stack">
      <PageHeader title={t('ผู้ลงทะเบียน', 'Registrants')} subtitle={current.title + ' · ' + regs.length + ' ' + t('คน', 'people')}>
        <button className="btn" onClick={() => downloadCsv(file + '.csv', registrantRows(regs, t, lang))}><Icon name="download" size={16} /> CSV</button>
        <button className="btn primary" onClick={() => downloadExcel(file + '.xlsx', [{ name: 'Registrants', rows: registrantRows(regs, t, lang) }])}><Icon name="download" size={16} /> Excel</button>
      </PageHeader>

      <div className="card stack">
        <div className="row between">
          <div className="search"><Icon name="search" size={16} /><input placeholder={t('ค้นหาชื่อ อีเมล หน่วยงาน หรือรหัสบัตร', 'Search name, email, organization or ticket')} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 'auto' }}>
            <option value="all">{t('ทุกสถานะ', 'All statuses')}</option>
            <option value="in">{t('เช็คอินแล้ว', 'Checked in')}</option>
            <option value="out">{t('ยังไม่เช็คอิน', 'Not checked in')}</option>
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th>{t('ชื่อ', 'Name')}</th><th>{t('ติดต่อ', 'Contact')}</th><th>{t('หน่วยงาน', 'Organization')}</th><th>{t('รหัสบัตร', 'Ticket')}</th><th>{t('ลงทะเบียนเมื่อ', 'Registered at')}</th><th>{t('สถานะ', 'Status')}</th><th></th></tr></thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={7} className="muted">{t('ไม่พบรายชื่อ', 'No registrants found')}</td></tr>}
              {list.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.name}</b>{r.source === 'kiosk' && <> <span className="badge">Kiosk</span></>}</td>
                  <td className="small">{r.email}<br /><span className="muted">{r.phone}</span></td>
                  <td>{r.org || '-'}</td>
                  <td><code>{r.ticket}</code></td>
                  <td className="small">{formatDate(r.createdAt, lang)}</td>
                  <td>{r.checkedIn ? <span className="badge ok">{t('เช็คอินแล้ว', 'Checked in')}</span> : <span className="badge">{t('ยังไม่เช็คอิน', 'Not checked in')}</span>}</td>
                  <td>
                    <div className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                      <button className="btn small-btn" onClick={() => toggleCheckIn(r)}>{r.checkedIn ? t('ยกเลิก', 'Undo') : t('เช็คอิน', 'Check in')}</button>
                      <button className="btn small-btn danger" aria-label={t('ลบ', 'Delete')} onClick={() => remove(r)}><Icon name="trash" size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
