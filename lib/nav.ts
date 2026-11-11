// รายการเมนู: เก็บไว้ที่เดียว ใช้ทั้ง Sidebar (คอม) และแถบเมนูล่าง (มือถือ)
// จัดกลุ่มตามงานที่ผู้ใช้ทำ (ไม่ใช่ตามโครงสร้างระบบ) และเรียงตามความถี่ที่ใช้
export type NavItem = { href: string; icon: string; th: string; en: string };
export type NavGroup = { th: string; en: string; items: NavItem[] };

// เมนูของ "กิจกรรมที่เลือกอยู่" (ทั้ง admin และ user ใช้ได้)
// ลำดับ: แดชบอร์ด -> ข้อมูลและสถานที่ -> แบรนด์ -> ที่เหลือ
export const eventGroups: NavGroup[] = [
  { th: 'ภาพรวม', en: 'Overview', items: [
    { href: '/dashboard', icon: 'chart', th: 'แดชบอร์ด', en: 'Dashboard' },
  ] },
  { th: 'จัดการกิจกรรม', en: 'Manage event', items: [
    { href: '/details', icon: 'info', th: 'ข้อมูลและสถานที่', en: 'Details & venue' },
    { href: '/branding', icon: 'palette', th: 'แบรนด์', en: 'Branding' },
    { href: '/registrants', icon: 'users', th: 'ผู้ลงทะเบียน', en: 'Registrants' },
    { href: '/questions', icon: 'clipboard', th: 'แบบสอบถาม', en: 'Survey' },
  ] },
  { th: 'หน้างาน', en: 'On site', items: [
    { href: '/share', icon: 'qr', th: 'QR / ลิงก์', en: 'QR & links' },
    { href: '/kiosk', icon: 'kiosk', th: 'Kiosk หน้างาน', en: 'On-site kiosk' },
  ] },
];
export const eventNav: NavItem[] = eventGroups.flatMap((g) => g.items);

// เมนูของ admin: เห็นเฉพาะ "กิจกรรมทั้งหมด" กับ "มอบหมายผู้ดูแล" (จัดการผู้ใช้อยู่ในหน้ามอบหมาย)
// ส่วนการจัดการรายละเอียดของแต่ละงานเป็นหน้าที่ของ user ที่ได้รับมอบหมาย
export const adminGroup: NavGroup = { th: 'Admin', en: 'Admin', items: [
  { href: '/events', icon: 'layers', th: 'กิจกรรมทั้งหมด', en: 'All events' },
  { href: '/assignments', icon: 'assign', th: 'มอบหมายผู้ดูแล', en: 'Admin assignment' },
] };
export const adminNav: NavItem[] = adminGroup.items;

// หน้าของ admin (รวมหน้ารายงานรายกิจกรรมที่เปิดจากการ์ดกิจกรรม)
export function isAdminPath(path: string): boolean {
  return ['/events', '/assignments', '/reports'].some((p) => path === p || path.startsWith(p + '/'));
}
