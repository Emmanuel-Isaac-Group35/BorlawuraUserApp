import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';

export const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigation = useNavigation();

  const menuItems = [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'Track Order', path: '/track-order' },
    { label: 'Support', path: '/support' }
  ];

  const handleMenuClick = (path: string) => {
    navigateTo(path);
    setIsMenuOpen(false);
  };

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
          
          <TouchableOpacity 
            onPress={() => setIsMenuOpen(!isMenuOpen)}
            style={styles.menuButton}
          >
            <RemixIcon 
              name={isMenuOpen ? 'ri-close-line' : 'ri-menu-line'} 
              size={24} 
              color="#4b5563" 
            />
          </TouchableOpacity>
        </View>
        
        {isMenuOpen && (
          <View style={styles.menu}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.path}
                onPress={() => handleMenuClick(item.path)}
                style={styles.menuItem}
              >
                <Text style={styles.menuItemText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  menuButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  menuItem: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#374151',
  },
});
