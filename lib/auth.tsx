'use client';
// ระบบ Login: เก็บ "session" (ข้อมูลคนที่ login อยู่) ไว้ใน LocalStorage
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { readStore } from './db';
import type { Role, User } from './types';

export type Session = { id: string; name: string; username: string; role: Role };

type AuthValue = {
  user: Session | null;
  ready: boolean; // true เมื่ออ่าน session เสร็จแล้ว
  login: (username: string, password: string) => Session | null; // สำเร็จคืน session / ไม่สำเร็จคืน null
  logout: () => void;
  refresh: () => void; // ใช้หลังแก้ชื่อตัวเอง เพื่ออัปเดตชื่อที่แสดง
};

const AuthContext = createContext<AuthValue>({ user: null, ready: false, login: () => null, logout: () => {}, refresh: () => {} });
const SESSION_KEY = 'we_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  // เปิดเว็บครั้งแรก: อ่าน session ที่เคยบันทึกไว้
  useEffect(() => {
    const text = localStorage.getItem(SESSION_KEY);
    if (text) {
      const saved: Session = JSON.parse(text);
      // session เก่าของ admin ตัวอย่างที่ยังใช้ชื่อ "ผู้ดูแลระบบ"
      if (saved.id === 'u-admin' && saved.name === 'ผู้ดูแลระบบ') saved.name = 'Admin';
      setUser(saved);
    }
    setReady(true);
  }, []);

  function saveSession(u: User): Session {
    const session: Session = { id: u.id, name: u.name, username: u.username, role: u.role };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session);
    return session;
  }

  function login(username: string, password: string): Session | null {
    const users = readStore<User>('users');
    for (const u of users) {
      if (u.username === username.trim() && u.password === password) {
        return saveSession(u);
      }
    }
    return null; // หาไม่เจอ = username หรือ password ผิด
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  function refresh() {
    if (!user) return;
    const users = readStore<User>('users');
    for (const u of users) {
      if (u.id === user.id) {
        saveSession(u);
        return;
      }
    }
    logout(); // หาไม่เจอ = บัญชีถูกลบแล้ว
  }

  return <AuthContext.Provider value={{ user, ready, login, logout, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
