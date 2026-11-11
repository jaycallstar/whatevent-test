'use client';
// ตัวเลือกสี 1 สี (ใช้ทั้งสีหลักและสีรอง) แบบกระชับ: หัวข้อ (+ สวิตช์เปิด/ปิดสำหรับสีรอง) และ "ปุ่มสี" (จุดสี + รหัส HEX)
// กดปุ่มแล้วมีกล่องเด้งขึ้นมาให้ปรับ: แถบเลื่อน R G B + ช่องตัวเลข, รหัส HEX และจานสี
// ปิดกล่องด้วยปุ่ม "เสร็จ" / กดนอกกล่อง / กด Esc
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { hexToRgb, rgbToHex } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';

const channels = [{ key: 'R', name: 'Red' }, { key: 'G', name: 'Green' }, { key: 'B', name: 'Blue' }];

// enabled / onToggle: ใส่เมื่อสีนี้ปิดได้ (สีรอง) · ปิดอยู่ = ปุ่มสีกดไม่ได้
type Props = { label: string; value: string; onChange: (hex: string) => void; enabled?: boolean; onToggle?: (on: boolean) => void };

export default function ColorField({ label, value, onChange, enabled = true, onToggle }: Props) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const rgb = hexToRgb(value);
  const [text, setText] = useState(value.toUpperCase());
  useEffect(() => { setText(value.toUpperCase()); }, [value]);
  useEffect(() => { if (!enabled) setOpen(false); }, [enabled]);

  // กดนอกกล่อง หรือกด Esc -> ปิด (Esc คืนโฟกัสให้ปุ่ม)
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', down); document.removeEventListener('keydown', key); };
  }, [open]);

  // พิมพ์รหัสสีเอง: รับ #RRGGBB หรือ RRGGBB เมื่อครบ 6 หลักจึงเปลี่ยนสีจริง
  function typeHex(raw: string) {
    setText(raw);
    const m = raw.trim().match(/^#?([0-9a-fA-F]{6})$/);
    if (m) onChange('#' + m[1].toLowerCase());
  }
  const valid = /^#?[0-9a-fA-F]{6}$/.test(text.trim());

  function setChannel(i: number, raw: number) {
    const v = Math.max(0, Math.min(255, Math.round(Number.isFinite(raw) ? raw : 0)));
    const next = [...rgb];
    next[i] = v;
    onChange(rgbToHex(next[0], next[1], next[2]));
  }
  // พื้นแถบเลื่อนไล่จาก 0 ถึง 255 ของช่องนั้น โดยช่องอื่นคงที่ ให้เห็นผลก่อนเลื่อน
  const track = (i: number) => {
    const lo = [...rgb], hi = [...rgb];
    lo[i] = 0; hi[i] = 255;
    return 'linear-gradient(90deg, rgb(' + lo.join(',') + '), rgb(' + hi.join(',') + '))';
  };

  return (
    <div className="color-tile" ref={wrap}>
      <div className="color-tile-head">
        <b>{label}</b>
        {onToggle && (
          <label className="color-switch">
            <span>{enabled ? t('เปิด', 'On') : t('ปิด', 'Off')}</span>
            <input type="checkbox" role="switch" className="switch" checked={enabled} onChange={(e) => onToggle(e.target.checked)} aria-label={label + ' ' + t('เปิด/ปิด', 'on/off')} />
          </label>
        )}
      </div>

      <button type="button" ref={btn} className={open ? 'color-btn open' : 'color-btn'} disabled={!enabled} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)}
        title={enabled ? t('กดเพื่อปรับสี', 'Click to adjust') : undefined}>
        <span className={enabled ? 'color-dot' : 'color-dot off'} style={enabled ? { background: value } : undefined} />
        <span className="color-code">{enabled ? value.toUpperCase() : t('ปิดอยู่ (ใช้สีหลักสีเดียว)', 'Off (main color only)')}</span>
        {enabled && <Icon name="chevron" size={16} />}
      </button>

      {open && enabled && (
        <div className="color-pop" role="dialog" aria-label={t('ปรับ', 'Adjust ') + label}>
          <div className="color-pop-top">
            <label className="color-hex">
              <span className="sr-only">{t('รหัสสี HEX', 'HEX code')}</span>
              <input value={text} onChange={(e) => typeHex(e.target.value)} maxLength={7} spellCheck={false} aria-invalid={!valid} placeholder="#4A74FF" autoFocus />
            </label>
            <label className="color-picker-btn" title={t('จานสี', 'Color picker')}>
              <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={t('จานสี', 'Color picker')} />
              <Icon name="palette" size={18} /> {t('จานสี', 'Picker')}
            </label>
          </div>

          <div className="rgb-block" role="group" aria-label={label + ' RGB'}>
            {channels.map((c, i) => (
              <div key={c.key} className="rgb-line">
                <b className={'rgb-key ' + c.key.toLowerCase()} title={c.name}>{c.key}</b>
                <input type="range" className="rgb-range" min={0} max={255} value={rgb[i]} style={{ background: track(i) }}
                  aria-label={label + ' ' + c.name} onChange={(e) => setChannel(i, Number(e.target.value))} />
                <input type="number" className="rgb-num" min={0} max={255} value={rgb[i]} aria-label={label + ' ' + c.key}
                  onChange={(e) => setChannel(i, Number(e.target.value))} />
              </div>
            ))}
          </div>

          <div className="color-pop-foot">
            <button type="button" className="btn primary small-btn" onClick={() => { setOpen(false); btn.current?.focus(); }}>{t('เสร็จ', 'Done')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
