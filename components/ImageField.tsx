'use client';
// ช่องใส่รูป: อัปโหลดไฟล์ หรือวางลิงก์ก็ได้
import Icon from './Icon';
import { useLang } from '@/lib/i18n';

type Props = { label: string; hint: string; value: string; onChange: (v: string) => void };

export default function ImageField({ label, hint, value, onChange }: Props) {
  const { t } = useLang();

  // อ่านไฟล์ที่เลือก แล้วแปลงเป็น data URL เพื่อเก็บใน LocalStorage
  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(t('กรุณาเลือกไฟล์รูปภาพ', 'Please choose an image file'));
      return;
    }
    if (file.size > 500 * 1024) {
      alert(t('ไฟล์ใหญ่เกิน 500 KB กรุณาย่อรูปก่อน', 'The file is larger than 500 KB. Please shrink it first'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  // ผู้ใช้เลือกไฟล์จากเครื่อง (เอาไฟล์แรกเท่านั้น)
  function handleSelect(files: FileList | null) {
    if (files && files.length > 0) {
      handleFile(files[0]);
    } else {
      handleFile(undefined);
    }
  }

  // รูปที่อัปโหลดเป็น data URL ยาวมาก ไม่แสดงในช่องลิงก์ (แสดงเฉพาะลิงก์ที่วางเอง)
  let linkValue = value;
  if (value.startsWith('data:')) linkValue = '';

  return (
    <div className="stack-sm">
      <b>{label}</b>
      <p className="hint">{hint}</p>
      {value && <img className="preview" src={value} alt={label} />}
      <div className="row">
        <label className="btn small-btn">
          <Icon name="upload" size={15} /> {t('อัปโหลดไฟล์', 'Upload file')}
          <input type="file" accept="image/*" hidden onChange={(e) => handleSelect(e.target.files)} />
        </label>
        {value && <button className="btn small-btn danger" onClick={() => onChange('')}>{t('ลบรูป', 'Remove')}</button>}
      </div>
      <input placeholder={t('หรือวางลิงก์รูป https://...', 'Or paste an image link https://...')} value={linkValue} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
