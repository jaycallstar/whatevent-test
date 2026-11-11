// ไฟล์นี้บอกว่า "ข้อมูลของเรามีหน้าตาอย่างไร" (เหมือนการออกแบบตารางในฐานข้อมูล)

// มี role แค่ 2 แบบ: admin (ทำได้ทุกอย่าง) กับ user (จัดการได้เฉพาะ event ที่ admin มอบหมายให้)
export type Role = 'admin' | 'user';

export type User = { id: string; username: string; password: string; name: string; role: Role };

// ชนิดคำถามในแบบสอบถาม: ให้คะแนน 1-5 / เลือกข้อ / พิมพ์ตอบ
export type QuestionType = 'rating' | 'choice' | 'text';
export type Question = { id: string; text: string; type: QuestionType; options: string[] };

// รูปแบบงาน: open = งานเปิด (เข้าได้เลย ไม่ต้องลงทะเบียน) / closed = งานปิด (ต้องลงทะเบียนเท่านั้น)
export type Access = 'open' | 'closed';

// ค่าที่ปรับได้ในหน้า "แบรนด์"
export type BrandTheme = {
  accent2: string; // สีรอง ผู้ใช้กำหนดเองได้ (RGB/HEX) ใช้ไล่เฉดคู่กับสีหลักในหัวกิจกรรมและพื้นหลัง Kiosk
  useSecondary: boolean; // เปิด/ปิดสีรอง (ปิด = ใช้สีหลักสีเดียว ไม่ไล่เฉด)
  font: string; // รหัสฟอนต์ ดู lib/brand.ts
  overlay: number; // ความเข้มของเงาบนรูปพื้นหลัง 0-90 (%)
  tagline: string; // ข้อความสั้นใต้ชื่องาน
};

// ค่าของหน้าจอ Kiosk
export type KioskSettings = {
  bg: 'brand' | 'light' | 'dark' | 'image';
  image: string; // รูปพื้นหลังแนวตั้ง (ใช้เมื่อ bg = image)
  walkIn: boolean; // แสดงปุ่ม "ลงทะเบียนหน้างาน" ที่ตู้ (กดแล้วแสดง QR ไปหน้าลงทะเบียน) เฉพาะงานปิด
  showStats: boolean; // แสดงจำนวนที่นั่งว่าง (งานปิด)
  idle: number; // ไม่มีคนแตะกี่วินาทีแล้วกลับหน้าแรก
};

export type EventItem = {
  id: string;
  title: string;
  description: string;
  startAt: string; // เก็บเป็นข้อความ ISO เช่น 2026-01-31T09:00:00.000Z
  endAt: string;
  capacity: number; // จำนวนที่นั่ง
  // --- รูปแบบงาน + ช่วงเวลารับลงทะเบียน (ใช้กับงานปิด) ---
  access: Access;
  regOpenAt: string; // ว่าง = เปิดรับทันที
  regCloseAt: string; // ว่าง = รับจนกว่าที่นั่งเต็ม
  regPaused: boolean; // หยุดรับชั่วคราว
  // --- สถานที่ ---
  location: string; // ชื่อสถานที่
  address: string;
  directions: string; // วิธีการเดินทาง
  // --- แบรนด์ ---
  color: string; // สีธีมหลักของงาน เช่น #2f5bea
  logo: string; // ลิงก์ หรือ data URL ที่อัปโหลด
  banner: string;
  theme: BrandTheme;
  kiosk: KioskSettings;
  // --- อื่น ๆ ---
  userIds: string[]; // user ที่ admin มอบหมายให้ดูแล event นี้
  questions: Question[];
};

export type Registration = {
  id: string; eventId: string; name: string; email: string; phone: string;
  org: string; // หน่วยงาน
  ticket: string; checkedIn: boolean; createdAt: string;
  checkedInAt?: string; // เวลาเช็คอิน
  source?: 'online' | 'kiosk'; // ลงทะเบียนผ่านเว็บ หรือ ที่ตู้ Kiosk หน้างาน
};

export type Response = {
  id: string; eventId: string;
  registrationId?: string; // งานปิด: ผู้ลงทะเบียนที่ตอบ (1 คนตอบได้ 1 ครั้ง)
  answers: Record<string, string>; // { รหัสคำถาม: คำตอบ }
  createdAt: string;
};
