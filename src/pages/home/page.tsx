import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { BottomNavigation } from '../../components/feature/BottomNavigation';
import { ChatFloatingButton } from '../../components/feature/ChatFloatingButton';
import { NewsSlider } from './components/NewsSlider';
import { ServiceCategories } from './components/ServiceCategories';
import { QuickActions } from './components/QuickActions';
import { RecentOrders } from './components/RecentOrders';

export function HomePage() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Real-time synchronization is already on, but we'll simulate a 1.5s refresh for UX
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
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
        <NewsSlider />
        <ServiceCategories />
        <QuickActions />
        <RecentOrders />
      </ScrollView>

      <BottomNavigation />
      <ChatFloatingButton />
    </SafeAreaView>
  );
}

export default HomePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 64,
    paddingBottom: 80,
  },
});
