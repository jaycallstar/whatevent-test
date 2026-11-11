'use client';
// "กิจกรรมที่เลือกอยู่" (current event) ใช้ร่วมกันทุกหน้าหลัง login
//  - user: เลือกได้เฉพาะกิจกรรมที่ admin มอบหมายให้
//  - admin: เลือกได้ทุกกิจกรรม
// เมนูซ้ายมีตัวสลับกิจกรรม แล้วทุกหน้า (แดชบอร์ด ตั้งค่า ผู้ลงทะเบียน ...) จะแสดงข้อมูลของกิจกรรมนี้
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth';
import { useStore } from './db';
import { canSee } from './helpers';
import type { EventItem } from './types';

type EventValue = {
  allEvents: EventItem[]; // ทุกกิจกรรมในระบบ (ใช้ในหน้า admin)
  setAllEvents: (list: EventItem[]) => void;
  events: EventItem[]; // เฉพาะกิจกรรมที่ผู้ใช้เห็นได้
  current: EventItem | null; // กิจกรรมที่เลือกอยู่
  setCurrentId: (id: string) => void;
  updateCurrent: (changed: EventItem) => void; // บันทึกการแก้ไขกิจกรรม
  ready: boolean;
};

const EventContext = createContext<EventValue>({
  allEvents: [], setAllEvents: () => {}, events: [], current: null, setCurrentId: () => {}, updateCurrent: () => {}, ready: false,
});
const CURRENT_KEY = 'we_current_event';

export function EventProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [allEvents, setAllEvents, ready] = useStore<EventItem>('events');
  const [savedId, setSavedId] = useState('');

  useEffect(() => {
    setSavedId(localStorage.getItem(CURRENT_KEY) || '');
  }, []);

  const events = user ? allEvents.filter((e) => canSee(e, user)) : [];
  // ถ้ากิจกรรมที่เคยเลือกไว้ใช้ไม่ได้แล้ว ให้ใช้กิจกรรมแรกในรายการแทน
  const current = events.find((e) => e.id === savedId) || events[0] || null;

  function setCurrentId(id: string) {
    localStorage.setItem(CURRENT_KEY, id);
    setSavedId(id);
  }

  function updateCurrent(changed: EventItem) {
    setAllEvents(allEvents.map((e) => (e.id === changed.id ? changed : e)));
  }

  return (
    <EventContext.Provider value={{ allEvents, setAllEvents, events, current, setCurrentId, updateCurrent, ready }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  return useContext(EventContext);
}
