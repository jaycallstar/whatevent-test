'use client';
// แสดงผลแบบสอบถามทีละคำถาม (ใช้ทั้งในแดชบอร์ดและหน้ารายงาน)
import { BarChart, HBar } from './Charts';
import Icon from './Icon';
import { answersOf, choiceCounts, ratingCounts } from '@/lib/analytics';
import { useLang } from '@/lib/i18n';
import type { EventItem, Response } from '@/lib/types';

// hideRating = ไม่แสดงคำถามแบบให้คะแนน (ความพึงพอใจ) — ใช้ในแดชบอร์ด
export default function SurveyResults({ event, responses, hideRating = false }: { event: EventItem; responses: Response[]; hideRating?: boolean }) {
  const { t } = useLang();

  const questions = event.questions.filter((q) => !(hideRating && q.type === 'rating'));
  // การ์ดกราฟ (ไม่ใช่พิมพ์ตอบ) จำนวนคี่ -> ใบสุดท้ายกว้างเต็มแถว จะได้ไม่มีช่องว่าง
  const charts = questions.filter((q) => q.type !== 'text');
  const lastChart = charts.length % 2 === 1 ? charts[charts.length - 1].id : '';

  if (questions.length === 0) return <div className="card muted">{t('ยังไม่มีแบบสอบถาม ไปสร้างได้ที่เมนู “แบบสอบถาม”', 'No survey yet. Create one in the “Survey” menu.')}</div>;

  return (
    <div className="survey-grid">
      {questions.map((q) => {
        const answers = answersOf(responses, q.id);
        return (
          <div key={q.id} className={q.type === 'text' || q.id === lastChart ? 'card stack-sm full' : 'card stack-sm'}>
            <div className="row between"><h3>{q.text}</h3><span className="small muted">{answers.length} {t('คำตอบ', 'answers')}</span></div>

            {q.type === 'rating' && (() => {
              const rows = ratingCounts(answers);
              let sum = 0;
              for (const a of answers) sum += Number(a);
              const avg = answers.length > 0 ? (sum / answers.length).toFixed(1) : '-';
              return (
                <>
                  <div className="row"><span className="avg-score"><Icon name="star" size={22} filled /> {avg}</span><span className="muted small">/ 5 {t('คะแนนเฉลี่ย', 'average')}</span></div>
                  <BarChart data={rows.map((r) => ({ label: r.label, value: r.value }))} />
                </>
              );
            })()}

            {q.type === 'choice' && choiceCounts(q.options, answers).map((row, i) => (
              <HBar key={row.label} label={(i + 1) + '. ' + row.label} value={row.value} total={answers.length} unit={t('คน', 'people')} />
            ))}

            {q.type === 'text' && (answers.length === 0
              ? <p className="muted small">{t('ยังไม่มีคำตอบ', 'No answers yet')}</p>
              : <div className="comments">{answers.slice(0, 8).map((a, i) => <p key={i} className="note">{a}</p>)}</div>)}
          </div>
        );
      })}
    </div>
  );
}
