'use client';
// การ์ดแสดงกิจกรรม 1 ใบ (หน้า "กิจกรรมทั้งหมด" ของ admin)
import Link from 'next/link';
import Icon from './Icon';
import RegBadge from './RegBadge';
import { formatDate, heroStyle } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { EventItem, User } from '@/lib/types';

type Props = { event: EventItem; count: number; checkedIn: number; managers: User[]; onEdit: () => void; onDelete: () => void };

export default function EventCard({ event, count, checkedIn, managers, onEdit, onDelete }: Props) {
  const { lang, t } = useLang();

  // เปอร์เซ็นต์ที่นั่งที่ถูกจอง (ไม่เกิน 100)
  const pct = Math.min(100, Math.round((count / Math.max(1, event.capacity)) * 100));

  // ข้อความชื่อผู้ดูแล (ถ้าไม่มีใครดูแลให้บอกว่ายังไม่มี)
  const names: string[] = [];
  for (const u of managers) names.push(u.name);
  let managerText = t('ยังไม่มีผู้ดูแล', 'No manager');
  if (names.length > 0) managerText = names.join(', ');

  return (
    <div className="card event-card">
      <div className="event-card-head" style={heroStyle(event)}>
        <div className="logo small-logo">{event.logo ? <img src={event.logo} alt="" /> : (event.title || 'W').slice(0, 1)}</div>
        <div style={{ minWidth: 0 }}>
          <h3 className="ellipsis">{event.title}</h3>
          <span className="chip">{event.access === 'open' ? t('งานเปิด', 'Open event') : t('งานปิด', 'Closed event')}</span>
        </div>
      </div>
      <div className="stack-sm event-card-body">
        <p className="small muted"><Icon name="calendar" size={14} /> {formatDate(event.startAt, lang)}</p>
        <div className="ec-stats">
          <div><b>{count}</b><span>{t('ลงทะเบียน', 'Registered')}</span></div>
          <div><b>{checkedIn}</b><span>{t('เช็คอิน', 'Checked in')}</span></div>
          <div><b>{pct}%</b><span>{t('ที่นั่ง', 'Seats')}</span></div>
        </div>
        <div className="track" aria-hidden><div className="fill" style={{ width: pct + '%' }} /></div>
        <div className="row between" style={{ gap: 8 }}>
          <RegBadge event={event} count={count} />
          <span className="small muted">{managerText}</span>
        </div>
        <div className="ec-actions">
          <Link className="btn small-btn primary" href={'/reports/' + event.id}><Icon name="file" size={15} /> {t('รายงาน', 'Report')}</Link>
          <button className="btn small-btn" onClick={onEdit}><Icon name="type" size={15} /> {t('แก้ไข', 'Edit')}</button>
          <Link className="btn small-btn" href={'/assignments'}><Icon name="assign" size={15} /> {t('ผู้ดูแล', 'Managers')}</Link>
          <button className="btn small-btn danger" onClick={onDelete} aria-label={t('ลบ', 'Delete')}><Icon name="trash" size={15} /></button>
        </div>
      </div>
    </div>
  );
}
