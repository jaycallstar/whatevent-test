'use client';
// เมนูด้านซ้าย (จอคอม) — แสดงถาวร ไม่พับ · ดีไซน์เรียบพื้นเทาอ่อน เมนูที่เลือกเป็นปุ่มน้ำเงินทึบ (แนว Stripe)
// โลโก้ → กิจกรรมที่ได้รับมอบหมาย → เมนูจัดกลุ่ม → ภาษา/ธีม → ชื่อผู้ใช้ + ออกจากระบบ (ล่างสุด)
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import CurrentEvent from './CurrentEvent';
import Icon from './Icon';
import PrefsBar from './PrefsBar';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { adminGroup, eventGroups } from '@/lib/nav';
import type { NavGroup, NavItem } from '@/lib/nav';

export default function Sidebar() {
  const { t } = useLang();
  const { user, logout } = useAuth();
  const path = usePathname();
  const router = useRouter();
  if (!user) return null;
  const isAdmin = user.role === 'admin';

  function renderItem(item: NavItem) {
    const active = path === item.href || path.startsWith(item.href + '/');
    return (
      <li key={item.href}>
        <Link href={item.href} className={active ? 'sb-link active' : 'sb-link'} aria-current={active ? 'page' : undefined}>
          <Icon name={item.icon} size={18} />
          <span className="sb-text">{t(item.th, item.en)}</span>
        </Link>
      </li>
    );
  }
  const renderGroup = (g: NavGroup) => (
    <div key={g.en} className="sb-group">
      <p className="sb-label">{t(g.th, g.en)}</p>
      <ul className="sb-menu">{g.items.map(renderItem)}</ul>
    </div>
  );

  return (
    <aside className="sidebar" aria-label={t('เมนูหลัก', 'Main menu')}>
      <div className="sb-head">
        <img src="/logo.png" alt="" width={32} height={32} className="sb-logo" />
        <b className="sb-name">WhatEvent</b>
      </div>
      {/* admin เห็นเฉพาะเมนูของ admin / user เห็นกิจกรรมที่ได้รับมอบหมาย + เมนูของกิจกรรม */}
      {!isAdmin && <CurrentEvent />}
      <nav className="sb-nav">
        {isAdmin ? renderGroup(adminGroup) : eventGroups.map(renderGroup)}
      </nav>
      <div className="sb-prefs"><PrefsBar layout="split" /></div>
      {/* ล่างสุด: บทบาทที่ล็อกอินอยู่ (ป้ายสี) + ชื่อ + ปุ่มออกจากระบบ */}
      <div className="sb-foot">
        {/* admin: ป้าย "Admin" / user: แสดงชื่อที่ตั้งไว้ (ไม่แสดงคำว่า User) */}
        <div className="sb-who" title={isAdmin ? t('เข้าสู่ระบบในบทบาท Admin', 'Signed in as Admin') : user.name}>
          <span className={isAdmin ? 'role-pill admin' : 'role-pill'}>
            <Icon name={isAdmin ? 'shield' : 'user'} size={13} /> <span className="ellipsis">{isAdmin ? 'Admin' : user.name}</span>
          </span>
        </div>
        <button type="button" className="sb-logout" onClick={() => { logout(); router.replace('/'); }}>
          <Icon name="logout" size={16} /> {t('ออกจากระบบ', 'Sign out')}
        </button>
      </div>
    </aside>
  );
}
