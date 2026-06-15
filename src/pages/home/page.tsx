import React, { useState, useCallback, useEffect } from 'react';
import { Dimensions, View, StyleSheet, ScrollView, RefreshControl, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { ChatFloatingButton } from '../../components/feature/ChatFloatingButton';
import { NewsSlider } from './components/NewsSlider';
import { PopUpAnnouncement } from '../../components/feature/PopUpAnnouncement';
import { RecentOrders } from './components/RecentOrders';
import { ActiveStatusCard } from './components/ActiveStatusCard';
import { typography } from '../../utils/typography';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import { supabase } from '../../lib/supabase';
import { resolveRealUserId } from '../../utils/user';

import { LinearGradient } from 'expo-linear-gradient';

export const HomePage: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { width: screenWidth } = Dimensions.get('window');
  const { settings } = useSettings();
  const [refreshing, setRefreshing] = useState(false);
  const [recentLocations, setRecentLocations] = useState<{ address: string, lat: number, lng: number }[]>([]);
  const [stats, setStats] = useState({
    tricycles: 0,
    rewards: user?.reward_points || 0,
    pickups: 0
  });

  const isSmallScreen = screenWidth < 380;
  const hPadding = 20;

  const fetchLiveStats = async () => {
    try {
      const realUserId = user?.supabase_id || user?.id;
      if (!realUserId) return;

      const { count: tricycleCount } = await supabase
        .from('riders')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true);

      const { data: userData } = await supabase
        .from('users')
        .select('reward_points')
        .eq('id', realUserId)
        .single();

      const { count: completedCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', realUserId)
        .eq('status', 'completed');

      setStats(prev => ({
        ...prev,
        tricycles: tricycleCount || 0,
        rewards: userData?.reward_points || 0,
        pickups: completedCount || 0
      }));
    } catch (e) {
      console.log('Stats fetch error:', e);
    }
  };

  const fetchRecentLocations = async () => {
    try {
      const searchId = await resolveRealUserId(user);
      if (!searchId) return;

      const { data } = await supabase
        .from('orders')
        .select('address, pickup_latitude, pickup_longitude')
        .eq('user_id', searchId)
        .order('created_at', { ascending: false })
        .limit(10);

      const defaults = [
        { address: 'Airport Residential Area, Accra, Ghana', lat: 5.6053, lng: -0.1818 },
        { address: 'Legon Campus, University of Ghana, Accra', lat: 5.6508, lng: -0.1869 }
      ];

      if (data) {
        const unique: { address: string, lat: number, lng: number }[] = [];
        const seen = new Set();
        data.forEach(item => {
          if (item.address && item.pickup_latitude && item.pickup_longitude && !seen.has(item.address)) {
            seen.add(item.address);
            unique.push({
              address: item.address,
              lat: Number(item.pickup_latitude),
              lng: Number(item.pickup_longitude)
            });
          }
        });
        if (unique.length > 0) {
          setRecentLocations(unique.slice(0, 2));
        } else {
          setRecentLocations(defaults);
        }
      } else {
        setRecentLocations(defaults);
      }
    } catch (e) {
      console.log('Error fetching recent locations:', e);
    }
  };

  useEffect(() => {
    fetchLiveStats();
    fetchRecentLocations();
    const interval = setInterval(() => {
      fetchLiveStats();
      fetchRecentLocations();
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
        refreshUser(),
        fetchLiveStats(),
        fetchRecentLocations()
    ]);
    setRefreshing(false);
  }, [refreshUser]);

  const paddingH = screenWidth * 0.06;
  const touchTarget = 44;

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { 
            paddingTop: insets.top + (isSmallScreen ? 60 : 70),
            paddingBottom: insets.bottom + 120,
          }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#059669" />
        }
      >
        <View style={{ paddingHorizontal: paddingH }}>
          {/* Premium Zenith Header */}
          <LinearGradient
            colors={['#10b981', '#065f46', '#022c22']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
             <View style={styles.headerTop}>
                <View style={{ flex: 1 }}>
                   <Text style={[styles.greetingText, { letterSpacing: 1 }]} numberOfLines={1}>NEARBY RIDERS</Text>
                   <View style={[styles.liveIndicatorRow, { marginTop: 4 }]}>
                     <View style={[styles.liveStatusDot, { marginRight: 6 }]} />
                     <Text style={[styles.userNameText, { fontSize: 18 }]} numberOfLines={1}>
                       {stats.tricycles} Active
                     </Text>
                   </View>
                </View>

              <View style={styles.headerActions}>
              </View>
             </View>

             <View style={styles.headerDivider} />

             <View style={styles.headerStatsRow}>
               <LinearGradient colors={['#34d399', '#059669']} style={styles.statPill} start={{x:0, y:0}} end={{x:1, y:1}}>
                 <RemixIcon name="ri-moped-fill" size={14} color="#ffffff" />
                 <Text style={styles.statPillText}>{stats.tricycles} On duty</Text>
               </LinearGradient>

               <LinearGradient colors={['#60a5fa', '#1d4ed8']} style={styles.statPill} start={{x:0, y:0}} end={{x:1, y:1}}>
                 <RemixIcon name="ri-checkbox-circle-fill" size={14} color="#ffffff" />
                 <Text style={styles.statPillText}>{stats.pickups} Pickups done</Text>
               </LinearGradient>
             </View>
          </LinearGradient>

          {/* Quick Pickup Search Bar & Recent Locations Shortcut */}
          <View style={styles.dispatchSection}>
            <TouchableOpacity 
              style={styles.searchBar}
              onPress={() => navigateTo('/booking')}
              activeOpacity={0.8}
            >
              <View style={styles.searchLeft}>
                <View style={styles.searchIconBg}>
                  <RemixIcon name="ri-map-pin-5-fill" size={16} color="#10b981" />
                </View>
                <Text style={styles.searchText}>Where should we collect waste?</Text>
              </View>
              <RemixIcon name="ri-arrow-right-s-line" size={20} color="#64748b" />
            </TouchableOpacity>
            
            {recentLocations.map((loc, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.recentItem}
                onPress={() => navigateTo('/booking', { 
                  prefillLocation: loc.address, 
                  prefillLat: loc.lat, 
                  prefillLng: loc.lng 
                })}
                activeOpacity={0.7}
              >
                <View style={styles.recentLeft}>
                  <View style={styles.recentIconBg}>
                    <RemixIcon name="ri-history-line" size={16} color="#94a3b8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentTitle} numberOfLines={1}>{loc.address.split(',')[0]}</Text>
                    <Text style={styles.recentSubtitle} numberOfLines={1}>{loc.address}</Text>
                  </View>
                </View>
                <RemixIcon name="ri-arrow-right-line" size={16} color="#cbd5e1" />
              </TouchableOpacity>
            ))}
          </View>
  
          <NewsSlider />

          <View style={styles.sectionHeader}>
             <Text style={styles.sectionTitle}>Recent Orders</Text>
             <TouchableOpacity 
              onPress={() => navigateTo('/orders')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
             >
                <Text style={styles.seeAll}>See All</Text>
             </TouchableOpacity>
          </View>
        </View>
        
        <RecentOrders refreshing={refreshing} />
      </ScrollView>


      <ChatFloatingButton />
      <PopUpAnnouncement />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdfdfd' },
  content: { },
  headerCard: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    marginBottom: 10,
  },
  headerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16
  },
  headerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4
  },
  statPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: typography.bold
  },
  headerTop: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
  },
  avatarContainer: { 
    position: 'relative' 
  },
  avatar: { 
    width: 56, 
    height: 56, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 2, 
    borderColor: 'rgba(255,255,255,0.1)' 
  },
  avatarText: { 
    fontSize: 24, 
    fontFamily: typography.bold, 
    color: '#fff' 
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  onlineBadge: { 
    position: 'absolute', 
    bottom: -2, 
    right: -2, 
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    backgroundColor: '#10b981', 
    borderWidth: 2, 
    borderColor: '#0f172a' 
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  greetingText: {
    fontSize: 10,
    fontFamily: typography.bold,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  userNameText: {
    fontSize: 26,
    fontFamily: typography.bold,
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  statLabel: {
    fontSize: 9,
    fontFamily: typography.bold,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: '#ffffff',
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
    paddingLeft: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: typography.bold,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  seeAll: {
    fontSize: 12,
    fontFamily: typography.bold,
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dispatchSection: {
    marginBottom: 32,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  searchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  searchIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchText: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: '#334155',
    flex: 1,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recentIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentTitle: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: '#1e293b',
  },
  recentSubtitle: {
    fontSize: 11,
    fontFamily: typography.medium,
    color: '#64748b',
    marginTop: 2,
  },
});

export default HomePage;
