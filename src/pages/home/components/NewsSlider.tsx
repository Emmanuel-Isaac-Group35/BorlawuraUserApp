import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSettings } from '../../../context/SettingsContext';
import { typography } from '../../../utils/typography';
import { navigateTo } from '../../../utils/navigation';

interface NewsItem {
  id: number | string;
  title: string;
  content: string;
  category?: string;
  image: string;
  action_type?: string;
  action_value?: string;
}

export const NewsSlider: React.FC = () => {
  const { settings } = useSettings();
  const [currentSlide, setCurrentSlide] = useState(0);
  const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
  const flatListRef = useRef<FlatList>(null);

  // Responsive measurements
  const hPadding = windowWidth < 400 ? 10 : 20;
  const slideSpacing = windowWidth < 400 ? 8 : 12;
  const slideWidth = Math.round(windowWidth - hPadding * 2);
  const slideHeight = windowHeight < 700 ? 180 : windowHeight < 900 ? 220 : 250;

  const defaultSlides = [
    {
      id: 'welcome',
      title: "Premium Waste Care",
      content: "Reliable and contactless pickup for your home and office.",
      category: 'Official',
      image: 'https://readdy.ai/api/search-image?query=modern%20waste%20truck%20clean%20city%20street%20morning&width=600&height=400'
    },
    {
      id: 'promo',
      title: "Join the Green Wave",
      content: "Get 20% off your first pickup. Use code: FREESHIP",
      category: 'Promotion',
      image: 'https://readdy.ai/api/search-image?query=recycling%20process%20modern%20green%20facility&width=600&height=400'
    },
    {
      id: 'eco',
      title: "Zero Waste Living",
      content: "Tips for a cleaner home and a healthier planet.",
      category: 'Tips',
      image: 'https://readdy.ai/api/search-image?query=clean%20green%20residential%20area%20garden&width=600&height=400'
    }
  ];

  if (settings?.mobileApp?.bannersEnabled === false) return null;

  const newsItems = (settings?.mobileApp?.newsItems?.length > 0)
    ? settings.mobileApp.newsItems 
    : defaultSlides;

  // Auto-scroll logic
  // Auto-scroll logic
  useEffect(() => {
    if (newsItems.length <= 1) return;
    const interval = setInterval(() => {
      let next = currentSlide + 1;
      if (next >= newsItems.length) next = 0;
      setCurrentSlide(next);
      flatListRef.current?.scrollToIndex({ index: next, animated: true, viewPosition: 0 });
    }, 6000);
    return () => clearInterval(interval);
  }, [newsItems.length, currentSlide, slideWidth, slideSpacing]);


  // Keep indicator in sync with scroll
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const idx = viewableItems[0].index;
      if (idx !== currentSlide) setCurrentSlide(idx);
    }
  }).current;
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 60 });

  const handleAction = (item: NewsItem) => {
    if (item.action_type === 'route' && item.action_value) {
      navigateTo(item.action_value);
    } else {
      navigateTo('/booking');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={newsItems}
        keyExtractor={(item, idx) => String(item.id || idx)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={slideWidth}
        snapToAlignment="start"
        decelerationRate={Platform.OS === 'ios' ? 0 : 0.98}
        contentContainerStyle={{ paddingHorizontal: hPadding }}
        style={{ width: windowWidth, minHeight: slideHeight + 10 }}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.93}
            onPress={() => handleAction(item)}
            style={[styles.slide, { width: slideWidth, height: slideHeight, minHeight: 140, maxWidth: windowWidth - hPadding * 2 }]}
          >
            <Image source={{ uri: item.image }} style={[styles.image, { height: slideHeight }]} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(2, 44, 34, 0.15)', 'rgba(2, 44, 34, 0.96)']}
              style={styles.gradient}
            >
              <View style={styles.overlayContent}>
                <View style={styles.badge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.badgeText}>{(item.category || 'Promo').toUpperCase()}</Text>
                </View>
                <Text style={styles.slideTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.slideText} numberOfLines={2}>{item.content}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfigRef.current}
        getItemLayout={(_, index) => ({
          length: slideWidth,
          offset: slideWidth * index,
          index,
        })}
        initialScrollIndex={0}
        windowSize={2}
      />
      
      {newsItems.length > 1 && (
        <View style={styles.indicators}>
          {newsItems.map((_: any, index: number) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentSlide ? styles.indicatorActive : styles.indicatorInactive
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    marginBottom: 28,
  },
  slide: {
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#022c22',
    minHeight: 140,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      }
    })
  },
  image: {
    width: '100%',
    height: '100%',
    minHeight: 140,
    borderRadius: 30,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'flex-end',
    padding: 24,
  },
  overlayContent: {
    gap: 6,
  },
  badge: { 
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10, 
    backgroundColor: 'rgba(16, 185, 129, 0.15)', 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  badgeText: { 
    fontSize: 10, 
    fontFamily: typography.bold, 
    color: '#10b981',
    letterSpacing: 1.2,
  },
  slideTitle: {
    fontSize: 24,
    fontFamily: typography.bold,
    color: '#ffffff',
    letterSpacing: -0.8,
    lineHeight: 28,
  },
  slideText: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: 'rgba(248, 250, 252, 0.9)',
    lineHeight: 20,
    marginTop: 2,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 18,
  },
  indicator: {
    height: 7,
    borderRadius: 3.5,
  },
  indicatorActive: { 
    backgroundColor: '#059669', 
    width: 24,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  indicatorInactive: { 
    backgroundColor: '#cbd5e1', 
    width: 6,
  },
});
