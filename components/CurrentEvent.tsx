'use client';
// กิจกรรมที่ผู้ใช้ได้รับมอบหมาย (แสดงใน Sidebar และเมนู "เพิ่มเติม" บนมือถือ) — ไม่ใช่ dropdown
//  - ดูแลงานเดียว: การ์ดแสดงชื่อและวันที่ (ไม่ต้องเลือกอะไร)
//  - ดูแลหลายงาน: รายการแบนให้กดสลับงานได้ทันที
import Icon from './Icon';
import { useEvents } from '@/lib/eventContext';
import { formatDate, secondColor } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { EventItem } from '@/lib/types';

function Logo({ event }: { event: EventItem }) {
  return (
    <span className="sw-logo" style={{ background: 'linear-gradient(135deg,' + event.color + ',' + secondColor(event) + ')' }}>
      {event.logo ? <img src={event.logo} alt="" /> : (event.title || 'W').slice(0, 1)}
    </span>
  );
}

export default function CurrentEvent() {
  const { t, lang } = useLang();
  const { events, current, setCurrentId } = useEvents();

  if (!current) return <p className="ce-empty small muted">{t('ยังไม่ได้รับมอบหมายกิจกรรม', 'No event assigned yet')}</p>;

  const many = events.length > 1;
  const body = (e: EventItem) => (
    <>
      <Logo event={e} />
      <span className="sw-text">
        <b className="ellipsis">{e.title}</b>
        <small className="ellipsis">{formatDate(e.startAt, lang)}</small>
      </span>
    </>
  );

  return (
    <div className="ce">
      <p className="sb-label">{many ? t('กิจกรรมของฉัน', 'My events') : t('กิจกรรมที่ดูแล', 'My event')}</p>
      {!many && <div className="ce-item on">{body(current)}</div>}
      {many && (
        <ul className="ce-list">
          {events.map((e) => (
            <li key={e.id}>
              <button type="button" className={e.id === current.id ? 'ce-item on' : 'ce-item'} aria-pressed={e.id === current.id} onClick={() => setCurrentId(e.id)}>
                {body(e)}
                {e.id === current.id && <Icon name="check" size={16} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
