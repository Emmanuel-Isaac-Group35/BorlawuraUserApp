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
import Constants from 'expo-constants';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

// Configure notification behavior for foreground notifications
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    } as Notifications.NotificationBehavior),
  });
} catch (e) {
  console.warn('Notification handler setup skip');
}

import { typography } from '../../utils/typography';

const AuthPage = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { login, signInWithGoogle } = useAuth();
  const [loginType, setLoginType] = useState<'phone' | 'email'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    const identifier = (loginType === 'phone' ? phoneNumber : email).trim();
    const pass = password.trim();

    if (!identifier) {
      Alert.alert('Required Info', `Please enter your ${loginType === 'phone' ? 'phone number' : 'email address'}.`);
      return;
    }
    if (!pass) {
      Alert.alert('Required Info', 'Please enter your password.');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      let finalEmail = identifier.toLowerCase();

      // If logging in with phone, we need to find the associated email first
      if (loginType === 'phone') {
        const cleanPhone = (identifier.startsWith('0') ? identifier.substring(1) : identifier).replace(/\s+/g, '');
        const variant1 = `+233${cleanPhone}`;
        const variant2 = `233${cleanPhone}`;
        const variant3 = `0${cleanPhone}`;
        const variant4 = cleanPhone;

        const { data: userRecord, error: findError } = await supabase
          .from('users')
          .select('email')
          .or(`phone_number.eq.${variant1},phone_number.eq.${variant2},phone_number.eq.${variant3},phone_number.eq.${variant4}`)
          .maybeSingle();

        if (findError || !userRecord?.email) {
          setIsLoading(false);
          Alert.alert("Login Failed", "No account associated with this phone number was found. Please sign up.");
          return;
        }
        finalEmail = userRecord.email;
      }

      // Final Auth Check using Supabase Security Vault
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: pass,
      });

      if (authError || !authData.user) {
        setIsLoading(false);
        Alert.alert('Login Failed', authError?.message || 'Invalid credentials. Please try again.');
        return;
      }

      // Success! Fetch public user data
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (dbError || !dbUser) {
        // Fallback if record is slow to propagate
        await login({ id: authData.user.id, email: finalEmail, isSignup: false });
      } else {
        await login({ ...dbUser, isSignup: false });
      }
      
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('Error', error.message || 'An error occurred during sign in.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Brand Header */}
          <View style={[styles.brandHeader, { paddingTop: Math.max(insets.top, 20) + 40 }]}>
            <View style={styles.logoBlur} />
            <View style={styles.logoCircle}>
              <Image
                source={require('../../../assets/Borla Wura Logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>Borla Wura</Text>
            <Text style={styles.brandTagline}>Eco-friendly waste management for everyone</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Welcome Back</Text>
            <Text style={styles.formSubtitle}>Sign in to continue your recycling journey</Text>

            <View style={styles.tabContainer}>
              <TouchableOpacity 
                onPress={() => setLoginType('phone')}
                style={[styles.tab, loginType === 'phone' && styles.tabActive]}
              >
                <Text style={[styles.tabLabel, loginType === 'phone' && styles.tabLabelActive]}>Phone</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setLoginType('email')}
                style={[styles.tab, loginType === 'email' && styles.tabActive]}
              >
                <Text style={[styles.tabLabel, loginType === 'email' && styles.tabLabelActive]}>Email</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
                {loginType === 'phone' ? (
                  <View style={[styles.inputWrapper, styles.row]}>
                    <View style={styles.countryPicker}>
                      <Image source={{ uri: 'https://flagcdn.com/w40/gh.png' }} style={styles.flag} />
                      <Text style={styles.countryCode}>+233</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder="Phone number"
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                ) : (
                  <View style={[styles.inputWrapper, styles.row]}>
                    <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.fieldIcon} />
                    <TextInput
                      style={styles.inputField}
                      placeholder="Email address"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                )}

               <View style={styles.passwordWrapper}>
                 <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.fieldIcon} />
                 <TextInput
                   style={styles.passwordInput}
                   placeholder="Password"
                   secureTextEntry={!showPassword}
                   value={password}
                   onChangeText={setPassword}
                   placeholderTextColor="#94a3b8"
                 />
                 <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                   <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#64748b" />
                 </TouchableOpacity>
               </View>
                <TouchableOpacity 
                   onPress={() => navigation.navigate('ForgotPassword')}
                   style={styles.forgotBtn}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[
                styles.loginBtn, 
                ((loginType === 'phone' ? !phoneNumber : !email) || !password || isLoading) && styles.loginBtnDisabled
              ]}
              onPress={handleContinue}
              disabled={((loginType === 'phone' ? !phoneNumber : !email) || !password || isLoading)}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.signupLink} 
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.signupText}>
                New here? <Text style={styles.signupHighlight}>Create Account</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerBox}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.socialBtn} onPress={() => signInWithGoogle()}>
               <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }} style={styles.socialIcon} />
               <Text style={styles.socialBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            <Text style={styles.legalText}>
              By joining, you agree to our <Text style={styles.legalHighlight}>Terms</Text> and <Text style={styles.legalHighlight}>Privacy Policy</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { flexGrow: 1 },
  brandHeader: {
    backgroundColor: '#10b981',
    paddingBottom: 40,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  logoBlur: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -50,
    right: -50,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: '#ffffff',
    padding: 14,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  logoImage: { width: '100%', height: '100%' },
  brandName: { fontSize: 24, fontFamily: typography.bold, color: '#ffffff' },
  brandTagline: { fontSize: 13, fontFamily: typography.medium, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -30,
  },
  formTitle: { fontSize: 28, fontFamily: typography.bold, color: '#0f172a' },
  formSubtitle: { fontSize: 15, fontFamily: typography.medium, color: '#64748b', marginTop: 6, marginBottom: 32 },
  inputGroup: { gap: 16, marginBottom: 24 },
  inputRow: { flexDirection: 'row', gap: 12 },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  flag: { width: 22, height: 15, borderRadius: 2, marginRight: 8 },
  countryCode: { fontSize: 14, fontFamily: typography.bold, color: '#0f172a' },
  phoneInput: {
    flex: 1,
    height: 56,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingHorizontal: 10,
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#0f172a',
  },
  inputWrapper: {
    height: 60,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingLeft: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  fieldIcon: { marginRight: 8 },
  passwordWrapper: {
    height: 60,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#0f172a',
  },
  eyeBtn: { paddingHorizontal: 16 },
  loginBtn: {
    height: 60,
    backgroundColor: '#10b981',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  loginBtnDisabled: { backgroundColor: '#94a3b8', shadowOpacity: 0 },
  loginBtnText: { fontSize: 17, fontFamily: typography.bold, color: '#ffffff' },
  signupLink: { alignItems: 'center' },
  signupText: { fontSize: 15, fontFamily: typography.medium, color: '#64748b' },
  signupHighlight: { color: '#10b981', fontFamily: typography.bold },
  dividerBox: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 32 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
  dividerLabel: { fontSize: 11, fontFamily: typography.bold, color: '#cbd5e1', letterSpacing: 1 },
  socialBtn: {
    height: 60,
    borderRadius: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    gap: 12,
    marginBottom: 30,
  },
  socialIcon: { width: 22, height: 22 },
  socialBtnText: {
    fontSize: 16,
    fontFamily: typography.semiBold,
    color: '#1e293b',
  },
  legalText: { fontSize: 12, fontFamily: typography.medium, color: '#94a3b8', textAlign: 'center', lineHeight: 18, paddingBottom: 40 },
  legalHighlight: { color: '#64748b', textDecorationLine: 'underline' },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 8 },
  forgotText: { fontSize: 13, fontFamily: typography.medium, color: '#10b981' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 6,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 15,
    fontFamily: typography.semiBold,
    color: '#64748b',
  },
  tabLabelActive: {
    color: '#10b981',
  },
  inputField: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#0f172a',
  },
});

export default AuthPage;
