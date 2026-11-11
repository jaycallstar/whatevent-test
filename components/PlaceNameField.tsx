'use client';
// ช่องชื่อสถานที่
//  - มี API key (ไม่บังคับ): พิมพ์แล้วมีรายการสถานที่จาก Google Places ให้เลือก เลือกแล้วเติม "ชื่อสถานที่" และ "ที่อยู่" ให้อัตโนมัติ
//  - ไม่มี API key: เป็นช่องพิมพ์ธรรมดา (Google ไม่เปิดข้อมูลที่อยู่ให้ดึงอัตโนมัติถ้าไม่มี key)
import { useRef, useState } from 'react';
import Icon from './Icon';
import { useLang } from '@/lib/i18n';
import { GOOGLE_KEY, loadGoogle } from '@/lib/maps';

export type PickedPlace = { name: string; address: string };
type Suggestion = { id: string; title: string; subtitle: string; pick: () => Promise<PickedPlace> };

async function searchGoogle(text: string): Promise<Suggestion[]> {
  const google = await loadGoogle();
  const { AutocompleteSuggestion } = await google.maps.importLibrary('places');
  const result = await AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: text, language: 'th' });
  return result.suggestions.filter((s: any) => s.placePrediction).slice(0, 6).map((s: any, i: number) => {
    const p = s.placePrediction;
    return {
      id: p.placeId || String(i),
      title: p.mainText ? p.mainText.text : p.text.text,
      subtitle: p.secondaryText ? p.secondaryText.text : '',
      pick: async () => {
        const place = p.toPlace();
        await place.fetchFields({ fields: ['displayName', 'formattedAddress'] });
        return { name: place.displayName, address: place.formattedAddress || '' };
      },
    };
  });
}

type Props = { label: string; value: string; placeholder: string; onText: (text: string) => void; onPick: (place: PickedPlace) => void };

export default function PlaceNameField({ label, value, placeholder, onText, onPick }: Props) {
  const { t } = useLang();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // รอ 0.4 วินาทีหลังหยุดพิมพ์ แล้วค่อยค้นหา (ไม่ค้นหาทุกตัวอักษร)
  function handleType(text: string) {
    onText(text);
    clearTimeout(timer.current);
    if (!GOOGLE_KEY || text.trim().length < 2) { setItems([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try { setItems(await searchGoogle(text)); } catch { setItems([]); }
      setOpen(true);
    }, 400);
  }

  async function choose(s: Suggestion) {
    setOpen(false);
    try { onPick(await s.pick()); } catch { onText(s.title); }
  }

  return (
    <label className="place-field">{label}
      <input value={value} placeholder={placeholder} autoComplete="off" onChange={(e) => handleType(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)} onFocus={() => items.length > 0 && setOpen(true)} />
      {open && items.length > 0 && (
        <div className="suggest" role="listbox">
          {items.map((s) => (
            <button key={s.id} type="button" role="option" aria-selected={false} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(s)}>
              <Icon name="pin" size={16} />
              <span><b>{s.title}</b><small>{s.subtitle}</small></span>
            </button>
          ))}
          <div className="suggest-foot">{t('ผลลัพธ์จาก Google Maps · เลือกแล้วระบบเติมที่อยู่ให้', 'Results from Google Maps · picking one fills in the address')}</div>
        </div>
      )}
    </label>
  );
}
