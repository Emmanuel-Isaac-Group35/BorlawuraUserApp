import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Navigation } from '../../components/feature/Navigation';
import { BottomNavigation } from '../../components/feature/BottomNavigation';
import { NewsSlider } from './components/NewsSlider';
import { ServiceCategories } from './components/ServiceCategories';
import { QuickActions } from './components/QuickActions';
import { RecentOrders } from './components/RecentOrders';

export function HomePage() {
  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <NewsSlider />
        <ServiceCategories />
        <QuickActions />
        <RecentOrders />
      </ScrollView>
      
      <BottomNavigation />
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
