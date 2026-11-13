// ฟังก์ชันคำนวณตัวเลขสำหรับแดชบอร์ดและรายงาน (แยกไว้ให้อ่านง่าย ไม่ปนกับหน้าจอ)
import { locale } from './helpers';
import type { Lang } from './i18n';
import type { EventItem, Registration, Response } from './types';

export type ChartItem = { label: string; value: number };

// ฟังก์ชันแปลภาษาที่ได้จาก useLang()
type TFunc = (th: string, en: string) => string;

export function percent(part: number, total: number): number {
  if (total > 0) return Math.round((part / total) * 100);
  return 0;
}

// นับจำนวนรายการในแต่ละวัน ย้อนหลัง days วัน
export function countByDay(list: { createdAt: string }[], days: number, lang: Lang): ChartItem[] {
  const result: ChartItem[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    let count = 0;
    for (const item of list) {
      if (new Date(item.createdAt).toDateString() === day.toDateString()) count++;
    }
    result.push({ label: day.toLocaleDateString(locale(lang), { day: 'numeric', month: 'short' }), value: count });
  }
  return result;
}

// ยอดสะสม: เริ่มจากจำนวนที่ลงทะเบียนไว้ก่อนช่วงเวลานี้ แล้วบวกเพิ่มทีละวัน
export function cumulative(list: { createdAt: string }[], days: number, lang: Lang): ChartItem[] {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  // นับรายการที่มาก่อนวันเริ่มต้น
  let running = 0;
  for (const item of list) {
    if (new Date(item.createdAt) < start) running++;
  }

  // บวกยอดของแต่ละวันเพิ่มเข้าไปทีละวัน
  const daily = countByDay(list, days, lang);
  const result: ChartItem[] = [];
  for (const d of daily) {
    running += d.value;
    result.push({ label: d.label, value: running });
  }
  return result;
}

// นับตามวันในสัปดาห์ (อาทิตย์ = 0)
export function countByWeekday(list: { createdAt: string }[], labels: string[]): ChartItem[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const item of list) {
    counts[new Date(item.createdAt).getDay()]++;
  }
  const result: ChartItem[] = [];
  for (let i = 0; i < labels.length; i++) {
    result.push({ label: labels[i], value: counts[i] });
  }
  return result;
}

// นับตามช่วงเวลาของวัน: 0-6 / 6-12 / 12-18 / 18-24
export function countByTimeSlot(list: { createdAt: string }[], labels: string[]): ChartItem[] {
  const counts = [0, 0, 0, 0];
  for (const item of list) {
    counts[Math.floor(new Date(item.createdAt).getHours() / 6)]++;
  }
  const result: ChartItem[] = [];
  for (let i = 0; i < labels.length; i++) {
    result.push({ label: labels[i], value: counts[i] });
  }
  return result;
}

// นับค่าที่ซ้ำกัน เช่น หน่วยงาน แล้วเรียงจากมากไปน้อย (เอา top อันดับแรก)
export function groupCount(values: string[], top: number): ChartItem[] {
  const counts: Record<string, number> = {};
  for (const v of values) {
    let key = v.trim();
    if (key === '') key = '-';
    counts[key] = (counts[key] || 0) + 1;
  }

  const rows: ChartItem[] = [];
  for (const label of Object.keys(counts)) {
    rows.push({ label: label, value: counts[label] });
  }
  rows.sort((a, b) => b.value - a.value);
  return rows.slice(0, top);
}

// ---------- แบบสอบถาม ----------
// รวมคำตอบของคำถามข้อหนึ่ง (ตัดคำตอบว่างทิ้ง)
export function answersOf(responses: Response[], questionId: string): string[] {
  const list: string[] = [];
  for (const r of responses) {
    const a = r.answers[questionId];
    if (a) list.push(a);
  }
  return list;
}

// นับจำนวนคนที่ให้ 1-5 ดาว
export function ratingCounts(answers: string[]): ChartItem[] {
  const rows: ChartItem[] = [];
  for (let star = 1; star <= 5; star++) {
    let count = 0;
    for (const a of answers) {
      if (Number(a) === star) count++;
    }
    rows.push({ label: String(star), value: count });
  }
  return rows;
}

