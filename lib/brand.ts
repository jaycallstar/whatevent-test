// ค่าเริ่มต้นของแบรนด์/Kiosk + ฟอนต์ที่เลือกได้ + ฟังก์ชันเติมค่าที่ขาด (ข้อมูลเก่าใน LocalStorage)
import type { BrandTheme, EventItem, KioskSettings } from './types';

export const fonts = [
  { key: 'noto', name: 'Noto Sans Thai', css: "'Noto Sans Thai', 'Noto Sans', sans-serif", q: 'Noto+Sans+Thai:wght@400;500;600;700' },
  { key: 'plex', name: 'IBM Plex Sans Thai', css: "'IBM Plex Sans Thai', system-ui, sans-serif", q: 'IBM+Plex+Sans+Thai:wght@400;500;600' },
  { key: 'prompt', name: 'Prompt', css: "'Prompt', sans-serif", q: 'Prompt:wght@400;500;600' },
  { key: 'kanit', name: 'Kanit', css: "'Kanit', sans-serif", q: 'Kanit:wght@400;500;600' },
  { key: 'sarabun', name: 'Sarabun', css: "'Sarabun', sans-serif", q: 'Sarabun:wght@400;600' },
  { key: 'mitr', name: 'Mitr', css: "'Mitr', sans-serif", q: 'Mitr:wght@400;500' },
];

// หาฟอนต์จากรหัส ถ้าไม่เจอใช้ตัวแรก
export function fontOf(key: string) {
  for (const f of fonts) {
    if (f.key === key) return f;
  }
  return fonts[0];
}

// โหลดฟอนต์จาก Google Fonts เฉพาะตัวที่ใช้ (โหลดครั้งเดียว)
export function loadFont(key: string) {
  if (typeof document === 'undefined') return;
  const f = fontOf(key);
  const id = 'font-' + f.key;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=' + f.q + '&display=swap';
  document.head.appendChild(link);
}

export function defaultTheme(color = '#4a74ff'): BrandTheme {
  return { accent2: secondOf(color), useSecondary: true, font: 'noto', overlay: 55, tagline: '' };
}

export function defaultKiosk(): KioskSettings {
  return { bg: 'brand', image: '', walkIn: true, showStats: true, idle: 30 };
}

// แปลงตัวเลข 0-255 เป็นเลขฐาน 16 สองหลัก เช่น 10 -> "0a"
function toHex2(v: number): string {
  let h = Math.round(v).toString(16);
  if (h.length < 2) h = '0' + h;
  return h;
}

// สีรองเริ่มต้น: ผสมสีหลักกับกรมท่าธีมเว็บ 50% ได้เฉดเข้มที่เข้ากัน (ใช้เป็นค่าตั้งต้น ผู้ใช้เปลี่ยนเองได้ในหน้าแบรนด์)
// (ไม่เรียก hexToRgb จาก helpers.ts เพราะ helpers.ts import ไฟล์นี้อยู่แล้ว จะวนกันเอง)
export function secondOf(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  // สีกรมท่า #16244f
  const navyR = 0x16;
  const navyG = 0x24;
  const navyB = 0x4f;

  return '#' + toHex2(r * 0.5 + navyR * 0.5) + toHex2(g * 0.5 + navyG * 0.5) + toHex2(b * 0.5 + navyB * 0.5);
}

// เลือกเฉพาะค่าธีมที่ใช้ได้จริง (ค่าที่ผิดรูปแบบจะถูกทิ้ง)
function pickTheme(t?: Partial<BrandTheme>): Partial<BrandTheme> {
  if (!t) return {};
  const out: Partial<BrandTheme> = {};
  // สีรองต้องเป็นรูปแบบ #rrggbb เท่านั้น
  if (t.accent2 && /^#[0-9a-fA-F]{6}$/.test(t.accent2)) out.accent2 = t.accent2.toLowerCase();
  if (typeof t.useSecondary === 'boolean') out.useSecondary = t.useSecondary;
  if (t.font) out.font = t.font;
  if (typeof t.overlay === 'number') out.overlay = t.overlay;
  if (typeof t.tagline === 'string') out.tagline = t.tagline;
  return out;
}

// เติมค่าที่ขาดให้กิจกรรม (กันข้อมูลเก่าที่ยังไม่มีฟิลด์ใหม่พัง)
export function normalizeEvent(e: Partial<EventItem> & { id: string }): EventItem {
  const color = e.color || '#4a74ff';
  return {
    // ค่าเริ่มต้น (ถ้า e มีค่าของตัวเอง จะไปทับค่าเหล่านี้ที่ ...e)
    title: '', description: '', startAt: new Date().toISOString(), endAt: new Date().toISOString(), capacity: 100,
    location: '', address: '', directions: '', logo: '', banner: '', userIds: [], questions: [],
    access: 'closed', regOpenAt: '', regCloseAt: '', regPaused: false,
    ...e,
    color,
    // เก็บเฉพาะค่าที่ยังใช้ (สีรอง + เปิด/ปิดสีรอง ฟอนต์ เงาบนรูป สโลแกน) ค่าเก่าอย่างสไตล์/ความโค้งที่เคยบันทึกไว้จะถูกทิ้ง ถ้าไม่มีสีรองที่ใช้ได้จะคำนวณจากสีหลักให้
    theme: { ...defaultTheme(color), ...pickTheme(e.theme) },
    kiosk: { ...defaultKiosk(), ...(e.kiosk || {}) },
  } as EventItem;
}
