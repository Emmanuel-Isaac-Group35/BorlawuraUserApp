import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { sendLocalNotification } from '../utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      let finalData: any[] = [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${searchId},target_audience.eq.all_users,target_audience.eq.all`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        if (error.code === '42703') {
          // Fallback if user_id column doesn't exist in notifications table
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('notifications')
            .select('*')
            .or('target_audience.eq.all_users,target_audience.eq.all')
            .order('created_at', { ascending: false })
            .limit(20);
          
          if (fallbackError) throw fallbackError;
          finalData = fallbackData || [];
        } else if (error.code === '42P01') {
          if (!_schemaMismatchLogged) {
            _schemaMismatchLogged = true;
            console.warn(
              `[Notifications] Table "notifications" does not exist. ` +
              'Run the notifications table migration in Supabase. Falling back to empty log.'
            );
          }
          return;
        } else {
          throw error;
        }
      } else {
        finalData = data || [];
      }

      // Load read and deleted ids from AsyncStorage
      const readIdsJson = await AsyncStorage.getItem(`read_notif_ids_${searchId}`);
      const readIds: string[] = readIdsJson ? JSON.parse(readIdsJson) : [];

      const deletedIdsJson = await AsyncStorage.getItem(`deleted_notif_ids_${searchId}`);
      const deletedIds: string[] = deletedIdsJson ? JSON.parse(deletedIdsJson) : [];

      const formatted = finalData
        .filter(n => !deletedIds.includes(n.id))
        .map(n => ({
          id: n.id,
          type: n.type || 'system',
          title: n.title,
          desc: n.message || n.body || n.content || '',
          time: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: n.user_id === searchId ? (n.is_read || n.read || false) : (readIds.includes(n.id) || n.is_read || n.read || false),
          icon: n.icon || 'ri-notification-3-fill',
          color: n.color || '#10b981',
        }));
      setNotifications(formatted);
    } catch (e) {
      console.log('[Notifications Sync] Operational bypass:', e);
    }
  }, [user, isLoggedIn]);

  useEffect(() => {
    fetchNotifications();

    const searchId = user?.supabase_id || user?.id;
    if (!searchId || !isLoggedIn || String(searchId).startsWith('user_')) return;

    // 1. Listen for new DB notifications (Real-time Broadcast & Direct)
    const notifChannel = supabase.channel('notif-sync')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications'
      }, (payload) => {
        const newNotif = payload.new;
        const isTargetedToMe = newNotif.user_id === searchId;
        const isBroadcastToUsers = newNotif.target_audience === 'all_users' || newNotif.target_audience === 'all';
        
        if (isTargetedToMe || isBroadcastToUsers) {
          fetchNotifications();
          sendLocalNotification(newNotif.title, newNotif.message || newNotif.body || "New update");
        }
      }).subscribe((status) => {
        if (status === 'CHANNEL_ERROR') console.log("[Notifications] DB Log Subscription bypassed.");
      });

    // Note: GlobalOrderListener.tsx handles the actual Order Status notifications.

    return () => {
      supabase.removeChannel(notifChannel);
    };
  }, [user, isLoggedIn, fetchNotifications]);

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
    if (!searchId) return;

    try {
      // Update DB for direct ones (defensive check for user_id existence handled silently)
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', searchId);
      
      // Save all notification IDs to read list in AsyncStorage
      const readIdsJson = await AsyncStorage.getItem(`read_notif_ids_${searchId}`);
      const readIds: string[] = readIdsJson ? JSON.parse(readIdsJson) : [];
      const newReadIds = Array.from(new Set([...readIds, ...notifications.map(n => n.id)]));
      await AsyncStorage.setItem(`read_notif_ids_${searchId}`, JSON.stringify(newReadIds));
    } catch (e) {
      console.log('[Notifications Read All] Error:', e);
    }
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [user, notifications]);

  const clearNotifications = useCallback(async () => {
    const searchId = user?.supabase_id || user?.id;
    if (!searchId) return;

    try {
      // Delete user's direct notifications from the database
      await supabase.from('notifications').delete().eq('user_id', searchId);

      // Save all current notification IDs to the deleted list in AsyncStorage so we filter them out
      const deletedIdsJson = await AsyncStorage.getItem(`deleted_notif_ids_${searchId}`);
      const deletedIds: string[] = deletedIdsJson ? JSON.parse(deletedIdsJson) : [];
      const newDeletedIds = Array.from(new Set([...deletedIds, ...notifications.map(n => n.id)]));
      await AsyncStorage.setItem(`deleted_notif_ids_${searchId}`, JSON.stringify(newDeletedIds));
    } catch (e) {
      console.log('[Notifications Clear All] Error:', e);
    }

    setNotifications([]);
  }, [user, notifications]);

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
