import { StyleSheet, Platform } from 'react-native';

export const typography = {
  regular: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'sans-serif',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'sans-serif',
  }),
  semiBold: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'sans-serif',
  }),
};

export const globalStyles = StyleSheet.create({
  textRegular: {
    fontFamily: typography.regular,
  },
  textMedium: {
    fontFamily: typography.medium,
  },
  textSemiBold: {
    fontFamily: typography.semiBold,
  },
  textBold: {
    fontFamily: typography.bold,
  },
});
