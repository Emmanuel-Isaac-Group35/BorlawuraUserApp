import React from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
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
      <StatusBar style="dark" />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Image 
          source={require('../../assets/Borla Wura Logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});

export default SplashView;
