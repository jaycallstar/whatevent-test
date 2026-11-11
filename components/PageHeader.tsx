// หัวของแต่ละหน้า: ชื่อหน้า + คำอธิบาย + ปุ่มด้านขวา (ส่งปุ่มเข้ามาทาง children)
import { ReactNode } from 'react';

export default function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="muted">{subtitle}</p>}
      </div>
      {children && <div className="row no-print">{children}</div>}
    </div>
  );
}
