'use client';
// แผนที่ Google Maps ที่ฝังจากข้อความสถานที่ (ไม่ต้องมี API key) + ปุ่มเปิดนำทางใน Google Maps
// ใช้ทั้งในหน้าตั้งค่า (การ์ดสถานที่) และการ์ดสถานที่ในหน้าลงทะเบียนของผู้เข้าร่วม
// รอ 0.7 วินาทีหลังหยุดพิมพ์ จึงโหลดแผนที่ใหม่ (กันแผนที่กระพริบทุกตัวอักษร)
import { useEffect, useState } from 'react';
import Icon from './Icon';
import { mapEmbedUrl, mapLinkUrl } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';

type Props = { query: string; showEmptyHint?: boolean };

export default function MapEmbed({ query, showEmptyHint = false }: Props) {
  const { t } = useLang();
  const [q, setQ] = useState(query); // ข้อความที่ใช้โหลดแผนที่จริง (หน่วงเวลาตอนพิมพ์)
  useEffect(() => {
    const id = setTimeout(() => setQ(query), 700);
    return () => clearTimeout(id);
  }, [query]);

  const src = mapEmbedUrl(q);
  if (!src) {
    if (!showEmptyHint) return null;
    return (
      <div className="map-empty">
        <Icon name="pin" size={22} />
        <span>{t('กรอกชื่อสถานที่หรือที่อยู่ แผนที่ Google Maps จะแสดงที่นี่', 'Enter a place name or address and Google Maps will show it here')}</span>
      </div>
    );
  }
  return (
    <div className="stack-sm">
      <iframe className="map-frame" title="Google Maps" src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      <div><a className="btn small-btn" href={mapLinkUrl(query)} target="_blank" rel="noreferrer"><Icon name="external" size={15} /> {t('เปิดใน Google Maps', 'Open in Google Maps')}</a></div>
    </div>
  );
}
