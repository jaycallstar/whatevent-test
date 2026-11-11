'use client';
// แบบสอบถาม: ออกแบบให้ใช้ง่าย — การ์ดชนิดคำถาม, แก้ตัวเลือกทีละช่อง, เลื่อนขึ้น/ลง, ทำซ้ำ
// และมีตัวอย่างหน้าที่ผู้ตอบเห็นแบบสด (จอใหญ่เห็นคู่กัน / จอเล็กกดสลับ) · บันทึกอัตโนมัติ
import { useState } from 'react';
import Link from 'next/link';
import { Segmented } from '@/components/Controls';
import Icon from '@/components/Icon';
import NoEvent from '@/components/NoEvent';
import PageHeader from '@/components/PageHeader';
import { newId, useStore } from '@/lib/db';
import { useEvents } from '@/lib/eventContext';
import { brandStyle } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { Question, QuestionType, Response } from '@/lib/types';

export default function QuestionsPage() {
  const { t } = useLang();
  const { current, updateCurrent } = useEvents();
  const [responses] = useStore<Response>('responses');
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [focus, setFocus] = useState(''); // ช่องที่ต้องโฟกัสหลังเพิ่ม เช่น "q1:2"
  const [answers, setAnswers] = useState<Record<string, string>>({}); // คำตอบในตัวอย่าง (ไม่บันทึก)
  if (!current) return <NoEvent />;
  const event = current;
  const qs = event.questions;
  const count = responses.filter((r) => r.eventId === event.id).length;

  const types: { type: QuestionType; icon: string; name: string; desc: string }[] = [
    { type: 'rating', icon: 'star', name: t('ให้คะแนน 1–5', 'Rating 1–5'), desc: t('วัดความพึงพอใจด้วยดาว', 'Measure satisfaction with stars') },
    { type: 'choice', icon: 'list', name: t('เลือกตอบ', 'Multiple choice'), desc: t('ให้เลือก 1 คำตอบจากตัวเลือก', 'Pick one answer from options') },
    { type: 'text', icon: 'type', name: t('พิมพ์ตอบ', 'Free text'), desc: t('ความคิดเห็น/ข้อเสนอแนะ', 'Comments and suggestions') },
  ];
  const typeOf = (q: Question) => types.find((x) => x.type === q.type)!;

  const save = (list: Question[]) => updateCurrent({ ...event, questions: list });
  const update = (id: string, changes: Partial<Question>) => save(qs.map((q) => (q.id === id ? { ...q, ...changes } : q)));

  function add(type: QuestionType) {
    const q: Question = { id: newId(), text: '', type, options: type === 'choice' ? [t('ตัวเลือก 1', 'Option 1'), t('ตัวเลือก 2', 'Option 2')] : [] };
    save([...qs, q]);
    setFocus(q.id + ':q');
  }
  function changeType(q: Question, type: QuestionType) {
    update(q.id, { type, options: type === 'choice' && q.options.filter((o) => o).length === 0 ? [t('ตัวเลือก 1', 'Option 1'), t('ตัวเลือก 2', 'Option 2')] : q.options });
  }
  function move(index: number, dir: -1 | 1) {
    const next = [...qs];
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item);
    save(next);
  }
  function duplicate(index: number) {
    const next = [...qs];
    next.splice(index + 1, 0, { ...qs[index], id: newId(), options: [...qs[index].options] });
    save(next);
  }
  function remove(q: Question) {
    if (q.text && !confirm(t('ลบคำถาม “', 'Delete “') + q.text + '”?')) return;
    save(qs.filter((x) => x.id !== q.id));
  }
  // ----- ตัวเลือกของคำถามแบบเลือกตอบ -----
  function setOption(q: Question, i: number, value: string) {
    const options = [...q.options];
    options[i] = value;
    update(q.id, { options });
  }
  function addOption(q: Question, at = q.options.length) {
    const options = [...q.options];
    options.splice(at, 0, '');
    update(q.id, { options });
    setFocus(q.id + ':' + at);
  }
  function removeOption(q: Question, i: number) {
    update(q.id, { options: q.options.filter((_, k) => k !== i) });
  }

  return (
    <div className="stack">
      <PageHeader title={t('แบบสอบถาม', 'Survey')} subtitle={event.title + ' · ' + qs.length + ' ' + t('คำถาม', 'questions') + ' · ' + count + ' ' + t('คนตอบแล้ว', 'responses') + ' · ' + t('บันทึกอัตโนมัติ', 'Saved automatically')}>
        <Link className="btn" href="/share"><Icon name="qr" size={16} /> QR</Link>
        <a className="btn" href={'/survey/' + event.id} target="_blank" rel="noreferrer"><Icon name="external" size={16} /> {t('เปิดหน้าแบบสอบถาม', 'Open survey')}</a>
      </PageHeader>

      <div className="alert info"><Icon name={event.access === 'open' ? 'unlock' : 'lock'} size={16} /> {event.access === 'open' ? t('งานเปิด: ใครก็ตอบได้ทันทีเมื่อสแกน QR แบบสอบถาม', 'Open event: anyone can answer right after scanning the survey QR') : t('งานปิด: ผู้ตอบต้องยืนยันว่าลงทะเบียนแล้ว (รหัสบัตร / อีเมล / เบอร์โทร) และตอบได้คนละ 1 ครั้ง', 'Closed event: respondents must verify their registration (ticket / email / phone) and can answer once')}</div>
      {count > 0 && <div className="alert info"><Icon name="info" size={16} /> {t('มีคนตอบแล้ว การเปลี่ยนชนิดหรือลบคำถามจะทำให้ผลของข้อนั้นไม่ตรงกับคำตอบเดิม', 'People have already answered. Changing the type or deleting a question can make earlier answers mismatch.')}</div>}

      <div className="view-switch">
        <Segmented label={t('มุมมอง', 'View')} value={view} onChange={setView} options={[{ value: 'edit', label: t('แก้ไข', 'Edit') }, { value: 'preview', label: t('ตัวอย่าง', 'Preview') }]} />
      </div>

      <div className="survey-layout" data-view={view}>
        {/* ---------- ตัวแก้ไข ---------- */}
        <div className="survey-editor stack">
          {qs.length === 0 && (
            <div className="card empty">
              <div className="empty-icon"><Icon name="clipboard" size={28} /></div>
              <h3>{t('ยังไม่มีคำถาม', 'No questions yet')}</h3>
              <p className="muted small">{t('เลือกชนิดคำถามด้านล่างเพื่อเริ่มสร้างแบบสอบถาม', 'Pick a question type below to start your survey')}</p>
            </div>
          )}

          {qs.map((q, index) => {
            const info = typeOf(q);
            const filled = q.options.filter((o) => o.trim()).length;
            return (
              <div key={q.id} className="card q-card">
                <div className="q-head">
                  <span className="q-num">{index + 1}</span>
                  <label className="q-type">
                    <span className="sr-only">{t('ชนิดคำถาม', 'Question type')}</span>
                    <Icon name={info.icon} size={16} />
                    <select value={q.type} onChange={(e) => changeType(q, e.target.value as QuestionType)}>
                      {types.map((x) => <option key={x.type} value={x.type}>{x.name}</option>)}
                    </select>
                  </label>
                  <div className="q-actions">
                    <button className="icon-btn ghost" disabled={index === 0} onClick={() => move(index, -1)} aria-label={t('เลื่อนขึ้น', 'Move up')} title={t('เลื่อนขึ้น', 'Move up')}><Icon name="up" size={16} /></button>
                    <button className="icon-btn ghost" disabled={index === qs.length - 1} onClick={() => move(index, 1)} aria-label={t('เลื่อนลง', 'Move down')} title={t('เลื่อนลง', 'Move down')}><Icon name="down" size={16} /></button>
                    <button className="icon-btn ghost" onClick={() => duplicate(index)} aria-label={t('ทำซ้ำ', 'Duplicate')} title={t('ทำซ้ำ', 'Duplicate')}><Icon name="copy" size={16} /></button>
                    <button className="icon-btn ghost danger" onClick={() => remove(q)} aria-label={t('ลบ', 'Delete')} title={t('ลบ', 'Delete')}><Icon name="trash" size={16} /></button>
                  </div>
                </div>

                <input className="q-text" value={q.text} autoFocus={focus === q.id + ':q'} onChange={(e) => update(q.id, { text: e.target.value })} placeholder={t('พิมพ์คำถาม...', 'Type your question...')} aria-label={t('คำถามข้อที่ ', 'Question ') + (index + 1)} />
                {!q.text.trim() && <span className="hint warn-text">{t('ยังไม่ได้พิมพ์คำถาม', 'Question text is empty')}</span>}

                {q.type === 'rating' && (
                  <div className="q-preview stars static" aria-hidden>{[1, 2, 3, 4, 5].map((n) => <Icon key={n} name="star" size={24} />)}<span className="hint">{t('ผู้ตอบแตะดาว 1–5', 'Respondents tap 1–5 stars')}</span></div>
                )}

                {q.type === 'choice' && (
                  <div className="opt-list">
                    {q.options.map((o, i) => (
                      <div key={i} className="opt-row">
                        <span className="opt-dot" aria-hidden />
                        <input value={o} autoFocus={focus === q.id + ':' + i} placeholder={t('ตัวเลือก ', 'Option ') + (i + 1)} aria-label={t('ตัวเลือก ', 'Option ') + (i + 1)}
                          onChange={(e) => setOption(q, i, e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(q, i + 1); } }} />
                        <button className="icon-btn ghost" onClick={() => removeOption(q, i)} aria-label={t('ลบตัวเลือก', 'Remove option')}><Icon name="x" size={15} /></button>
                      </div>
                    ))}
                    <button className="btn small-btn ghost-btn" onClick={() => addOption(q)}><Icon name="plus" size={14} /> {t('เพิ่มตัวเลือก', 'Add option')}</button>
                    {filled < 2 && <span className="hint warn-text">{t('ควรมีอย่างน้อย 2 ตัวเลือก', 'Add at least 2 options')}</span>}
                    <span className="hint">{t('เคล็ดลับ: กด Enter เพื่อเพิ่มตัวเลือกถัดไป', 'Tip: press Enter to add the next option')}</span>
                  </div>
                )}

                {q.type === 'text' && <div className="q-preview text-box">{t('ผู้ตอบพิมพ์ความคิดเห็นได้อิสระ (ไม่บังคับตอบ)', 'Respondents type freely (optional)')}</div>}
              </div>
            );
          })}

          <div className="card stack-sm">
            <b>{t('เพิ่มคำถาม', 'Add a question')}</b>
            <div className="type-cards">
              {types.map((x) => (
                <button key={x.type} type="button" className="type-card" onClick={() => add(x.type)}>
                  <span className="choice-icon"><Icon name={x.icon} size={20} /></span>
                  <b>{x.name}</b>
                  <span className="small muted">{x.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ---------- ตัวอย่างหน้าผู้ตอบ ---------- */}
        <aside className="survey-preview">
          <div className="sp-frame brand-scope" style={brandStyle(event)}>
            <div className="sp-head"><Icon name="eye" size={15} /> {t('ตัวอย่างที่ผู้ตอบเห็น', 'What respondents see')}</div>
            {qs.length === 0 && <p className="muted small">{t('เพิ่มคำถามแล้วตัวอย่างจะแสดงที่นี่', 'Add a question to see the preview')}</p>}
            {qs.map((q, i) => (
              <div key={q.id} className="sp-q">
                <b>{i + 1}. {q.text || <span className="muted">{t('(ยังไม่มีคำถาม)', '(empty)')}</span>}{q.type !== 'text' && <span className="req"> *</span>}</b>
                {q.type === 'rating' && (
                  <div className="stars">{[1, 2, 3, 4, 5].map((n) => (
                    <button type="button" key={n} aria-label={n + ' / 5'} className={Number(answers[q.id] || 0) >= n ? 'on' : ''} onClick={() => setAnswers({ ...answers, [q.id]: String(n) })}>
                      <Icon name="star" size={26} filled={Number(answers[q.id] || 0) >= n} />
                    </button>
                  ))}</div>
                )}
                {q.type === 'choice' && q.options.filter((o) => o.trim()).map((o) => (
                  <label key={o} className="check-row opt-pick"><input type="radio" name={'pv-' + q.id} checked={answers[q.id] === o} onChange={() => setAnswers({ ...answers, [q.id]: o })} /> {o}</label>
                ))}
                {q.type === 'text' && <textarea rows={2} placeholder={t('พิมพ์คำตอบ...', 'Type your answer...')} />}
              </div>
            ))}
            {qs.length > 0 && <span className="btn primary big" aria-hidden>{t('ส่งแบบสอบถาม', 'Submit survey')}</span>}
          </div>
        </aside>
      </div>
    </div>
  );
}