// นับว่าแต่ละตัวเลือกมีคนเลือกกี่คน แล้วเรียงจากมากไปน้อย
export function choiceCounts(options: string[], answers: string[]): ChartItem[] {
  const rows: ChartItem[] = [];
  for (const o of options) {
    if (!o) continue; // ข้ามตัวเลือกที่ว่าง
    let count = 0;
    for (const a of answers) {
      if (a === o) count++;
    }
    rows.push({ label: o, value: count });
  }
  rows.sort((a, b) => b.value - a.value);
  return rows;
}

// คะแนนเฉลี่ยของคำถามชนิดให้คะแนนข้อแรก (ไม่มีข้อมูลคืน null)
export function averageRating(event: EventItem, responses: Response[]): number | null {
  // หาคำถามชนิด rating ข้อแรก
  let ratingId = '';
  for (const q of event.questions) {
    if (q.type === 'rating') {
      ratingId = q.id;
      break;
    }
  }
  if (ratingId === '') return null;

  // เก็บเฉพาะคะแนนที่มากกว่า 0
  const scores: number[] = [];
  for (const a of answersOf(responses, ratingId)) {
    const n = Number(a);
    if (n > 0) scores.push(n);
  }
  if (scores.length === 0) return null;

  let sum = 0;
  for (const s of scores) sum += s;
  return sum / scores.length;
}

// ---------- ตัวเลขสรุปของกิจกรรม ----------
export function summarize(event: EventItem, regs: Registration[], responses: Response[]) {
  const total = regs.length;

  let checkedIn = 0;
  let today = 0;
  const todayText = new Date().toDateString();
  for (const r of regs) {
    if (r.checkedIn) checkedIn++;
    if (new Date(r.createdAt).toDateString() === todayText) today++;
  }

  const daysLeft = Math.ceil((new Date(event.startAt).getTime() - Date.now()) / 86400000);

  return {
    total: total,
    capacityPercent: percent(total, event.capacity),
    remaining: Math.max(0, event.capacity - total),
    checkedIn: checkedIn,
    checkInRate: percent(checkedIn, total),
    responseCount: responses.length,
    responseRate: percent(responses.length, total),
    average: averageRating(event, responses),
    today: today,
    daysLeft: daysLeft,
  };
}

// ---------- ใช้กับรายงาน ----------
// เก็บเฉพาะรายการในช่วง days วันล่าสุด (days = 0 คือทั้งหมด)
// (ใช้ <T> เพื่อให้ส่ง Registration หรือ Response เข้ามาแล้วได้ชนิดเดิมกลับไป)
export function within<T extends { createdAt: string }>(list: T[], days: number): T[] {
  if (!days) return list;
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const result: T[] = [];
  for (const x of list) {
    if (new Date(x.createdAt) >= start) result.push(x);
  }
  return result;
}

// หารายการที่ค่ามากที่สุด (ถ้าค่าสูงสุดเป็น 0 คืน null)
function findTop(items: ChartItem[]): ChartItem | null {
  let best: ChartItem | null = null;
  for (const it of items) {
    if (best === null || it.value > best.value) best = it;
  }
  if (best !== null && best.value > 0) return best;
  return null;
}

