'use client';
// มอบหมายผู้ดูแล (Admin Assignment) — เฉพาะ admin
// กำหนดว่า user คนไหนดูแลกิจกรรมไหน ได้จากหน้าเดียว ไม่ต้องเข้าไปทีละกิจกรรม
//  - มุมมอง "ตามผู้ใช้": เลือกผู้ใช้ทางซ้าย แล้วเปิด/ปิดกิจกรรมทางขวา
//  - มุมมอง "ตารางรวม": ติ๊กช่องในตาราง กิจกรรม × ผู้ใช้
//  - แท็บ "ผู้ใช้งาน": เพิ่ม / แก้ชื่อ / เปลี่ยน role / ลบ บัญชีผู้ใช้
import { useEffect, useState } from 'react';
import { Segmented } from '@/components/Controls';
import Icon from '@/components/Icon';
import Kpi from '@/components/Kpi';
import PageHeader from '@/components/PageHeader';
import UsersPanel from '@/components/UsersPanel';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/db';
import { useEvents } from '@/lib/eventContext';
import { formatDate, secondColor } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { EventItem, User } from '@/lib/types';

// หาผู้ใช้ที่เลือกอยู่ (ไม่ได้เลือก/ไม่เจอ ให้ใช้คนแรก ถ้าไม่มีใครเลยคืน null)
function pickUser(list: User[], id: string): User | null {
  for (const u of list) {
    if (u.id === id) return u;
  }
  if (list.length > 0) return list[0];
  return null;
}

