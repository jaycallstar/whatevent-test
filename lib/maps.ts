// โหลด Google Maps JavaScript API (ใช้เฉพาะตอนมี API key — ไม่บังคับ)
// มี NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ใน .env.local -> ช่องชื่อสถานที่มีรายการแนะนำจาก Google Places และเติม "ที่อยู่" ให้อัตโนมัติ
// ไม่มี key -> ไม่โหลดอะไรเลย (แผนที่ที่แสดงใช้การฝังของ Google ที่ไม่ต้องใช้ key)
// ต้องเปิดใช้ Maps JavaScript API และ Places API (New) ในโปรเจกต์ Google Cloud
export const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

let googleLoading: Promise<any> | null = null;
export function loadGoogle(): Promise<any> {
  if (googleLoading) return googleLoading;
  googleLoading = new Promise((resolve, reject) => {
    const w = window as any;
    if (w.google && w.google.maps && w.google.maps.importLibrary) return resolve(w.google);
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=' + GOOGLE_KEY + '&loading=async&language=th&v=weekly';
    script.async = true;
    script.onload = () => resolve(w.google);
    script.onerror = () => { googleLoading = null; reject(new Error('load')); };
    document.head.appendChild(script);
  });
  return googleLoading;
}
