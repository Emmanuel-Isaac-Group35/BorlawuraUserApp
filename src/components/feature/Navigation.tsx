import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RemixIcon } from '../../utils/icons';

export const Navigation: React.FC = () => {


  return (
    <>
      <View style={styles.nav}>
        <View style={styles.navContent}>
          <View style={styles.navLeft}>
            <View style={styles.logoContainer}>
              <RemixIcon name="ri-recycle-line" size={20} color="#fff" />
            </View>
            <Text style={styles.logoText}>Borla Wura</Text>
          </View>


        </View>


      </View>
    </>
  );
};

const styles = StyleSheet.create({
  nav: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    zIndex: 50,
    paddingTop: 40,
    paddingBottom: 12,
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
    width: 32,
    height: 32,
    backgroundColor: '#10b981',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: 'Pacifico',
  },

});
