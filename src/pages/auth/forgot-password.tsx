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
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Required", "Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'borlawura-user://reset-password',
      });

      if (error) throw error;
      
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
                No worries! Enter your email address and we'll send you a link to reset your password.
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <TouchableOpacity 
                style={[styles.resetBtn, (!email || isLoading) && styles.resetBtnDisabled]}
                onPress={handleReset}
                disabled={!email || isLoading}
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
                We've sent a password reset link to <Text style={styles.emailHighlight}>{email}</Text>. Please follow the instructions in the email to continue.
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
