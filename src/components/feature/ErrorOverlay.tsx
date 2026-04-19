import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { RemixIcon } from '../../utils/icons';
import { typography } from '../../utils/typography';

interface ErrorOverlayProps {
  visible: boolean;
  title: string;
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  showCancel?: boolean;
}

export const ErrorOverlay: React.FC<ErrorOverlayProps> = ({
  visible,
  title,
  message,
  type,
  onConfirm,
  onCancel,
  confirmLabel = 'Understood',
  showCancel = false
}) => {
  const scaleAnim = new Animated.Value(0.9);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start();
    }
  }, [visible]);

  const getTheme = () => {
    switch (type) {
      case 'error': return { color: '#ef4444', icon: 'ri-error-warning-fill', bg: '#fef2f2' };
      case 'success': return { color: '#10b981', icon: 'ri-checkbox-circle-fill', bg: '#f0fdf4' };
      case 'warning': return { color: '#f59e0b', icon: 'ri-alert-fill', bg: '#fffbeb' };
      default: return { color: '#3b82f6', icon: 'ri-information-fill', bg: '#eff6ff' };
    }
  };

  const theme = getTheme();

  return (
    <Modal transparent visible={visible} animationType="none">
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} onTouchEnd={onCancel} />
        
        <Animated.View style={[
          styles.card, 
          { transform: [{ scale: scaleAnim }], opacity: opacityAnim }
        ]}>
          <View style={[styles.iconBox, { backgroundColor: theme.bg }]}>
            <RemixIcon name={theme.icon} size={32} color={theme.color} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.footer}>
            {showCancel && (
              <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={onConfirm} 
              style={[styles.confirmBtn, { backgroundColor: theme.color }]}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: typography.bold,
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    fontFamily: typography.medium,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: '#fff',
  },
  cancelBtn: {
    flex: 0.4,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  cancelText: {
    fontSize: 15,
    fontFamily: typography.bold,
    color: '#64748b',
  },
});
