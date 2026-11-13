'use client';
// แบรนด์ของงาน: สีหลัก + สีรอง (กำหนดเป็น RGB/HEX ได้ สีรองปิดได้) ฟอนต์ และรูปภาพ — ฝั่งซ้ายตั้งค่าเป็นแท็บ ฝั่งขวาเห็นตัวอย่างบนมือถือทันที
// (ไม่มีสไตล์ปุ่ม / ความโค้งมุม: ใช้ค่ามาตรฐานของเว็บ)
import { useEffect, useState } from 'react';
import BrandPreview from '@/components/BrandPreview';
import ColorField from '@/components/ColorField';
import Icon from '@/components/Icon';
import ImageField from '@/components/ImageField';
import NoEvent from '@/components/NoEvent';
import PageHeader from '@/components/PageHeader';
import { fonts, loadFont, secondOf } from '@/lib/brand';
import { useEvents } from '@/lib/eventContext';
import { useLang } from '@/lib/i18n';


export default function BrandingPage() {
  const { t } = useLang();
  const { current, updateCurrent } = useEvents();
  const [tab, setTab] = useState('color'); // 'color' | 'type' | 'images'
 
  // หน้านี้ต้องโชว์ตัวอย่างทุกฟอนต์ เลยโหลดทุกฟอนต์ตอนเปิดหน้า
  useEffect(() => {
    fonts.forEach((f) => loadFont(f.key));
  }, []);
 
  // ถ้ายังไม่ได้เลือกงาน ให้โชว์หน้า NoEvent
  if (!current) {
    return <NoEvent />;
  }
  const event = current;
 
  // ---------- ฟังก์ชันแก้ค่าแต่ละอย่าง ----------
 
  // เปลี่ยนสีหลัก
  // ถ้าสีรองยังเป็นสีที่คำนวณจากสีหลักเดิม (ผู้ใช้ยังไม่เคยแก้เอง) ให้คำนวณสีรองใหม่ตามสีหลักใหม่
  // ถ้าผู้ใช้เลือกสีรองเองไว้แล้ว ก็ไม่ต้องเปลี่ยน
  function changeColor(hex: string) {
    const userNeverEditedSecond = event.theme.accent2 === secondOf(event.color);
    const newSecond = userNeverEditedSecond ? secondOf(hex) : event.theme.accent2;
    updateCurrent({
      ...event,
      color: hex,
      theme: { ...event.theme, accent2: newSecond },
    });
  }
 
  function changeSecondColor(hex: string) {
    updateCurrent({ ...event, theme: { ...event.theme, accent2: hex } });
  }
 
  function toggleSecondColor(on: boolean) {
    updateCurrent({ ...event, theme: { ...event.theme, useSecondary: on } });
  }
 
  function changeFont(fontKey: string) {
    updateCurrent({ ...event, theme: { ...event.theme, font: fontKey } });
  }
 
  function changeTagline(text: string) {
    updateCurrent({ ...event, theme: { ...event.theme, tagline: text } });
  }
 
  function changeOverlay(value: number) {
    updateCurrent({ ...event, theme: { ...event.theme, overlay: value } });
  }
 
  function changeLogo(value: any) {
    updateCurrent({ ...event, logo: value });
  }
 
  function changeBanner(value: any) {
    updateCurrent({ ...event, banner: value });
  }
 
  // ---------- ข้อมูลปุ่มแท็บ ----------
  const tabs = [
    { value: 'color', label: t('สี', 'Color'), icon: 'palette' },
    { value: 'type', label: t('ตัวอักษร', 'Typography'), icon: 'type' },
    { value: 'images', label: t('รูปภาพ', 'Images'), icon: 'image' },
  ];
 
  return (
    <div className="stack">
      <PageHeader
        title={t('แบรนด์', 'Branding')}
        subtitle={t(
          'ใช้กับหน้าลงทะเบียน แบบสอบถาม และตู้ Kiosk · บันทึกอัตโนมัติ',
          'Applied to registration, survey and kiosk · Saved automatically'
        )}
      />
 
      <div className="brand-layout">
        {/* ฝั่งซ้าย: แท็บ + เนื้อหาของแท็บ */}
        <div className="stack">
          <div className="tabbar" role="tablist" aria-label={t('หมวดการตั้งค่า', 'Settings sections')}>
            {tabs.map((item) => (
              <button
                key={item.value}
                role="tab"
                aria-selected={tab === item.value}
                className={tab === item.value ? 'tab on' : 'tab'}
                onClick={() => setTab(item.value)}
              >
                <Icon name={item.icon} size={16} /> {item.label}
              </button>
            ))}
          </div>
 
          {/* แท็บสี */}
          {tab === 'color' && (
            <div className="card color-card">
              <ColorField
                label={t('สีหลัก', 'Main color')}
                value={event.color}
                onChange={changeColor}
              />
              <ColorField
                label={t('สีรอง', 'Secondary color')}
                value={event.theme.accent2}
                onChange={changeSecondColor}
                enabled={event.theme.useSecondary}
                onToggle={toggleSecondColor}
              />
            </div>
          )}
 
          {/* แท็บตัวอักษร */}
          {tab === 'type' && (
            <div className="card stack">
              <div className="stack-sm">
                <b>{t('ฟอนต์ของงาน', 'Event font')}</b>
                <p className="hint">
                  {t(
                    'ใช้ในหน้าผู้เข้าร่วมและตู้ Kiosk (เมนูหลังบ้านใช้ฟอนต์เดิม)',
                    'Used on attendee pages and the kiosk (the admin area keeps its own font)'
                  )}
                </p>
                <div className="font-grid" role="radiogroup" aria-label={t('ฟอนต์', 'Font')}>
                  {fonts.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      role="radio"
                      aria-checked={event.theme.font === f.key}
                      className={event.theme.font === f.key ? 'font-card on' : 'font-card'}
                      onClick={() => changeFont(f.key)}
                    >
                      <span className="font-sample" style={{ fontFamily: f.css }}>
                        กิจกรรม Aa
                      </span>
                      <small>{f.name}</small>
                    </button>
                  ))}
                </div>
              </div>
 
              <label>
                {t('สโลแกน (ข้อความสั้นใต้ชื่องาน)', 'Tagline (short text under the event name)')}
                <input
                  value={event.theme.tagline}
                  maxLength={60}
                  onChange={(e) => changeTagline(e.target.value)}
                  placeholder={t('เช่น Connect · Create · Inspire', 'e.g. Connect · Create · Inspire')}
                />
                <span className="hint">{event.theme.tagline.length}/60</span>
              </label>
            </div>
          )}
 
          {/* แท็บรูปภาพ */}
          {tab === 'images' && (
            <div className="grid2">
              <div className="card">
                <ImageField
                  label={t('โลโก้', 'Logo')}
                  hint={t(
                    'แนะนำ 512 × 512 px (จัตุรัส 1:1) ไฟล์ไม่เกิน 500 KB',
                    'Recommended 512 × 512 px (square 1:1), up to 500 KB'
                  )}
                  value={event.logo}
                  onChange={changeLogo}
                />
              </div>
 
              <div className="card stack-sm">
                <ImageField
                  label={t('ภาพพื้นหลังหัวกิจกรรม', 'Header background')}
                  hint={t(
                    'แนะนำ 1200 × 400 px (3:1) ไฟล์ไม่เกิน 500 KB · ถ้าไม่ใส่จะใช้สีหลักแทน',
                    'Recommended 1200 × 400 px (3:1), up to 500 KB · without it the main color is used'
                  )}
                  value={event.banner}
                  onChange={changeBanner}
                />
 
                {/* สไลเดอร์เงา โชว์เฉพาะตอนมีรูปพื้นหลัง */}
                {event.banner && (
                  <label>
                    {t('ความเข้มของเงาบนรูป', 'Image shade')}{' '}
                    <span className="muted small">{event.theme.overlay}%</span>
                    <input
                      type="range"
                      min={0}
                      max={90}
                      value={event.theme.overlay}
                      onChange={(e) => changeOverlay(Number(e.target.value))}
                    />
                    <span className="hint">
                      {t(
                        'เพิ่มเงาเมื่อรูปสว่าง เพื่อให้ตัวอักษรสีขาวอ่านชัด',
                        'Add shade on bright images so white text stays readable'
                      )}
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>
 
        {/* ฝั่งขวา: ตัวอย่างบนมือถือ */}
        <aside className="brand-preview" aria-label={t('ตัวอย่าง', 'Preview')}>
          <p className="small muted center-text">{t('ตัวอย่างบนมือถือผู้เข้าร่วม', 'Attendee mobile preview')}</p>
          <BrandPreview event={event} />
        </aside>
      </div>
    </div>
  );
}