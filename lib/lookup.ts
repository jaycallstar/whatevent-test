// ค้นหาผู้ลงทะเบียนจาก "รหัสบัตร / อีเมล / เบอร์โทร" (ใช้ที่ตู้ Kiosk และหน้าแบบสอบถามของงานปิด)
import { readStore } from './db';
import type { Registration } from './types';

// เอาเฉพาะตัวเลขออกมา เช่น "081-234-5678" -> "0812345678"
function digits(s: string): string {
  return s.replace(/\D/g, '');
}

export function findRegistration(eventId: string, raw: string): Registration | null {
  const value = raw.trim();
  if (!value) return null;

  const all = readStore<Registration>('registrations');
  for (const r of all) {
    // ดูเฉพาะผู้ลงทะเบียนของงานนี้
    if (r.eventId !== eventId) continue;

    // 1) ตรงกับรหัสบัตร
    if (r.ticket.toUpperCase() === value.toUpperCase()) return r;

    // 2) ตรงกับอีเมล
    if (r.email && r.email.toLowerCase() === value.toLowerCase()) return r;

    // 3) ตรงกับเบอร์โทร (ต้องพิมพ์ตัวเลขอย่างน้อย 9 ตัว)
    if (digits(value).length >= 9 && digits(r.phone) === digits(value)) return r;
  }
  return null;
}