export default function AssignmentsPage() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { allEvents, setAllEvents } = useEvents();
  const [users, setUsers] = useStore<User>('users');
  const [view, setView] = useState<'user' | 'matrix' | 'users'>('user');
  const [selectedId, setSelectedId] = useState('');
  const [q, setQ] = useState('');
  const [userQ, setUserQ] = useState('');

  // เฉพาะผู้ใช้ที่ role = user (admin เห็นทุกกิจกรรมอยู่แล้ว)
  const staff: User[] = [];
  for (const u of users) {
    if (u.role === 'user') staff.push(u);
  }

  // เปิดจากหน้า "ผู้ใช้งาน" แบบ /assignments?user=xxx -> เลือกคนนั้นให้เลย
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('user');
    if (id) setSelectedId(id);
  }, []);

  if (!user) return null;
  if (user.role !== 'admin') return <div className="alert">{t('เฉพาะ admin เท่านั้นที่เข้าหน้านี้ได้', 'Only admins can open this page')}</div>;

  const selected = pickUser(staff, selectedId);

  // กิจกรรมที่ยังไม่มีผู้ดูแล
  let unassigned = 0;
  for (const e of allEvents) {
    if (e.userIds.length === 0) unassigned++;
  }

  // กิจกรรมที่ตรงกับคำค้นหา
  const events: EventItem[] = [];
  for (const e of allEvents) {
    if (e.title.toLowerCase().includes(q.toLowerCase())) events.push(e);
  }

  // ผู้ใช้ที่ตรงกับคำค้นหา
  const staffList: User[] = [];
  for (const u of staff) {
    if ((u.name + u.username).toLowerCase().includes(userQ.toLowerCase())) staffList.push(u);
  }

  // กิจกรรมนี้มีผู้ใช้คนนี้ดูแลอยู่ไหม
  function has(e: EventItem, u: User): boolean {
    return e.userIds.includes(u.id);
  }

  // ผู้ใช้คนนี้ดูแลกี่กิจกรรม
  function countManaged(u: User): number {
    let count = 0;
    for (const e of allEvents) {
      if (has(e, u)) count++;
    }
    return count;
  }

  // กิจกรรมนี้มีผู้ดูแล (ที่เป็น user) กี่คน
  function countStaffIn(e: EventItem): number {
    let count = 0;
    for (const id of e.userIds) {
      for (const u of staff) {
        if (u.id === id) {
          count++;
          break;
        }
      }
    }
    return count;
  }

  // เปิด/ปิดการดูแลกิจกรรมหนึ่งของผู้ใช้คนหนึ่ง
  function toggle(eventId: string, userId: string) {
    const next: EventItem[] = [];
    for (const e of allEvents) {
      if (e.id !== eventId) {
        next.push(e);
        continue;
      }
      const ids: string[] = [];
      if (e.userIds.includes(userId)) {
        // มีอยู่แล้ว -> เอาออก
        for (const x of e.userIds) {
          if (x !== userId) ids.push(x);
        }
      } else {
        // ยังไม่มี -> เพิ่มเข้าไป
        for (const x of e.userIds) ids.push(x);
        ids.push(userId);
      }
      next.push({ ...e, userIds: ids });
    }
    setAllEvents(next);
  }

  // มอบหมาย/ถอนทุกกิจกรรมที่แสดงอยู่ (ตามคำค้นหา) ให้ผู้ใช้คนนี้
  function setAll(u: User, on: boolean) {
    const shownIds: string[] = [];
    for (const e of events) shownIds.push(e.id);

    const next: EventItem[] = [];
    for (const e of allEvents) {
      if (!shownIds.includes(e.id)) {
        next.push(e);
        continue;
      }
      const ids: string[] = [];
      for (const x of e.userIds) {
        if (x !== u.id) ids.push(x);
      }
      if (on) ids.push(u.id);
      next.push({ ...e, userIds: ids });
    }
    setAllEvents(next);
  }

  return (
    <div className="stack">
      <PageHeader title={t('มอบหมายผู้ดูแล', 'Admin assignment')} subtitle={t('กำหนดผู้ใช้ให้ดูแลกิจกรรมได้หลายงานในหน้าเดียว · บันทึกอัตโนมัติ', 'Assign users to many events from one place · Saved automatically')}>
        <button className="btn" onClick={() => setView('users')}><Icon name="user-plus" size={16} /> {t('เพิ่มผู้ใช้', 'Add users')}</button>
      </PageHeader>

      <div className="kpis kpis-3">
        <Kpi icon="users" tone="blue" label={t('ผู้ใช้ (role user)', 'Staff users')} value={staff.length} sub={t('admin เห็นทุกกิจกรรมอยู่แล้ว', 'Admins already see every event')} />
        <Kpi icon="layers" tone="purple" label={t('กิจกรรมทั้งหมด', 'Events')} value={allEvents.length} />
        <Kpi icon="alert" tone="orange" label={t('ยังไม่มีผู้ดูแล', 'Without a manager')} value={unassigned} sub={unassigned ? t('ควรมอบหมายอย่างน้อย 1 คน', 'Assign at least one person') : t('ครบทุกกิจกรรมแล้ว', 'Every event is covered')} />
      </div>

      <div className="row between">
        <Segmented label={t('มุมมอง', 'View')} value={view} onChange={setView} options={[
          { value: 'user', label: <><Icon name="user" size={15} /> {t('ตามผู้ใช้', 'By user')}</> },
          { value: 'matrix', label: <><Icon name="grid" size={15} /> {t('ตารางรวม', 'Matrix')}</> },
          { value: 'users', label: <><Icon name="users" size={15} /> {t('ผู้ใช้งาน', 'Users')}</> },
        ]} />
        {view !== 'users' && <div className="search"><Icon name="search" size={16} /><input placeholder={t('ค้นหากิจกรรม', 'Search events')} value={q} onChange={(e) => setQ(e.target.value)} /></div>}
      </div>

      {view === 'users' && <UsersPanel users={users} setUsers={setUsers} onAssign={(id) => { setSelectedId(id); setView('user'); }} />}

      {view !== 'users' && staff.length === 0 && (
        <div className="card empty">
          <div className="empty-icon"><Icon name="users" size={28} /></div>
          <h3>{t('ยังไม่มีผู้ใช้ role “user”', 'No “user” accounts yet')}</h3>
          <button className="btn primary" onClick={() => setView('users')}>{t('ไปเพิ่มผู้ใช้', 'Add a user')}</button>
        </div>
      )}

      {staff.length > 0 && view === 'user' && selected && (
        <div className="assign-layout">
          {/* รายชื่อผู้ใช้ (จอเล็กเป็น dropdown) */}
          <div className="card assign-users">
            <label className="assign-select">{t('เลือกผู้ใช้', 'Choose a user')}
              <select value={selected.id} onChange={(e) => setSelectedId(e.target.value)}>
                {staff.map((u) => <option key={u.id} value={u.id}>{u.name} (@{u.username}) · {countManaged(u)}</option>)}
              </select>
            </label>
            <div className="assign-list">
              {staff.length > 6 && <div className="search" style={{ maxWidth: 'none' }}><Icon name="search" size={16} /><input placeholder={t('ค้นหาผู้ใช้', 'Search users')} value={userQ} onChange={(e) => setUserQ(e.target.value)} /></div>}
              {staffList.map((u) => (
                <button key={u.id} type="button" className={u.id === selected.id ? 'user-row on' : 'user-row'} onClick={() => setSelectedId(u.id)} aria-pressed={u.id === selected.id}>
                  <span className="avatar">{u.name.slice(0, 1)}</span>
                  <span className="sw-text"><b className="ellipsis">{u.name}</b><small className="muted">@{u.username}</small></span>
                  <span className="count-pill">{countManaged(u)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* กิจกรรมของผู้ใช้ที่เลือก */}
          <div className="card stack-sm">
            <div className="card-head">
              <div>
                <h3>{t('กิจกรรมที่ ', 'Events managed by ')}{selected.name}{t(' ดูแล', '')}</h3>
                <p className="hint">{countManaged(selected)} / {allEvents.length} {t('กิจกรรม', 'events')}</p>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn small-btn" onClick={() => setAll(selected, true)}>{t('เลือกทั้งหมด', 'Select all')}</button>
                <button className="btn small-btn" onClick={() => setAll(selected, false)}>{t('ล้างทั้งหมด', 'Clear all')}</button>
              </div>
            </div>
            {events.length === 0 && <p className="muted small">{t('ไม่พบกิจกรรม', 'No events found')}</p>}
            <ul className="assign-events">
              {events.map((e) => {
                // ผู้ดูแลคนอื่นของกิจกรรมนี้ (ไม่นับคนที่เลือกอยู่)
                const otherNames: string[] = [];
                for (const u of users) {
                  if (u.id !== selected.id && e.userIds.includes(u.id)) otherNames.push(u.name);
                }
                return (
                  <li key={e.id}>
                    <label className={has(e, selected) ? 'assign-row on' : 'assign-row'}>
                      <span className="sw-logo" style={{ background: 'linear-gradient(135deg,' + e.color + ',' + secondColor(e) + ')' }}>{e.logo ? <img src={e.logo} alt="" /> : (e.title || 'W').slice(0, 1)}</span>
                      <span className="sw-text">
                        <b className="ellipsis">{e.title}</b>
                        <small className="muted ellipsis">{formatDate(e.startAt, lang)} · {e.access === 'open' ? t('งานเปิด', 'Open') : t('งานปิด', 'Closed')}{otherNames.length > 0 && ' · ' + t('ร่วมกับ ', 'with ') + otherNames.join(', ')}</small>
                      </span>
                      <input type="checkbox" role="switch" className="switch" checked={has(e, selected)} onChange={() => toggle(e.id, selected.id)} aria-label={e.title} />
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {staff.length > 0 && view === 'matrix' && (
        <div className="card table-wrap matrix-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th className="sticky-col">{t('กิจกรรม', 'Event')}</th>
                {staff.map((u) => (
                  <th key={u.id} className="center-text">
                    <span className="mx-user"><span className="avatar xs">{u.name.slice(0, 1)}</span><span className="ellipsis">{u.name}</span></span>
                  </th>
                ))}
                <th className="center-text">{t('รวม', 'Total')}</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="sticky-col">
                    <b className="ellipsis" style={{ maxWidth: 240 }}>{e.title}</b>
                    <small className="muted">{formatDate(e.startAt, lang)}</small>
                  </td>
                  {staff.map((u) => (
                    <td key={u.id} className="center-text">
                      <input type="checkbox" className="mx-check" checked={has(e, u)} onChange={() => toggle(e.id, u.id)} aria-label={e.title + ' — ' + u.name} />
                    </td>
                  ))}
                  <td className="center-text">
                    {e.userIds.length === 0 && <span className="status warn">{t('ไม่มี', 'None')}</span>}
                    {e.userIds.length > 0 && <b>{countStaffIn(e)}</b>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
