'use client';
// ตัวอย่างหน้าที่ผู้เข้าร่วมเห็น (ย่อส่วนในกรอบมือถือ) ใช้ในหน้า "แบรนด์" เพื่อดูผลทันที
import Icon from './Icon';
import { brandStyle, formatDate, heroStyle } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { EventItem } from '@/lib/types';

export default function BrandPreview({ event }: { event: EventItem }) {
  const { t, lang } = useLang();
  return (
    <div className="phone">
      <div className="phone-notch" aria-hidden />
      <div className="phone-screen brand-scope" style={brandStyle(event)}>
        <div className="pv-hero" style={heroStyle(event)}>
          <div className="pv-logo">{event.logo ? <img src={event.logo} alt="" /> : (event.title || 'W').slice(0, 1)}</div>
          <b className="pv-title">{event.title || t('กิจกรรมใหม่', 'New event')}</b>
          {event.theme.tagline && <span className="pv-tag">{event.theme.tagline}</span>}
          <span className="pv-chip"><Icon name="calendar" size={11} /> {formatDate(event.startAt, lang)}</span>
        </div>
        <div className="pv-card">
          <b>{t('ลงทะเบียน', 'Register')}</b>
          <span className="pv-field">{t('ชื่อ-นามสกุล', 'Full name')}</span>
          <span className="pv-field">{t('อีเมล', 'Email')}</span>
          <span className="btn primary pv-btn">{t('ยืนยันการลงทะเบียน', 'Confirm registration')}</span>
        </div>
        <div className="pv-card">
          <b>{t('แบบสอบถาม', 'Survey')}</b>
          <span className="pv-opt on"><i />{t('ตัวเลือกที่ 1', 'Option 1')}</span>
          <span className="pv-opt"><i />{t('ตัวเลือกที่ 2', 'Option 2')}</span>
        </div>
      </div>
    </div>
  );
}
