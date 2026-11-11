'use client';
// QR Code และลิงก์สำหรับแจกผู้เข้าร่วม (QR ลงทะเบียน และ QR แบบสอบถาม แยกกัน)
import NoEvent from '@/components/NoEvent';
import PageHeader from '@/components/PageHeader';
import QRBox from '@/components/QRBox';
import { useEvents } from '@/lib/eventContext';
import { useLang } from '@/lib/i18n';

export default function SharePage() {
  const { t } = useLang();
  const { current } = useEvents();
  if (!current) return <NoEvent />;
  const base = window.location.origin;

  return (
    <div className="stack">
      <PageHeader title={t('QR / ลิงก์', 'QR & links')} subtitle={current.title} />
      <div className="grid2">
        <QRBox title={current.access === 'open' ? t('QR ข้อมูลงาน (งานเปิด)', 'Event info QR (open event)') : t('QR ลงทะเบียน', 'Registration QR')} text={base + '/register/' + current.id} />
        <QRBox title={current.access === 'open' ? t('QR แบบสอบถาม (ตอบได้ทันที)', 'Survey QR (answer right away)') : t('QR แบบสอบถาม (ยืนยันการลงทะเบียนก่อน)', 'Survey QR (registration check first)')} text={base + '/survey/' + current.id} />
        <QRBox title={t('QR หน้าจอ Kiosk', 'Kiosk screen QR')} text={base + '/k/' + current.id} />
      </div>
      <p className="hint">{t('หมายเหตุ: ข้อมูลเก็บใน LocalStorage ของเบราว์เซอร์ ลิงก์จึงเห็นข้อมูลเฉพาะบนเครื่องนี้ (ใช้งานจริงต้องมี backend)', 'Note: data lives in this browser’s LocalStorage, so links only show data on this device (a real deployment needs a backend).')}</p>
    </div>
  );
}
