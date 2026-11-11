// ที่เก็บข้อมูลของเว็บ: ใช้ LocalStorage ของเบราว์เซอร์ (ไม่ต้องมี backend)
// ถ้าอยากเปลี่ยนไปใช้ MockAPI หรือฐานข้อมูลจริง ให้แก้เฉพาะ 2 ฟังก์ชัน readStore / writeStore
import { useEffect, useState } from 'react';
import { normalizeEvent } from './brand';
import type { EventItem, Registration, Response, User } from './types';

export type StoreName = 'users' | 'events' | 'registrations' | 'responses';

export function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ---------- ข้อมูลตัวอย่าง (สร้างให้ครั้งแรกที่เปิดเว็บ) ----------
function daysFromNow(n: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function seedUsers(): User[] {
  return [
    { id: 'u-admin', username: 'admin', password: 'admin1234', name: 'Admin', role: 'admin' },
    { id: 'u-user1', username: 'user1', password: 'user1234', name: 'คุณสมชาย', role: 'user' },
    { id: 'u-user2', username: 'user2', password: 'user1234', name: 'คุณวรา', role: 'user' },
  ];
}

function seedEvents(): EventItem[] {
  const list: (Partial<EventItem> & { id: string })[] = [
    {
      id: 'demo', title: 'Tech & Design Meetup 2026',
      description: 'พบปะนักออกแบบและนักพัฒนา แลกเปลี่ยนมุมมอง พร้อม workshop และ networking ตลอดทั้งวัน',
      startAt: daysFromNow(7, 9), endAt: daysFromNow(7, 17), capacity: 150,
      location: 'สยามสแควร์ วัน', address: 'ถนนพระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ',
      directions: 'BTS สยาม ทางออก 2 เดินตรงไปประมาณ 5 นาที\nรถยนต์: จอดที่ลานจอดรถชั้น B1–B3 แล้วขึ้นลิฟต์ไปชั้น 5',
      access: 'closed', regOpenAt: daysFromNow(-20, 9), regCloseAt: daysFromNow(6, 18),
      color: '#4a74ff', logo: '', banner: '', userIds: ['u-user1'],
      theme: { accent2: '', useSecondary: true, font: 'noto', overlay: 55, tagline: 'Connect · Create · Inspire' },
      questions: [
        { id: 'q1', text: 'ความพึงพอใจโดยรวมต่องานนี้', type: 'rating', options: [] },
        { id: 'q2', text: 'คุณรู้จักงานนี้จากช่องทางไหน', type: 'choice', options: ['Facebook', 'เพื่อน/คนรู้จัก', 'เว็บไซต์', 'Instagram'] },
        { id: 'q3', text: 'ข้อเสนอแนะเพิ่มเติม', type: 'text', options: [] },
      ],
    },
    {
      id: 'ux', title: 'UX Research Workshop',
      description: 'เวิร์กชอปการวิจัยผู้ใช้ภาคปฏิบัติ สำหรับทีมออกแบบผลิตภัณฑ์',
      startAt: daysFromNow(21, 13), endAt: daysFromNow(21, 17), capacity: 60,
      location: 'ไบเทค บางนา', address: 'ถนนบางนา-ตราด กิโลเมตรที่ 1 เขตบางนา กรุงเทพฯ',
      directions: 'BTS บางนา ต่อรถรับส่งของงาน',
      access: 'open',
      color: '#0f9d8a', logo: '', banner: '', userIds: ['u-user1'],
      questions: [
        { id: 'q1', text: 'ความพึงพอใจต่อเวิร์กชอป', type: 'rating', options: [] },
        { id: 'q2', text: 'สิ่งที่อยากให้ปรับปรุง', type: 'text', options: [] },
      ],
    },
  ];
  return list.map(normalizeEvent);
}

const firstNames = ['สมชาย', 'วราภรณ์', 'ธนกร', 'พิมพ์ชนก', 'กิตติพงษ์', 'นลินี', 'อนุชา', 'มณีรัตน์', 'ปิยะ', 'ชลธิชา', 'ศุภกร', 'รุ่งนภา'];
const lastNames = ['ใจดี', 'สุขสันต์', 'มั่นคง', 'รุ่งเรือง', 'แสงทอง', 'ศรีสุข', 'เก่งกล้า', 'ดีเลิศ'];
const orgs = ['ABC Studio', 'Nova Tech', 'Freelance', 'Siam University', 'Bangkok Digital'];

// สร้างผู้ลงทะเบียนตัวอย่างกระจายตามวันและเวลา เพื่อให้กราฟมีข้อมูลดูได้
function makeRegistrations(eventId: string, count: number, spreadDays: number): Registration[] {
  const list: Registration[] = [];
  for (let i = 0; i < count; i++) {
    const hour = 7 + ((i * 5) % 16);
    list.push({
      id: eventId + '-r' + i, eventId,
      name: firstNames[i % firstNames.length] + ' ' + lastNames[(i * 3) % lastNames.length],
      email: eventId + i + '@example.com', phone: '081' + String(1000000 + i * 137).slice(0, 7),
      org: orgs[(i * 2) % orgs.length], ticket: 'EV-' + eventId.toUpperCase() + (100 + i),
      checkedIn: i % 10 < 6, createdAt: daysFromNow(-(i % spreadDays), hour),
      source: i % 7 === 0 ? 'kiosk' : 'online',
    });
  }
  return list;
}

function seedRegistrations(): Registration[] {
  return [...makeRegistrations('demo', 42, 14), ...makeRegistrations('ux', 18, 10)];
}

function seedResponses(): Response[] {
  const ratings = ['5', '4', '5', '3', '5', '4', '4', '5', '2', '5', '4', '5', '3', '4', '5', '5', '4', '4', '5', '3', '5', '4', '5', '4'];
  const channels = ['Facebook', 'เพื่อน/คนรู้จัก', 'เว็บไซต์', 'Instagram', 'เพื่อน/คนรู้จัก', 'Facebook'];
  const comments = ['จัดงานดีมาก', '', 'อยากให้มีบ่อย ๆ', '', 'สถานที่เดินทางสะดวก', '', 'เสียงในห้องบางช่วงเบาไป', ''];
  const list: Response[] = [];
  for (let i = 0; i < ratings.length; i++) {
    list.push({ id: 's' + i, eventId: 'demo', answers: { q1: ratings[i], q2: channels[i % channels.length], q3: comments[i % comments.length] }, createdAt: daysFromNow(-(i % 5), 12) });
  }
  for (let i = 0; i < 6; i++) {
    list.push({ id: 'u' + i, eventId: 'ux', answers: { q1: ratings[i + 3], q2: i % 2 ? 'อยากได้ตัวอย่างงานจริงเพิ่ม' : '' }, createdAt: daysFromNow(-(i % 3), 15) });
  }
  return list;
}

const seeds = { users: seedUsers, events: seedEvents, registrations: seedRegistrations, responses: seedResponses };

// ---------- อ่าน / เขียน LocalStorage ----------
export function readStore<T>(name: StoreName): T[] {
  if (typeof window === 'undefined') return []; // ตอนรันบน server ไม่มี localStorage
  const text = localStorage.getItem('we_' + name);
  if (text) {
    const list = JSON.parse(text);
    // กิจกรรมที่บันทึกไว้ก่อนมีฟิลด์ใหม่ -> เติมค่าเริ่มต้นให้
    if (name === 'events') return list.map(normalizeEvent);
    // ชื่อที่แสดงเดิมของบัญชี admin ตัวอย่าง -> เปลี่ยนเป็น "Admin"
    if (name === 'users') return list.map((u: User) => (u.id === 'u-admin' && u.name === 'ผู้ดูแลระบบ' ? { ...u, name: 'Admin' } : u));
    return list;
  }
  const first = seeds[name]() as unknown as T[]; // ยังไม่เคยมีข้อมูล -> ใส่ข้อมูลตัวอย่าง
  localStorage.setItem('we_' + name, JSON.stringify(first));
  return first;
}

export function writeStore<T>(name: StoreName, list: T[]) {
  localStorage.setItem('we_' + name, JSON.stringify(list));
}

// ---------- hook: ใช้เหมือน useState แต่บันทึกลง LocalStorage ให้อัตโนมัติ ----------
// ตัวอย่าง: const [regs, setRegs, ready] = useStore<Registration>('registrations');
export function useStore<T>(name: StoreName): [T[], (next: T[]) => void, boolean] {
  const [list, setList] = useState<T[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setList(readStore<T>(name));
    setReady(true);
  }, [name]);

  function update(next: T[]) {
    setList(next);
    writeStore(name, next);
  }
  return [list, update, ready];
}
