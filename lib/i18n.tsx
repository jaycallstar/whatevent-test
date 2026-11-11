'use client';
// ระบบสลับภาษา ไทย/อังกฤษ
// วิธีใช้ในหน้าไหนก็ได้:  const { t } = useLang();   แล้วเขียน  t('ข้อความไทย', 'English text')
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type Lang = 'th' | 'en';
type LangValue = { lang: Lang; setLang: (l: Lang) => void; t: (th: string, en: string) => string };

const LangContext = createContext<LangValue>({ lang: 'th', setLang: () => {}, t: (th) => th });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('th');

  // เปิดเว็บครั้งแรก: ดูว่าเคยเลือกภาษาไว้ไหม
  useEffect(() => {
    const saved = localStorage.getItem('we_lang');
    if (saved === 'en' || saved === 'th') setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem('we_lang', l);
  }

  // t(ไทย, อังกฤษ) -> คืนข้อความตามภาษาที่เลือก
  function t(th: string, en: string): string {
    return lang === 'en' ? en : th;
  }

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
