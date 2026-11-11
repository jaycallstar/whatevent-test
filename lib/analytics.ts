// ฟังก์ชันคำนวณตัวเลขสำหรับแดชบอร์ดและรายงาน (แยกไว้ให้อ่านง่าย ไม่ปนกับหน้าจอ)
import { locale } from './helpers';
import type { Lang } from './i18n';
import type { EventItem, Registration, Response } from './types';

export type ChartItem = { label: string; value: number };

export function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
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
  let running = list.filter((item) => new Date(item.createdAt) < start).length;
  return countByDay(list, days, lang).map((d) => {
    running += d.value;
    return { label: d.label, value: running };
  });
}

// นับตามวันในสัปดาห์ (อาทิตย์ = 0)
export function countByWeekday(list: { createdAt: string }[], labels: string[]): ChartItem[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const item of list) counts[new Date(item.createdAt).getDay()]++;
  return labels.map((label, i) => ({ label, value: counts[i] }));
}

// นับตามช่วงเวลาของวัน: 0-6 / 6-12 / 12-18 / 18-24
export function countByTimeSlot(list: { createdAt: string }[], labels: string[]): ChartItem[] {
  const counts = [0, 0, 0, 0];
  for (const item of list) counts[Math.floor(new Date(item.createdAt).getHours() / 6)]++;
  return labels.map((label, i) => ({ label, value: counts[i] }));
}

