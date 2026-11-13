// ส่งออกข้อมูลเป็นไฟล์ CSV และ Excel (.xlsx)
import { answersOf, insights, summarize } from './analytics';
import { formatDate } from './helpers';
import type { Lang } from './i18n';
import type { EventItem, Registration, Response } from './types';

type TFunc = (th: string, en: string) => string; // ฟังก์ชันแปลภาษาจาก useLang()
export type Sheet = { name: string; rows: string[][] };

// ---------- สร้างตารางข้อมูล (แถวแรกคือหัวตาราง) ----------
export function registrantRows(regs: Registration[], t: TFunc, lang: Lang): string[][] {
  const rows = [[t('ชื่อ', 'Name'), t('อีเมล', 'Email'), t('โทรศัพท์', 'Phone'), t('หน่วยงาน', 'Organization'), t('รหัสบัตร', 'Ticket'), t('ลงทะเบียนเมื่อ', 'Registered at'), t('ช่องทาง', 'Channel'), t('สถานะ', 'Status'), t('เช็คอินเมื่อ', 'Checked in at')]];

  for (const r of regs) {
    // ช่องทางที่ลงทะเบียน
    let channel = t('ออนไลน์', 'Online');
    if (r.source === 'kiosk') channel = 'Kiosk';

    // สถานะการเช็คอิน
    let status = t('ยังไม่เช็คอิน', 'Not checked in');
    if (r.checkedIn) status = t('เช็คอินแล้ว', 'Checked in');

    // เวลาเช็คอิน (ยังไม่เช็คอินให้เว้นว่าง)
    let checkedInAt = '';
    if (r.checkedInAt) checkedInAt = formatDate(r.checkedInAt, lang);

    rows.push([r.name, r.email, r.phone, r.org, r.ticket, formatDate(r.createdAt, lang), channel, status, checkedInAt]);
  }
  return rows;
}

export function surveyRows(event: EventItem, responses: Response[], t: TFunc, lang: Lang): string[][] {
  // หัวตาราง: เวลาที่ตอบ + ข้อความคำถามแต่ละข้อ
  const header = [t('เวลาที่ตอบ', 'Submitted at')];
  for (const q of event.questions) header.push(q.text);
  const rows = [header];

  // 1 คำตอบ = 1 แถว
  for (const r of responses) {
    const row = [formatDate(r.createdAt, lang)];
    for (const q of event.questions) row.push(r.answers[q.id] || '');
    rows.push(row);
  }
  return rows;
}

export function summaryRows(event: EventItem, regs: Registration[], responses: Response[], t: TFunc, lang: Lang): string[][] {
  const s = summarize(event, regs, responses);
  const rows: string[][] = [];

  rows.push([t('หัวข้อ', 'Item'), t('ค่า', 'Value')]);
  rows.push([t('ชื่อกิจกรรม', 'Event'), event.title]);
  rows.push([t('วัน-เวลา', 'Date & time'), formatDate(event.startAt, lang) + ' - ' + formatDate(event.endAt, lang)]);
  rows.push([t('สถานที่', 'Location'), event.location]);

  // รูปแบบงาน
  let accessText = t('งานปิด (ต้องลงทะเบียน)', 'Closed (registration required)');
  if (event.access === 'open') accessText = t('งานเปิด (ไม่ต้องลงทะเบียน)', 'Open (no registration)');
  rows.push([t('รูปแบบงาน', 'Access'), accessText]);

  // ช่วงรับลงทะเบียน (แสดงเฉพาะงานปิด)
  if (event.access === 'closed') {
    let openText = t('ทันที', 'Now');
    if (event.regOpenAt) openText = formatDate(event.regOpenAt, lang);
    let closeText = t('จนที่นั่งเต็ม', 'Until full');
    if (event.regCloseAt) closeText = formatDate(event.regCloseAt, lang);
    rows.push([t('ช่วงรับลงทะเบียน', 'Registration window'), openText + ' - ' + closeText]);
  }

  rows.push([t('จำนวนที่นั่ง', 'Capacity'), String(event.capacity)]);
  rows.push([t('ผู้ลงทะเบียน', 'Registrants'), String(s.total)]);
  rows.push([t('อัตราการจองที่นั่ง (%)', 'Seats booked (%)'), String(s.capacityPercent)]);
  rows.push([t('เช็คอินแล้ว', 'Checked in'), String(s.checkedIn)]);
  rows.push([t('อัตราการเข้างาน (%)', 'Check-in rate (%)'), String(s.checkInRate)]);
  rows.push([t('ตอบแบบสอบถาม', 'Survey responses'), String(s.responseCount)]);
  rows.push([t('อัตราการตอบ (%)', 'Response rate (%)'), String(s.responseRate)]);

  // คะแนนเฉลี่ย (ไม่มีข้อมูลให้ใส่ "-")
  let averageText = '-';
  if (s.average !== null) averageText = s.average.toFixed(2);
  rows.push([t('คะแนนเฉลี่ย (เต็ม 5)', 'Average rating (out of 5)'), averageText]);

  // สรุปคำถามแบบเลือกตอบ
  for (const q of event.questions) {
    if (q.type !== 'choice') continue;
    const answers = answersOf(responses, q.id);
    for (const o of q.options) {
      if (!o) continue; // ข้ามตัวเลือกที่ว่าง
      let count = 0;
      for (const a of answers) {
        if (a === o) count++;
      }
      rows.push([q.text + ' - ' + o, String(count)]);
    }
  }
  return rows;
}

// ข้อสังเกตอัตโนมัติ (1 แถว = 1 ข้อ)
export function insightRows(event: EventItem, regs: Registration[], responses: Response[], t: TFunc): string[][] {
  const rows: string[][] = [[t('ข้อสังเกต', 'Insight')]];
  const list = insights(event, regs, responses, t);
  for (const x of list) rows.push([x]);
  return rows;
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
  const lines: string[] = [];
  for (const row of rows) {
    // ครอบทุกช่องด้วย " และถ้าในข้อความมี " ให้เขียนเป็น ""
    const cells: string[] = [];
    for (const cell of row) {
      cells.push('"' + String(cell).replace(/"/g, '""') + '"');
    }
    lines.push(cells.join(','));
  }
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
  const cleaned = text.replace(/[\\/:*?"<>|]/g, '').trim();
  if (cleaned === '') return 'event';
  return cleaned;
}
