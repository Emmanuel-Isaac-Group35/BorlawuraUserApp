import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, useWindowDimensions, TouchableOpacity, Animated } from 'react-native';
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
  
  const hPadding = 20;
  const slideWidth = windowWidth - (hPadding * 2);

  const defaultSlides = [
    {
      id: 'welcome',
      title: "Welcome to Borla Wura",
      content: "Experience the cleanest waste management service in town.",
      category: 'Official',
      image: 'https://readdy.ai/api/search-image?query=professional%20waste%20collection%20truck%20modern%20clean%20city&width=500&height=250'
    },
    {
      id: 'promo',
      title: "Rapid Pickup Promo",
      content: "Get 20% off your first instant pickup request today!",
      category: 'Promotion',
      image: 'https://readdy.ai/api/search-image?query=recycling%20bins%20modern%20garbage%20can%20outdoor&width=500&height=250'
    },
    {
      id: 'eco',
      title: "Go Green, Save More",
      content: "Separated recyclables get special priority handling.",
      category: 'Tips',
      image: 'https://readdy.ai/api/search-image?query=green%20clean%20park%20sunny%20day&width=500&height=250'
    }
  ];

  const newsItems = (settings?.mobileApp?.newsItems?.length > 0)
    ? settings.mobileApp.newsItems 
    : defaultSlides;

  useEffect(() => {
    if (newsItems.length <= 1) return;
    const interval = setInterval(() => {
      const next = (currentSlide + 1) % newsItems.length;
      setCurrentSlide(next);
      scrollRef.current?.scrollTo({ x: next * (slideWidth + 12), animated: true });
    }, 5000);
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
        snapToInterval={slideWidth + 12}
        snapToAlignment="start"
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / (slideWidth + 12));
          if (index !== currentSlide) setCurrentSlide(index);
        }}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {newsItems.map((item: NewsItem, idx: number) => (
          <TouchableOpacity 
            key={item.id || idx} 
            activeOpacity={0.9} 
            onPress={() => handleAction(item)}
            style={[styles.slide, { width: slideWidth }]}
          >
            <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
            
            <LinearGradient
              colors={['transparent', 'rgba(15, 23, 42, 0.2)', 'rgba(15, 23, 42, 0.8)']}
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
    marginBottom: 24,
  },
  slide: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 240,
    marginRight: 12,
    backgroundColor: '#0f172a',
    elevation: 6,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
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
    height: '80%',
    justifyContent: 'flex-end',
    padding: 16,
  },
  overlayContent: {
    gap: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#10b981',
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: typography.bold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  slideTitle: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: '#ffffff',
  },
  slideText: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  indicator: {
    height: 5,
    borderRadius: 3,
  },
  indicatorActive: {
    backgroundColor: '#10b981',
    width: 18,
  },
  indicatorInactive: {
    backgroundColor: '#e2e8f0',
    width: 5,
  },
});
