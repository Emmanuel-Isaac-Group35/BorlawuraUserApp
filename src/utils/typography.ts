import { StyleSheet, Platform } from 'react-native';

export const typography = {
  regular: 'Montserrat-Regular',
  medium: 'Montserrat-Medium',
  semiBold: 'Montserrat-SemiBold',
  bold: 'Montserrat-Bold',
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
