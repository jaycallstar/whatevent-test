'use client';
// กิจกรรมทั้งหมด (เฉพาะ admin): ภาพรวมทุกงาน + สร้าง / แก้ไข / ลบ / ดูรายงาน / ส่งออกภาพรวม
// admin ไม่ได้จัดการรายละเอียดของงาน (สถานที่ แบรนด์ แบบสอบถาม) — เป็นหน้าที่ของ user ที่ได้รับมอบหมาย
import { useState } from 'react';
import { Segmented } from '@/components/Controls';
import EventCard from '@/components/EventCard';
import EventDialog, { draftOf } from '@/components/EventDialog';
import type { EventDraft } from '@/components/EventDialog';
import Icon from '@/components/Icon';
import Kpi from '@/components/Kpi';
import PageHeader from '@/components/PageHeader';
import { percent, summarize } from '@/lib/analytics';
import { useAuth } from '@/lib/auth';
import { normalizeEvent } from '@/lib/brand';
import { newId, useStore } from '@/lib/db';
import { useEvents } from '@/lib/eventContext';
import { downloadExcel } from '@/lib/export';
import { formatDate } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { EventItem, Registration, Response, User } from '@/lib/types';

type Filter = 'all' | 'upcoming' | 'past';

export default function EventsPage() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { allEvents, setAllEvents } = useEvents();
  const [regs, setRegs] = useStore<Registration>('registrations');
  const [responses, setResponses] = useStore<Response>('responses');
  const [users] = useStore<User>('users');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [dialog, setDialog] = useState<{ id: string | null; draft: EventDraft } | null>(null);
  if (!user) return null;

  const now = Date.now();

  // ผู้ใช้ที่เป็นผู้ดูแลได้ (role user)
  const staff: User[] = [];
  for (const u of users) {
    if (u.role === 'user') staff.push(u);
  }

  // กิจกรรมตามคำค้นหาและตัวกรอง (ทั้งหมด / กำลังจะมาถึง / จบแล้ว) เรียงตามวันเริ่ม
  const list: EventItem[] = [];
  for (const e of allEvents) {
    if (!e.title.toLowerCase().includes(search.toLowerCase())) continue;
    if (filter === 'upcoming' && Date.parse(e.endAt) < now) continue;
    if (filter === 'past' && Date.parse(e.endAt) >= now) continue;
    list.push(e);
  }
  list.sort((a, b) => a.startAt.localeCompare(b.startAt));

  // มีกิจกรรมนี้อยู่ในระบบไหม (ผู้ลงทะเบียนที่กิจกรรมถูกลบไปแล้วจะไม่นับ)
  function eventExists(id: string): boolean {
    for (const e of allEvents) {
      if (e.id === id) return true;
    }
    return false;
  }

  // ตัวเลขรวมของทุกกิจกรรม
  let totalRegs = 0;
  let totalIn = 0;
  for (const r of regs) {
    if (!eventExists(r.eventId)) continue;
    totalRegs++;
    if (r.checkedIn) totalIn++;
  }

  let unassigned = 0;
  let upcomingCount = 0;
  for (const e of allEvents) {
    if (e.userIds.length === 0) unassigned++;
    if (Date.parse(e.endAt) >= now) upcomingCount++;
  }

  // ผู้ลงทะเบียน / คำตอบ / ผู้ดูแล ของกิจกรรมหนึ่ง
  function regsOf(eventId: string): Registration[] {
    const result: Registration[] = [];
    for (const r of regs) {
      if (r.eventId === eventId) result.push(r);
    }
    return result;
  }
  function responsesOf(eventId: string): Response[] {
    const result: Response[] = [];
    for (const r of responses) {
      if (r.eventId === eventId) result.push(r);
    }
    return result;
  }
  function managersOf(e: EventItem): User[] {
    const result: User[] = [];
    for (const u of users) {
      if (e.userIds.includes(u.id)) result.push(u);
    }
    return result;
  }
  function countChecked(list: Registration[]): number {
    let count = 0;
    for (const r of list) {
      if (r.checkedIn) count++;
    }
    return count;
  }

  function openCreate() {
    const start = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(17);
    setDialog({ id: null, draft: { title: '', startAt: start.toISOString(), endAt: end.toISOString(), capacity: 100, access: 'closed', userIds: [] } });
  }

  function save(d: EventDraft) {
    if (dialog && dialog.id) {
      // แก้ไขกิจกรรมเดิม
      const next: EventItem[] = [];
      for (const e of allEvents) {
        if (e.id === dialog.id) {
          next.push({ ...e, ...d });
        } else {
          next.push(e);
        }
      }
      setAllEvents(next);
    } else {
      // สร้างกิจกรรมใหม่
      setAllEvents([...allEvents, normalizeEvent({ id: newId(), ...d })]);
    }
    setDialog(null);
  }

  // ลบกิจกรรม พร้อมข้อมูลผู้ลงทะเบียนและคำตอบของกิจกรรมนั้น
  function deleteEvent(event: EventItem) {
    if (!confirm(t('ลบกิจกรรม “', 'Delete “') + event.title + t('” พร้อมข้อมูลทั้งหมด?', '” and all its data?'))) return;

    const nextEvents: EventItem[] = [];
    for (const e of allEvents) {
      if (e.id !== event.id) nextEvents.push(e);
    }
    setAllEvents(nextEvents);

    const nextRegs: Registration[] = [];
    for (const r of regs) {
      if (r.eventId !== event.id) nextRegs.push(r);
    }
    setRegs(nextRegs);

    const nextResponses: Response[] = [];
    for (const r of responses) {
      if (r.eventId !== event.id) nextResponses.push(r);
    }
    setResponses(nextResponses);
  }

  // ส่งออกภาพรวมทุกกิจกรรมเป็น Excel
  function exportAll() {
    const rows = [[t('กิจกรรม', 'Event'), t('วันที่เริ่ม', 'Start'), t('รูปแบบ', 'Access'), t('ที่นั่ง', 'Capacity'), t('ผู้ลงทะเบียน', 'Registrants'), t('เช็คอิน', 'Checked in'), t('อัตราเข้างาน (%)', 'Check-in rate (%)'), t('ตอบแบบสอบถาม', 'Responses'), t('คะแนนเฉลี่ย', 'Avg rating'), t('ผู้ดูแล', 'Managers')]];
    for (const e of allEvents) {
      const s = summarize(e, regsOf(e.id), responsesOf(e.id));

      let accessText = t('งานปิด', 'Closed');
      if (e.access === 'open') accessText = t('งานเปิด', 'Open');
      let averageText = '-';
      if (s.average !== null) averageText = s.average.toFixed(2);
      const managerNames: string[] = [];
      for (const u of managersOf(e)) managerNames.push(u.name);

      rows.push([e.title, formatDate(e.startAt, lang), accessText, String(e.capacity), String(s.total), String(s.checkedIn), String(s.checkInRate), String(s.responseCount), averageText, managerNames.join(', ')]);
    }
    downloadExcel('whatevent-overview.xlsx', [{ name: 'Overview', rows }]);
  }

  return (
    <div className="stack">
      <PageHeader title={t('กิจกรรมทั้งหมด', 'All events')} subtitle={t('สร้างกิจกรรมและกำหนดผู้ดูแล · ผู้ดูแลจะจัดการรายละเอียดของงานเอง', 'Create events and pick managers · managers handle the event details')}>
        <button className="btn" onClick={exportAll}><Icon name="download" size={16} /> {t('ส่งออกภาพรวม', 'Export overview')}</button>
        <button className="btn primary" onClick={openCreate}><Icon name="plus" size={16} /> {t('สร้างกิจกรรม', 'Create event')}</button>
      </PageHeader>

      <div className="kpis kpis-4">
        <Kpi icon="layers" label={t('กิจกรรมทั้งหมด', 'Events')} value={allEvents.length} sub={t('กำลังจะมาถึง ', 'Upcoming ') + upcomingCount} />
        <Kpi icon="users" label={t('ผู้ลงทะเบียนรวม', 'Total registrants')} value={totalRegs} />
        <Kpi icon="check" label={t('เช็คอินรวม', 'Total check-ins')} value={totalIn} progress={percent(totalIn, totalRegs)} sub={t('อัตราเข้างาน ', 'Rate ') + percent(totalIn, totalRegs) + '%'} />
        <Kpi icon="assign" label={t('ยังไม่มีผู้ดูแล', 'Without a manager')} value={unassigned} sub={unassigned ? t('ไปมอบหมายที่ “มอบหมายผู้ดูแล”', 'Assign in “Admin assignment”') : t('ครบทุกกิจกรรม', 'All covered')} />
      </div>

      <div className="row between">
        <Segmented label={t('ตัวกรอง', 'Filter')} value={filter} onChange={setFilter} options={[
          { value: 'all', label: t('ทั้งหมด', 'All') },
          { value: 'upcoming', label: t('กำลังจะมาถึง', 'Upcoming') },
          { value: 'past', label: t('จบแล้ว', 'Past') },
        ]} />
        <div className="search"><Icon name="search" size={16} /><input placeholder={t('ค้นหาชื่อกิจกรรม', 'Search events')} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      </div>

      {list.length === 0 && <div className="card empty"><div className="empty-icon"><Icon name="layers" size={26} /></div><p className="muted">{t('ไม่พบกิจกรรม', 'No events found')}</p></div>}
      <div className="cards">
        {list.map((e) => {
          const eRegs = regsOf(e.id);
          return (
            <EventCard key={e.id} event={e} count={eRegs.length} checkedIn={countChecked(eRegs)}
              managers={managersOf(e)}
              onEdit={() => setDialog({ id: e.id, draft: draftOf(e) })} onDelete={() => deleteEvent(e)} />
          );
        })}
      </div>

      {dialog && <EventDialog initial={dialog.draft} staff={staff} editing={!!dialog.id} onSave={save} onClose={() => setDialog(null)} />}
    </div>
  );
}
