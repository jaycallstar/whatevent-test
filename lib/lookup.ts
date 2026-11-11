// ค้นหาผู้ลงทะเบียนจาก "รหัสบัตร / อีเมล / เบอร์โทร" (ใช้ที่ตู้ Kiosk และหน้าแบบสอบถามของงานปิด)
import { readStore } from './db';
import type { Registration } from './types';

const digits = (s: string) => s.replace(/\D/g, '');

export function findRegistration(eventId: string, raw: string): Registration | null {
  const value = raw.trim();
  if (!value) return null;
  const all = readStore<Registration>('registrations');
  return all.find((r) => r.eventId === eventId && (
    r.ticket.toUpperCase() === value.toUpperCase() ||
    (!!r.email && r.email.toLowerCase() === value.toLowerCase()) ||
    (digits(value).length >= 9 && digits(r.phone) === digits(value)))) || null;
}
