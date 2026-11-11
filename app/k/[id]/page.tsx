'use client';
// หน้าจอ Kiosk หน้างาน (เปิดบนแท็บเล็ต/จอสัมผัส) — เลย์เอาต์แนวตั้ง 1080 × 1920 (Full HD) เสมอ
// จอกว้างกว่า 9:16 (แท็บเล็ต/จอคอม) จะแสดงเป็นคอลัมน์แนวตั้งตรงกลางจอ ส่วนมือถือเต็มจอ · ใช้สี ฟอนต์ โลโก้ ตามแบรนด์ของงาน
// หน้าแรก: ข้อมูลงานด้านบน + ปุ่ม  (งานเปิด: ไม่มีปุ่ม มี QR แบบสอบถามในการ์ดข้อมูลงาน)
//   เช็คอิน            -> เปิดกล้องสแกน QR บัตรที่ได้จากการลงทะเบียน (อย่างเดียว ไม่มีช่องพิมพ์)
//   ลงทะเบียนหน้างาน   -> แสดง QR ไปหน้าลงทะเบียน (สแกนด้วยมือถือ) อย่างเดียว
//   แบบสอบถาม          -> แสดง QR อย่างเดียว (งานปิด: ผู้ตอบต้องยืนยันการลงทะเบียนบนมือถือก่อน)
// เปิดที่ /k/รหัสกิจกรรม  (ใส่ ?preview=1 สำหรับดูตัวอย่างในหน้าตั้งค่า — ตัวอย่างจะไม่เปิดกล้อง)
// หมายเหตุ: เบราว์เซอร์เปิดกล้องได้เฉพาะหน้าที่เปิดผ่าน HTTPS หรือ localhost
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import Icon from '@/components/Icon';
import { loadFont } from '@/lib/brand';
import { readStore, writeStore } from '@/lib/db';
import { brandStyle, formatDate, heroBackground, locale, regState, textOn } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import { findRegistration } from '@/lib/lookup';
import type { EventItem, Registration } from '@/lib/types';

type Screen = 'home' | 'checkin' | 'register' | 'survey' | 'done';
type Done = { name: string; message: string };

// ---------- QR เป็นรูป ----------
function QR({ text, label, big = false }: { text: string; label: string; big?: boolean }) {
  const [src, setSrc] = useState('');
  useEffect(() => { QRCode.toDataURL(text, { width: 720, margin: 1 }).then(setSrc); }, [text]);
  const cls = big ? 'k-qr xl' : 'k-qr';
  return src ? <img className={cls} src={src} alt={label} /> : <div className={cls} />;
}

