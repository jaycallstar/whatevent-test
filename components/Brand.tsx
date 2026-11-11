// โลโก้ WhatEvent (รูปอยู่ที่ public/logo.png เปลี่ยนรูปได้โดยแทนที่ไฟล์นั้น)
export default function Brand({ size = 36 }: { size?: number }) {
  return (
    <span className="brand">
      <img className="brand-logo" src="/logo.png" alt="" width={size} height={size} style={{ width: size, height: size }} />
      <span>WhatEvent</span>
    </span>
  );
}
