'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Clock, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { unreadCount, setUnreadCount } = useAuth();
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    if (!isOpen) {
      loadNotifications();
    }
    setIsOpen(!isOpen);
  };

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <Info className="w-4 h-4 text-[#7F5D99]" />;
      case 'TASK_SUBMITTED':
      case 'TASK_REVIEWED':
        return <CheckCircle2 className="w-4 h-4 text-[#237A4B]" />;
      case 'TASK_OVERDUE':
        return <AlertCircle className="w-4 h-4 text-[#B42318]" />;
      default:
        return <Clock className="w-4 h-4 text-[#9E7EB5]" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative p-2.5 rounded-xl text-[#6B6172] hover:text-[#4C2365] hover:bg-[#F2EDF7] transition-colors cursor-pointer"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#B42318] text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-xl border border-[#E8DFED] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-[#E8DFED] flex items-center justify-between bg-[#FAF6FD]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#4C2365]">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#7F5D99] text-white">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium text-[#7F5D99] hover:text-[#4C2365] flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-[#E8DFED]">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#6B6172]">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-[#C4A4DA] mx-auto mb-2 opacity-60" />
                <p className="text-sm font-medium text-[#251A2D]">No notifications yet</p>
                <p className="text-xs text-[#6B6172] mt-0.5">
                  You are completely caught up on your tasks!
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={(e) => !item.isRead && markAsRead(item.id, e)}
                  className={`p-3.5 flex items-start gap-3 hover:bg-[#FAF6FD] transition-colors cursor-pointer ${
                    !item.isRead ? 'bg-[#F8F4FA]/80' : 'bg-white'
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-[#F2EDF7] shrink-0">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-xs ${
                          !item.isRead ? 'font-bold text-[#251A2D]' : 'font-medium text-[#6B6172]'
                        } truncate`}
                      >
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#7F5D99] shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-[#6B6172] line-clamp-2 mt-0.5">{item.message}</p>
                    <span className="text-[10px] text-[#9E7EB5] mt-1 block">
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 border-t border-[#E8DFED] bg-white text-center">
            <span className="text-[11px] text-[#6B6172]">
              In-app notification center • Socket.IO live alerts enabled
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
