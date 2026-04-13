import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Pressable } from 'react-native';
import { RemixIcon } from '../../../utils/icons';
import { navigateTo } from '../../../utils/navigation';

interface Action {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  path: string;
}

export const QuickActions: React.FC = () => {
  const actions: Action[] = [
    {
      icon: 'ri-flashlight-line',
      title: 'Instant Pickup',
      subtitle: 'Ready in 30 mins',
      color: '#f97316',
      path: '/booking'
    },
    {
      icon: 'ri-calendar-line',
      title: 'Schedule Pickup',
      subtitle: 'Plan ahead',
      color: '#3b82f6',
      path: '/booking'
    },
    {
      icon: 'ri-truck-line',
      title: 'Track Order',
      subtitle: 'Live updates',
      color: '#a855f7',
      path: '/orders'
    }
  ];

  const handleActionClick = (path: string) => {
    navigateTo(path);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.grid}>
        {actions.map((action, index) => {
          const scale = new Animated.Value(1);
          const handlePressIn = () => {
            Animated.spring(scale, {
              toValue: 0.97,
              useNativeDriver: true,
              speed: 30,
              bounciness: 8,
            }).start();
          };
          const handlePressOut = () => {
            Animated.spring(scale, {
              toValue: 1,
              useNativeDriver: true,
              speed: 30,
              bounciness: 8,
            }).start();
          };
          return (
            <Pressable
              key={index}
              onPress={() => handleActionClick(action.path)}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={({ pressed }) => [
                styles.actionCard,
                pressed && { transform: [{ scale: 0.97 }], opacity: 0.96 },
              ]}
            >
              <View style={styles.actionContent}>
                <View style={[styles.iconContainer, { backgroundColor: action.color, shadowColor: action.color }]}> 
                  <RemixIcon name={action.icon} size={28} color="#fff" />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
    paddingHorizontal: 10,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 14,
    borderWidth: 0,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
    minHeight: 90,
    alignItems: 'flex-start',
    justifyContent: 'center',
    transition: 'all 0.15s',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  textContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
    fontFamily: 'Montserrat-SemiBold',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Montserrat-Regular',
  },
});
