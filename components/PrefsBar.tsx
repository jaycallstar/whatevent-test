'use client';
// ปุ่มสลับภาษา (TH/EN) และโหมดสว่าง/มืด ใช้ได้ทุกหน้า
import { useEffect, useState } from 'react';
import Icon from './Icon';
import { useLang } from '@/lib/i18n';

// layout="split": ภาษาและธีมเป็นปุ่มเลือก 2 กลุ่มเต็มความกว้าง (ใช้ใน Sidebar)
export default function PrefsBar({ layout = 'inline' }: { layout?: 'inline' | 'split' }) {
  const { lang, setLang, t } = useLang();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === 'dark');
  }, []);

  function setTheme(nextDark: boolean) {
    const next = nextDark ? 'dark' : 'light';
    document.documentElement.dataset.theme = next; // CSS อ่านค่านี้เพื่อเปลี่ยนสี
    localStorage.setItem('we_theme', next);
    setDark(nextDark);
  }
  function toggleTheme() { setTheme(!dark); }

  if (layout === 'split') {
    return (
      <div className="prefs-split">
        <div className="seg" role="group" aria-label={t('ภาษา', 'Language')}>
          <button type="button" className={lang === 'th' ? 'on' : ''} aria-pressed={lang === 'th'} onClick={() => setLang('th')}>TH</button>
          <button type="button" className={lang === 'en' ? 'on' : ''} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
        </div>
        <div className="seg" role="group" aria-label={t('ธีม', 'Theme')}>
          <button type="button" className={!dark ? 'on' : ''} aria-pressed={!dark} onClick={() => setTheme(false)} aria-label={t('โหมดสว่าง', 'Light mode')} title={t('โหมดสว่าง', 'Light mode')}><Icon name="sun" size={16} /></button>
          <button type="button" className={dark ? 'on' : ''} aria-pressed={dark} onClick={() => setTheme(true)} aria-label={t('โหมดมืด', 'Dark mode')} title={t('โหมดมืด', 'Dark mode')}><Icon name="moon" size={16} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="prefs">
      <div className="seg" role="group" aria-label={t('ภาษา', 'Language')}>
        <button type="button" className={lang === 'th' ? 'on' : ''} onClick={() => setLang('th')}>TH</button>
        <button type="button" className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
      </div>
      <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={t('สลับโหมดสว่าง/มืด', 'Toggle light/dark mode')} title={t('สลับโหมดสว่าง/มืด', 'Toggle light/dark mode')}>
        <Icon name={dark ? 'sun' : 'moon'} />
      </button>
    </div>
  );
}
