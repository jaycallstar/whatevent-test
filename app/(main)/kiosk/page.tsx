'use client';
// ตั้งค่า Kiosk หน้างาน + ดูตัวอย่างสด (จอแนวตั้ง 1080×1920 / แท็บเล็ต / มือถือ)
// หน้าจอ Kiosk จริงอยู่ที่ /k/รหัสกิจกรรม (ใช้แบรนด์ของงานโดยอัตโนมัติ)
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Segmented, Switch } from '@/components/Controls';
import Icon from '@/components/Icon';
import ImageField from '@/components/ImageField';
import NoEvent from '@/components/NoEvent';
import PageHeader from '@/components/PageHeader';
import QRBox from '@/components/QRBox';
import { useEvents } from '@/lib/eventContext';
import { useLang } from '@/lib/i18n';
import type { KioskSettings } from '@/lib/types';

const devices = {
  kiosk: { w: 1080, h: 1920, icon: 'kiosk', label: 'Kiosk 1080×1920' },
  tablet: { w: 820, h: 1180, icon: 'tablet', label: 'Tablet' },
  mobile: { w: 390, h: 844, icon: 'phone', label: 'Mobile' },
};
type Device = keyof typeof devices;

// iframe ขนาดจริงของอุปกรณ์ แล้วย่อให้พอดีกล่อง (เห็นผลเหมือนจอจริง)
function ScaledFrame({ src, w, h }: { src: string; w: number; h: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const maxH = Math.min(window.innerHeight * 0.72, 860);
      setScale(Math.min(entry.contentRect.width / w, maxH / h));
    });
    ro.observe(box.current);
    return () => ro.disconnect();
  }, [w, h]);
  return (
    <div ref={box} className="frame-box">
      <div className="frame-device" style={{ width: w * scale, height: h * scale }}>
        <iframe title="Kiosk preview" src={src} style={{ width: w, height: h, transform: 'scale(' + scale + ')' }} />
      </div>
      <span className="small muted">{w} × {h} px · {Math.round(scale * 100)}%</span>
    </div>
  );
}

