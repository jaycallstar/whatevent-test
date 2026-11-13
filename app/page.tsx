'use client';
// หน้าแรก = หน้า Login (การ์ดอยู่กลางจอ พื้นหลังเรียบสว่าง มีแสงน้ำเงินจาง ๆ ด้านบนและเส้นกริดบาง ๆ ไม่มีเงา)
// หลัง login: user ไปที่แดชบอร์ดของกิจกรรมเลย / admin ไปที่หน้ากิจกรรมทั้งหมด
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/Icon';
import PrefsBar from '@/components/PrefsBar';
import { useAuth } from '@/lib/auth';
import type { Session } from '@/lib/auth';
import { useLang } from '@/lib/i18n';

// หน้าแรกของแต่ละ role
function homeFor(user: Session): string {
  if (user.role === 'admin') return '/events';
  return '/dashboard';
}

export default function LoginPage() {
  const { t } = useLang();
  const { user, ready, login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // ถ้า login อยู่แล้ว ให้ข้ามไปหน้าแรกของ role นั้นเลย
  useEffect(() => {
    if (ready && user) router.replace(homeFor(user));
  }, [ready, user, router]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const session = login(username, password);
    if (!session) {
      setError(t('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'Incorrect username or password'));
      setBusy(false);
    } else {
      router.replace(homeFor(session));
    }
  }

  // กดบัญชีทดลองแล้วกรอกให้อัตโนมัติ
  function fill(u: string, p: string) {
    setUsername(u);
    setPassword(p);
    setError('');
  }

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden />
      <div className="login-top"><PrefsBar /></div>

      <form className="login-card" onSubmit={handleSubmit} noValidate={false}>
        <div className="login-brand">
          <img className="login-mark" src="/logo.png" alt="" width={64} height={64} />
          <span className="login-name">WhatEvent</span>
          <h1>{t('เข้าสู่ระบบ', 'Sign in')}</h1>
        </div>

        <label className="field">
          <span>{t('ชื่อผู้ใช้', 'Username')}</span>
          <span className="field-box">
            <Icon name="user" size={18} />
            <input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" placeholder={t('เช่น admin', 'e.g. admin')} aria-invalid={!!error} />
          </span>
        </label>
        <label className="field">
          <span>{t('รหัสผ่าน', 'Password')}</span>
          <span className="field-box">
            <Icon name="lock" size={18} />
            <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" aria-invalid={!!error} />
            <button type="button" className="field-eye" onClick={() => setShow(!show)} aria-label={show ? t('ซ่อนรหัสผ่าน', 'Hide password') : t('แสดงรหัสผ่าน', 'Show password')}>
              <Icon name={show ? 'eye-off' : 'eye'} size={18} />
            </button>
          </span>
        </label>
        {error && <div className="alert" role="alert"><Icon name="alert" size={16} /> {error}</div>}
        <button className="btn primary big login-submit" disabled={busy}>{busy ? t('กำลังเข้าสู่ระบบ...', 'Signing in...') : t('เข้าสู่ระบบ', 'Sign in')} {!busy && <Icon name="chevron-right" size={18} />}</button>

        <div className="divider"><span>{t('บัญชีทดลอง · กดเพื่อกรอกให้', 'Demo accounts · tap to fill')}</span></div>
        <div className="demo-grid">
          <button type="button" className="demo-tile" onClick={() => fill('admin', 'admin1234')}>
            <span className="demo-icon admin"><Icon name="shield" size={18} /></span>
            <span><b>Admin</b><small>{t('ทำได้ทุกอย่าง', 'Full access')}</small></span>
          </button>
          <button type="button" className="demo-tile" onClick={() => fill('user1', 'user1234')}>
            <span className="demo-icon"><Icon name="user" size={18} /></span>
            <span><b>User</b><small>{t('เฉพาะงานที่ดูแล', 'Assigned events')}</small></span>
          </button>
        </div>
      </form>
      <p className="login-foot">© WhatEvent · Event & Survey Platform</p>
    </div>
  );
}
