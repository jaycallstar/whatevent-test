'use client';
// โฟลเดอร์ (main) คือ "กลุ่มหน้า" ที่ใช้โครงเดียวกัน: Sidebar ซ้าย (คอม) / แถบเมนูล่าง (มือถือ)
// (วงเล็บในชื่อโฟลเดอร์ไม่มีผลกับ URL เช่น app/(main)/dashboard -> /dashboard)
import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import Brand from '@/components/Brand';
import PrefsBar from '@/components/PrefsBar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/lib/auth';
import { EventProvider } from '@/lib/eventContext';
import { useLang } from '@/lib/i18n';
import { isAdminPath } from '@/lib/nav';

export default function MainLayout({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const { user, ready } = useAuth();
  const router = useRouter();
  const path = usePathname();

  // admin ใช้ได้เฉพาะหน้าของ admin / user ใช้ได้เฉพาะหน้าของกิจกรรม
  let wrongPlace = false;
  if (user) {
    if (user.role === 'admin') {
      wrongPlace = !isAdminPath(path);
    } else {
      wrongPlace = isAdminPath(path);
    }
  }

  // ยังไม่ login -> กลับหน้า Login / เข้าหน้าที่ไม่ใช่ของ role ตัวเอง -> พาไปหน้าแรกของ role
  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace('/');
      return;
    }
    if (wrongPlace) {
      if (user.role === 'admin') {
        router.replace('/events');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [ready, user, wrongPlace, router]);

  if (!ready || !user || wrongPlace) return <p className="center-msg">{t('กำลังโหลด...', 'Loading...')}</p>;

  return (
    <EventProvider>
      <div className="app">
        <Sidebar />
        <div className="content">
          {/* แถบบนสุดแสดงเฉพาะมือถือ */}
          <header className="topbar"><Brand /><PrefsBar /></header>
          <main>{children}</main>
        </div>
        <BottomNav />
      </div>
    </EventProvider>
  );
}
