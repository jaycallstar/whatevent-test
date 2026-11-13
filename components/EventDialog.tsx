'use client';
// กล่องสร้าง / แก้ไขกิจกรรม (admin): ชื่อ วันเวลา จำนวนที่นั่ง รูปแบบงาน และผู้ดูแล
// รายละเอียดอื่น (สถานที่ แบรนด์ แบบสอบถาม) เป็นหน้าที่ของ user ที่ได้รับมอบหมาย
import { FormEvent, useEffect, useState } from 'react';
import Icon from './Icon';
import { toInputValue } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { Access, EventItem, User } from '@/lib/types';

type Draft = { title: string; startAt: string; endAt: string; capacity: number; access: Access; userIds: string[] };
type Props = { initial: Draft; staff: User[]; editing: boolean; onSave: (d: Draft) => void; onClose: () => void };

export type { Draft as EventDraft };

// ดึงเฉพาะค่าที่แก้ในกล่องนี้ออกมาจากกิจกรรม
export function draftOf(e: EventItem): Draft {
  return { title: e.title, startAt: e.startAt, endAt: e.endAt, capacity: e.capacity, access: e.access, userIds: e.userIds.slice() };
}

export default function EventDialog({ initial, staff, editing, onSave, onClose }: Props) {
  const { t } = useLang();
  const [d, setD] = useState<Draft>(initial);
  const [error, setError] = useState('');
  const accessList: Access[] = ['closed', 'open'];

  // กด Esc เพื่อปิดกล่อง
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!d.title.trim()) {
      setError(t('กรุณาใส่ชื่อกิจกรรม', 'Please enter an event name'));
      return;
    }
    if (d.endAt <= d.startAt) {
      setError(t('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม', 'The end must be after the start'));
      return;
    }
    onSave({ ...d, title: d.title.trim() });
  }

  // เปลี่ยนเวลาเริ่ม / สิ้นสุด (ถ้าช่องถูกล้างให้ไม่เปลี่ยนค่า)
  function changeStart(value: string) {
    if (value) setD({ ...d, startAt: new Date(value).toISOString() });
  }
  function changeEnd(value: string) {
    if (value) setD({ ...d, endAt: new Date(value).toISOString() });
  }

  // กดเลือก / เอาออก ผู้ดูแลคนหนึ่ง
  function toggle(id: string) {
    const next: string[] = [];
    if (d.userIds.includes(id)) {
      // มีอยู่แล้ว -> เอาออก
      for (const x of d.userIds) {
        if (x !== id) next.push(x);
      }
    } else {
      // ยังไม่มี -> เพิ่มเข้าไป
      for (const x of d.userIds) next.push(x);
      next.push(id);
    }
    setD({ ...d, userIds: next });
  }

  return (
    <div className="modal-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="modal card stack" role="dialog" aria-modal="true" aria-labelledby="ev-dialog-title" onSubmit={submit}>
        <div className="card-head">
          <h2 id="ev-dialog-title">{editing ? t('แก้ไขกิจกรรม', 'Edit event') : t('สร้างกิจกรรมใหม่', 'Create an event')}</h2>
          <button type="button" className="icon-btn ghost" onClick={onClose} aria-label={t('ปิด', 'Close')}><Icon name="x" size={18} /></button>
        </div>
        <label>{t('ชื่อกิจกรรม', 'Event name')}<input autoFocus value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder={t('เช่น Tech Meetup 2026', 'e.g. Tech Meetup 2026')} /></label>
        <div className="grid">
          <label>{t('เริ่ม', 'Starts')}<input type="datetime-local" value={toInputValue(d.startAt)} onChange={(e) => changeStart(e.target.value)} /></label>
          <label>{t('สิ้นสุด', 'Ends')}<input type="datetime-local" value={toInputValue(d.endAt)} onChange={(e) => changeEnd(e.target.value)} /></label>
        </div>
        <div className="grid">
          <label>{t('จำนวนที่นั่ง', 'Capacity')}<input type="number" min={1} value={d.capacity} onChange={(e) => setD({ ...d, capacity: Math.max(1, Number(e.target.value)) })} /></label>
          <div className="stack-sm">
            <span className="field-label">{t('รูปแบบงาน', 'Access')}</span>
            <div className="segmented" role="radiogroup" aria-label={t('รูปแบบงาน', 'Access')}>
              {accessList.map((a) => (
                <button key={a} type="button" role="radio" aria-checked={d.access === a} className={d.access === a ? 'on' : ''} onClick={() => setD({ ...d, access: a })}>
                  <Icon name={a === 'open' ? 'unlock' : 'lock'} size={15} /> {a === 'open' ? t('งานเปิด', 'Open') : t('งานปิด', 'Closed')}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="stack-sm">
          <span className="field-label">{t('ผู้ดูแลกิจกรรม', 'Managers')}</span>
          {staff.length === 0 && <p className="hint">{t('ยังไม่มีผู้ใช้ role user — เพิ่มได้ที่ “มอบหมายผู้ดูแล” แท็บผู้ใช้งาน', 'No user accounts yet — add them in “Admin assignment”, Users tab')}</p>}
          <div className="pick-list">
            {staff.map((u) => (
              <button key={u.id} type="button" className={d.userIds.includes(u.id) ? 'pick on' : 'pick'} aria-pressed={d.userIds.includes(u.id)} onClick={() => toggle(u.id)}>
                <Icon name={d.userIds.includes(u.id) ? 'check' : 'user'} size={15} /> {u.name}
              </button>
            ))}
          </div>
        </div>
        {error && <div className="alert" role="alert"><Icon name="alert" size={16} /> {error}</div>}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn" onClick={onClose}>{t('ยกเลิก', 'Cancel')}</button>
          <button className="btn primary">{editing ? t('บันทึก', 'Save') : t('สร้างกิจกรรม', 'Create event')}</button>
        </div>
      </form>
    </div>
  );
}
