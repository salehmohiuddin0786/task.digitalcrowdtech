'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  Trash2,
  Check,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { getSocket } from '@/lib/socket';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const { user, tenant, setUnreadCount } = useAuth();

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getNotifications();
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Real-time socket listener
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('tdc_token') : null;
    if (!token || !user) return;

    const socket = getSocket(token, tenant?.id);
    if (!socket) return;

    const handleNewNotif = (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((c) => c + 1);
    };

    socket.on('notification:new', handleNewNotif);
    return () => {
      socket.off('notification:new', handleNewNotif);
    };
  }, [user, tenant, setUnreadCount]);

  const markAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'TASK_ASSIGNED':
        return <Info className="w-5 h-5 text-[#7F5D99]" />;
      case 'TASK_COMPLETED':
      case 'TASK_REVIEWED':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'TASK_CHANGES_REQUESTED':
      case 'TASK_OVERDUE':
        return <AlertCircle className="w-5 h-5 text-rose-600" />;
      default:
        return <Clock className="w-5 h-5 text-[#9E7EB5]" />;
    }
  };

  const filteredNotifications =
    filter === 'UNREAD' ? notifications.filter((n) => !n.isRead) : notifications;

  const unreadTotal = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#4C2365] tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-[#7F5D99]" />
            Notification Center
          </h2>
          <p className="text-xs text-[#6B6172] mt-0.5">
            Real-time feed of task assignments, review decisions, and system alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadTotal > 0 && (
            <button
              onClick={markAllRead}
              className="px-3.5 py-2 rounded-xl border border-[#E8DFED] bg-white text-xs font-bold text-[#7F5D99] hover:bg-[#FAF6FD] flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'ALL'
              ? 'bg-[#7F5D99] text-white shadow-xs'
              : 'bg-white text-[#6B6172] hover:bg-[#FAF6FD] border border-[#E8DFED]'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filter === 'UNREAD'
              ? 'bg-[#7F5D99] text-white shadow-xs'
              : 'bg-white text-[#6B6172] hover:bg-[#FAF6FD] border border-[#E8DFED]'
          }`}
        >
          Unread ({unreadTotal})
        </button>
      </div>

      {/* Notification Stream */}
      <div className="rounded-3xl bg-white border border-[#E8DFED] overflow-hidden shadow-xs divide-y divide-[#E8DFED]">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#6B6172]">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-10 h-10 text-[#C4A4DA] mx-auto mb-2 opacity-60" />
            <p className="text-sm font-bold text-[#251A2D]">
              {filter === 'UNREAD' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="text-xs text-[#6B6172] mt-1">You are all caught up on your alerts!</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 sm:p-5 flex items-start gap-4 transition-colors group ${
                !n.isRead ? 'bg-[#FAF6FD]/60' : 'bg-white'
              }`}
            >
              <div className="p-2.5 rounded-2xl bg-[#FAF6FD] border border-[#E8DFED] shrink-0">
                {getTypeIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className={`text-sm ${
                        !n.isRead ? 'font-extrabold text-[#251A2D]' : 'font-semibold text-[#6B6172]'
                      }`}
                    >
                      {n.title}
                    </h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#7F5D99] shrink-0" />
                    )}
                  </div>

                  <span className="text-[11px] text-[#6B6172] shrink-0">
                    {new Date(n.createdAt).toLocaleDateString()} •{' '}
                    {new Date(n.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs text-[#251A2D] mt-1 leading-relaxed">{n.message}</p>

                <div className="flex items-center gap-3 pt-2 text-xs">
                  {n.entityType === 'task' && n.entityId && (
                    <Link
                      href={`/dashboard/tasks/${n.entityId}`}
                      className="text-xs font-bold text-[#7F5D99] hover:text-[#4C2365] flex items-center gap-1 transition-colors"
                    >
                      Open Task
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {!n.isRead && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="text-xs font-medium text-[#6B6172] hover:text-[#7F5D99] flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Mark read
                    </button>
                  )}

                  <button
                    onClick={() => deleteNotification(n.id)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-[#6B6172] hover:text-rose-600 transition-opacity flex items-center gap-1 cursor-pointer ml-auto"
                    title="Delete notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
