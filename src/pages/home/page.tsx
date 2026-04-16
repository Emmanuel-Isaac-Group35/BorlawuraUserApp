import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Text } from 'react-native';
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

export function HomePage() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const firstName = user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Friend';

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { 
            paddingTop: insets.top + 85,
            paddingBottom: insets.bottom + 100 
          }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={['#10b981']}
            tintColor={'#10b981'}
          />
        }
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Hello, {firstName} 👋</Text>
          <Text style={styles.welcomeSubtitle}>Ready to clean up today?</Text>
        </View>

        <ActiveStatusCard />
        <NewsSlider />
        <QuickActions />
        <RecentOrders />
      </ScrollView>

      <ChatFloatingButton />
      <PopUpAnnouncement />
    </SafeAreaView>
  );
}

export default HomePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
  },
  welcomeSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  welcomeTitle: {
    fontSize: 26,
    fontFamily: typography.bold,
    color: '#0f172a',
  },
  welcomeSubtitle: {
    fontSize: 15,
    fontFamily: typography.medium,
    color: '#64748b',
    marginTop: 2,
  },
});
