'use client';
// การ์ดสถานที่ (ผู้เข้าร่วมเห็นในหน้าลงทะเบียน): ชื่อ + ที่อยู่ + แผนที่ Google Maps ตามสถานที่ที่กรอก + วิธีเดินทาง
import Icon from './Icon';
import MapEmbed from './MapEmbed';
import { placeQuery } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { EventItem } from '@/lib/types';

type Props = { event: Pick<EventItem, 'location' | 'address' | 'directions'>; title?: string };

export default function MapCard({ event, title }: Props) {
  const { t } = useLang();
  const query = placeQuery(event);
  if (!query && !event.directions) return null;

  return (
    <div className="card stack-sm">
      <h3>{title || t('สถานที่จัดงาน', 'Venue')}</h3>
      {event.location && <p className="place-name">{event.location}</p>}
      {event.address && <p className="muted">{event.address}</p>}
      <MapEmbed query={query} />
      {event.directions && (
        <div className="directions">
          <b><Icon name="pin" size={18} /> {t('วิธีการเดินทาง', 'How to get there')}</b>
          <p>{event.directions}</p>
        </div>
      )}
    </div>
  );
}
