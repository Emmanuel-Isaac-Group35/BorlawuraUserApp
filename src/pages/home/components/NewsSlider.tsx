import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Button } from '../../../components/base/Button';
import { RemixIcon } from '../../../utils/icons';
import { navigateTo } from '../../../utils/navigation';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  category: 'tip' | 'news' | 'alert';
  icon: string;
  bgColor: string;
  textColor: string;
  image: string;
}

export const NewsSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { width } = Dimensions.get('window');

  const handleBookingClick = () => {
    navigateTo('/booking');
  };

  const newsItems: NewsItem[] = [
    {
      id: 1,
      title: "Waste Sorting Tip",
      content: "Separate plastic bottles from caps before disposal. This helps recycling facilities process materials more efficiently.",
      category: 'tip',
      icon: 'ri-recycle-line',
      bgColor: '#ecfdf5',
      textColor: '#065f46',
      image: 'https://readdy.ai/api/search-image?query=Waste%20sorting%20and%20recycling%20concept%2C%20separated%20plastic%20bottles%20and%20caps%2C%20colorful%20recycling%20bins%2C%20clean%20organized%20waste%20management%2C%20eco-friendly%20disposal%20system%2C%20bright%20clean%20environment%2C%20educational%20waste%20sorting%20demonstration%2C%20sustainable%20living%20concept%2C%20high-quality%20realistic%20photography&width=350&height=180&seq=tip1&orientation=landscape'
    },
    {
      id: 2,
      title: "Service Update",
      content: "New pickup zones added in East Legon and Cantonments. Book your instant pickup now with 25-minute guarantee!",
      category: 'news',
      icon: 'ri-map-pin-line',
      bgColor: '#eff6ff',
      textColor: '#1e40af',
      image: 'https://readdy.ai/api/search-image?query=Modern%20waste%20collection%20truck%20in%20upscale%20residential%20area%2C%20East%20Legon%20neighborhood%2C%20professional%20waste%20management%20service%2C%20clean%20urban%20streets%2C%20efficient%20pickup%20service%2C%20modern%20Ghana%20residential%20area%2C%20bright%20daylight%2C%20service%20expansion%20concept%2C%20high-quality%20realistic%20photography&width=350&height=180&seq=news1&orientation=landscape'
    },
    {
      id: 3,
      title: "Eco-Friendly Tip",
      content: "Compost your organic waste at home! Kitchen scraps can become nutrient-rich soil for your garden in 3-4 weeks.",
      category: 'tip',
      icon: 'ri-leaf-line',
      bgColor: '#f0fdf4',
      textColor: '#166534',
      image: 'https://readdy.ai/api/search-image?query=Home%20composting%20setup%20with%20kitchen%20scraps%2C%20organic%20waste%20composting%20bin%2C%20fresh%20vegetables%20and%20fruit%20peels%2C%20rich%20dark%20compost%20soil%2C%20garden%20composting%20system%2C%20sustainable%20home%20gardening%2C%20eco-friendly%20waste%20management%2C%20natural%20recycling%20process%2C%20high-quality%20realistic%20photography&width=350&height=180&seq=tip2&orientation=landscape'
    },
    {
      id: 4,
      title: "Holiday Schedule",
      content: "Special pickup hours during Independence Day weekend. Extended service until 11 PM on March 6th and 7th.",
      category: 'alert',
      icon: 'ri-calendar-line',
      bgColor: '#fff7ed',
      textColor: '#9a3412',
      image: 'https://readdy.ai/api/search-image?query=Ghana%20Independence%20Day%20celebration%20with%20waste%20management%20service%2C%20red%20gold%20green%20colors%2C%20festive%20holiday%20atmosphere%2C%20extended%20service%20hours%2C%20professional%20waste%20collection%20during%20celebrations%2C%20patriotic%20holiday%20theme%2C%20clean%20city%20celebration%2C%20high-quality%20realistic%20photography&width=350&height=180&seq=alert1&orientation=landscape'
    },
    {
      id: 5,
      title: "Recycling Reward",
      content: "Earn ₵2 cashback for every 5kg of recyclables! Separate plastics, papers, and metals to qualify for rewards.",
      category: 'news',
      icon: 'ri-coin-line',
      bgColor: '#faf5ff',
      textColor: '#6b21a8',
      image: 'https://readdy.ai/api/search-image?query=Recycling%20rewards%20program%20concept%2C%20separated%20recyclable%20materials%2C%20plastic%20bottles%20papers%20metals%2C%20Ghana%20cedi%20coins%20and%20cashback%20rewards%2C%20eco-friendly%20incentive%20system%2C%20sustainable%20waste%20management%20rewards%2C%20clean%20organized%20recycling%20setup%2C%20high-quality%20realistic%20photography&width=350&height=180&seq=news2&orientation=landscape'
    },
    {
      id: 6,
      title: "Safety Reminder",
      content: "Always tie waste bags securely and place them in designated pickup areas. This keeps our communities clean and safe.",
      category: 'tip',
      icon: 'ri-shield-check-line',
      bgColor: '#fef2f2',
      textColor: '#991b1b',
      image: 'https://readdy.ai/api/search-image?query=Properly%20tied%20waste%20bags%20in%20designated%20pickup%20area%2C%20secure%20waste%20disposal%2C%20clean%20community%20environment%2C%20organized%20waste%20collection%20point%2C%20safety%20in%20waste%20management%2C%20well-maintained%20residential%20area%2C%20responsible%20waste%20disposal%20practices%2C%20high-quality%20realistic%20photography&width=350&height=180&seq=tip3&orientation=landscape'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % newsItems.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [newsItems.length]);

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + newsItems.length) % newsItems.length);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % newsItems.length);
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'tip': return { bg: '#d1fae5', text: '#065f46' };
      case 'news': return { bg: '#dbeafe', text: '#1e40af' };
      case 'alert': return { bg: '#fed7aa', text: '#9a3412' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const currentItem = newsItems[currentSlide];

  return (
    <View style={[styles.container, { backgroundColor: currentItem.bgColor }]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>A Cleaner Home, A Cleaner City</Text>
          <Text style={styles.subtitle}>We Handle Your Trash, So You Don't Have To</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.sectionTitle}>Sanitation News & Tips</Text>
          <View style={styles.controls}>
            <TouchableOpacity onPress={handlePrevSlide} style={styles.controlButton}>
              <RemixIcon name="ri-arrow-left-s-line" size={16} color="#4b5563" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNextSlide} style={styles.controlButton}>
              <RemixIcon name="ri-arrow-right-s-line" size={16} color="#4b5563" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentSlide(index);
          }}
          style={styles.slider}
          contentOffset={{ x: currentSlide * width, y: 0 }}
        >
          {newsItems.map((item) => (
            <View key={item.id} style={[styles.slide, { width, backgroundColor: item.bgColor }]}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                <View style={styles.badgeContainer}>
                  <View style={[styles.badge, { backgroundColor: getCategoryBadgeColor(item.category).bg }]}>
                    <Text style={[styles.badgeText, { color: getCategoryBadgeColor(item.category).text }]}>
                      {item.category.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.slideContent}>
                <View style={styles.iconContainer}>
                  <View style={[styles.iconWrapper, { backgroundColor: item.bgColor }]}>
                    <RemixIcon name={item.icon} size={24} color={item.textColor} />
                  </View>
                </View>
                
                <View style={styles.textContent}>
                  <Text style={[styles.slideTitle, { color: item.textColor }]}>{item.title}</Text>
                  <Text style={[styles.slideText, { color: item.textColor }]}>
                    {item.content}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.indicators}>
          {newsItems.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleSlideChange(index)}
              style={[
                styles.indicator,
                index === currentSlide ? styles.indicatorActive : styles.indicatorInactive
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <Button variant="primary" size="lg" fullWidth onPress={handleBookingClick}>
            <View style={styles.buttonContent}>
              <RemixIcon name="ri-truck-line" size={20} color="#fff" />
              <Text style={styles.buttonText}>Book Pickup Now</Text>
            </View>
          </Button>
          <Button variant="outline" size="md" fullWidth onPress={handleBookingClick}>
            <View style={styles.buttonContent}>
              <RemixIcon name="ri-calendar-line" size={18} color="#10b981" />
              <Text style={[styles.buttonText, styles.buttonTextOutline]}>Schedule Regular Pickup</Text>
            </View>
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  content: {
    zIndex: 10,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slider: {
    marginBottom: 24,
  },
  slide: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  slideContent: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    marginTop: 2,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
  },
  slideTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  slideText: {
    fontSize: 14,
    lineHeight: 20,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorActive: {
    backgroundColor: '#10b981',
  },
  indicatorInactive: {
    backgroundColor: '#d1d5db',
  },
  buttonContainer: {
    gap: 12,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  buttonTextOutline: {
    color: '#10b981',
  },
});
