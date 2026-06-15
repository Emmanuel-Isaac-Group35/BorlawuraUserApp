import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { typography } from '../../utils/typography';
import { supabase } from '../../lib/supabase';

const ForgotPasswordPage = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [identifier, setIdentifier] = useState('');
  const [loginType, setLoginType] = useState<'phone' | 'email'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resolvedEmail, setResolvedEmail] = useState('');

  const handleReset = async () => {
    if (!identifier) {
      Alert.alert("Required", `Please enter your ${loginType === 'phone' ? 'phone number' : 'email address'}`);
      return;
    }

    setIsLoading(true);
    try {
      let targetEmail = identifier.trim();

      if (loginType === 'phone') {
        const cleanPhone = (targetEmail.startsWith('0') ? targetEmail.substring(1) : targetEmail).replace(/\s+/g, '');
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
          throw new Error("No account found with this phone number.");
        }
        targetEmail = userRecord.email;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: 'borlawura-user://reset-password',
      });

      if (error) throw error;
      
      setResolvedEmail(targetEmail);
      setIsSubmitted(true);
    } catch (error: any) {
      Alert.alert("Reset Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.iconCircle}>
            <Ionicons name="key-outline" size={40} color="#10b981" />
          </View>

          {!isSubmitted ? (
            <>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                No worries! Enter your details and we'll send you a link to reset your password.
              </Text>

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
                <Text style={styles.label}>{loginType === 'phone' ? 'Phone Number' : 'Email Address'}</Text>
                {loginType === 'phone' ? (
                  <View style={styles.phoneInputWrapper}>
                    <View style={styles.countryPicker}>
                      <Text style={styles.countryCode}>+233</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="50 000 0000"
                      keyboardType="phone-pad"
                      value={identifier}
                      onChangeText={setIdentifier}
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                ) : (
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={identifier}
                    onChangeText={setIdentifier}
                    placeholderTextColor="#94a3b8"
                  />
                )}
              </View>

              <TouchableOpacity 
                style={[styles.resetBtn, (!identifier || isLoading) && styles.resetBtnDisabled]}
                onPress={handleReset}
                disabled={!identifier || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.resetBtnText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successContainer}>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.subtitle}>
                We've found an account associated with your request and sent a password reset link to <Text style={styles.emailHighlight}>{resolvedEmail}</Text>.
              </Text>

              <TouchableOpacity 
                style={styles.resetBtn}
                onPress={() => navigation.navigate('Auth')}
              >
                <Text style={styles.resetBtnText}>Back to Login</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.resendBtn}
                onPress={() => setIsSubmitted(false)}
              >
                <Text style={styles.resendText}>Didn't receive the email? <Text style={styles.resendHighlight}>Resend</Text></Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { paddingHorizontal: 20 },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: 30, paddingTop: 40, alignItems: 'center' },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: { fontSize: 28, fontFamily: typography.bold, color: '#0f172a', textAlign: 'center' },
  subtitle: { 
    fontSize: 15, 
    fontFamily: typography.medium, 
    color: '#64748b', 
    marginTop: 12, 
    marginBottom: 40, 
    textAlign: 'center',
    lineHeight: 24
  },
  inputGroup: { width: '100%', marginBottom: 32 },
  label: { fontSize: 13, fontFamily: typography.bold, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 6,
    marginBottom: 32,
    width: '100%',
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
  phoneInputWrapper: {
    flexDirection: 'row',
    gap: 12,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 15,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  countryCode: { fontSize: 14, fontFamily: typography.bold, color: '#0f172a' },
  input: {
    height: 56,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  resetBtn: {
    height: 56,
    backgroundColor: '#10b981',
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  resetBtnDisabled: { backgroundColor: '#94a3b8', shadowOpacity: 0 },
  resetBtnText: { fontSize: 16, fontFamily: typography.bold, color: '#ffffff' },
  successContainer: { width: '100%', alignItems: 'center' },
  emailHighlight: { color: '#0f172a', fontFamily: typography.bold },
  resendBtn: { marginTop: 32 },
  resendText: { fontSize: 14, fontFamily: typography.medium, color: '#64748b' },
  resendHighlight: { color: '#10b981', fontFamily: typography.bold },
});

export default ForgotPasswordPage;
