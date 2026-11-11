// ฟังก์ชันช่วยเล็ก ๆ ที่หลายหน้าใช้ร่วมกัน
import type { CSSProperties } from 'react';
import type { Lang } from './i18n';
import { fontOf } from './brand';
import type { EventItem } from './types';

// ---------- วันที่ ----------
export function locale(lang: Lang): string {
  return lang === 'en' ? 'en-GB' : 'th-TH';
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
export function hexToRgb(hex: string): number[] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const part = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + part(r) + part(g) + part(b);
}

// เลือกสีตัวอักษรที่อ่านออกบนพื้นสีนั้น (พื้นสว่าง -> ตัวอักษรเข้ม)
export function textOn(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160 ? '#172036' : '#ffffff';
}

// ความต่างของสี (WCAG) ใช้บอกว่าตัวอักษรบนสีธีมอ่านง่ายไหม (ตัวอักษรหนา/ใหญ่ ต้อง >= 3 · ตัวอักษรเล็กปกติ ต้อง >= 4.5)
export function contrastRatio(a: string, b: string): number {
  const lum = (hex: string) => {
    const c = hexToRgb(hex).map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const l1 = lum(a), l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// สีรองที่ใช้งานจริง: เปิดสีรองอยู่ -> สีรอง / ปิดอยู่ -> สีหลัก (ผลคือไม่ไล่เฉด)
export function secondColor(event: EventItem): string {
  return event.theme.useSecondary ? event.theme.accent2 : event.color;
}

// พื้นหลังหัวกิจกรรม: มีรูปที่อัปโหลดไว้ -> ใช้รูป (มีเงาตามที่ตั้ง) / ไม่มีรูป -> ไล่เฉดจากสีหลักไปเฉดเข้ม
export function heroBackground(event: EventItem): string {
  const th = event.theme;
  if (event.banner) {
    const a = (th.overlay / 100).toFixed(2);
    return 'linear-gradient(90deg, rgba(8,14,30,' + a + '), rgba(8,14,30,' + (th.overlay / 250).toFixed(2) + ')), url("' + event.banner + '") center / cover';
  }
  return 'linear-gradient(135deg, ' + event.color + ', ' + secondColor(event) + ')';
}

// สไตล์ของหัวกิจกรรม
export function heroStyle(event: EventItem): CSSProperties {
  return { background: heroBackground(event), color: event.banner ? '#fff' : textOn(event.color) };
}

// ตัวแปรสีธีมของงาน (ส่งให้ CSS ใช้ผ่าน var(--accent)) ใช้ในหน้าหลังบ้าน
export function themeStyle(event: EventItem): CSSProperties {
  return { '--accent': event.color, '--on-accent': textOn(event.color), '--accent2': secondColor(event) } as CSSProperties;
}

// สไตล์แบรนด์ (สี + ฟอนต์) ใช้ในหน้าผู้เข้าร่วม, Kiosk และตัวอย่างในหน้าแบรนด์
export function brandStyle(event: EventItem): CSSProperties {
  return { ...themeStyle(event), '--brand-font': fontOf(event.theme.font).css } as CSSProperties;
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
  return [p.location, p.address].map((x) => (x || '').trim()).filter(Boolean).join(' ');
}

// ลิงก์แผนที่สำหรับฝังในหน้าเว็บ (iframe)
export function mapEmbedUrl(query: string): string {
  return query ? 'https://maps.google.com/maps?q=' + encodeURIComponent(query) + '&hl=th&z=16&output=embed' : '';
}

// ลิงก์เปิดใน Google Maps (แอป/เว็บ) เพื่อนำทาง
export function mapLinkUrl(query: string): string {
  return query ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query) : '';
}
