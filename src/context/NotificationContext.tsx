import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { sendLocalNotification } from '../utils/notifications';

export interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: string;
  icon: string;
  color: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notif: Omit<AppNotification, 'id' | 'time' | 'read'>) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Module-level flag — ensures the schema-mismatch warning is only logged once per session
let _schemaMismatchLogged = false;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetchNotifications = useCallback(async () => {
    const searchId = user?.supabase_id || user?.id;
    if (!searchId || !isLoggedIn || String(searchId).startsWith('user_')) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', searchId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        // 42703 = column "user_id" does not exist → table schema needs migration
        // 42P01 = table "notifications" does not exist → table needs to be created
        if (error.code === '42703' || error.code === '42P01') {
          if (!_schemaMismatchLogged) {
            _schemaMismatchLogged = true;
            console.warn(
              `[Notifications] Schema issue (${error.code}): ${error.message}. ` +
              'Run the notifications table migration in Supabase. Falling back to empty log.'
            );
          }
          return;
        }
        throw error;
      }

      if (data) {
        const formatted = data.map(n => ({
          id: n.id,
          type: n.type || 'system',
          title: n.title,
          desc: n.message || n.body || n.content || '',
          time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: n.is_read || n.read || false,
          icon: n.icon || 'ri-notification-3-fill',
          color: n.color || '#10b981',
        }));
        setNotifications(formatted);
      }
    } catch (e) {
      // Silent fail — don't crash the app for a non-critical feature
      console.log('[Notifications Sync] Operational bypass:', e);
    }
  }, [user, isLoggedIn]);

  useEffect(() => {
    fetchNotifications();

    const searchId = user?.supabase_id || user?.id;
    if (!searchId || !isLoggedIn || String(searchId).startsWith('user_')) return;

    // 1. Listen for new DB notifications (Defensive)
    const notifChannel = supabase.channel('notif-sync')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${searchId}` 
      }, (payload) => {
        fetchNotifications();
        sendLocalNotification(payload.new.title, payload.new.message || payload.new.body || "New update");
      }).subscribe((status) => {
        if (status === 'CHANNEL_ERROR') console.log("[Notifications] DB Log Subscription bypassed.");
      });

    // 2. Listen for Order Status Changes (The core "Sync" - MUST WORK)
    const orderChannel = supabase.channel('global-order-sync')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders', 
        filter: `user_id=eq.${searchId}` 
      }, (payload) => {
        const status = payload.new.status;
        const title = `Order ${status.toUpperCase()}`;
        let message = `Your order status has been updated to ${status}.`;

        if (status === 'accepted') message = "A rider has accepted your mission request!";
        if (status === 'arrived') message = "Your rider has arrived at the pickup location.";
        if (status === 'completed') message = "Mission successful! Your waste has been collected.";

        sendLocalNotification(title, message);
        fetchNotifications(); // Refresh to show the latest state
      }).subscribe((status) => {
        if (status === 'CHANNEL_ERROR') console.warn("[Sync] Critical: Order sync channel failed.");
      });

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(orderChannel);
    };
  }, [user, isLoggedIn]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: Math.random().toString(36).substring(2, 11),
      time: 'Just now',
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markAllAsRead = useCallback(async () => {
    const searchId = user?.supabase_id || user?.id;
    if (searchId) {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', searchId);
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [user]);

  const clearNotifications = useCallback(async () => {
    const searchId = user?.supabase_id || user?.id;
    if (searchId) {
      await supabase.from('notifications').delete().eq('user_id', searchId);
    }
    setNotifications([]);
  }, [user]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllAsRead, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
