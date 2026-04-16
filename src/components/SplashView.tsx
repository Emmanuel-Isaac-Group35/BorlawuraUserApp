import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { typography } from '../utils/typography';

const SplashView = () => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.logoText}>Borla Wura</Text>
        <View style={styles.dot} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#32BA7C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 48,
    fontFamily: typography.bold,
    textAlign: 'center',
    letterSpacing: -1.5,
  },
  dot: {
    width: 10,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    marginTop: 8,
  },
});

export default SplashView;