// สรุปข้อสังเกตอัตโนมัติ (เป็นประโยคอ่านง่าย) สำหรับหน้า "รายงาน"
export function insights(event: EventItem, regs: Registration[], responses: Response[], t: TFunc): string[] {
  const s = summarize(event, regs, responses);
  const out: string[] = [];

  if (s.total === 0) {
    out.push(t('ยังไม่มีผู้ลงทะเบียนในช่วงนี้ จึงยังสรุปผลไม่ได้', 'No registrations in this period yet, so there is nothing to summarise.'));
    return out;
  }

  // 1) จองที่นั่งไปกี่ %
  out.push(t('จองที่นั่งไปแล้ว ' + s.capacityPercent + '% (' + s.total + ' จาก ' + event.capacity + ' ที่นั่ง)', s.capacityPercent + '% of seats are booked (' + s.total + ' of ' + event.capacity + ').'));

  // 2) วันที่ลงทะเบียนมากที่สุด
  const weekdayNames = [t('วันอาทิตย์', 'Sunday'), t('วันจันทร์', 'Monday'), t('วันอังคาร', 'Tuesday'), t('วันพุธ', 'Wednesday'), t('วันพฤหัสบดี', 'Thursday'), t('วันศุกร์', 'Friday'), t('วันเสาร์', 'Saturday')];
  const wd = findTop(countByWeekday(regs, weekdayNames));
  if (wd) {
    out.push(t('คนลงทะเบียนมากที่สุดใน' + wd.label + ' (' + wd.value + ' คน)', 'Most people register on ' + wd.label + ' (' + wd.value + ').'));
  }

  // 3) ช่วงเวลาที่ลงทะเบียนมากที่สุด
  const slotNames = ['00:00–06:00', '06:00–12:00', '12:00–18:00', '18:00–24:00'];
  const slot = findTop(countByTimeSlot(regs, slotNames));
  if (slot) {
    out.push(t('ช่วงเวลาที่ลงทะเบียนมากที่สุดคือ ' + slot.label + ' น. เหมาะกับการโพสต์ประชาสัมพันธ์', 'Peak sign-up time is ' + slot.label + ', a good slot for promotion posts.'));
  }

  // 4) หน่วยงานที่มามากที่สุด
  const orgNames: string[] = [];
  for (const r of regs) orgNames.push(r.org);
  const org = groupCount(orgNames, 1)[0];
  if (org && org.label !== '-') {
    out.push(t('หน่วยงานที่มาเยอะที่สุดคือ ' + org.label + ' (' + percent(org.value, s.total) + '%)', 'The largest group comes from ' + org.label + ' (' + percent(org.value, s.total) + '%).'));
  }

  // 5) อัตราการเข้างาน
  if (s.checkedIn > 0) {
    let tone = t('ค่อนข้างต่ำ ควรส่งข้อความเตือนก่อนวันงาน', 'which is low; consider sending reminders');
    if (s.checkInRate >= 80) {
      tone = t('ถือว่าสูงมาก', 'which is very high');
    } else if (s.checkInRate >= 60) {
      tone = t('อยู่ในเกณฑ์ดี', 'which is healthy');
    }
    out.push(t('อัตราการเข้างาน ' + s.checkInRate + '% ' + tone, 'Check-in rate is ' + s.checkInRate + '%, ' + tone + '.'));
  }

  // 6) จำนวนคนที่ลงทะเบียนที่ตู้ Kiosk
  let kiosk = 0;
  for (const r of regs) {
    if (r.source === 'kiosk') kiosk++;
  }
  if (kiosk > 0) {
    out.push(t('ลงทะเบียน/ลงชื่อที่ตู้ Kiosk หน้างาน ' + kiosk + ' คน', kiosk + ' people signed up at the on-site kiosk.'));
  }

  // 7) คะแนนความพึงพอใจ
  if (s.average !== null) {
    let mood = t('ควรดูข้อเสนอแนะเพื่อปรับปรุง', 'review the comments for improvements');
    if (s.average >= 4.2) {
      mood = t('ผู้เข้าร่วมพึงพอใจมาก', 'attendees are very satisfied');
    } else if (s.average >= 3.5) {
      mood = t('ผู้เข้าร่วมค่อนข้างพึงพอใจ', 'attendees are fairly satisfied');
    }
    out.push(t('คะแนนความพึงพอใจเฉลี่ย ' + s.average.toFixed(2) + ' / 5 — ' + mood, 'Average satisfaction is ' + s.average.toFixed(2) + ' / 5 — ' + mood + '.'));
  }

  // 8) คนตอบแบบสอบถามน้อย
  if (s.total > 0 && s.responseRate < 30) {
    out.push(t('ตอบแบบสอบถามเพียง ' + s.responseRate + '% ลองแสดง QR แบบสอบถามที่ตู้ Kiosk ตอนจบงาน', 'Only ' + s.responseRate + '% answered the survey; try showing the survey QR on the kiosk at the end.'));
  }

  return out;
}
