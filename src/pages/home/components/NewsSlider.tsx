import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, useWindowDimensions, TouchableOpacity, Animated, Platform } from 'react-native';
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
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  
  // Responsive measurements
  const hPadding = 20;
  const slideSpacing = 12;
  const slideWidth = windowWidth - (hPadding * 2);

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

  const newsItems = (settings?.mobileApp?.newsItems?.length > 0)
    ? settings.mobileApp.newsItems 
    : defaultSlides;

  // Auto-scroll logic
  useEffect(() => {
    if (newsItems.length <= 1) return;
    const interval = setInterval(() => {
      const next = (currentSlide + 1) % newsItems.length;
      setCurrentSlide(next);
      scrollRef.current?.scrollTo({ x: next * (slideWidth + slideSpacing), animated: true });
    }, 6000);
    return () => clearInterval(interval);
  }, [newsItems.length, currentSlide, slideWidth]);

  const handleAction = (item: NewsItem) => {
    if (item.action_type === 'route' && item.action_value) {
      navigateTo(item.action_value);
    } else {
      navigateTo('/booking');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={slideWidth + slideSpacing}
        snapToAlignment="start"
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / (slideWidth + slideSpacing));
          if (index !== currentSlide) setCurrentSlide(index);
        }}
        contentContainerStyle={{ paddingHorizontal: 0 }}
      >
        {newsItems.map((item: NewsItem, idx: number) => (
          <TouchableOpacity 
            key={item.id || idx} 
            activeOpacity={0.95} 
            onPress={() => handleAction(item)}
            style={[styles.slide, { width: slideWidth }]}
          >
            <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
            
            <LinearGradient
              colors={['transparent', 'rgba(15, 23, 42, 0.2)', 'rgba(15, 23, 42, 0.85)']}
              style={styles.gradient}
            >
              <View style={styles.overlayContent}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{(item.category || 'Promo').toUpperCase()}</Text>
                </View>
                <Text style={styles.slideTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.slideText} numberOfLines={2}>{item.content}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
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
    height: 250,
    marginRight: 12,
    backgroundColor: '#0f172a',
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
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#10b981',
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: typography.bold,
    color: '#ffffff',
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
    backgroundColor: '#10b981',
    width: 28,
  },
  indicatorInactive: {
    backgroundColor: '#e2e8f0',
    width: 7,
  },
});
