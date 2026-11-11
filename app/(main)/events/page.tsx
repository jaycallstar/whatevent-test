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

  const staff = users.filter((u) => u.role === 'user');
  const now = Date.now();
  const list = allEvents
    .filter((e) => e.title.toLowerCase().includes(search.toLowerCase()))
    .filter((e) => filter === 'all' || (filter === 'upcoming' ? Date.parse(e.endAt) >= now : Date.parse(e.endAt) < now))
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  const totalRegs = regs.filter((r) => allEvents.some((e) => e.id === r.eventId)).length;
  const totalIn = regs.filter((r) => r.checkedIn && allEvents.some((e) => e.id === r.eventId)).length;
  const unassigned = allEvents.filter((e) => e.userIds.length === 0).length;

  function openCreate() {
    const start = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    start.setHours(9, 0, 0, 0);
    const end = new Date(start);
    end.setHours(17);
    setDialog({ id: null, draft: { title: '', startAt: start.toISOString(), endAt: end.toISOString(), capacity: 100, access: 'closed', userIds: [] } });
  }

  function save(d: EventDraft) {
    if (dialog && dialog.id) setAllEvents(allEvents.map((e) => (e.id === dialog.id ? { ...e, ...d } : e)));
    else setAllEvents([...allEvents, normalizeEvent({ id: newId(), ...d })]);
    setDialog(null);
  }

  // ลบกิจกรรม พร้อมข้อมูลผู้ลงทะเบียนและคำตอบของกิจกรรมนั้น
  function deleteEvent(event: EventItem) {
    if (!confirm(t('ลบกิจกรรม “', 'Delete “') + event.title + t('” พร้อมข้อมูลทั้งหมด?', '” and all its data?'))) return;
    setAllEvents(allEvents.filter((e) => e.id !== event.id));
    setRegs(regs.filter((r) => r.eventId !== event.id));
    setResponses(responses.filter((r) => r.eventId !== event.id));
  }

  // ส่งออกภาพรวมทุกกิจกรรมเป็น Excel
  function exportAll() {
    const rows = [[t('กิจกรรม', 'Event'), t('วันที่เริ่ม', 'Start'), t('รูปแบบ', 'Access'), t('ที่นั่ง', 'Capacity'), t('ผู้ลงทะเบียน', 'Registrants'), t('เช็คอิน', 'Checked in'), t('อัตราเข้างาน (%)', 'Check-in rate (%)'), t('ตอบแบบสอบถาม', 'Responses'), t('คะแนนเฉลี่ย', 'Avg rating'), t('ผู้ดูแล', 'Managers')]];
    for (const e of allEvents) {
      const s = summarize(e, regs.filter((r) => r.eventId === e.id), responses.filter((r) => r.eventId === e.id));
      rows.push([e.title, formatDate(e.startAt, lang), e.access === 'open' ? t('งานเปิด', 'Open') : t('งานปิด', 'Closed'), String(e.capacity), String(s.total), String(s.checkedIn), String(s.checkInRate), String(s.responseCount), s.average === null ? '-' : s.average.toFixed(2), users.filter((u) => e.userIds.includes(u.id)).map((u) => u.name).join(', ')]);
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
        <Kpi icon="layers" label={t('กิจกรรมทั้งหมด', 'Events')} value={allEvents.length} sub={t('กำลังจะมาถึง ', 'Upcoming ') + allEvents.filter((e) => Date.parse(e.endAt) >= now).length} />
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
          const eRegs = regs.filter((r) => r.eventId === e.id);
          return (
            <EventCard key={e.id} event={e} count={eRegs.length} checkedIn={eRegs.filter((r) => r.checkedIn).length}
              managers={users.filter((u) => e.userIds.includes(u.id))}
              onEdit={() => setDialog({ id: e.id, draft: draftOf(e) })} onDelete={() => deleteEvent(e)} />
          );
        })}
      </div>

      {dialog && <EventDialog initial={dialog.draft} staff={staff} editing={!!dialog.id} onSave={save} onClose={() => setDialog(null)} />}
    </div>
  );
}
