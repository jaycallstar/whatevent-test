'use client';
// จัดการผู้ใช้ (เฉพาะ admin) — อยู่ในแท็บ "ผู้ใช้งาน" ของหน้ามอบหมายผู้ดูแล: เพิ่ม / แก้ชื่อที่แสดง / เปลี่ยน role / ลบ
import { FormEvent, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { newId } from '@/lib/db';
import { useEvents } from '@/lib/eventContext';
import { useLang } from '@/lib/i18n';
import type { Role, User } from '@/lib/types';

type Props = { users: User[]; setUsers: (list: User[]) => void; onAssign: (userId: string) => void };

export default function UsersPanel({ users, setUsers, onAssign }: Props) {
  const { t } = useLang();
  const { user, refresh } = useAuth();
  const { allEvents, setAllEvents } = useEvents();
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'user' as Role });
  const [error, setError] = useState('');
  if (!user) return null;

  function addUser(e: FormEvent) {
    e.preventDefault();
    if (users.some((u) => u.username === form.username.trim())) return setError(t('ชื่อผู้ใช้นี้ถูกใช้แล้ว', 'This username is already taken'));
    setUsers([...users, { id: newId(), name: form.name, username: form.username.trim(), password: form.password, role: form.role }]);
    setForm({ name: '', username: '', password: '', role: 'user' });
    setError('');
  }

  // แก้ชื่อที่แสดง (ถ้าแก้ชื่อตัวเอง ให้รีเฟรช session ด้วย)
  function renameUser(target: User, name: string) {
    if (!name.trim() || name === target.name) return;
    setUsers(users.map((u) => (u.id === target.id ? { ...u, name: name.trim() } : u)));
    if (target.id === user!.id) setTimeout(refresh, 0);
  }

  function changeRole(target: User, role: Role) {
    setUsers(users.map((u) => (u.id === target.id ? { ...u, role } : u)));
  }

  // ลบผู้ใช้ และเอาออกจากรายชื่อที่ได้รับมอบหมายในทุกกิจกรรม
  function deleteUser(target: User) {
    if (!confirm(t('ลบผู้ใช้ ', 'Delete user ') + target.username + '?')) return;
    setUsers(users.filter((u) => u.id !== target.id));
    setAllEvents(allEvents.map((e) => ({ ...e, userIds: e.userIds.filter((id) => id !== target.id) })));
  }

  return (
    <div className="stack">

      <form className="card stack-sm" onSubmit={addUser}>
        <h3>{t('เพิ่มผู้ใช้ใหม่', 'Add a new user')}</h3>
        <div className="grid">
          <label>{t('ชื่อที่แสดง', 'Display name')}<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>{t('ชื่อผู้ใช้', 'Username')}<input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
          <label>{t('รหัสผ่าน', 'Password')}<input required minLength={4} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          <label>Role
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="user">{t('User — จัดการกิจกรรมที่ได้รับมอบหมาย', 'User — manages assigned events')}</option>
              <option value="admin">{t('Admin — ทำได้ทุกอย่าง', 'Admin — full access')}</option>
            </select>
          </label>
        </div>
        {error && <div className="alert">{error}</div>}
        <div><button className="btn primary">{t('เพิ่มผู้ใช้', 'Add user')}</button></div>
      </form>

      <div className="card table-wrap">
        <table>
          <thead><tr><th>{t('ชื่อที่แสดง (แก้ไขได้)', 'Display name (editable)')}</th><th>{t('ชื่อผู้ใช้', 'Username')}</th><th>Role</th><th>{t('กิจกรรมที่ดูแล', 'Events managed')}</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {/* กด Enter หรือคลิกออกนอกช่องเพื่อบันทึกชื่อ */}
                  <input defaultValue={u.name} key={u.name} onBlur={(e) => renameUser(u, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} style={{ minWidth: 170 }} aria-label={t('ชื่อที่แสดง', 'Display name')} />
                </td>
                <td>@{u.username}</td>
                <td>
                  <select value={u.role} disabled={u.id === user.id} onChange={(e) => changeRole(u, e.target.value as Role)}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>{u.role === 'admin' ? t('ทั้งหมด', 'All') : <button className="btn small-btn" onClick={() => onAssign(u.id)}>{allEvents.filter((e) => e.userIds.includes(u.id)).length} · {t('มอบหมาย', 'Assign')}</button>}</td>
                <td>{u.id !== user.id && <button className="btn small-btn danger" onClick={() => deleteUser(u)}>{t('ลบ', 'Delete')}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
