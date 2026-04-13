import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RemixIcon } from '../../utils/icons';

export const Navigation: React.FC = () => {


  return (
    <View style={styles.navWrapper}>
      <View style={styles.nav}>
        <View style={styles.navContent}>
          <View style={styles.navLeft}>
            <View style={styles.logoContainer}>
              <RemixIcon name="ri-recycle-line" size={22} color="#fff" />
            </View>
            <Text style={styles.logoText}>Borla Wura</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
    paddingTop: 8,
  },
  nav: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 8,
    width: '96%',
    alignSelf: 'center',
    paddingTop: 36,
    paddingBottom: 10,
    marginTop: 8,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    width: 36,
    height: 36,
    backgroundColor: '#10b981',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: 'Montserrat-Bold',
  },
});
