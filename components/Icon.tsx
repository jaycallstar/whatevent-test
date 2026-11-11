// ไอคอนจากไลบรารีจริง: Lucide (ผ่านแพ็กเกจ react-icons) — ไม่ใช้อีโมจิ
// เรียกใช้ด้วย <Icon name="chart" />  เพิ่มไอคอนใหม่: import จาก 'react-icons/lu' แล้วเพิ่มใน icons
// ดูรายชื่อไอคอนทั้งหมดได้ที่ https://lucide.dev/icons
import type { IconType } from 'react-icons';
import {
  LuArrowDown, LuArrowUp, LuCalendarDays, LuChartColumn, LuChevronDown, LuChevronLeft, LuChevronRight, LuChevronUp,
  LuChevronsUpDown, LuCircle, LuCircleCheck, LuCircleCheckBig, LuClipboardList, LuClock, LuCopy, LuDoorOpen, LuDownload,
  LuEllipsis, LuExternalLink, LuEye, LuEyeOff, LuFileText, LuHouse, LuImage, LuInfo, LuLayers, LuLayoutDashboard,
  LuLayoutGrid, LuList, LuLocateFixed, LuLock, LuLockOpen, LuLogOut, LuMapPin, LuMaximize, LuMonitor, LuMonitorSmartphone,
  LuMoon, LuNavigation, LuPalette, LuPanelLeft, LuPlus, LuPrinter, LuQrCode, LuRefreshCw, LuScanQrCode, LuSearch,
  LuShieldCheck, LuSmartphone, LuSparkles, LuStar, LuSun, LuTablet, LuTicket, LuTrash2, LuTrendingUp, LuTriangleAlert,
  LuType, LuUpload, LuUser, LuUserCog, LuUserPlus, LuUsers, LuX, LuZap,
} from 'react-icons/lu';

const icons: Record<string, IconType> = {
  chart: LuLayoutDashboard, bars: LuChartColumn, info: LuInfo, pin: LuMapPin, palette: LuPalette, clipboard: LuClipboardList,
  users: LuUsers, qr: LuQrCode, file: LuFileText, calendar: LuCalendarDays, shield: LuShieldCheck, check: LuCircleCheck,
  'check-big': LuCircleCheckBig, star: LuStar, trend: LuTrendingUp, clock: LuClock, ticket: LuTicket, plus: LuPlus,
  trash: LuTrash2, download: LuDownload, upload: LuUpload, search: LuSearch, logout: LuLogOut, user: LuUser, sun: LuSun,
  moon: LuMoon, more: LuEllipsis, external: LuExternalLink, copy: LuCopy, image: LuImage, print: LuPrinter, layers: LuLayers,
  kiosk: LuMonitorSmartphone, assign: LuUserCog, chevron: LuChevronDown, 'chevron-up': LuChevronUp,
  'chevron-right': LuChevronRight, 'chevron-left': LuChevronLeft, chevrons: LuChevronsUpDown, sidebar: LuPanelLeft,
  eye: LuEye, 'eye-off': LuEyeOff, lock: LuLock, unlock: LuLockOpen, maximize: LuMaximize, scan: LuScanQrCode,
  up: LuArrowUp, down: LuArrowDown, x: LuX, locate: LuLocateFixed, type: LuType, list: LuList, sparkle: LuSparkles,
  grid: LuLayoutGrid, refresh: LuRefreshCw, 'user-plus': LuUserPlus, home: LuHouse, monitor: LuMonitor, phone: LuSmartphone,
  tablet: LuTablet, door: LuDoorOpen, bolt: LuZap, alert: LuTriangleAlert, navigation: LuNavigation,
};

// filled = true จะระบายสีทึบ (ใช้กับดาวให้คะแนน)
export default function Icon({ name, size = 18, filled = false }: { name: string; size?: number; filled?: boolean }) {
  const Svg = icons[name] || LuCircle;
  return <Svg size={size} strokeWidth={1.9} fill={filled ? 'currentColor' : 'none'} aria-hidden focusable="false" />;
}
