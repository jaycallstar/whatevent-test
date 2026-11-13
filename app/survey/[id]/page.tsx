'use client';
// หน้าแบบสอบถามสำหรับผู้เข้าร่วมงาน (ไม่ต้อง login) เปิดจาก QR แบบสอบถาม
//  - งานเปิด: สแกน QR แล้วตอบได้ทันที
//  - งานปิด: ต้องยืนยันว่าลงทะเบียนแล้ว (รหัสบัตร / อีเมล / เบอร์โทร) ก่อนตอบ และตอบได้คนละ 1 ครั้ง
//    ลิงก์ที่มี ?t=รหัสบัตร (จากหน้าลงทะเบียนสำเร็จ / ตู้ Kiosk) จะยืนยันให้อัตโนมัติ
import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import EventHero from '@/components/EventHero';
import Icon from '@/components/Icon';
import PrefsBar from '@/components/PrefsBar';
import { newId, useStore } from '@/lib/db';
import { findRegistration } from '@/lib/lookup';
import { brandStyle } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { EventItem, Registration, Response } from '@/lib/types';

export default function SurveyPage() {
  const { t } = useLang();
  const params = useParams<{ id: string }>();
  const [events, , ready] = useStore<EventItem>('events');
  const [responses, setResponses] = useStore<Response>('responses');
  const [answers, setAnswers] = useState<Record<string, string>>({}); // { รหัสคำถาม: คำตอบ }
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [fromKiosk, setFromKiosk] = useState(false); // เปิดมาจากตู้ Kiosk -> ส่งเสร็จแล้วพากลับ
  const [code, setCode] = useState(''); // งานปิด: รหัสบัตร/อีเมล/เบอร์โทร ที่กรอก
  const [person, setPerson] = useState<Registration | null>(null); // งานปิด: ผู้ลงทะเบียนที่ยืนยันแล้ว

  // อ่านค่าจากลิงก์ (?from=kiosk และ ?t=รหัสบัตร)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setFromKiosk(q.get('from') === 'kiosk');
    const ticket = q.get('t');
    if (ticket) {
      setCode(ticket);
      setPerson(findRegistration(params.id, ticket));
    }
  }, [params.id]);

  // มาจากตู้ Kiosk และส่งเสร็จแล้ว -> รอ 8 วินาทีแล้วพากลับหน้า Kiosk
  useEffect(() => {
    if (!sent || !fromKiosk) return;
    const id = setTimeout(() => window.location.assign('/k/' + params.id), 8000);
    return () => clearTimeout(id);
  }, [sent, fromKiosk, params.id]);

  if (!ready) return <p className="center-msg">{t('กำลังโหลด...', 'Loading...')}</p>;

  // หากิจกรรมจากรหัสใน URL
  let found: EventItem | null = null;
  for (const e of events) {
    if (e.id === params.id) found = e;
  }
  if (!found) return <p className="center-msg">{t('ไม่พบกิจกรรมนี้ ลิงก์อาจไม่ถูกต้อง', 'Event not found. The link may be incorrect.')}</p>;
  const event: EventItem = found;

  const closed = event.access === 'closed';

  // ผู้ลงทะเบียนคนนี้เคยตอบแล้วหรือยัง
  let answered = false;
  if (person) {
    for (const r of responses) {
      if (r.eventId === event.id && r.registrationId === person.id) answered = true;
    }
  }

  // เลือกว่าจะแสดงหน้าไหน: ส่งแล้ว / ยืนยันตัวตน / ตอบแล้ว / ยังไม่มีคำถาม / ฟอร์มตอบ
  let view = 'form';
  if (sent) {
    view = 'sent';
  } else if (closed && !person) {
    view = 'verify';
  } else if (answered) {
    view = 'answered';
  } else if (event.questions.length === 0) {
    view = 'empty';
  }

  // งานปิด: ตรวจว่าที่กรอกมาตรงกับผู้ลงทะเบียนคนไหน
  function verify(e: FormEvent) {
    e.preventDefault();
    const hit = findRegistration(event.id, code);
    if (!hit) {
      setError(t('ไม่พบข้อมูลการลงทะเบียน งานนี้ต้องลงทะเบียนก่อนจึงจะตอบแบบสอบถามได้', 'No registration found. This event requires registration before answering the survey.'));
      return;
    }
    setError('');
    setPerson(hit);
  }

  function setAnswer(questionId: string, value: string) {
    setAnswers({ ...answers, [questionId]: value });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // คำถามให้คะแนนและเลือกตอบ ต้องตอบ / พิมพ์ตอบเว้นว่างได้
    for (const q of event.questions) {
      if (q.type !== 'text' && !answers[q.id]) {
        setError(t('กรุณาตอบ: ', 'Please answer: ') + q.text);
        return;
      }
    }
    if (closed && !person) return;

    let registrationId: string | undefined = undefined;
    if (person) registrationId = person.id;

    setResponses([...responses, { id: newId(), eventId: event.id, registrationId: registrationId, answers: answers, createdAt: new Date().toISOString() }]);
    setSent(true);
  }

  // ตัวเลือกที่ไม่ว่างของคำถามแบบเลือกตอบ
  function nonEmpty(options: string[]): string[] {
    const result: string[] = [];
    for (const o of options) {
      if (o) result.push(o);
    }
    return result;
  }

  return (
    <div className="public themed brand-scope" style={brandStyle(event)}>
      <div className="public-top"><PrefsBar /></div>
      <EventHero event={event} subtitle={t('แบบสอบถามหลังกิจกรรม', 'Post-event survey')} />

      {/* ---------- ส่งคำตอบแล้ว ---------- */}
      {view === 'sent' && (
        <div className="card stack-sm center-text">
          <div className="empty-icon" style={{ margin: '0 auto' }}><Icon name="check" size={28} /></div>
          <h2>{t('ขอบคุณสำหรับความคิดเห็น', 'Thank you for your feedback')}</h2>
          <p className="muted">{t('บันทึกคำตอบของคุณเรียบร้อยแล้ว', 'Your answers have been recorded.')}</p>
          {fromKiosk && <a className="btn primary big" href={'/k/' + event.id}>{t('กลับหน้า Kiosk', 'Back to kiosk')}</a>}
        </div>
      )}

      {/* ---------- งานปิด: ยืนยันการลงทะเบียนก่อน ---------- */}
      {view === 'verify' && (
        <form className="card stack-sm" onSubmit={verify}>
          <div className="status-card info" style={{ padding: 0 }}>
            <span className="status-icon"><Icon name="lock" size={24} /></span>
            <div className="stack-sm">
              <h2>{t('สำหรับผู้ลงทะเบียนเท่านั้น', 'Registered attendees only')}</h2>
              <p className="muted">{t('งานนี้เป็นงานปิด กรอกรหัสบัตร อีเมล หรือเบอร์โทรที่ใช้ลงทะเบียน เพื่อยืนยันก่อนตอบแบบสอบถาม', 'This is a closed event. Enter the ticket code, email or phone you registered with to continue.')}</p>
            </div>
          </div>
          <label>{t('รหัสบัตร / อีเมล / เบอร์โทร', 'Ticket code / email / phone')}<input required value={code} onChange={(e) => { setCode(e.target.value); setError(''); }} autoComplete="off" /></label>
          {error && <div className="alert" role="alert"><Icon name="alert" size={16} /> {error}</div>}
          <button className="btn primary big">{t('ยืนยันการลงทะเบียน', 'Verify registration')}</button>
          <a className="link-btn small" href={'/register/' + event.id} style={{ justifySelf: 'center' }}>{t('ยังไม่ได้ลงทะเบียน? ไปหน้าลงทะเบียน', 'Not registered? Go to registration')}</a>
        </form>
      )}

      {/* ---------- ตอบไปแล้ว ---------- */}
      {view === 'answered' && (
        <div className="card stack-sm center-text">
          <div className="empty-icon" style={{ margin: '0 auto' }}><Icon name="check" size={28} /></div>
          <h2>{t('คุณตอบแบบสอบถามนี้แล้ว', 'You have already answered this survey')}</h2>
          {person && <p className="muted">{person.name} · {person.ticket}</p>}
          {fromKiosk && <a className="btn primary big" href={'/k/' + event.id}>{t('กลับหน้า Kiosk', 'Back to kiosk')}</a>}
        </div>
      )}

      {/* ---------- ยังไม่มีคำถาม ---------- */}
      {view === 'empty' && <div className="card muted">{t('กิจกรรมนี้ยังไม่มีแบบสอบถาม', 'This event has no survey yet.')}</div>}

      {/* ---------- ฟอร์มตอบแบบสอบถาม ---------- */}
      {view === 'form' && (
        <form className="stack" onSubmit={handleSubmit}>
          {person && <div className="alert info"><Icon name="user" size={16} /><span>{t('ตอบในนามของ ', 'Answering as ')}<b>{person.name}</b> · {person.ticket}</span></div>}
          {event.questions.map((q) => (
            <div key={q.id} className="card stack-sm">
              <h3>{q.text}{q.type !== 'text' && <span className="req"> *</span>}</h3>

              {q.type === 'rating' && (
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button type="button" key={n} aria-label={n + ' / 5'} className={Number(answers[q.id] || 0) >= n ? 'on' : ''} onClick={() => setAnswer(q.id, String(n))}>
                      <Icon name="star" size={34} filled={Number(answers[q.id] || 0) >= n} />
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'choice' && nonEmpty(q.options).map((o) => (
                <label key={o} className="check-row opt-pick">
                  <input type="radio" name={q.id} checked={answers[q.id] === o} onChange={() => setAnswer(q.id, o)} /> {o}
                </label>
              ))}

              {q.type === 'text' && <textarea value={answers[q.id] || ''} onChange={(e) => setAnswer(q.id, e.target.value)} />}
            </div>
          ))}
          {error && <div className="alert">{error}</div>}
          <button className="btn primary big">{t('ส่งแบบสอบถาม', 'Submit survey')}</button>
        </form>
      )}
      <p className="foot">{t('จัดทำด้วย WhatEvent', 'Powered by WhatEvent')}</p>
    </div>
  );
}