// ---------- สแกน QR ด้วยกล้อง ----------
// อ่านด้วย BarcodeDetector ของเบราว์เซอร์ถ้ารองรับ QR (Chrome บน Android/Mac) ไม่รองรับก็ใช้ไลบรารี jsQR (ใช้ได้ทุกเบราว์เซอร์)
function Scanner({ onCode, preview }: { onCode: (code: string) => void; preview: boolean }) {
  const { t } = useLang();
  const video = useRef<HTMLVideoElement>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting');
  const [attempt, setAttempt] = useState(0); // เพิ่มค่าเพื่อเริ่มเปิดกล้องใหม่
  const found = useRef(onCode);
  found.current = onCode;

  useEffect(() => {
    if (preview) return; // ตัวอย่างในหน้าตั้งค่า: ไม่เปิดกล้อง
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let stopped = false;
    setStatus('starting');

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (stopped || !video.current) return;
        video.current.srcObject = stream;
        await video.current.play();

        // เลือกตัวอ่าน QR
        const w = window as any;
        let detector: any = null;
        if (w.BarcodeDetector) {
          try {
            const formats: string[] = await w.BarcodeDetector.getSupportedFormats();
            if (formats.includes('qr_code')) detector = new w.BarcodeDetector({ formats: ['qr_code'] });
          } catch { detector = null; }
        }
        const jsQR = detector ? null : (await import('jsqr')).default;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (stopped) return;
        setStatus('scanning');

        let lastCode = '', lastAt = 0;
        timer = setInterval(async () => {
          const v = video.current;
          if (!v || v.readyState < 2 || !v.videoWidth) return;
          let text = '';
          if (detector) {
            const codes = await detector.detect(v).catch(() => []);
            if (codes[0] && codes[0].rawValue) text = String(codes[0].rawValue);
          } else if (jsQR && ctx) {
            const cw = Math.min(640, v.videoWidth), ch = Math.round((cw * v.videoHeight) / v.videoWidth);
            canvas.width = cw; canvas.height = ch;
            ctx.drawImage(v, 0, 0, cw, ch);
            const img = ctx.getImageData(0, 0, cw, ch);
            const r = jsQR(img.data, cw, ch, { inversionAttempts: 'dontInvert' });
            if (r) text = r.data;
          }
          // รหัสเดิมซ้ำภายใน 3 วินาที ไม่ประมวลผลซ้ำ (กันเด้งข้อความผิดพลาดรัว ๆ)
          if (text && !(text === lastCode && Date.now() - lastAt < 3000)) {
            lastCode = text; lastAt = Date.now();
            found.current(text);
          }
        }, 300);
      } catch {
        if (!stopped) setStatus('error');
      }
    })();
    return () => { stopped = true; clearInterval(timer); stream?.getTracks().forEach((tr) => tr.stop()); };
  }, [facing, attempt, preview]);

  return (
    <div className="k-scan">
      <div className="k-scan-view">
        {!preview && <video ref={video} playsInline muted />}
        <span className="k-scan-frame" aria-hidden />
        {status === 'scanning' && !preview && <span className="k-scan-line" aria-hidden />}
        <span className="k-scan-status" role="status">
          {preview ? t('ตัวอย่าง: กล้องจะเปิดที่ตู้จริง', 'Preview: the camera opens on the real kiosk')
            : status === 'starting' ? t('กำลังเปิดกล้อง...', 'Opening camera...')
            : status === 'scanning' ? t('นำ QR บัตรมาวางในกรอบ', 'Hold your QR ticket inside the frame')
            : t('เปิดกล้องไม่ได้', 'Camera unavailable')}
        </span>
      </div>
      {status === 'error' && !preview && (
        <div className="k-scan-error">
          <p className="k-error" role="alert">{t('เปิดกล้องไม่ได้ กรุณาอนุญาตการใช้กล้องในเบราว์เซอร์ (หน้านี้ต้องเปิดผ่าน HTTPS หรือ localhost)', 'Could not open the camera. Allow camera access in the browser (this page must be opened over HTTPS or localhost).')}</p>
          <button type="button" className="k-btn primary" onClick={() => setAttempt(attempt + 1)}><Icon name="refresh" size={22} /> {t('ลองอีกครั้ง', 'Try again')}</button>
        </div>
      )}
      {status !== 'error' && !preview && (
        <button type="button" className="k-btn" onClick={() => setFacing(facing === 'user' ? 'environment' : 'user')}><Icon name="refresh" size={22} /> {t('สลับกล้องหน้า/หลัง', 'Flip camera')}</button>
      )}
    </div>
  );
}

