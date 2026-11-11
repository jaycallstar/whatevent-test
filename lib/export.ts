// ส่งออกข้อมูลเป็นไฟล์ CSV และ Excel (.xlsx)
import { answersOf, insights, summarize } from './analytics';
import { formatDate } from './helpers';
import type { Lang } from './i18n';
import type { EventItem, Registration, Response } from './types';

type T = (th: string, en: string) => string; // ฟังก์ชันแปลภาษาจาก useLang()
export type Sheet = { name: string; rows: string[][] };

// ---------- สร้างตารางข้อมูล (แถวแรกคือหัวตาราง) ----------
export function registrantRows(regs: Registration[], t: T, lang: Lang): string[][] {
  const rows = [[t('ชื่อ', 'Name'), t('อีเมล', 'Email'), t('โทรศัพท์', 'Phone'), t('หน่วยงาน', 'Organization'), t('รหัสบัตร', 'Ticket'), t('ลงทะเบียนเมื่อ', 'Registered at'), t('ช่องทาง', 'Channel'), t('สถานะ', 'Status'), t('เช็คอินเมื่อ', 'Checked in at')]];
  for (const r of regs) {
    rows.push([r.name, r.email, r.phone, r.org, r.ticket, formatDate(r.createdAt, lang), r.source === 'kiosk' ? 'Kiosk' : t('ออนไลน์', 'Online'),
      r.checkedIn ? t('เช็คอินแล้ว', 'Checked in') : t('ยังไม่เช็คอิน', 'Not checked in'), r.checkedInAt ? formatDate(r.checkedInAt, lang) : '']);
  }
  return rows;
}

export function surveyRows(event: EventItem, responses: Response[], t: T, lang: Lang): string[][] {
  const header = [t('เวลาที่ตอบ', 'Submitted at')];
  for (const q of event.questions) header.push(q.text);
  const rows = [header];
  for (const r of responses) {
    const row = [formatDate(r.createdAt, lang)];
    for (const q of event.questions) row.push(r.answers[q.id] || '');
    rows.push(row);
  }
  return rows;
}

export function summaryRows(event: EventItem, regs: Registration[], responses: Response[], t: T, lang: Lang): string[][] {
  const s = summarize(event, regs, responses);
  const rows: string[][] = [
    [t('หัวข้อ', 'Item'), t('ค่า', 'Value')],
    [t('ชื่อกิจกรรม', 'Event'), event.title],
    [t('วัน-เวลา', 'Date & time'), formatDate(event.startAt, lang) + ' - ' + formatDate(event.endAt, lang)],
    [t('สถานที่', 'Location'), event.location],
    [t('รูปแบบงาน', 'Access'), event.access === 'open' ? t('งานเปิด (ไม่ต้องลงทะเบียน)', 'Open (no registration)') : t('งานปิด (ต้องลงทะเบียน)', 'Closed (registration required)')],
    ...(event.access === 'closed' ? [[t('ช่วงรับลงทะเบียน', 'Registration window'), (event.regOpenAt ? formatDate(event.regOpenAt, lang) : t('ทันที', 'Now')) + ' - ' + (event.regCloseAt ? formatDate(event.regCloseAt, lang) : t('จนที่นั่งเต็ม', 'Until full'))]] : []),
    [t('จำนวนที่นั่ง', 'Capacity'), String(event.capacity)],
    [t('ผู้ลงทะเบียน', 'Registrants'), String(s.total)],
    [t('อัตราการจองที่นั่ง (%)', 'Seats booked (%)'), String(s.capacityPercent)],
    [t('เช็คอินแล้ว', 'Checked in'), String(s.checkedIn)],
    [t('อัตราการเข้างาน (%)', 'Check-in rate (%)'), String(s.checkInRate)],
    [t('ตอบแบบสอบถาม', 'Survey responses'), String(s.responseCount)],
    [t('อัตราการตอบ (%)', 'Response rate (%)'), String(s.responseRate)],
    [t('คะแนนเฉลี่ย (เต็ม 5)', 'Average rating (out of 5)'), s.average === null ? '-' : s.average.toFixed(2)],
  ];
  // สรุปคำถามแบบเลือกตอบ
  for (const q of event.questions) {
    if (q.type !== 'choice') continue;
    const answers = answersOf(responses, q.id);
    for (const o of q.options.filter((x) => x)) rows.push([q.text + ' - ' + o, String(answers.filter((a) => a === o).length)]);
  }
  return rows;
}

// ข้อสังเกตอัตโนมัติ (1 แถว = 1 ข้อ)
export function insightRows(event: EventItem, regs: Registration[], responses: Response[], t: T): string[][] {
  return [[t('ข้อสังเกต', 'Insight')], ...insights(event, regs, responses, t).map((x) => [x])];
}

// ---------- ดาวน์โหลดไฟล์ ----------
function saveBlob(blob: Blob, filename: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// CSV: เปิดใน Excel ได้ ภาษาไทยไม่เพี้ยนเพราะใส่ BOM ไว้หน้าไฟล์
export function downloadCsv(filename: string, rows: string[][]) {
  const lines = rows.map((row) => row.map((cell) => '"' + String(cell).replace(/"/g, '""') + '"').join(','));
  saveBlob(new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }), filename);
}

// Excel: ใส่ได้หลาย sheet (ใช้ไลบรารี xlsx โหลดเมื่อกดปุ่มเท่านั้น)
export async function downloadExcel(filename: string, sheets: Sheet[]) {
  const XLSX = await import('xlsx');
  const book = XLSX.utils.book_new();
  for (const s of sheets) {
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(s.rows), s.name);
  }
  XLSX.writeFile(book, filename);
}

// ชื่อไฟล์ที่ปลอดภัย (ตัดอักขระที่ใช้ไม่ได้)
export function safeName(text: string): string {
  return text.replace(/[\\/:*?"<>|]/g, '').trim() || 'event';
}
