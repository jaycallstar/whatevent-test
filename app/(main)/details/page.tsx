'use client';
// ข้อมูลกิจกรรม + รูปแบบงาน (เปิด/ปิด) + ช่วงเวลารับลงทะเบียน + สถานที่ (ค้นหา / แตะปักหมุดบนแผนที่)
import { Switch } from '@/components/Controls';
import Icon from '@/components/Icon';
import MapEmbed from '@/components/MapEmbed';
import PlaceNameField from '@/components/PlaceNameField';
import NoEvent from '@/components/NoEvent';
import PageHeader from '@/components/PageHeader';
import RegBadge from '@/components/RegBadge';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/db';
import { useEvents } from '@/lib/eventContext';
import { placeQuery, toInputValue } from '@/lib/helpers';
import { useLang } from '@/lib/i18n';
import type { Access, EventItem, Registration } from '@/lib/types';

// แปลงค่าจาก <input type="datetime-local"> เป็น ISO (ช่องว่าง = ไม่กำหนด)
function fromInput(v: string): string {
  if (!v) return '';
  return new Date(v).toISOString();
}

export default function DetailsPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const { current, updateCurrent } = useEvents();
  const [regs] = useStore<Registration>('registrations');
  if (!current || !user) return <NoEvent />;
  const event = current;

  // แก้ค่าของกิจกรรมแล้วบันทึก
  function set(changes: Partial<EventItem>) {
    updateCurrent({ ...event, ...changes });
  }

  // จำนวนผู้ลงทะเบียนของกิจกรรมนี้
  let count = 0;
  for (const r of regs) {
    if (r.eventId === event.id) count++;
  }

  // เวลาเริ่ม / สิ้นสุด (ถ้าช่องถูกล้างให้ไม่เปลี่ยนค่า)
  function setStart(v: string) {
    if (v) set({ startAt: fromInput(v) });
  }
  function setEnd(v: string) {
    if (v) set({ endAt: fromInput(v) });
  }

  // ตั้งเวลาปิดรับลงทะเบียนเป็น 1 วันก่อนงานเริ่ม
  function closeOneDayBefore() {
    const d = new Date(event.startAt);
    d.setDate(d.getDate() - 1);
    set({ regCloseAt: d.toISOString() });
  }

  const accessCards: { value: Access; icon: string; title: string; desc: string }[] = [
    { value: 'closed', icon: 'lock', title: t('งานปิด', 'Closed event'), desc: t('ต้องลงทะเบียนก่อนเท่านั้น มีบัตร QR เช็คอินหน้างาน กำหนดช่วงเวลารับลงทะเบียนได้', 'Registration required. Attendees get a QR ticket; set when registration opens and closes.') },
    { value: 'open', icon: 'unlock', title: t('งานเปิด', 'Open event'), desc: t('ใครก็เข้าร่วมได้ ไม่ต้องลงทะเบียน หน้าลงทะเบียนจะแสดงข้อมูลงานและวิธีเดินทางแทน', 'Anyone can join without registering. The registration page shows event info and directions instead.') },
  ];

  let capacityLabel = t('จำนวนที่นั่ง', 'Capacity');
  if (event.access === 'open') capacityLabel = t('จำนวนผู้เข้าร่วมที่คาดไว้', 'Expected attendees');

  return (
    <div className="stack">
      <PageHeader title={t('ข้อมูลและสถานที่', 'Details & venue')} subtitle={event.title + ' · ' + t('บันทึกอัตโนมัติ', 'Saved automatically')}>
        <RegBadge event={event} count={count} />
      </PageHeader>

      <div className="details-grid">
        {/* ---------- คอลัมน์ซ้าย ---------- */}
        <div className="stack">
          <section className="card stack-sm">
            <h3 className="sec-title"><Icon name="info" size={18} /> {t('ข้อมูลกิจกรรม', 'Event information')}</h3>
            <label>{t('ชื่อกิจกรรม', 'Event name')}<input value={event.title} onChange={(e) => set({ title: e.target.value })} /></label>
            <label>{t('รายละเอียด', 'Description')}<textarea value={event.description} onChange={(e) => set({ description: e.target.value })} /></label>
            <div className="grid">
              <label>{t('วัน-เวลาเริ่ม', 'Starts')}<input type="datetime-local" value={toInputValue(event.startAt)} onChange={(e) => setStart(e.target.value)} /></label>
              <label>{t('วัน-เวลาสิ้นสุด', 'Ends')}<input type="datetime-local" value={toInputValue(event.endAt)} onChange={(e) => setEnd(e.target.value)} /></label>
              <label>{capacityLabel}<input type="number" min={1} value={event.capacity} onChange={(e) => set({ capacity: Math.max(1, Number(e.target.value)) })} /></label>
            </div>
          </section>

          <section className="card stack-sm">
            <h3 className="sec-title"><Icon name="door" size={18} /> {t('รูปแบบการเข้าร่วม', 'How people join')}</h3>
            <div className="choice-cards" role="radiogroup" aria-label={t('รูปแบบงาน', 'Event access')}>
              {accessCards.map((c) => (
                <button key={c.value} type="button" role="radio" aria-checked={event.access === c.value} className={event.access === c.value ? 'choice-card on' : 'choice-card'} onClick={() => set({ access: c.value })}>
                  <span className="choice-icon"><Icon name={c.icon} size={20} /></span>
                  <b>{c.title}</b>
                  <span className="small muted">{c.desc}</span>
                </button>
              ))}
            </div>

            {event.access === 'closed' && (
              <div className="reg-window stack-sm">
                <div className="row between">
                  <b>{t('ช่วงเวลารับลงทะเบียน', 'Registration window')}</b>
                  <RegBadge event={event} count={count} showDetail />
                </div>
                <div className="grid">
                  <label>{t('เปิดรับลงทะเบียน', 'Opens')}
                    <input type="datetime-local" value={toInputValue(event.regOpenAt)} onChange={(e) => set({ regOpenAt: fromInput(e.target.value) })} />
                    <span className="hint">
                      {event.regOpenAt && <button type="button" className="link-btn" onClick={() => set({ regOpenAt: '' })}>{t('ล้างค่า (เปิดทันที)', 'Clear (open now)')}</button>}
                      {!event.regOpenAt && t('ว่าง = เปิดรับทันที', 'Empty = open now')}
                    </span>
                  </label>
                  <label>{t('ปิดรับลงทะเบียน', 'Closes')}
                    <input type="datetime-local" value={toInputValue(event.regCloseAt)} onChange={(e) => set({ regCloseAt: fromInput(e.target.value) })} />
                    <span className="hint">
                      {event.regCloseAt && <button type="button" className="link-btn" onClick={() => set({ regCloseAt: '' })}>{t('ล้างค่า (รับจนเต็ม)', 'Clear (until full)')}</button>}
                      {!event.regCloseAt && t('ว่าง = รับจนกว่าที่นั่งจะเต็ม', 'Empty = until seats run out')}
                    </span>
                  </label>
                </div>
                <div className="row">
                  <span className="small muted">{t('ตั้งค่าด่วน:', 'Quick set:')}</span>
                  <button type="button" className="chip-btn" onClick={() => set({ regOpenAt: new Date().toISOString() })}>{t('เปิดตั้งแต่ตอนนี้', 'Open from now')}</button>
                  <button type="button" className="chip-btn" onClick={() => set({ regCloseAt: event.startAt })}>{t('ปิดเมื่องานเริ่ม', 'Close at start')}</button>
                  <button type="button" className="chip-btn" onClick={closeOneDayBefore}>{t('ปิดก่อนงาน 1 วัน', 'Close 1 day before')}</button>
                </div>
                {event.regOpenAt && event.regCloseAt && event.regCloseAt <= event.regOpenAt && <div className="alert">{t('เวลาปิดรับต้องอยู่หลังเวลาเปิดรับ', 'The closing time must be after the opening time')}</div>}
                <Switch checked={event.regPaused} onChange={(v) => set({ regPaused: v })} label={t('หยุดรับลงทะเบียนชั่วคราว', 'Pause registration')} hint={t('ปิดฟอร์มทันทีโดยไม่ต้องแก้เวลา (เปิดกลับได้ทุกเมื่อ)', 'Close the form right away without changing the times')} />
              </div>
            )}
          </section>

        </div>

        {/* ---------- คอลัมน์ขวา: สถานที่ + แผนที่ ---------- */}
        <div className="stack">
          <section className="card stack-sm">
            <h3 className="sec-title"><Icon name="pin" size={18} /> {t('สถานที่จัดงาน', 'Venue')}</h3>
            <PlaceNameField label={t('ชื่อสถานที่', 'Place name')} value={event.location} placeholder={t('เช่น สยามสแควร์ วัน', 'e.g. Siam Square One')}
              onText={(text) => set({ location: text })} onPick={(p) => set({ location: p.name, address: p.address })} />
            <label>{t('ที่อยู่', 'Address')}
              <textarea value={event.address} onChange={(e) => set({ address: e.target.value })} placeholder={t('เช่น ถนนพระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ', 'e.g. Rama 1 Road, Pathum Wan, Bangkok')} />
              <span className="hint">{t('แผนที่ Google Maps ด้านล่างแสดงตามชื่อสถานที่และที่อยู่ที่กรอก ยิ่งระบุชัดเจน (ชื่อ + เขต/จังหวัด) ตำแหน่งยิ่งตรง', 'The Google Maps below follows the name and address you enter. The more specific (name + district/city), the more accurate.')}</span>
            </label>
            <MapEmbed query={placeQuery(event)} showEmptyHint />
            <label>{t('วิธีการเดินทาง', 'How to get there')}
              <textarea style={{ minHeight: 110 }} value={event.directions} onChange={(e) => set({ directions: e.target.value })} placeholder={t('เช่น BTS สยาม ทางออก 2 เดินต่อ 5 นาที', 'e.g. BTS Siam exit 2, then walk 5 minutes')} />
              <span className="hint">{t('แสดงเป็นตัวหนังสือใหญ่ในหน้าลงทะเบียนและตู้ Kiosk', 'Shown in large text on the registration page and kiosk')}</span>
            </label>
          </section>
        </div>
      </div>
    </div>
  );
}
