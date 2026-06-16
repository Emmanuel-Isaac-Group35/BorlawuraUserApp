import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  LayoutAnimation, ScrollView, Image,
  ActivityIndicator, Dimensions, useWindowDimensions
} from 'react-native';
import { typography } from '../../../utils/typography';
import { RemixIcon } from '../../../utils/icons';
import { navigateTo } from '../../../utils/navigation';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';
import { resolveRealUserId } from '../../../utils/user';
import { LinearGradient } from 'expo-linear-gradient';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────



// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  type: string;
  date: string;
  time: string;
  status: string;
  rider: string;
  rider_avatar?: string;
  icon: string;
  amount?: string;
  progress: number;
}

interface RecentOrdersProps {
  refreshing?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const getProgress = (status?: string | null) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'done') return 1;
  if (s === 'arrived') return 0.85;
  if (s === 'heading') return 0.6;
  if (s === 'in_progress' || s === 'active') return 0.4;
  if (s === 'accepted' || s === 'assigned' || s === 'confirmed') return 0.25;
  if (s === 'cancelled') return 0;
  return 0.1; // pending
};

const getStatusConfig = (status?: string | null) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'done')
    return { label: 'Completed',  color: '#10b981', icon: 'ri-checkbox-circle-fill',  progressColors: ['#10b981', '#059669'] as [string,string] };
  if (['in_progress', 'heading', 'arrived', 'active', 'accepted', 'assigned', 'confirmed'].includes(s))
    return { label: 'In Progress', color: '#3b82f6', icon: 'ri-loader-4-line',         progressColors: ['#3b82f6', '#1d4ed8'] as [string,string] };
  if (s === 'cancelled')
    return { label: 'Cancelled',  color: '#ef4444', icon: 'ri-close-circle-fill',     progressColors: ['#ef4444', '#dc2626'] as [string,string] };
  return   { label: 'Pending',   color: '#f59e0b', icon: 'ri-time-fill',             progressColors: ['#f59e0b', '#d97706'] as [string,string] };
};

