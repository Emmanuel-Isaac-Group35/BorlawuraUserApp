import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const AuthPage = () => {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleContinue = () => {
    if (phoneNumber) {
      navigation.navigate('OTP', { phoneNumber: `+233 ${phoneNumber}` });
    }
  };

  const handleSocialLogin = async (provider: string) => {
    // Simulate social login process
    const mockUserData = {
      id: `${provider}_${Date.now()}`,
      name: `${provider} User`,
      email: `${provider.toLowerCase()}@example.com`,
      provider: provider
    };
    
    await login(mockUserData);
    // Navigation is handled by AuthNavigator pattern in App.tsx
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Top Section */}
          <View style={styles.topSection}>
            <View style={styles.illustrationContainer}>
              <Image
                source={require('../../../assets/gift_illustration.png')}
                style={styles.illustration}
                resizeMode="contain"
              />
            </View>
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoText}>
                New to Borla Wura? Enjoy up to 40% off on your first ride-hailing trips!
              </Text>
            </View>
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            <Text style={styles.title}>Enter your number</Text>

            <View style={styles.inputRow}>
              <TouchableOpacity style={styles.countryPicker}>
                <Image
                  source={{ uri: 'https://flagcdn.com/w40/gh.png' }}
                  style={styles.flag}
                />
                <Text style={styles.countryCode}>+233</Text>
                <Ionicons name="chevron-down" size={16} color="#666" />
              </TouchableOpacity>

              <TextInput
                style={styles.phoneInput}
                placeholder="Phone number"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity 
              style={[styles.nextButton, !phoneNumber && styles.nextButtonDisabled]}
              onPress={handleContinue}
              disabled={!phoneNumber}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLogin('Apple')}
            >
              <Ionicons name="logo-apple" size={24} color="#000" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Continue with Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLogin('Google')}
            >
              <View style={styles.googleIconContainer}>
                <Image 
                   source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg' }} 
                   style={styles.googleIconPlaceholder}
                />
                <FontAwesome name="google" size={20} color="#DB4437" style={styles.socialIcon} />
              </View>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialButton}
              onPress={() => handleSocialLogin('Facebook')}
            >
              <FontAwesome name="facebook" size={24} color="#1877F2" style={styles.socialIcon} />
              <Text style={styles.socialButtonText}>Continue with Facebook</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By signing up, you agree to our{' '}
                <Text style={styles.link}>Terms & Conditions</Text>, acknowledge our{' '}
                <Text style={styles.link}>Privacy Policy</Text>, and confirm that you're over
                18. We may send promotions related to our services - you can
                unsubscribe anytime in Communication Settings under your profile.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  topSection: {
    backgroundColor: '#32BA7C',
    paddingTop: 40,
    paddingBottom: 30,
    alignItems: 'center',
  },
  illustrationContainer: {
    height: 180,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    height: '100%',
    width: '100%',
  },
  promoTextContainer: {
    paddingHorizontal: 40,
    marginTop: 20,
  },
  promoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  countryPicker: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 10,
  },
  flag: {
    width: 24,
    height: 16,
    marginRight: 8,
    borderRadius: 2,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginRight: 4,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEEEEE',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#32BA7C',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 30,
    height: 56,
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#A0DDC0',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 30,
    paddingVertical: 14,
    marginBottom: 16,
    height: 56,
  },
  socialIcon: {
    marginRight: 10,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  googleIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIconPlaceholder: {
    width: 0,
    height: 0,
  },
  footer: {
    marginTop: 40,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: '#32BA7C',
    textDecorationLine: 'underline',
  },
});

export default AuthPage;
