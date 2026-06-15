import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import { typography } from '../../utils/typography';
import { useAuth } from '../../context/AuthContext';
import { OrderService } from '../../services/OrderService';
import { LinearGradient } from 'expo-linear-gradient';
import { resolveRealUserId } from '../../utils/user';
import { supabase } from '../../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get('window');
const isSmall = SCREEN_W < 360;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const getStatusConfig = (status: string) => {
  const s = status?.toLowerCase() ?? '';
  if (['in_progress', 'active', 'accepted', 'assigned', 'confirmed', 'heading', 'arrived'].includes(s))
    return { color: '#3b82f6', bg: '#eff6ff', label: 'Active', icon: 'ri-loader-4-line' };
  if (s === 'pending' || s === 'scheduled')
    return { color: '#f59e0b', bg: '#fffbeb', label: 'Pending', icon: 'ri-time-line' };
  if (s === 'completed' || s === 'done')
    return { color: '#10b981', bg: '#ecfdf5', label: 'Completed', icon: 'ri-checkbox-circle-line' };
  return { color: '#ef4444', bg: '#fef2f2', label: 'Cancelled', icon: 'ri-close-circle-line' };
};

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

const OrdersPage: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  // ── Real-time subscription ────────────────────────────────────────────────
  useEffect(() => {
    fetchOrders();
    let subChannel: any;
    const setup = async () => {
      const searchId = await resolveRealUserId(user);
      if (!searchId) return;
      subChannel = supabase
        .channel(`orders-live-${searchId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${searchId}` },
          () => fetchOrders())
        .subscribe();
    };
    setup();
    return () => { if (subChannel) supabase.removeChannel(subChannel); };
  }, [user]);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchOrders = async () => {
    const searchId = await resolveRealUserId(user);
    if (!searchId) return;
    setIsLoading(true);
    try {
      const data = await OrderService.getOrdersByUserId(searchId);
      if (!data) { setOrders([]); return; }

      const riderIds = [...new Set(data.map((p: any) => p.rider_id).filter(Boolean))];
      let ridersMap: Record<string, any> = {};
      if (riderIds.length > 0) {
        const { data: rd } = await supabase.from('riders').select('id, full_name, phone_number').in('id', riderIds as string[]);
        if (rd) rd.forEach((r: any) => { ridersMap[r.id] = r; });
      }

      setOrders(data.map((p: any) => ({
        id: (p.id || '').slice(0, 8).toUpperCase(),
        realId: p.id,
        status: p.status,
        service: p.service_type || 'Waste Pickup',
        date: p.created_at ? formatDate(p.created_at) : 'Unknown',
        time: p.scheduled_at ? formatTime(p.scheduled_at) : (p.created_at ? formatTime(p.created_at) : '--:--'),
        address: p.address || 'No address',
        wasteType: p.waste_type || 'General',
        bagSize: p.waste_size || 'Standard',
        rider: p.rider_id ? (ridersMap[p.rider_id]?.full_name || null) : null,
        riderPhone: p.rider_id ? (ridersMap[p.rider_id]?.phone_number || null) : null,
      })));
    } catch { setOrders([]); }
    finally { setIsLoading(false); }
  };

  const activeOrders = orders.filter(o =>
    ['pending', 'scheduled', 'in_progress', 'active', 'accepted', 'assigned', 'confirmed', 'heading', 'arrived']
      .includes(o.status?.toLowerCase())
  );
  const historyOrders = orders.filter(o =>
    ['completed', 'done', 'cancelled'].includes(o.status?.toLowerCase())
  );
  const shown = activeTab === 'active' ? activeOrders : historyOrders;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />

      {/* ── Header gradient ── */}
      <LinearGradient
        colors={['#10b981', '#065f46', '#022c22']}
        style={[styles.header, { paddingTop: insets.top + 70 }]}
      >
        {/* Summary row */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerEyebrow}>YOUR ORDERS</Text>
            <Text style={styles.headerCount} numberOfLines={1} adjustsFontSizeToFit>
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} Total
            </Text>
          </View>
          {activeOrders.length > 0 && (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>{activeOrders.length} Active</Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.tabActive]}
            onPress={() => setActiveTab('active')}
            activeOpacity={0.85}
          >
            <RemixIcon
              name="ri-loader-4-line"
              size={14}
              color={activeTab === 'active' ? '#0f172a' : 'rgba(255,255,255,0.5)'}
            />
            <Text style={[styles.tabLabel, activeTab === 'active' && styles.tabLabelActive]}>
              Active
            </Text>
            {activeOrders.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{activeOrders.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.85}
          >
            <RemixIcon
              name="ri-history-line"
              size={14}
              color={activeTab === 'history' ? '#0f172a' : 'rgba(255,255,255,0.5)'}
            />
            <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>
              History
            </Text>
            {historyOrders.length > 0 && (
              <View style={[styles.tabBadge, { backgroundColor: '#94a3b8' }]}>
                <Text style={styles.tabBadgeText}>{historyOrders.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── List ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchOrders} tintColor="#10b981" />}
        showsVerticalScrollIndicator={false}
      >
        {shown.length > 0 ? (
          shown.map(order => <OrderCard key={order.realId} order={order} />)
        ) : (
          <EmptyState tab={activeTab} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Order Card
// ─────────────────────────────────────────────────────────────────────────────

const OrderCard: React.FC<{ order: any }> = ({ order }) => {
  const cfg = getStatusConfig(order.status);
  const isHistory = ['completed', 'done', 'cancelled'].includes(order.status?.toLowerCase());
  const isCompleted = ['completed', 'done'].includes(order.status?.toLowerCase());
  const isCancelled = order.status?.toLowerCase() === 'cancelled';

  return (
    <TouchableOpacity
      style={[styles.card, isHistory && styles.cardHistory]}
      onPress={() => navigateTo('/track-order', { id: order.realId })}
      activeOpacity={0.88}
    >
      {/* Top row: icon + service + status badge */}
      <View style={styles.cardTop}>
        <View style={[styles.serviceIcon, isHistory && styles.serviceIconHistory]}>
          <RemixIcon
            name={order.service?.toLowerCase().includes('instant') ? 'ri-flashlight-fill' : 'ri-moped-fill'}
            size={18}
            color={isHistory ? '#94a3b8' : '#10b981'}
          />
        </View>
        <View style={styles.cardTopMid}>
          <Text style={styles.serviceName} numberOfLines={1}>{order.service}</Text>
          <Text style={styles.orderId}>#{order.id}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <RemixIcon name={cfg.icon} size={11} color={cfg.color} />
          <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Body: date, waste type, address */}
      <View style={styles.cardBody}>
        <View style={styles.metaRow}>
          <MetaChip icon="ri-calendar-event-line" label={`${order.date} · ${order.time}`} />
          <MetaChip icon="ri-recycle-line" label={order.wasteType} />
        </View>
        <View style={[styles.metaRow, { marginTop: 8 }]}>
          <RemixIcon name="ri-map-pin-2-line" size={13} color="#94a3b8" />
          <Text style={styles.addressText} numberOfLines={1}>{order.address}</Text>
        </View>
        {order.rider && (
          <View style={[styles.metaRow, { marginTop: 8 }]}>
            <RemixIcon name="ri-user-3-line" size={13} color="#94a3b8" />
            <Text style={styles.riderText} numberOfLines={1}>{order.rider}</Text>
          </View>
        )}
      </View>

      {/* Footer CTA */}
      <View style={styles.cardFooter}>
        {!isHistory ? (
          // Active → Track button
          <View style={styles.trackBtn}>
            <RemixIcon name="ri-radar-line" size={14} color="#10b981" />
            <Text style={styles.trackBtnText}>Track Order</Text>
            <RemixIcon name="ri-arrow-right-s-line" size={16} color="#10b981" />
          </View>
        ) : isCompleted ? (
          // Completed → completion note
          <View style={styles.completedTag}>
            <RemixIcon name="ri-checkbox-circle-fill" size={14} color="#10b981" />
            <Text style={styles.completedTagText}>Pickup completed</Text>
          </View>
        ) : (
          // Cancelled → cancelled note
          <View style={styles.cancelledTag}>
            <RemixIcon name="ri-close-circle-line" size={14} color="#ef4444" />
            <Text style={styles.cancelledTagText}>Order cancelled</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Small reusable meta chip
const MetaChip: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <View style={styles.metaChip}>
    <RemixIcon name={icon} size={12} color="#94a3b8" />
    <Text style={styles.metaChipText} numberOfLines={1}>{label}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ tab: 'active' | 'history' }> = ({ tab }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIconCircle}>
      <RemixIcon
        name={tab === 'history' ? 'ri-history-line' : 'ri-archive-line'}
        size={36}
        color="#cbd5e1"
      />
    </View>
    <Text style={styles.emptyTitle}>
      {tab === 'history' ? 'No past orders' : 'No active orders'}
    </Text>
    <Text style={styles.emptySub}>
      {tab === 'history'
        ? 'Your completed and cancelled pickups will appear here.'
        : 'You have no ongoing pickups right now.'}
    </Text>
    {tab === 'active' && (
      <TouchableOpacity style={styles.bookBtn} onPress={() => navigateTo('/booking')}>
        <Text style={styles.bookBtnText}>Schedule a Pickup</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Styles — all sizes use SCREEN_W-relative values for responsiveness
// ─────────────────────────────────────────────────────────────────────────────

const PAD = SCREEN_W * 0.05;         // ~20px on 375w phones
const CARD_RADIUS = SCREEN_W * 0.06; // ~22px

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  // Header
  header: {
    paddingHorizontal: PAD,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  headerEyebrow: {
    fontSize: isSmall ? 9 : 10,
    fontFamily: typography.bold,
    color: '#a7f3d0',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerCount: {
    fontSize: isSmall ? 20 : 24,
    fontFamily: typography.bold,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#34d399' },
  liveText: { fontSize: isSmall ? 10 : 11, fontFamily: typography.bold, color: '#ffffff' },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: isSmall ? 40 : 44,
    borderRadius: 10,
  },
  tabActive: { backgroundColor: '#ffffff' },
  tabLabel: {
    fontSize: isSmall ? 11 : 12,
    fontFamily: typography.bold,
    color: 'rgba(255,255,255,0.45)',
  },
  tabLabelActive: { color: '#0f172a' },
  tabBadge: {
    backgroundColor: '#059669',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeText: { color: '#fff', fontSize: 9, fontFamily: typography.bold },

  // Scroll
  scroll: { flex: 1 },
  listContent: {
    paddingHorizontal: PAD,
    paddingTop: 20,
    paddingBottom: 120,
  },

  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: CARD_RADIUS,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHistory: {
    // Slightly muted background for completed/cancelled
    backgroundColor: '#fafafa',
  },

  // Card top row
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: PAD,
    paddingBottom: 14,
  },
  serviceIcon: {
    width: isSmall ? 40 : 44,
    height: isSmall ? 40 : 44,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  serviceIconHistory: { backgroundColor: '#f1f5f9' },
  cardTopMid: { flex: 1, minWidth: 0 },
  serviceName: {
    fontSize: isSmall ? 14 : 15,
    fontFamily: typography.bold,
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  orderId: {
    fontSize: 10,
    fontFamily: typography.bold,
    color: '#94a3b8',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    flexShrink: 0,
  },
  statusLabel: { fontSize: isSmall ? 9 : 10, fontFamily: typography.bold },

  // Divider
  divider: { height: 1, backgroundColor: '#f8fafc', marginHorizontal: PAD },

  // Card body
  cardBody: { padding: PAD, paddingVertical: 14, gap: 0 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaChipText: {
    fontSize: isSmall ? 11 : 12,
    fontFamily: typography.medium,
    color: '#64748b',
  },
  addressText: {
    flex: 1,
    fontSize: isSmall ? 12 : 13,
    fontFamily: typography.medium,
    color: '#64748b',
  },
  riderText: {
    flex: 1,
    fontSize: isSmall ? 12 : 13,
    fontFamily: typography.medium,
    color: '#475569',
  },

  // Card footer
  cardFooter: {
    paddingHorizontal: PAD,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackBtnText: {
    fontSize: isSmall ? 12 : 13,
    fontFamily: typography.bold,
    color: '#10b981',
    flex: 1,
  },
  completedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedTagText: {
    fontSize: isSmall ? 11 : 12,
    fontFamily: typography.medium,
    color: '#10b981',
  },
  cancelledTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cancelledTagText: {
    fontSize: isSmall ? 11 : 12,
    fontFamily: typography.medium,
    color: '#ef4444',
  },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingVertical: 72,
    paddingHorizontal: PAD,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: isSmall ? 16 : 18,
    fontFamily: typography.bold,
    color: '#0f172a',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: isSmall ? 13 : 14,
    fontFamily: typography.medium,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
  },
  bookBtn: {
    marginTop: 28,
    backgroundColor: '#0f172a',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: typography.bold,
    letterSpacing: 0.5,
  },
});

export default OrdersPage;
