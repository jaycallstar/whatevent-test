'use client';
// หัวของกิจกรรม (โลโก้ + ชื่อ + สโลแกน + วันเวลา + สถานที่) ใช้ซ้ำในหลายหน้า แสดงตามแบรนด์ของงาน
import { ReactNode, useEffect } from 'react';
import Icon from './Icon';
import { loadFont } from '@/lib/brand';
import { brandStyle, formatDate, heroStyle } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { EventItem } from '@/lib/types';

export default function EventHero({ event, subtitle, children }: { event: EventItem; subtitle?: string; children?: ReactNode }) {
  const { lang, t } = useLang();
  useEffect(() => { loadFont(event.theme.font); }, [event.theme.font]);
  return (
    <div className="hero brand-scope" style={{ ...brandStyle(event), ...heroStyle(event) }}>
      <div className="logo">{event.logo ? <img src={event.logo} alt="logo" /> : (event.title || 'W').slice(0, 1)}</div>
      <div className="hero-body">
        {subtitle && <p className="hero-sub">{subtitle}</p>}
        <h1>{event.title || t('กิจกรรมใหม่', 'New event')}</h1>
        {event.theme.tagline && <p className="hero-tag">{event.theme.tagline}</p>}
        <div className="chips">
          <span className="chip"><Icon name="calendar" size={14} /> {formatDate(event.startAt, lang)}</span>
          <span className="chip"><Icon name="pin" size={14} /> {event.location || t('ยังไม่ระบุสถานที่', 'No location yet')}</span>
        </div>
      </div>
      {children && <div className="hero-side">{children}</div>}
    </div>
  );
}
