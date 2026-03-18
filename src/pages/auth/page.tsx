import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

// Configure notification behavior for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as Notifications.NotificationBehavior),
});

const AuthPage = () => {
  const navigation = useNavigation<any>();
  const { login } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (phoneNumber && password && !isLoading) {
      setIsLoading(true);
      const cleanNumber = phoneNumber.replace(/\s+/g, '');
      const finalNumber = cleanNumber.startsWith('0') ? cleanNumber.substring(1) : cleanNumber;
      const fullNumber = `+233${finalNumber}`;
      
      try {
        // First verify user in DB
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('phone_number', fullNumber)
          .eq('password', password)
          .single();

        if (error || !user) {
          setIsLoading(false);
          Alert.alert("Authentication Failed", "Invalid phone number or password. If you don't have an account, please Sign Up.");
          return;
        }

        // User exists and password matches! Log in immediately without OTP
        try {
          await login({ 
            phoneNumber: fullNumber, 
            id: user.id || 'user_' + Date.now(), 
            name: user.full_name, 
            email: user.email, 
            password: user.password, 
            isSignup: false,
            supabase_id: user.id
          });
          
          setIsLoading(false);
          // Navigation is handled automatically by AuthNavigator
        } catch (loginError: any) {
          console.error("Login failed:", loginError);
          setIsLoading(false);
          Alert.alert("Login Error", loginError.message || "Failed to log in.");
        }
      } catch (error) {
        console.error('Login process error:', error);
        setIsLoading(false);
        Alert.alert('Error', 'An error occurred during sign in. Please try again.');
      }
    } else if (!phoneNumber) {
      Alert.alert("Required", "Please enter your phone number");
    } else if (!password) {
      Alert.alert("Required", "Please enter your password");
    }
  };

  const handleSocialLogin = async (provider: string) => {
    // social login logic...
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
            <Text style={styles.title}>Sign In</Text>

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

            <View style={[styles.phoneInput, { marginBottom: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0 }]}>
              <TextInput
                style={{ flex: 1, paddingHorizontal: 16, height: 50, color: '#000', fontSize: 16 }}
                placeholder="Password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={{ paddingRight: 15 }} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.nextButton, (!phoneNumber || isLoading) && styles.nextButtonDisabled]}
              onPress={handleContinue}
              disabled={!phoneNumber || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.nextButtonText}>Next</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={{alignItems: 'center', marginTop: -10, marginBottom: 20}} onPress={() => navigation.navigate('Signup')}>
              <Text style={{color: '#666', fontSize: 16}}>Don't have an account? <Text style={{color: '#32BA7C', fontWeight: 'bold'}}>Sign up</Text></Text>
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
