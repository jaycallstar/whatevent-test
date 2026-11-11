'use client';
// แถบเมนูด้านล่างจอ สำหรับมือถือ (เหมือนแอปทั่วไป) ปุ่ม "เพิ่มเติม" เปิดกล่องที่มีเมนูที่เหลือ
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import CurrentEvent from './CurrentEvent';
import Icon from './Icon';
import PrefsBar from './PrefsBar';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { adminNav, eventNav } from '@/lib/nav';

export default function BottomNav() {
  const { t } = useLang();
  const { user, logout } = useAuth();
  const path = usePathname();
  const router = useRouter();
  const [sheet, setSheet] = useState(false);

  // เปลี่ยนหน้าแล้วปิดกล่อง
  useEffect(() => {
    setSheet(false);
  }, [path]);

  if (!user) return null;

  function handleLogout() {
    logout();
    router.replace('/');
  }

  // admin: 2 เมนูของ admin / user: 4 เมนูหลักของกิจกรรมอยู่บนแถบ ที่เหลืออยู่ในกล่อง "เพิ่มเติม"
  const isAdmin = user.role === 'admin';
  const mainItems = isAdmin ? adminNav : eventNav.slice(0, 4);
  const moreItems = isAdmin ? [] : eventNav.slice(4);
  const moreActive = moreItems.some((m) => path.startsWith(m.href));

  return (
    <>
      {sheet && <div className="scrim" onClick={() => setSheet(false)} />}
      {sheet && (
        <div className="sheet card" role="dialog" aria-label={t('เมนูเพิ่มเติม', 'More menu')}>
          <div className="sheet-handle" aria-hidden />
          {!isAdmin && <CurrentEvent />}
          <div className="sheet-grid">
            {moreItems.map((m) => (
              <Link key={m.href} href={m.href} className={path.startsWith(m.href) ? 'sheet-item active' : 'sheet-item'}>
                <Icon name={m.icon} size={20} /> {t(m.th, m.en)}
              </Link>
            ))}
          </div>
          <div className="row between">
            <div className="row" style={{ flexWrap: 'nowrap' }}>
              <div className="avatar">{user.name.slice(0, 1)}</div>
              <div><b>{user.name}</b><div className="small muted">{user.role === 'admin' ? 'Admin' : 'User'}</div></div>
            </div>
            <PrefsBar />
          </div>
          <button className="btn danger" onClick={handleLogout}><Icon name="logout" size={16} /> {t('ออกจากระบบ', 'Sign out')}</button>
        </div>
      )}

      <nav className="bottom-nav" aria-label={t('เมนูหลัก', 'Main menu')}>
        {mainItems.map((m) => (
          <Link key={m.href} href={m.href} className={path.startsWith(m.href) ? 'bn-item active' : 'bn-item'}>
            <Icon name={m.icon} size={22} />
            <span>{t(m.th, m.en)}</span>
          </Link>
        ))}
        <button className={sheet || moreActive ? 'bn-item active' : 'bn-item'} onClick={() => setSheet(!sheet)} aria-expanded={sheet}>
          <Icon name="more" size={22} />
          <span>{t('เพิ่มเติม', 'More')}</span>
        </button>
      </nav>
    </>
  );
}
