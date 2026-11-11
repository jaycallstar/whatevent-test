'use client';
// สร้าง QR Code จากข้อความ (ใช้ไลบรารี qrcode) พร้อมปุ่มดาวน์โหลดและคัดลอกลิงก์
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import Icon from './Icon';
import { useLang } from '@/lib/i18n';

export default function QRBox({ title, text, showLink = true }: { title: string; text: string; showLink?: boolean }) {
  const { t } = useLang();
  const [image, setImage] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(text, { width: 600, margin: 2 }).then(setImage);
  }, [text]);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="card qr-box">
      <h3>{title}</h3>
      {image && <img src={image} alt={title} />}
      {showLink && <p className="small muted break">{text}</p>}
      <div className="row center">
        <a className="btn small-btn primary" href={image} download={title + '.png'}><Icon name="download" size={15} /> {t('ดาวน์โหลด', 'Download')}</a>
        {showLink && <button className="btn small-btn" onClick={copy}><Icon name="copy" size={15} /> {copied ? t('คัดลอกแล้ว', 'Copied') : t('คัดลอกลิงก์', 'Copy link')}</button>}
        {showLink && <a className="btn small-btn" href={text} target="_blank" rel="noreferrer"><Icon name="external" size={15} /> {t('เปิดหน้า', 'Open')}</a>}
      </div>
    </div>
  );
}
