import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import { typography } from '../../utils/typography';
import { useSettings } from '../../context/SettingsContext';
import { LinearGradient } from 'expo-linear-gradient';

const ServicesPage: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { settings } = useSettings();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const paddingH = screenWidth * 0.05;
  const isSmallScreen = screenWidth < 380;

  const defaultServices = [
    {
      id: 1,
      title: 'Instant Pickup',
      description: 'Ultra-fast waste collection with 30-minute response time.',
      icon: 'ri-flashlight-fill',
      category: 'pickup',
      features: ['Priority Dispatch', 'Live Tracking', 'On-Demand'],
      priceBadge: 'POPULAR'
    },
    {
      id: 2,
      title: 'Scheduled Collection',
      description: 'Strategic waste planning for recurring or future pickups.',
      icon: 'ri-calendar-event-fill',
      category: 'pickup',
      features: ['Flexible Timing', 'Cost Optimized', 'Weekly/Monthly'],
      priceBadge: 'STABLE'
    },
    {
      id: 3,
      title: 'Industrial Bulk',
      description: 'Heavy-duty removal for construction or large scale waste.',
      icon: 'ri-truck-fill',
      category: 'bulk',
      features: ['High Volume', 'Heavy Lifting', 'Fleet Support'],
      priceBadge: 'ENTERPRISE'
    }
  ];

  const services = (settings?.mobileApp?.services?.length > 0)
    ? settings.mobileApp.services
    : defaultServices;

  const categories = [
    { id: 'all', label: 'ALL LOGISTICS', icon: 'ri-grid-fill' },
    { id: 'pickup', label: 'PICKUP', icon: 'ri-moped-fill' },
    { id: 'bulk', label: 'BULK', icon: 'ri-truck-line' }
  ];

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter((service: any) => service.category === selectedCategory);

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 70,
            paddingBottom: insets.bottom + 120,
            paddingHorizontal: paddingH
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
           <Text style={styles.pageTitle}>LOGISTICS CAPABILITIES</Text>
           <Text style={styles.subtitle}>Select an operational mode for your waste collection mission.</Text>
        </View>

        <View style={styles.categoriesWrapper}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive
                ]}
                activeOpacity={0.8}
              >
                <RemixIcon 
                  name={category.icon} 
                  size={14} 
                  color={selectedCategory === category.id ? '#ffffff' : '#64748b'} 
                />
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive
                ]}>
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.servicesList}>
          {filteredServices.map((service: any) => (
            <TouchableOpacity 
              key={service.id} 
              style={styles.serviceCard}
              onPress={() => navigateTo('/booking', { type: service.id })}
              activeOpacity={0.9}
            >
               <View style={styles.cardHeader}>
                  <View style={styles.iconBox}>
                     <LinearGradient colors={['#f0fdf4', '#ffffff']} style={styles.iconInner}>
                        <RemixIcon name={service.icon} size={28} color="#10b981" />
                     </LinearGradient>
                  </View>
                  <View style={styles.headerRight}>
                     {service.priceBadge && (
                       <View style={styles.badge}>
                          <Text style={styles.badgeText}>{service.priceBadge}</Text>
                       </View>
                     )}
                     <RemixIcon name="ri-arrow-right-up-line" size={18} color="#cbd5e1" />
                  </View>
               </View>
               
               <View style={styles.cardBody}>
                  <Text style={styles.serviceTitle}>{service.title.toUpperCase()}</Text>
                  <Text style={styles.serviceDesc}>{service.description}</Text>
                  
                  <View style={styles.featuresRow}>
                     {service.features.slice(0, 3).map((f: string, i: number) => (
                       <View key={i} style={styles.featureNode}>
                          <View style={styles.nodeDot} />
                          <Text style={styles.nodeText}>{f}</Text>
                       </View>
                     ))}
                  </View>
               </View>

               <LinearGradient 
                colors={['#10b981', '#059669']} 
                start={{x:0, y:0}} end={{x:1, y:0}}
                style={styles.actionBtn}
               >
                  <Text style={styles.actionBtnText}>INITIALIZE BOOKING</Text>
                  <RemixIcon name="ri-flashlight-line" size={14} color="#fff" />
               </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.operationalCoverage}>
           <Text style={styles.coverageTitle}>OPERATIONAL COVERAGE</Text>
           <View style={styles.coverageGrid}>
              {['Accra Core', 'East Legon', 'Tema Harbor', 'Kumasi Center', 'Takoradi Port'].map((area) => (
                <View key={area} style={styles.areaChip}>
                   <View style={[styles.nodeDot, { backgroundColor: '#10b981' }]} />
                   <Text style={styles.areaText}>{area}</Text>
                </View>
              ))}
           </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ServicesPage;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollView: { flex: 1 },
  content: { },
  header: { marginBottom: 32 },
  pageTitle: { fontSize: 11, fontFamily: typography.bold, color: '#10b981', letterSpacing: 2, marginBottom: 8 },
  subtitle: { fontSize: 22, fontFamily: typography.bold, color: '#0f172a', lineHeight: 28 },
  categoriesWrapper: { marginBottom: 32 },
  categoriesContainer: { gap: 10 },
  categoryButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 14, 
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  categoryButtonActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  categoryText: { fontSize: 10, fontFamily: typography.bold, color: '#64748b', letterSpacing: 1 },
  categoryTextActive: { color: '#ffffff' },
  servicesList: { gap: 20, marginBottom: 40 },
  serviceCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  iconBox: { width: 64, height: 64, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' },
  iconInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRight: { alignItems: 'flex-end', gap: 12 },
  badge: { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#dcfce7' },
  badgeText: { fontSize: 8, fontFamily: typography.bold, color: '#10b981', letterSpacing: 1 },
  cardBody: { marginBottom: 24 },
  serviceTitle: { fontSize: 18, fontFamily: typography.bold, color: '#0f172a', marginBottom: 8, letterSpacing: -0.5 },
  serviceDesc: { fontSize: 14, fontFamily: typography.medium, color: '#64748b', lineHeight: 22, marginBottom: 20 },
  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featureNode: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nodeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1' },
  nodeText: { fontSize: 10, fontFamily: typography.bold, color: '#94a3b8', letterSpacing: 0.5 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 16 },
  actionBtnText: { fontSize: 12, fontFamily: typography.bold, color: '#ffffff', letterSpacing: 1 },
  operationalCoverage: { padding: 24, backgroundColor: '#f8fafc', borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9' },
  coverageTitle: { fontSize: 10, fontFamily: typography.bold, color: '#94a3b8', letterSpacing: 1.5, marginBottom: 20 },
  coverageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  areaChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ffffff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' },
  areaText: { fontSize: 11, fontFamily: typography.bold, color: '#475569' },
});
