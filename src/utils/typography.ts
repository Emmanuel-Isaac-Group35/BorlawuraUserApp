import { StyleSheet, Platform } from 'react-native';

export const typography = {
  regular: Platform.select({
    ios: 'Montserrat-Regular',
    android: 'Montserrat-Regular',
    default: 'Montserrat',
  }),
  medium: Platform.select({
    ios: 'Montserrat-Medium',
    android: 'Montserrat-Medium',
    default: 'Montserrat',
  }),
  bold: Platform.select({
    ios: 'Montserrat-Bold',
    android: 'Montserrat-Bold',
    default: 'Montserrat',
  }),
  semiBold: Platform.select({
    ios: 'Montserrat-SemiBold',
    android: 'Montserrat-SemiBold',
    default: 'Montserrat',
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
