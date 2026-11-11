'use client';
// รายงานของกิจกรรม 1 งาน (เฉพาะ admin) ใช้คอมโพเนนต์รายงานเดียวกับแท็บ "รายงาน" ในแดชบอร์ด
import Link from 'next/link';
import { useParams } from 'next/navigation';
import EventReport from '@/components/EventReport';
import Icon from '@/components/Icon';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/db';
import { useEvents } from '@/lib/eventContext';
import { useLang } from '@/lib/i18n';
import type { Registration, Response } from '@/lib/types';

export default function ReportDetailPage() {
  const { t } = useLang();
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { allEvents, ready } = useEvents();
  const [allRegs] = useStore<Registration>('registrations');
  const [allResponses] = useStore<Response>('responses');
  if (!user || !ready) return <p className="muted">{t('กำลังโหลด...', 'Loading...')}</p>;
  if (user.role !== 'admin') return <div className="alert">{t('เฉพาะ admin เท่านั้นที่เข้าหน้านี้ได้', 'Only admins can open this page')}</div>;

  const event = allEvents.find((e) => e.id === params.id);
  if (!event) return <div className="alert">{t('ไม่พบกิจกรรมนี้', 'Event not found')}</div>;

  return (
    <div className="stack">
      <PageHeader title={t('รายงานกิจกรรม', 'Event report')} subtitle={event.title}>
        <Link className="btn" href="/events"><Icon name="chevron-left" size={16} /> {t('กลับไปกิจกรรมทั้งหมด', 'Back to all events')}</Link>
      </PageHeader>
      <EventReport event={event} regs={allRegs.filter((r) => r.eventId === event.id)} responses={allResponses.filter((r) => r.eventId === event.id)} />
    </div>
  );
}
