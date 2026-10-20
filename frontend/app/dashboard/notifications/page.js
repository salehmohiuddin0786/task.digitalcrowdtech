'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Clock, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { api } from '@/lib/api';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight">
            Notification History
          </h2>
          <p className="text-xs text-[#6B6172] mt-0.5">
            Full audit trail of task alerts, approvals, and system events.
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="px-4 py-2 rounded-xl border border-[#E8DFED] bg-white text-xs font-semibold text-[#7F5D99] hover:bg-[#FAF6FD] flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <CheckCheck className="w-4 h-4" />
          Mark all as read
        </button>
      </div>

      <div className="rounded-3xl bg-white border border-[#E8DFED] overflow-hidden shadow-xs divide-y divide-[#E8DFED]">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#6B6172]">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-10 h-10 text-[#C4A4DA] mx-auto mb-2 opacity-60" />
            <p className="text-sm font-bold text-[#251A2D]">All caught up!</p>
            <p className="text-xs text-[#6B6172] mt-1">No alerts or notifications recorded.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-colors ${
                !n.isRead ? 'bg-[#FAF6FD]/60' : 'bg-white'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-[#FAF6FD] border border-[#E8DFED] shrink-0 text-[#7F5D99]">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-[#251A2D]">{n.title}</h4>
                  <span className="text-[11px] text-[#6B6172]">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-[#6B6172] mt-1">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
