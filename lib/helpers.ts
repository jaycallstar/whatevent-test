// ฟังก์ชันช่วยเล็ก ๆ ที่หลายหน้าใช้ร่วมกัน
import type { CSSProperties } from 'react';
import type { Lang } from './i18n';
import { fontOf } from './brand';
import type { EventItem } from './types';

// ---------- วันที่ ----------
export function locale(lang: Lang): string {
  if (lang === 'en') return 'en-GB';
  return 'th-TH';
}

export function formatDate(iso: string, lang: Lang): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString(locale(lang), { dateStyle: 'medium', timeStyle: 'short' });
}

// แปลงวันที่ให้ใส่ใน <input type="datetime-local"> ได้
export function toInputValue(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function newTicket(): string {
  return 'EV-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ---------- สี ----------
// แปลง "#rrggbb" เป็นตัวเลข [แดง, เขียว, น้ำเงิน]
export function hexToRgb(hex: string): number[] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

// แปลงตัวเลข 0-255 เป็นเลขฐาน 16 สองหลัก เช่น 10 -> "0a"
function toHexPart(v: number): string {
  let n = Math.round(v);
  if (n < 0) n = 0;
  if (n > 255) n = 255;
  let h = n.toString(16);
  if (h.length < 2) h = '0' + h;
  return h;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + toHexPart(r) + toHexPart(g) + toHexPart(b);
}

// เลือกสีตัวอักษรที่อ่านออกบนพื้นสีนั้น (พื้นสว่าง -> ตัวอักษรเข้ม)
export function textOn(hex: string): string {
  const rgb = hexToRgb(hex);
  const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
  if (brightness > 160) return '#172036';
  return '#ffffff';
}

// ค่าความสว่างของ 1 ช่องสี (ตามสูตร WCAG)
function channel(v: number): number {
  const x = v / 255;
  if (x <= 0.03928) return x / 12.92;
  return Math.pow((x + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
}

// ความต่างของสี (WCAG) ใช้บอกว่าตัวอักษรบนสีธีมอ่านง่ายไหม (ตัวอักษรหนา/ใหญ่ ต้อง >= 3 · ตัวอักษรเล็กปกติ ต้อง >= 4.5)
export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  let bright = l1;
  let dark = l2;
  if (l2 > l1) {
    bright = l2;
    dark = l1;
  }
  return (bright + 0.05) / (dark + 0.05);
}

// สีรองที่ใช้งานจริง: เปิดสีรองอยู่ -> สีรอง / ปิดอยู่ -> สีหลัก (ผลคือไม่ไล่เฉด)
export function secondColor(event: EventItem): string {
  if (event.theme.useSecondary) return event.theme.accent2;
  return event.color;
}

// พื้นหลังหัวกิจกรรม: มีรูปที่อัปโหลดไว้ -> ใช้รูป (มีเงาตามที่ตั้ง) / ไม่มีรูป -> ไล่เฉดจากสีหลักไปเฉดเข้ม
export function heroBackground(event: EventItem): string {
  const th = event.theme;
  if (event.banner) {
    const a = (th.overlay / 100).toFixed(2);
    const b = (th.overlay / 250).toFixed(2);
    return 'linear-gradient(90deg, rgba(8,14,30,' + a + '), rgba(8,14,30,' + b + ')), url("' + event.banner + '") center / cover';
  }
  return 'linear-gradient(135deg, ' + event.color + ', ' + secondColor(event) + ')';
}

// สไตล์ของหัวกิจกรรม
export function heroStyle(event: EventItem): CSSProperties {
  let textColor = textOn(event.color);
  if (event.banner) textColor = '#fff';
  return { background: heroBackground(event), color: textColor };
}

// ตัวแปรสีธีมของงาน (ส่งให้ CSS ใช้ผ่าน var(--accent)) ใช้ในหน้าหลังบ้าน
export function themeStyle(event: EventItem): CSSProperties {
  const style = {
    '--accent': event.color,
    '--on-accent': textOn(event.color),
    '--accent2': secondColor(event),
  } as CSSProperties;
  return style;
}

// สไตล์แบรนด์ (สี + ฟอนต์) ใช้ในหน้าผู้เข้าร่วม, Kiosk และตัวอย่างในหน้าแบรนด์
export function brandStyle(event: EventItem): CSSProperties {
  const style = { ...themeStyle(event), '--brand-font': fontOf(event.theme.font).css } as CSSProperties;
  return style;
}

// ---------- สถานะการรับลงทะเบียน ----------
export type RegState = 'open-event' | 'paused' | 'upcoming' | 'closed' | 'full' | 'open';

export function regState(event: EventItem, count: number, now = Date.now()): RegState {
  if (event.access === 'open') return 'open-event';
  if (event.regPaused) return 'paused';
  if (event.regOpenAt && now < Date.parse(event.regOpenAt)) return 'upcoming';
  if (event.regCloseAt && now > Date.parse(event.regCloseAt)) return 'closed';
  if (count >= event.capacity) return 'full';
  return 'open';
}

// ---------- สิทธิ์ ----------
// admin เห็นทุกกิจกรรม / user เห็นเฉพาะกิจกรรมที่ถูกมอบหมาย
export function canSee(event: EventItem, user: { id: string; role: string }): boolean {
  if (user.role === 'admin') return true;
  return event.userIds.includes(user.id);
}

// ---------- แผนที่ Google Maps (ไม่ต้องใช้ API key) ----------
// ใช้แผนที่ฝังของ Google Maps จากข้อความที่กรอก (ชื่อสถานที่ + ที่อยู่) Google ค้นหาและแสดงตำแหน่งให้เอง
type Place = { location: string; address: string };

export function placeQuery(p: Place): string {
  const parts: string[] = [];
  const loc = (p.location || '').trim();
  const addr = (p.address || '').trim();
  if (loc) parts.push(loc);
  if (addr) parts.push(addr);
  return parts.join(' ');
}

// ลิงก์แผนที่สำหรับฝังในหน้าเว็บ (iframe)
export function mapEmbedUrl(query: string): string {
  if (!query) return '';
  return 'https://maps.google.com/maps?q=' + encodeURIComponent(query) + '&hl=th&z=16&output=embed';
}

// ลิงก์เปิดใน Google Maps (แอป/เว็บ) เพื่อนำทาง
export function mapLinkUrl(query: string): string {
  if (!query) return '';
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
}
