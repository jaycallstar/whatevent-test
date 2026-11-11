'use client';
// แสดงเมื่อผู้ใช้ยังไม่มีกิจกรรมให้ดูแล (user ที่ admin ยังไม่ได้มอบหมายกิจกรรมให้)
import Link from 'next/link';
import Icon from './Icon';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';

export default function NoEvent() {
  const { t } = useLang();
  const { user } = useAuth();
  return (
    <div className="card empty">
      <div className="empty-icon"><Icon name="calendar" size={28} /></div>
      <h2>{t('ยังไม่มีกิจกรรมที่ได้รับมอบหมาย', 'No events assigned yet')}</h2>
      <p className="muted">{t('โปรดติดต่อผู้ดูแลระบบเพื่อให้มอบหมายกิจกรรมให้คุณ', 'Please ask an admin to assign an event to you.')}</p>
      {user?.role === 'admin' && <Link className="btn primary" href="/events">{t('ไปสร้างกิจกรรม', 'Create an event')}</Link>}
    </div>
  );
}