export default function KioskSetupPage() {
  const { t } = useLang();
  const { current, updateCurrent } = useEvents();
  const [device, setDevice] = useState<Device>('kiosk');
  const [origin, setOrigin] = useState('');
  useEffect(() => { setOrigin(window.location.origin); }, []);
  if (!current) return <NoEvent />;
  const event = current;
  const k = event.kiosk;
  const set = (changes: Partial<KioskSettings>) => updateCurrent({ ...event, kiosk: { ...k, ...changes } });
  const url = origin + '/k/' + event.id;
  const d = devices[device];

  return (
    <div className="stack">
      <PageHeader title={t('Kiosk หน้างาน', 'On-site kiosk')} subtitle={t('ตู้เช็คอิน/ลงทะเบียนแบบจอสัมผัส ใช้แบรนด์ของงานอัตโนมัติ · บันทึกอัตโนมัติ', 'Touch-screen check-in & registration, styled with the event brand · Saved automatically')}>
        <a className="btn primary" href={'/k/' + event.id} target="_blank" rel="noreferrer"><Icon name="maximize" size={16} /> {t('เปิดโหมด Kiosk', 'Launch kiosk')}</a>
      </PageHeader>

      <div className="kiosk-layout">
        {/* ---------- ตั้งค่า ---------- */}
        <div className="stack">
          <section className="card stack-sm">
            <h3 className="sec-title"><Icon name="palette" size={18} /> {t('หน้าตา', 'Look')}</h3>
            <p className="hint">{t('สี ฟอนต์ โลโก้ และความโค้งมุม มาจากเมนู “แบรนด์”', 'Colors, font, logo and corners come from “Branding”')} · <Link href="/branding" className="link-btn">{t('ไปที่แบรนด์', 'Open Branding')}</Link></p>
            <b className="small">{t('พื้นหลัง', 'Background')}</b>
            <Segmented label={t('พื้นหลัง', 'Background')} value={k.bg} onChange={(v) => set({ bg: v })} options={[
              { value: 'brand', label: t('สีแบรนด์', 'Brand') },
              { value: 'light', label: t('สว่าง', 'Light') },
              { value: 'dark', label: t('มืด', 'Dark') },
              { value: 'image', label: t('รูปภาพ', 'Image') },
            ]} />
            {k.bg === 'image' && <ImageField label={t('รูปพื้นหลัง Kiosk', 'Kiosk background')} hint={t('แนะนำ 1080 × 1920 px (แนวตั้ง 9:16) ไม่เกิน 500 KB', 'Recommended 1080 × 1920 px (portrait 9:16), up to 500 KB')} value={k.image} onChange={(v) => set({ image: v })} />}
          </section>

          <section className="card stack-sm">
            <h3 className="sec-title"><Icon name="bolt" size={18} /> {t('การทำงาน', 'Behaviour')}</h3>
            {event.access === 'closed'
              ? <Switch checked={k.walkIn} onChange={(v) => set({ walkIn: v })} label={t('แสดงปุ่ม “ลงทะเบียนหน้างาน”', 'Show the “Register on site” button')} hint={t('กดแล้วแสดง QR ไปหน้าลงทะเบียน (แสดงเฉพาะช่วงที่เปิดรับลงทะเบียน และที่นั่งยังไม่เต็ม)', 'Shows a QR code to the registration page (only while registration is open and seats remain)')} />
              : <p className="hint">{t('งานเปิด: ตู้แสดงเฉพาะข้อมูลงานพร้อม QR แบบสอบถาม (ไม่มีลงชื่อหรือลงทะเบียน)', 'Open event: the kiosk shows event info with the survey QR code (no sign-in or registration)')}</p>}
            <Switch checked={k.showStats} onChange={(v) => set({ showStats: v })} label={t('แสดงจำนวนที่นั่งว่าง', 'Show seats left')} hint={t('งานปิดเท่านั้น เช่น เหลือที่นั่ง 30 / 150', 'Closed events only, e.g. 30 / 150 seats left')} />
            <label>{t('กลับหน้าแรกอัตโนมัติเมื่อไม่มีคนใช้', 'Return home when idle')}
              <select value={k.idle} onChange={(e) => set({ idle: Number(e.target.value) })}>
                {[15, 30, 60, 120].map((s) => <option key={s} value={s}>{s} {t('วินาที', 'seconds')}</option>)}
              </select>
            </label>
          </section>

          <section className="card stack-sm">
            <h3 className="sec-title"><Icon name="info" size={18} /> {t('วิธีติดตั้งที่หน้างาน', 'Set up on site')}</h3>
            <ol className="steps-list">
              <li>{t('สแกน QR ด้านล่างด้วยแท็บเล็ต/จอสัมผัส หรือพิมพ์ลิงก์', 'Scan the QR below on the tablet/touch screen, or type the link')} <code className="break">{url}</code></li>
              <li>{t('กดปุ่มเต็มจอมุมขวาบน (แนะนำเปิดโหมด Guided Access / Kiosk ของเครื่อง)', 'Tap fullscreen at the top right (use the device’s Guided Access / kiosk mode)')}</li>
              <li>{t('ผู้เข้าร่วมกด “เช็คอิน” แล้วนำ QR บัตรที่ได้จากการลงทะเบียนมาสแกนที่กล้องของตู้ (เบราว์เซอร์จะขออนุญาตใช้กล้อง และต้องเปิดผ่าน HTTPS หรือ localhost)', 'Attendees tap “Check in” and scan the QR ticket from their registration with the kiosk camera (the browser asks for camera permission; use HTTPS or localhost)')}</li>
            </ol>
            <QRBox title={t('QR เปิดหน้า Kiosk', 'Kiosk link QR')} text={url} />
            <p className="hint">{t('หมายเหตุ: เวอร์ชันนี้เก็บข้อมูลใน LocalStorage เครื่อง Kiosk ต้องเป็นเครื่องเดียวกับที่มีข้อมูลผู้ลงทะเบียน (ใช้งานหลายเครื่องต้องมี backend)', 'Note: this version stores data in LocalStorage, so the kiosk must run on the device that has the registrations (multiple devices need a backend).')}</p>
          </section>
        </div>

        {/* ---------- ตัวอย่างสด ---------- */}
        <aside className="card kiosk-preview stack-sm">
          <div className="card-head">
            <h3>{t('ตัวอย่างสด', 'Live preview')}</h3>
            <Segmented label={t('อุปกรณ์', 'Device')} value={device} onChange={setDevice} options={(Object.keys(devices) as Device[]).map((key) => ({
              value: key, label: <span title={devices[key].label}><Icon name={devices[key].icon} size={16} /><span className="sr-only">{devices[key].label}</span></span>,
            }))} />
          </div>
          <p className="hint">{d.label} — {t('ลองแตะปุ่มในตัวอย่างได้ (ข้อมูลจริง)', 'You can tap through the preview (live data)')}</p>
          {origin && <ScaledFrame key={device} src={'/k/' + event.id + '?preview=1'} w={d.w} h={d.h} />}
        </aside>
      </div>
    </div>
  );
}
