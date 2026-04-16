import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, useWindowDimensions, Animated } from 'react-native';
import { useSettings } from '../../../context/SettingsContext';
import { typography } from '../../../utils/typography';

interface NewsItem {
  id: number | string;
  title: string;
  content: string;
  category: string;
  icon: string;
  bgColor: string;
  textColor: string;
  image: string;
}

export const NewsSlider: React.FC = () => {
  const { settings } = useSettings();
  const [currentSlide, setCurrentSlide] = useState(0);
  const { width: windowWidth } = useWindowDimensions();
  const scrollRef = React.useRef<ScrollView>(null);
  
  const hPadding = 20;
  const slideWidth = windowWidth - (hPadding * 2);

  const newsItems = (settings?.mobileApp?.newsItems?.length > 0)
    ? settings.mobileApp.newsItems 
    : [
      {
        id: 'welcome',
        title: "Welcome to Borla Wura",
        content: "Eco-friendly waste management for a cleaner, greener community.",
        category: 'official',
        bgColor: '#ecfdf5',
        textColor: '#10b981',
        image: 'https://readdy.ai/api/search-image?query=Clean%20green%20sustainable%20cityscape%20minimalist&width=400&height=200'
      }
    ];

  useEffect(() => {
    if (newsItems.length === 0) return;
    const interval = setInterval(() => {
      const next = (currentSlide + 1) % newsItems.length;
      setCurrentSlide(next);
      scrollRef.current?.scrollTo({ x: next * (slideWidth + 10), animated: true });
    }, 5000);
    return () => clearInterval(interval);
  }, [newsItems.length, currentSlide, slideWidth]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={slideWidth + 10}
        snapToAlignment="center"
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / (slideWidth + 10));
          if (index !== currentSlide) setCurrentSlide(index);
        }}
      >
        {newsItems.map((item: NewsItem) => (
          <View key={item.id} style={[styles.slide, { width: slideWidth }]}>
            <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
            <View style={styles.overlay}>
              <View style={[styles.badge, { backgroundColor: item.bgColor || '#10b98120' }]}>
                <Text style={[styles.badgeText, { color: item.textColor || '#10b981' }]}>{(item.category || 'NEWS').toUpperCase()}</Text>
              </View>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideText} numberOfLines={2}>{item.content}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  slide: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 180,
    position: 'relative',
    marginRight: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: typography.bold,
  },
  slideTitle: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: '#ffffff',
    marginBottom: 4,
  },
  slideText: {
    fontSize: 13,
    fontFamily: typography.medium,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorActive: {
    backgroundColor: '#10b981',
    width: 20,
  },
  indicatorInactive: {
    backgroundColor: '#e2e8f0',
  },
});