export default function KioskPage() {
  const { t, lang, setLang } = useLang();
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>('home');
  const [now, setNow] = useState(new Date());
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<Done | null>(null);
  const [left, setLeft] = useState(0); // วินาทีที่เหลือก่อนกลับหน้าแรก
  const lastTouch = useRef(Date.now());

  // ---------- โหลดข้อมูล + อัปเดตเมื่อข้อมูลเปลี่ยนจากแท็บ/หน้าตั้งค่าอื่น ----------
  useEffect(() => {
    function reload() {
      setEvent(readStore<EventItem>('events').find((e) => e.id === params.id) || null);
      setRegs(readStore<Registration>('registrations').filter((r) => r.eventId === params.id));
      setLoaded(true);
    }
    reload();
    setPreview(new URLSearchParams(window.location.search).has('preview'));
    window.addEventListener('storage', reload);
    const poll = setInterval(reload, 10000);
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => { window.removeEventListener('storage', reload); clearInterval(poll); clearInterval(clock); };
  }, [params.id]);

  useEffect(() => { if (event) loadFont(event.theme.font); }, [event]);

  // ข้อความผิดพลาดบนหน้าสแกนหายเองใน 4 วินาที
  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(id);
  }, [error]);

  // ---------- ไม่มีคนแตะนาน -> กลับหน้าแรก ----------
  useEffect(() => {
    const touch = () => { lastTouch.current = Date.now(); };
    window.addEventListener('pointerdown', touch);
    window.addEventListener('keydown', touch);
    return () => { window.removeEventListener('pointerdown', touch); window.removeEventListener('keydown', touch); };
  }, []);
  useEffect(() => {
    if (screen === 'home' || !event || preview) return;
    lastTouch.current = Date.now();
    const timer = setInterval(() => {
      // หน้าสแกนกล้องคนถือมือถือไม่ได้แตะจอ -> รอนานกว่าปกติ (อย่างน้อย 60 วินาที)
      const limit = screen === 'done' ? Math.min(15, event.kiosk.idle) : screen === 'checkin' ? Math.max(60, event.kiosk.idle) : event.kiosk.idle;
      const remain = Math.ceil(limit - (Date.now() - lastTouch.current) / 1000);
      setLeft(remain);
      if (remain <= 0) goHome();
    }, 500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, event, preview]);

  function goHome() { setScreen('home'); setError(''); setDone(null); }
  function open(s: Screen) { setError(''); setScreen(s); }

  if (!loaded) return <p className="center-msg">{t('กำลังโหลด...', 'Loading...')}</p>;
  if (!event) return <p className="center-msg">{t('ไม่พบกิจกรรมนี้ ลิงก์ Kiosk อาจไม่ถูกต้อง', 'Event not found. The kiosk link may be wrong.')}</p>;
  const ev = event;

  const state = regState(ev, regs.length);
  const isOpen = ev.access === 'open';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const surveyUrl = origin + '/survey/' + ev.id;
  const registerUrl = origin + '/register/' + ev.id;
  const hasSurvey = ev.questions.length > 0;

  // ---------- พื้นหลังตามแบรนด์ ----------
  const bg = ev.kiosk.bg;
  const background = bg === 'light' ? 'var(--k-light)' : bg === 'dark' ? 'var(--k-dark)'
    : bg === 'image' && ev.kiosk.image ? 'linear-gradient(180deg, rgba(8,12,26,.35), rgba(8,12,26,.75)), url("' + ev.kiosk.image + '") center / cover'
    : heroBackground(ev);
  const onBrand = bg === 'brand' && !ev.banner ? textOn(ev.color) : '#ffffff';
  const tone = bg === 'light' ? 'light' : 'dark-ish';

  // ---------- เช็คอิน: รับข้อความจาก QR (รหัสบัตร) ----------
  function checkIn(raw: string) {
    const value = raw.trim();
    if (!value) return;
    const hit = findRegistration(ev.id, value);
    if (!hit) return setError(t('ไม่พบข้อมูลการลงทะเบียนจาก QR นี้ ลองสแกนบัตรอีกครั้ง', 'No registration found for this QR. Please scan your ticket again.'));
    if (!hit.checkedIn) {
      const all = readStore<Registration>('registrations');
      const next = all.map((r) => (r.id === hit.id ? { ...r, checkedIn: true, checkedInAt: new Date().toISOString() } : r));
      writeStore('registrations', next);
      setRegs(next.filter((r) => r.eventId === ev.id));
    }
    setDone({
      name: hit.name,
      message: hit.checkedIn && hit.checkedInAt ? t('เช็คอินไว้ก่อนหน้านี้เมื่อ ', 'Already checked in at ') + formatDate(hit.checkedInAt, lang) : t('ขอให้สนุกกับกิจกรรม', 'Enjoy the event!'),
    });
    setScreen('done');
  }

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }

  const timeText = now.toLocaleTimeString(locale(lang), { hour: '2-digit', minute: '2-digit' });
  const dateText = now.toLocaleDateString(locale(lang), { weekday: 'long', day: 'numeric', month: 'long' });

  // ---------- ปุ่มหน้าแรก ----------
  // งานเปิด: ไม่มีปุ่ม (ไม่ต้องลงชื่อ/ลงทะเบียน) — QR แบบสอบถามอยู่ในการ์ดข้อมูลงานแทน
  // ปุ่มลงทะเบียนแสดงเฉพาะตอนเปิดรับลงทะเบียนอยู่ (QR พาไปหน้าลงทะเบียนซึ่งยึดช่วงเวลาและที่นั่งเดียวกัน)
  const tiles: { key: Screen; icon: string; title: string; desc: string; primary?: boolean; hidden?: boolean }[] = isOpen ? [] : [
    { key: 'checkin', icon: 'scan', title: t('เช็คอิน', 'Check in'), desc: t('สแกน QR บัตรที่ได้จากการลงทะเบียนด้วยกล้อง', 'Scan the QR ticket you received after registering'), primary: true },
    { key: 'register', icon: 'user-plus', title: t('ลงทะเบียนหน้างาน', 'Register on site'), desc: t('ยังไม่ได้ลงทะเบียน? สแกน QR เพื่อลงทะเบียน', 'Not registered? Scan a QR code to sign up'), hidden: !(ev.kiosk.walkIn && state === 'open') },
    { key: 'survey', icon: 'clipboard', title: t('แบบสอบถาม', 'Survey'), desc: t('สแกน QR เพื่อตอบแบบสอบถาม', 'Scan a QR code to answer the survey'), hidden: !hasSurvey },
  ];
  const stateNote: Record<string, string> = {
    upcoming: t('ยังไม่เปิดรับลงทะเบียน', 'Registration has not opened yet'),
    closed: t('ปิดรับลงทะเบียนแล้ว', 'Registration is closed'),
    paused: t('หยุดรับลงทะเบียนชั่วคราว', 'Registration is paused'),
    full: t('ที่นั่งเต็มแล้ว', 'The event is full'),
  };

  const back = <button type="button" className="k-back" onClick={goHome}><Icon name="chevron-left" size={26} /> {t('กลับหน้าแรก', 'Home')}</button>;
  const idleNote = !preview && screen !== 'home' && left > 0 && left <= 10 && <p className="k-idle">{t('กลับหน้าแรกอัตโนมัติใน ', 'Returning home in ')}{left}s</p>;

  return (
    <div className={'kiosk brand-scope k-' + tone} data-bg={bg} data-screen={screen}
      style={{ ...brandStyle(ev), ['--k-bg' as string]: background, ['--k-on' as string]: bg === 'light' ? 'var(--k-ink-dark)' : bg === 'dark' || bg === 'image' ? '#fff' : onBrand }}>

      {/* ---------- แถบบน: โลโก้ (ชื่องานแสดงในหัวข้อใหญ่อยู่แล้ว จึงไม่ซ้ำตรงนี้) ---------- */}
      <header className="k-top">
        <div className="k-brand">
          <span className="k-logo">{ev.logo ? <img src={ev.logo} alt="" /> : (ev.title || 'W').slice(0, 1)}</span>
        </div>
        <div className="k-top-right">
          <div className="k-clock"><b>{timeText}</b><span>{dateText}</span></div>
          <div className="k-lang" role="group" aria-label={t('ภาษา', 'Language')}>
            <button type="button" className={lang === 'th' ? 'on' : ''} onClick={() => setLang('th')}>TH</button>
            <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
          </div>
          {!preview && <button type="button" className="k-icon" onClick={fullscreen} aria-label={t('เต็มจอ', 'Fullscreen')} title={t('เต็มจอ', 'Fullscreen')}><Icon name="maximize" size={22} /></button>}
        </div>
      </header>

      {screen === 'home' && (
        <main className="k-home">
          <section className="k-hero">
            <h1 className="k-title">{ev.title}</h1>
            {ev.theme.tagline && <p className="k-tagline">{ev.theme.tagline}</p>}
            {!isOpen && ev.kiosk.showStats && (
              <p className="k-seats" aria-live="polite"><Icon name="ticket" size={22} /> {t('เหลือที่นั่ง', 'Seats left')} <b>{Math.max(0, ev.capacity - regs.length)}</b> / {ev.capacity}</p>
            )}
          </section>

          {/* ข้อมูลงานแสดงด้านบนเสมอ ผู้ใช้เห็นทันทีโดยไม่ต้องกด */}
          <section className="k-info" aria-label={t('ข้อมูลงาน', 'Event information')}>
            <div className="k-info-rows">
              <div className="k-info-row">
                <span className="k-info-icon"><Icon name="calendar" size={24} /></span>
                <span><small>{t('วันและเวลา', 'Date & time')}</small><b>{formatDate(ev.startAt, lang)}</b><em>{t('ถึง ', 'until ')}{formatDate(ev.endAt, lang)}</em></span>
              </div>
              {(ev.location || ev.address) && (
                <div className="k-info-row">
                  <span className="k-info-icon"><Icon name="pin" size={24} /></span>
                  <span><small>{t('สถานที่', 'Venue')}</small><b>{ev.location || '-'}</b>{ev.address && <em>{ev.address}</em>}</span>
                </div>
              )}
              {ev.directions && (
                <div className="k-info-row">
                  <span className="k-info-icon"><Icon name="navigation" size={24} /></span>
                  <span><small>{t('การเดินทาง', 'Getting here')}</small><em className="k-dir">{ev.directions}</em></span>
                </div>
              )}
            </div>
            {/* งานเปิด: QR แบบสอบถามอยู่ในการ์ดข้อมูลงาน (สแกนแล้วตอบได้ทันที) */}
            {isOpen && hasSurvey && (
              <div className="k-info-qrs">
                <div className="k-info-qr main">
                  <QR text={surveyUrl} label={t('QR แบบสอบถาม', 'Survey QR')} />
                  <span><b>{t('แบบสอบถาม', 'Survey')}</b><small>{t('สแกนแล้วตอบได้ทันที ไม่ต้องลงทะเบียน', 'Scan and answer, no registration needed')}</small></span>
                </div>
              </div>
            )}
          </section>

          {!isOpen && (
            <nav className="k-actions" aria-label={t('เมนู Kiosk', 'Kiosk menu')}>
              {tiles.filter((x) => !x.hidden).map((x) => (
                <button key={x.key} type="button" className={x.primary ? 'k-tile primary' : 'k-tile'} onClick={() => open(x.key)}>
                  <span className="k-tile-icon"><Icon name={x.icon} size={34} /></span>
                  <span className="k-tile-text"><b>{x.title}</b><small>{x.desc}</small></span>
                  <Icon name="chevron-right" size={30} />
                </button>
              ))}
              {stateNote[state] && <p className="k-note">{stateNote[state]}</p>}
            </nav>
          )}
        </main>
      )}

      {/* ---------- เช็คอิน: กล้องอย่างเดียว ---------- */}
      {screen === 'checkin' && (
        <main className="k-panel">
          {back}
          <div className="k-card center">
            <h2>{t('เช็คอินเข้างาน', 'Check in')}</h2>
            <p className="k-sub">{t('สแกน QR บัตรที่ได้จากการลงทะเบียน', 'Scan the QR ticket you received after registering')}</p>
            <Scanner onCode={checkIn} preview={preview} />
            {error && <p className="k-error" role="alert">{error}</p>}
          </div>
          {idleNote}
        </main>
      )}

      {/* ---------- ลงทะเบียนหน้างาน: QR อย่างเดียว ---------- */}
      {screen === 'register' && (
        <main className="k-panel">
          {back}
          <div className="k-card center">
            <h2>{t('ลงทะเบียนหน้างาน', 'Register on site')}</h2>
            <p className="k-sub">{t('สแกน QR ด้วยกล้องมือถือเพื่อลงทะเบียน แล้วนำ QR บัตรที่ได้มาเช็คอินที่ตู้นี้', 'Scan with your phone camera to register, then bring the QR ticket back here to check in')}</p>
            <QR big text={registerUrl} label={t('QR ลงทะเบียน', 'Registration QR')} />
          </div>
          {idleNote}
        </main>
      )}

      {/* ---------- แบบสอบถาม: QR อย่างเดียว ---------- */}
      {screen === 'survey' && (
        <main className="k-panel">
          {back}
          <div className="k-card center">
            <h2>{t('แบบสอบถาม', 'Survey')}</h2>
            <p className="k-sub">{isOpen ? t('สแกน QR ด้วยกล้องมือถือเพื่อตอบแบบสอบถาม', 'Scan with your phone camera to answer the survey') : t('สแกน QR ด้วยกล้องมือถือ (สำหรับผู้ลงทะเบียน ระบบจะให้ยืนยันก่อนตอบ)', 'Scan with your phone camera (registered attendees only, you will be asked to verify first)')}</p>
            <QR big text={surveyUrl} label={t('QR แบบสอบถาม', 'Survey QR')} />
          </div>
          {idleNote}
        </main>
      )}

      {/* ---------- เช็คอินสำเร็จ ---------- */}
      {screen === 'done' && done && (
        <main className="k-panel">
          <div className="k-card center k-success">
            <span className="k-check" aria-hidden><Icon name="check" size={88} /></span>
            <p className="k-eyebrow">{t('เช็คอินสำเร็จ', 'Check-in successful')}</p>
            <h2 className="k-welcome">{done.name}</h2>
            <p className="k-sub">{done.message}</p>
            <button type="button" className="k-btn primary" onClick={goHome}>{t('เสร็จสิ้น', 'Done')}{!preview && left > 0 && ' (' + left + ')'}</button>
          </div>
        </main>
      )}

      <footer className="k-foot">{t('แตะหน้าจอเพื่อเริ่มต้น', 'Tap the screen to start')} · Powered by WhatEvent</footer>
    </div>
  );
}
