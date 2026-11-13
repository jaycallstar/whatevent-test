'use client';
// ป้ายสถานะการรับลงทะเบียน (งานเปิด / เปิดรับ / ยังไม่เปิด / ปิดรับ / เต็ม / หยุดชั่วคราว)
import Icon from './Icon';
import { formatDate, regState } from '@/lib/helpers';
import type { RegState } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { EventItem } from '@/lib/types';

type RegText = { label: string; detail: string; tone: string; icon: string };

// คืนฟังก์ชันที่แปลงสถานะ -> ข้อความ/สี/ไอคอน ตามภาษาที่เลือก
export function useRegText() {
  const { t, lang } = useLang();

  function regText(state: RegState, event: EventItem): RegText {
    if (state === 'open-event') {
      return { label: t('งานเปิด', 'Open event'), detail: t('เข้าร่วมได้เลย ไม่ต้องลงทะเบียน', 'Walk in, no registration needed'), tone: 'info', icon: 'unlock' };
    }
    if (state === 'paused') {
      return { label: t('หยุดรับชั่วคราว', 'Paused'), detail: t('ผู้จัดหยุดรับลงทะเบียนไว้ชั่วคราว', 'Registration is temporarily paused'), tone: 'warn', icon: 'clock' };
    }
    if (state === 'upcoming') {
      return { label: t('ยังไม่เปิดรับ', 'Opens soon'), detail: t('เปิดรับ ', 'Opens ') + formatDate(event.regOpenAt, lang), tone: 'warn', icon: 'clock' };
    }
    if (state === 'closed') {
      return { label: t('ปิดรับแล้ว', 'Closed'), detail: t('ปิดรับเมื่อ ', 'Closed on ') + formatDate(event.regCloseAt, lang), tone: 'bad', icon: 'lock' };
    }
    if (state === 'full') {
      return { label: t('ที่นั่งเต็ม', 'Full'), detail: t('ที่นั่งเต็มแล้ว', 'All seats are taken'), tone: 'bad', icon: 'users' };
    }

    // สถานะ 'open' (เปิดรับลงทะเบียน)
    let detail = t('รับจนกว่าที่นั่งจะเต็ม', 'Until seats run out');
    if (event.regCloseAt) detail = t('ปิดรับ ', 'Closes ') + formatDate(event.regCloseAt, lang);
    return { label: t('เปิดรับลงทะเบียน', 'Registration open'), detail: detail, tone: 'ok', icon: 'check' };
  }

  return regText;
}

export default function RegBadge({ event, count, showDetail = false }: { event: EventItem; count: number; showDetail?: boolean }) {
  const getText = useRegText();
  const text = getText(regState(event, count), event);
  return (
    <span className={'status ' + text.tone} title={text.detail}>
      <Icon name={text.icon} size={14} /> {text.label}{showDetail && <small> · {text.detail}</small>}
    </span>
  );
}
