import React, { useState, useCallback, useEffect } from 'react';
import { useWindowDimensions, View, StyleSheet, ScrollView, RefreshControl, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { ChatFloatingButton } from '../../components/feature/ChatFloatingButton';
import { NewsSlider } from './components/NewsSlider';
import { PopUpAnnouncement } from '../../components/feature/PopUpAnnouncement';
import { QuickActions } from './components/QuickActions';
import { RecentOrders } from './components/RecentOrders';
import { ActiveStatusCard } from './components/ActiveStatusCard';
import { typography } from '../../utils/typography';
import { useAuth } from '../../context/AuthContext';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import { supabase } from '../../lib/supabase';

export const HomePage: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    tricycles: 0,
    rewards: user?.reward_points || 0,
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

      setStats(prev => ({
        ...prev,
        tricycles: tricycleCount || 0,
        rewards: userData?.reward_points || 0,
      }));
    } catch (e) {
      console.log('Stats fetch error:', e);
    }
  };

  useEffect(() => {
    fetchLiveStats();
    // Refresh periodically
    const interval = setInterval(fetchLiveStats, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
        refreshUser(),
        fetchLiveStats()
    ]);
    setRefreshing(false);
  }, [refreshUser]);

  const firstName = user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Friend';

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const today = new Date().toLocaleDateString('en-US', { 
    day: 'numeric', 
    month: 'short' 
  });

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { 
            paddingTop: insets.top + (isSmallScreen ? 60 : 70),
            paddingBottom: insets.bottom + 100,
            paddingHorizontal: hPadding
          }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#10b981" />
        }
      >
        {/* Professional Header Section */}
        <View style={styles.headerCard}>
           <View style={styles.headerTop}>
              <View style={{ flex: 1 }}>
                 <View style={styles.nameRow}>
                    <Text style={[styles.userNameText, isSmallScreen && { fontSize: 24 }]} adjustsFontSizeToFit numberOfLines={1}>{firstName} 👋</Text>
                 </View>
                 <View style={styles.statusRowHeader}>
                    <View style={styles.liveStatusDot} />
                    <Text style={styles.greetingText}>Live in {user?.location || 'Your Area'}</Text>
                 </View>
              </View>
              <Image 
                source={require('../../../assets/Borla Wura Logo.png')} 
                style={styles.headerLogo}
                resizeMode="contain"
              />
           </View>

           {/* Quick Stats Row */}
           <View style={styles.statsRow}>
              <View style={styles.statItem}>
                 <Text style={styles.statLabel}>Tricycles</Text>
                 <Text style={[styles.statValue, isSmallScreen && { fontSize: 11 }]}>{stats.tricycles}+ Nearby</Text>
              </View>
              <View style={styles.statDivider} />
              <TouchableOpacity style={styles.statItem} onPress={() => navigateTo('/profile')}>
                 <Text style={styles.statLabel}>Rewards</Text>
                 <Text style={[styles.statValue, { color: '#10b981' }, isSmallScreen && { fontSize: 11 }]}>{stats.rewards} pts</Text>
              </TouchableOpacity>
           </View>
        </View>

        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Featured Offers</Text>
        </View>
        <NewsSlider />

        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Quick Pickup</Text>
        </View>
        <QuickActions />

        <ActiveStatusCard />

        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Service History</Text>
           <TouchableOpacity onPress={() => navigateTo('/orders')}>
              <Text style={styles.seeAll}>View All</Text>
           </TouchableOpacity>
        </View>
        <RecentOrders />
      </ScrollView>

      <ChatFloatingButton />
      <PopUpAnnouncement />
    </SafeAreaView>
  );
};

export default HomePage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.03,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLogo: {
    width: 60,
    height: 60,
  },
  greetingText: {
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#64748b',
  },
  userNameText: {
    fontSize: 28,
    fontFamily: typography.bold,
    color: '#0f172a',
    letterSpacing: -0.8,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  dateBadgeText: {
    fontSize: 12,
    fontFamily: typography.bold,
    color: '#10b981',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 14,
    borderRadius: 16,
    gap: 12,
    marginBottom: 20,
  },
  searchPlaceholder: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: '#94a3b8',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#f1f5f9',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: typography.medium,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 13,
    fontFamily: typography.bold,
    color: '#1e293b',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: typography.bold,
    color: '#0f172a',
    letterSpacing: -0.6,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: '#10b981',
  },
  statusRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowRadius: 4,
    shadowOpacity: 0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tierBadgeText: {
    fontSize: 10,
    fontFamily: typography.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  referralBanner: {
    backgroundColor: '#10b981',
    borderRadius: 30,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },
  referralInfo: {
    flex: 1,
  },
  referralTitle: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: '#ffffff',
  },
  referralSub: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  referralBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  referralBtnText: {
    fontSize: 14,
    fontFamily: typography.bold,
    color: '#10b981',
  },
  tipCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: typography.medium,
    color: '#92400e',
    lineHeight: 18,
  },
  impactCardMain: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
  },
  impactDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  impactIconBox: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  impactMainTitle: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: '#0f172a',
  },
  impactSubTitle: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: '#94a3b8',
    marginBottom: 12,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontFamily: typography.bold,
    color: '#64748b',
  },
  mapCardMain: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    marginBottom: 32,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
  },
  homeMap: {
    borderRadius: 30,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  mapLabelText: {
    fontSize: 12,
    fontFamily: typography.bold,
    color: '#10b981',
  },
  mapHint: {
    fontSize: 11,
    fontFamily: typography.medium,
    color: '#94a3b8',
  },
  liveIndicater: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveText: {
    fontSize: 10,
    fontFamily: typography.bold,
    color: '#ef4444',
    textTransform: 'uppercase',
  },
});
