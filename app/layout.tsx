// โครงหลักของทุกหน้า: ใส่ฟอนต์ + ระบบสลับภาษา + ระบบ login + ตั้งค่า Dark/Light
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { LangProvider } from '@/lib/i18n';
import './globals.css';

export const metadata: Metadata = { title: 'WhatEvent', description: 'Event & Survey platform' };

// สคริปต์สั้น ๆ อ่านโหมดที่เคยเลือกไว้ก่อนหน้าเว็บแสดงผล (กันหน้าจอกะพริบ)
const themeScript = `try{var t=localStorage.getItem('we_theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <LangProvider>
          <AuthProvider>{children}</AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}