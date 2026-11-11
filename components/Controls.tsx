'use client';
// ตัวควบคุมเล็ก ๆ ที่ใช้ซ้ำ: Segmented (ปุ่มเลือกแบบแถบ) และ Switch (สวิตช์เปิด/ปิด)
import { ReactNode } from 'react';

type Option<T extends string> = { value: T; label: ReactNode };

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: Option<T>[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode }) {
  return (
    <label className="switch-row">
      <span className="switch-text">
        <span>{label}</span>
        {hint && <small className="hint">{hint}</small>}
      </span>
      <input type="checkbox" role="switch" className="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
