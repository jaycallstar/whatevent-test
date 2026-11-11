'use client';
// ป้ายสถานะการรับลงทะเบียน (งานเปิด / เปิดรับ / ยังไม่เปิด / ปิดรับ / เต็ม / หยุดชั่วคราว)
import Icon from './Icon';
import { formatDate, regState } from '@/lib/helpers';
import type { RegState } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { EventItem } from '@/lib/types';

export function useRegText() {
  const { t, lang } = useLang();
  return (state: RegState, event: EventItem): { label: string; detail: string; tone: string; icon: string } => {
    switch (state) {
      case 'open-event': return { label: t('งานเปิด', 'Open event'), detail: t('เข้าร่วมได้เลย ไม่ต้องลงทะเบียน', 'Walk in, no registration needed'), tone: 'info', icon: 'unlock' };
      case 'paused': return { label: t('หยุดรับชั่วคราว', 'Paused'), detail: t('ผู้จัดหยุดรับลงทะเบียนไว้ชั่วคราว', 'Registration is temporarily paused'), tone: 'warn', icon: 'clock' };
      case 'upcoming': return { label: t('ยังไม่เปิดรับ', 'Opens soon'), detail: t('เปิดรับ ', 'Opens ') + formatDate(event.regOpenAt, lang), tone: 'warn', icon: 'clock' };
      case 'closed': return { label: t('ปิดรับแล้ว', 'Closed'), detail: t('ปิดรับเมื่อ ', 'Closed on ') + formatDate(event.regCloseAt, lang), tone: 'bad', icon: 'lock' };
      case 'full': return { label: t('ที่นั่งเต็ม', 'Full'), detail: t('ที่นั่งเต็มแล้ว', 'All seats are taken'), tone: 'bad', icon: 'users' };
      default: return { label: t('เปิดรับลงทะเบียน', 'Registration open'), detail: event.regCloseAt ? t('ปิดรับ ', 'Closes ') + formatDate(event.regCloseAt, lang) : t('รับจนกว่าที่นั่งจะเต็ม', 'Until seats run out'), tone: 'ok', icon: 'check' };
    }
  };
}

export default function RegBadge({ event, count, showDetail = false }: { event: EventItem; count: number; showDetail?: boolean }) {
  const text = useRegText()(regState(event, count), event);
  return (
    <span className={'status ' + text.tone} title={text.detail}>
      <Icon name={text.icon} size={14} /> {text.label}{showDetail && <small> · {text.detail}</small>}
    </span>
  );
}