const statusLabel = (status?: string | null) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'done') return 'Delivered';
  if (s === 'arrived') return 'Rider arrived';
  if (s === 'heading') return 'Rider en route';
  if (['in_progress', 'active', 'accepted', 'assigned', 'confirmed'].includes(s)) return 'In progress';
  if (s === 'cancelled') return 'Cancelled';
  return 'Awaiting rider';
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const RecentOrders: React.FC<RecentOrdersProps> = React.memo(({ refreshing }) => {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth > 400 ? 300 : screenWidth - 64;
  const { user } = useAuth();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  React.useEffect(() => {
    if (refreshing) fetchRecentOrders();
  }, [refreshing]);

  // ── Fetch orders ──────────────────────────────────────────────────────────
  const fetchRecentOrders = async () => {
    const searchId = await resolveRealUserId(user);
    if (!searchId) return;

    if (orders.length === 0) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', searchId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const riderIds = Array.from(new Set((data || []).map((o: any) => o.rider_id).filter(Boolean)));
      let ridersMap: Record<string, { full_name: string; avatar_url: string | null }> = {};

      if (riderIds.length > 0) {
        const { data: rd } = await supabase
          .from('riders')
          .select('id, full_name, avatar_url')
          .in('id', riderIds);
        if (rd) rd.forEach((r: any) => { ridersMap[r.id] = r; });
      }

      const formatted: Order[] = (data || []).map((p: any) => {
        const riderInfo = p.rider_id ? ridersMap[p.rider_id] : null;
        return {
          id: p.id,
          type: p.service_type || 'Waste Pickup',
          date: p.created_at ? new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Pending',
          time: p.created_at ? new Date(p.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '--:--',
          status: p.status,
          amount: p.total_price ? `GHS ${p.total_price}` : undefined,
          icon: (p.service_type || '').toLowerCase().includes('instant') ? 'ri-flashlight-fill' : 'ri-moped-fill',
          progress: getProgress(p.status),
          rider: riderInfo?.full_name || (p.status === 'pending' ? 'Assigning...' : 'Fleet Rider'),
          rider_avatar: riderInfo?.avatar_url || undefined,
        };
      });

      if (isMounted.current) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOrders(formatted);
      }
    } catch (e) {
      console.error('[RecentOrders] Fetch error:', e);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  };

  // ── Real-time subscription ────────────────────────────────────────────────
  React.useEffect(() => {
    fetchRecentOrders();
    let subChannel: any;
    const setup = async () => {
      const searchId = await resolveRealUserId(user);
      if (!searchId) return;
      subChannel = supabase
        .channel(`recent-orders-${searchId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${searchId}` },
          () => fetchRecentOrders())
        .subscribe();
    };
    setup();
    return () => { if (subChannel) supabase.removeChannel(subChannel); };
  }, [user]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color="#10b981" />
      </View>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (orders.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBox}>
            <RemixIcon name="ri-moped-fill" size={26} color="#10b981" />
          </View>
          <Text style={styles.emptyTitle}>No pickups yet</Text>
          <Text style={styles.emptySub}>Your recent waste collection requests will show up here.</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigateTo('/booking')}>
            <Text style={styles.emptyBtnText}>Schedule a Pickup</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Cards ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={cardWidth + 16}
        snapToAlignment="start"
      >
        {orders.map((order, idx) => {
          const cfg = getStatusConfig(order.status);
          const isCompleted = order.status === 'completed' || order.status === 'done';
          const isCancelled = order.status === 'cancelled';
          // Highlight the first (most recent) card
          const highlight = idx === 0;

          return (
            <TouchableOpacity
              key={order.id}
              style={[styles.orderCard, { width: cardWidth }, highlight && styles.orderCardHighlight]}
              onPress={() => navigateTo('/track-order', { id: order.id })}
              activeOpacity={0.92}
            >
              {/* Gradient background for highlight */}
              {highlight && (
                <LinearGradient
                  colors={[cfg.color + '22', '#fff0']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              )}
              {/* ── Top: status + price ── */}
              <View style={styles.cardTop}>
                <View style={[styles.statusPill, { backgroundColor: cfg.color + '15' }]}> 
                  <RemixIcon name={cfg.icon} size={11} color={cfg.color} />
                  <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                {order.amount && (
                  <Text style={styles.priceText}>{order.amount}</Text>
                )}
              </View>

              {/* ── Service + date ── */}
              <View style={styles.serviceRow}>
                <View style={styles.serviceIconBox}>
                  <RemixIcon name={order.icon} size={20} color="#0f172a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceTitle} numberOfLines={1}>{order.type}</Text>
                  <Text style={styles.dateText}>{order.date} · {order.time}</Text>
                </View>
              </View>

              {/* ── Progress bar ── */}
              {!isCancelled && (
                <View style={styles.progressWrap}>
                  <View style={styles.progressTrack}>
                    <LinearGradient
                      colors={cfg.progressColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressFill, { width: `${order.progress * 100}%` as any }]}
                    />
                  </View>
                  <Text style={styles.progressLabel}>{statusLabel(order.status)}</Text>
                </View>
              )}

              {/* ── Rider / footer ── */}
              <View style={styles.cardFooter}>
                <View style={styles.riderRow}>
                  {order.rider_avatar ? (
                    <Image source={{ uri: order.rider_avatar }} style={styles.riderAvatar} />
                  ) : (
                    <View style={styles.riderAvatarFallback}>
                      <RemixIcon name="ri-user-3-fill" size={14} color="#94a3b8" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.riderLabel}>Rider</Text>
                    <Text style={styles.riderName} numberOfLines={1}>{order.rider}</Text>
                  </View>
                </View>
                <View style={[styles.arrowBox, { backgroundColor: cfg.color + '10' }]}> 
                  <RemixIcon
                    name={isCompleted ? 'ri-checkbox-circle-fill' : 'ri-arrow-right-s-line'}
                    size={18}
                    color={cfg.color}
                  />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* ── "View All" card ── */}
        <TouchableOpacity style={styles.viewAllCard} onPress={() => navigateTo('/orders')}>
          <View style={styles.viewAllIcon}>
            <RemixIcon name="ri-moped-fill" size={22} color="#10b981" />
          </View>
          <Text style={styles.viewAllTitle}>All Orders</Text>
          <Text style={styles.viewAllSub}>See your full pickup history</Text>
          <View style={styles.viewAllBtn}>
            <RemixIcon name="ri-arrow-right-line" size={16} color="#10b981" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { marginTop: 8, marginBottom: 20 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 4 },
  loadingBox: { height: 180, alignItems: 'center', justifyContent: 'center' },

  // Empty state
  emptyWrap: { marginBottom: 24, paddingHorizontal: 20 },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  emptyIconBox: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: 'rgba(16,185,129,0.08)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 16, fontFamily: typography.bold, color: '#0f172a', marginBottom: 6 },
  emptySub: { fontSize: 13, fontFamily: typography.medium, color: '#94a3b8', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn: { backgroundColor: '#0f172a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { fontSize: 12, fontFamily: typography.bold, color: '#ffffff', letterSpacing: 0.5 },

  // Order card
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
  },
  orderCardHighlight: {
    borderColor: '#10b981',
    borderWidth: 2,
    elevation: 7,
  },

  // Card top row
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusPillText: { fontSize: 10, fontFamily: typography.bold },
  priceText: { fontSize: 13, fontFamily: typography.bold, color: '#0f172a' },

  // Service row
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  serviceIconBox: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: '#f8fafc',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#f1f5f9',
    flexShrink: 0,
  },
  serviceTitle: { fontSize: 16, fontFamily: typography.bold, color: '#0f172a', letterSpacing: -0.3 },
  dateText: { fontSize: 11, fontFamily: typography.medium, color: '#94a3b8', marginTop: 3 },

  // Progress
  progressWrap: { marginBottom: 18 },
  progressTrack: {
    height: 5, backgroundColor: '#f1f5f9',
    borderRadius: 3, overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 11, fontFamily: typography.medium, color: '#94a3b8' },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 16,
  },
  riderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  riderAvatar: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#f1f5f9' },
  riderAvatarFallback: {
    width: 34, height: 34, borderRadius: 11,
    backgroundColor: '#f8fafc',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  riderLabel: { fontSize: 9, fontFamily: typography.bold, color: '#94a3b8', letterSpacing: 0.5 },
  riderName: { fontSize: 12, fontFamily: typography.bold, color: '#1e293b', marginTop: 1 },
  arrowBox: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },

  // View All card
  viewAllCard: {
    width: 160,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 20,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    borderStyle: 'dashed',
    gap: 8,
  },
  viewAllIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: 'rgba(16,185,129,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  viewAllTitle: { fontSize: 14, fontFamily: typography.bold, color: '#0f172a', textAlign: 'center' },
  viewAllSub: { fontSize: 11, fontFamily: typography.medium, color: '#94a3b8', textAlign: 'center', lineHeight: 16 },
  viewAllBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(16,185,129,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
});
