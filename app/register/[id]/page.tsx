'use client';
// หน้าลงทะเบียนสำหรับผู้เข้าร่วมงาน (ไม่ต้อง login) เปิดจาก QR ลงทะเบียน
//  - งานเปิด: ไม่มีฟอร์ม แสดงข้อมูลงาน + วิธีเดินทาง (เข้าร่วมได้เลย)
//  - งานปิด: เปิดฟอร์มเฉพาะช่วงเวลารับลงทะเบียน (ยังไม่เปิด / ปิดแล้ว / เต็ม / หยุดชั่วคราว จะแสดงข้อความแทน)
import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import EventHero from '@/components/EventHero';
import Icon from '@/components/Icon';
import MapCard from '@/components/MapCard';
import PrefsBar from '@/components/PrefsBar';
import QRBox from '@/components/QRBox';
import { useRegText } from '@/components/RegBadge';
import { newId, readStore, useStore } from '@/lib/db';
import { brandStyle, formatDate, newTicket, regState } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { EventItem, Registration } from '@/lib/types';

// นับถอยหลังจนถึงเวลาที่กำหนด เช่น "2 วัน 03:14:09"
function useCountdown(target: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const ms = Math.max(0, Date.parse(target || '') - now);
  const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return { done: ms === 0, d, text: pad(h) + ':' + pad(m) + ':' + pad(s) };
}

export default function RegisterPage() {
  const { t, lang } = useLang();
  const params = useParams<{ id: string }>();
  const [events, , ready] = useStore<EventItem>('events');
  const [regs, setRegs] = useStore<Registration>('registrations');
  const [form, setForm] = useState({ name: '', email: '', phone: '', org: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState<Registration | null>(null); // ลงทะเบียนสำเร็จแล้วเก็บไว้ที่นี่
  const regText = useRegText();
  const event = events.find((e) => e.id === params.id);
  const countdown = useCountdown(event ? event.regOpenAt : '');

  if (!ready) return <p className="center-msg">{t('กำลังโหลด...', 'Loading...')}</p>;
  if (!event) return <p className="center-msg">{t('ไม่พบกิจกรรมนี้ ลิงก์อาจไม่ถูกต้อง', 'Event not found. The link may be incorrect.')}</p>;
  const eventRegs = regs.filter((r) => r.eventId === event.id);
  const state = regState(event, eventRegs.length);
  const info = regText(state, event);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // ตรวจสถานะอีกครั้งตอนกดส่ง (กันเปิดหน้าค้างไว้จนเลยเวลาปิดรับ)
    const latest = readStore<Registration>('registrations').filter((r) => r.eventId === event!.id);
    const now = regState(event!, latest.length);
    if (now !== 'open') return setError(regText(now, event!).detail);
    const duplicated = latest.some((r) => r.email.toLowerCase() === form.email.trim().toLowerCase());
    if (duplicated) return setError(t('อีเมลนี้ลงทะเบียนกิจกรรมนี้แล้ว', 'This email is already registered for this event'));

    const created: Registration = {
      id: newId(), eventId: event!.id, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), org: form.org.trim(),
      ticket: newTicket(), checkedIn: false, createdAt: new Date().toISOString(), source: 'online',
    };
    setRegs([...regs, created]);
    setDone(created);
  }

  return (
    <div className="public themed brand-scope" style={brandStyle(event)}>
      <div className="public-top"><PrefsBar /></div>
      <EventHero event={event} subtitle={event.access === 'open' ? t('ข้อมูลกิจกรรม', 'Event information') : t('ลงทะเบียนเข้าร่วมกิจกรรม', 'Event registration')} />

      <div className="card stack-sm">
        <h3>{t('รายละเอียดงาน', 'About the event')}</h3>
        {event.description && <p>{event.description}</p>}
        <p className="muted"><Icon name="calendar" size={15} /> {formatDate(event.startAt, lang)} – {formatDate(event.endAt, lang)}</p>
      </div>

      {/* ---------- งานเปิด: ไม่ต้องลงทะเบียน ---------- */}
      {state === 'open-event' && (
        <div className="card status-card info">
          <span className="status-icon"><Icon name="unlock" size={26} /></span>
          <div>
            <h2>{t('งานนี้เข้าร่วมได้เลย ไม่ต้องลงทะเบียน', 'Just come — no registration needed')}</h2>
            <p className="muted">{t('เดินทางมาที่สถานที่จัดงานได้ตามวันและเวลาด้านบน', 'Come to the venue at the date and time above.')}</p>
          </div>
        </div>
      )}

      {/* ---------- งานปิด: แสดงสถานะ หรือฟอร์ม ---------- */}
      {state !== 'open-event' && !done && state !== 'open' && (
        <div className={'card status-card ' + info.tone}>
          <span className="status-icon"><Icon name={info.icon} size={26} /></span>
          <div className="stack-sm">
            <h2>{info.label}</h2>
            <p className="muted">{info.detail}</p>
            {state === 'upcoming' && !countdown.done && (
              <div className="countdown-box" aria-live="polite">
                {countdown.d > 0 && <span><b>{countdown.d}</b> {t('วัน', 'days')}</span>}
                <span><b>{countdown.text}</b></span>
              </div>
            )}
          </div>
        </div>
      )}

      {done ? (
        <div className="stack">
          <div className="alert ok">{t('ลงทะเบียนสำเร็จ ขอบคุณคุณ ', 'Registration successful. Thank you, ')}{done.name}</div>
          <QRBox title={t('บัตรเข้างาน ', 'Entry ticket ') + done.ticket} text={done.ticket} showLink={false} />
          <p className="muted small center-text">{t('บันทึกภาพหน้าจอหรือดาวน์โหลด QR นี้ไว้แสดงที่หน้างาน หรือสแกนที่ตู้ Kiosk', 'Save a screenshot or download this QR to show at the venue or scan at the kiosk.')}</p>
          {event.questions.length > 0 && <a className="btn big" href={'/survey/' + event.id + '?t=' + encodeURIComponent(done.ticket)}><Icon name="clipboard" size={16} /> {t('ลิงก์แบบสอบถามของคุณ (ตอบหลังจบงาน)', 'Your survey link (answer after the event)')}</a>}
        </div>
      ) : state === 'open' && (
        <form className="card stack-sm" onSubmit={handleSubmit}>
          <div className="row between">
            <h2>{t('ลงทะเบียน', 'Register')}</h2>
            <span className="small muted">{t('เหลือ ', 'Seats left ')}{Math.max(0, event.capacity - eventRegs.length)}{t(' ที่นั่ง', '')}</span>
          </div>
          {event.regCloseAt && <p className="hint"><Icon name="clock" size={14} /> {t('ปิดรับ ', 'Closes ')}{formatDate(event.regCloseAt, lang)}</p>}
          <label>{t('ชื่อ-นามสกุล', 'Full name')}<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></label>
          <label>{t('อีเมล', 'Email')}<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></label>
          <label>{t('เบอร์โทรศัพท์', 'Phone')}<input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" /></label>
          <label>{t('หน่วยงาน / บริษัท (ไม่บังคับ)', 'Organization / company (optional)')}<input value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })} autoComplete="organization" /></label>
          {error && <div className="alert">{error}</div>}
          <button className="btn primary big">{t('ยืนยันการลงทะเบียน', 'Confirm registration')}</button>
        </form>
      )}

      <MapCard event={event} />
      <p className="foot">{t('จัดทำด้วย WhatEvent', 'Powered by WhatEvent')}</p>
    </div>
  );
}