// นับค่าที่ซ้ำกัน เช่น หน่วยงาน แล้วเรียงจากมากไปน้อย (เอา top อันดับแรก)
export function groupCount(values: string[], top: number): ChartItem[] {
  const counts: Record<string, number> = {};
  for (const v of values) {
    const key = v.trim() || '-';
    counts[key] = (counts[key] || 0) + 1;
  }
  const rows = Object.keys(counts).map((label) => ({ label, value: counts[label] }));
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

export function ratingCounts(answers: string[]): ChartItem[] {
  const rows: ChartItem[] = [];
  for (let star = 1; star <= 5; star++) rows.push({ label: String(star), value: answers.filter((a) => Number(a) === star).length });
  return rows;
}

// นับว่าแต่ละตัวเลือกมีคนเลือกกี่คน แล้วเรียงจากมากไปน้อย
export function choiceCounts(options: string[], answers: string[]): ChartItem[] {
  const rows = options.filter((o) => o).map((o) => ({ label: o, value: answers.filter((a) => a === o).length }));
  rows.sort((a, b) => b.value - a.value);
  return rows;
}

// คะแนนเฉลี่ยของคำถามชนิดให้คะแนนข้อแรก (ไม่มีข้อมูลคืน null)
export function averageRating(event: EventItem, responses: Response[]): number | null {
  const q = event.questions.find((item) => item.type === 'rating');
  if (!q) return null;
  const scores = answersOf(responses, q.id).map(Number).filter((n) => n > 0);
  if (scores.length === 0) return null;
  let sum = 0;
  for (const s of scores) sum += s;
  return sum / scores.length;
}

// ---------- ตัวเลขสรุปของกิจกรรม ----------
export function summarize(event: EventItem, regs: Registration[], responses: Response[]) {
  const total = regs.length;
  const checkedIn = regs.filter((r) => r.checkedIn).length;
  const today = regs.filter((r) => new Date(r.createdAt).toDateString() === new Date().toDateString()).length;
  const daysLeft = Math.ceil((new Date(event.startAt).getTime() - Date.now()) / 86400000);
  return {
    total,
    capacityPercent: percent(total, event.capacity),
    remaining: Math.max(0, event.capacity - total),
    checkedIn,
    checkInRate: percent(checkedIn, total),
    responseCount: responses.length,
    responseRate: percent(responses.length, total),
    average: averageRating(event, responses),
    today,
    daysLeft,
  };
}

// ---------- ใช้กับรายงาน ----------
// เก็บเฉพาะรายการในช่วง days วันล่าสุด (days = 0 คือทั้งหมด)
export function within<T extends { createdAt: string }>(list: T[], days: number): T[] {
  if (!days) return list;
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return list.filter((x) => new Date(x.createdAt) >= start);
}

function top(items: ChartItem[]): ChartItem | null {
  let best: ChartItem | null = null;
  for (const it of items) if (!best || it.value > best.value) best = it;
  return best && best.value > 0 ? best : null;
}

type T = (th: string, en: string) => string;

// สรุปข้อสังเกตอัตโนมัติ (เป็นประโยคอ่านง่าย) สำหรับหน้า "รายงาน"
export function insights(event: EventItem, regs: Registration[], responses: Response[], t: T): string[] {
  const s = summarize(event, regs, responses);
  const out: string[] = [];
  if (s.total === 0) return [t('ยังไม่มีผู้ลงทะเบียนในช่วงนี้ จึงยังสรุปผลไม่ได้', 'No registrations in this period yet, so there is nothing to summarise.')];

  out.push(t('จองที่นั่งไปแล้ว ' + s.capacityPercent + '% (' + s.total + ' จาก ' + event.capacity + ' ที่นั่ง)', s.capacityPercent + '% of seats are booked (' + s.total + ' of ' + event.capacity + ').'));

  const wd = top(countByWeekday(regs, [t('วันอาทิตย์', 'Sunday'), t('วันจันทร์', 'Monday'), t('วันอังคาร', 'Tuesday'), t('วันพุธ', 'Wednesday'), t('วันพฤหัสบดี', 'Thursday'), t('วันศุกร์', 'Friday'), t('วันเสาร์', 'Saturday')]));
  if (wd) out.push(t('คนลงทะเบียนมากที่สุดใน' + wd.label + ' (' + wd.value + ' คน)', 'Most people register on ' + wd.label + ' (' + wd.value + ').'));

  const slot = top(countByTimeSlot(regs, ['00:00–06:00', '06:00–12:00', '12:00–18:00', '18:00–24:00']));
  if (slot) out.push(t('ช่วงเวลาที่ลงทะเบียนมากที่สุดคือ ' + slot.label + ' น. เหมาะกับการโพสต์ประชาสัมพันธ์', 'Peak sign-up time is ' + slot.label + ', a good slot for promotion posts.'));

  const org = groupCount(regs.map((r) => r.org), 1)[0];
  if (org && org.label !== '-') out.push(t('หน่วยงานที่มาเยอะที่สุดคือ ' + org.label + ' (' + percent(org.value, s.total) + '%)', 'The largest group comes from ' + org.label + ' (' + percent(org.value, s.total) + '%).'));

  if (s.checkedIn > 0) {
    const tone = s.checkInRate >= 80 ? t('ถือว่าสูงมาก', 'which is very high') : s.checkInRate >= 60 ? t('อยู่ในเกณฑ์ดี', 'which is healthy') : t('ค่อนข้างต่ำ ควรส่งข้อความเตือนก่อนวันงาน', 'which is low; consider sending reminders');
    out.push(t('อัตราการเข้างาน ' + s.checkInRate + '% ' + tone, 'Check-in rate is ' + s.checkInRate + '%, ' + tone + '.'));
  }

  const kiosk = regs.filter((r) => r.source === 'kiosk').length;
  if (kiosk > 0) out.push(t('ลงทะเบียน/ลงชื่อที่ตู้ Kiosk หน้างาน ' + kiosk + ' คน', kiosk + ' people signed up at the on-site kiosk.'));

  if (s.average !== null) {
    const mood = s.average >= 4.2 ? t('ผู้เข้าร่วมพึงพอใจมาก', 'attendees are very satisfied') : s.average >= 3.5 ? t('ผู้เข้าร่วมค่อนข้างพึงพอใจ', 'attendees are fairly satisfied') : t('ควรดูข้อเสนอแนะเพื่อปรับปรุง', 'review the comments for improvements');
    out.push(t('คะแนนความพึงพอใจเฉลี่ย ' + s.average.toFixed(2) + ' / 5 — ' + mood, 'Average satisfaction is ' + s.average.toFixed(2) + ' / 5 — ' + mood + '.'));
  }
  if (s.total > 0 && s.responseRate < 30) out.push(t('ตอบแบบสอบถามเพียง ' + s.responseRate + '% ลองแสดง QR แบบสอบถามที่ตู้ Kiosk ตอนจบงาน', 'Only ' + s.responseRate + '% answered the survey; try showing the survey QR on the kiosk at the end.'));
  return out;
}

