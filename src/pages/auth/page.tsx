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
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { RemixIcon } from '../../utils/icons';
import { LinearGradient } from 'expo-linear-gradient';

// Navigation handled via AppNavigator routes

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
        const rawPhone = identifier.replace(/\s+/g, '');
        const cleanPhone = (rawPhone.startsWith('0') ? rawPhone.substring(1) : (rawPhone.startsWith('+233') ? rawPhone.substring(4) : (rawPhone.startsWith('233') ? rawPhone.substring(3) : rawPhone)));
        
        const variants = [
          `+233${cleanPhone}`,
          `233${cleanPhone}`,
          `0${cleanPhone}`,
          cleanPhone
        ];

        // Search for user by any phone variant OR the raw identifier as email (in case they mistyped tab)
        const { data: userRecord, error: findError } = await supabase
          .from('users')
          .select('email')
          .or(`phone_number.in.(${variants.map(v => `"${v}"`).join(',')}),email.eq."${identifier}"`)
          .maybeSingle();

        if (findError || !userRecord?.email) {
          setIsLoading(false);
          Alert.alert("Account Not Found", "We couldn't locate an account with this phone number. Please verify your credentials or sign up.");
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
          <LinearGradient
            colors={['#064e3b', '#0d9488']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.brandHeader, { paddingTop: Math.max(insets.top, 20) + 40 }]}
          >
            <View style={styles.logoCircle}>
              <Image
                source={require('../../../assets/Borla Wura Logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>Borlawura</Text>
            <Text style={styles.brandTagline}>Eco-friendly waste management for everyone</Text>
          </LinearGradient>

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
                    <RemixIcon name="ri-mail-line" size={20} color="#64748b" style={styles.fieldIcon} />
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
                  <RemixIcon name="ri-lock-line" size={20} color="#64748b" style={styles.fieldIcon} />
                 <TextInput
                   style={styles.passwordInput}
                   placeholder="Password"
                   secureTextEntry={!showPassword}
                   value={password}
                   onChangeText={setPassword}
                   placeholderTextColor="#94a3b8"
                 />
                 <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <RemixIcon name={showPassword ? "ri-eye-off-line" : "ri-eye-line"} size={20} color="#64748b" />
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

            <TouchableOpacity style={styles.socialBtn} onPress={() => {
              // #region debug-point A:google-button-tap
              fetch("http://192.168.100.53:7777/event",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:"google-auth-failure",runId:"pre-fix",hypothesisId:"A",location:"src/pages/auth/page.tsx:246",msg:"[DEBUG] Google sign-in button tapped",data:{screen:"AuthPage"},ts:Date.now()})}).catch(()=>{});
              // #endregion
              signInWithGoogle();
            }}>
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
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  logoImage: { width: '100%', height: '100%' },
  brandName: { 
    fontSize: 28, 
    fontFamily: typography.bold, 
    color: '#ffffff',
    letterSpacing: -1,
  },
  brandTagline: { 
    fontSize: 14, 
    fontFamily: typography.medium, 
    color: 'rgba(255, 255, 255, 0.8)', 
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  formTitle: { 
    fontSize: 24, 
    fontFamily: typography.bold, 
    color: '#0f172a',
    marginBottom: 8,
  },
  formSubtitle: { 
    fontSize: 15, 
    fontFamily: typography.medium, 
    color: '#64748b', 
    marginBottom: 32,
  },
  inputGroup: { gap: 16, marginBottom: 24 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 4,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: typography.semiBold,
    color: '#94a3b8',
  },
  tabLabelActive: {
    color: '#059669',
  },
  inputWrapper: {
    height: 56,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingLeft: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  fieldIcon: { marginRight: 12 },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
  },
  flag: { width: 20, height: 14, borderRadius: 2 },
  countryCode: { fontSize: 14, fontFamily: typography.bold, color: '#1e293b' },
  phoneInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#0f172a',
  },
  inputField: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#0f172a',
  },
  passwordWrapper: {
    height: 56,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#0f172a',
  },
  eyeBtn: { paddingHorizontal: 16 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: 8 },
  forgotText: { 
    fontSize: 13, 
    fontFamily: typography.bold, 
    color: '#059669',
  },
  loginBtn: {
    height: 56,
    backgroundColor: '#059669',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 24,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  loginBtnDisabled: { backgroundColor: '#cbd5e1', shadowOpacity: 0 },
  loginBtnText: { fontSize: 16, fontFamily: typography.bold, color: '#ffffff' },
  signupLink: { alignItems: 'center' },
  signupText: { fontSize: 14, fontFamily: typography.medium, color: '#64748b' },
  signupHighlight: { color: '#059669', fontFamily: typography.bold },
  dividerBox: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 32 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#f1f5f9' },
  dividerLabel: { fontSize: 10, fontFamily: typography.bold, color: '#cbd5e1', letterSpacing: 1 },
  socialBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  socialIcon: { width: 20, height: 20 },
  socialBtnText: {
    fontSize: 15,
    fontFamily: typography.semiBold,
    color: '#1e293b',
  },
  legalText: { 
    fontSize: 12, 
    fontFamily: typography.medium, 
    color: '#94a3b8', 
    textAlign: 'center', 
    lineHeight: 18, 
    marginTop: 40,
    paddingBottom: 40 
  },
  legalHighlight: { color: '#64748b', textDecorationLine: 'underline' },
});

export default AuthPage;
