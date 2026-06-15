import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { RemixIcon } from '../../utils/icons';
import { typography } from '../../utils/typography';

const OTPPage = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { login } = useAuth();
  const { phoneNumber, generatedOtp: initialOtp, name, email, password, isSignup } = route.params || { phoneNumber: '024 123 4567', generatedOtp: '1234' };
  
  const [otp, setOtp] = useState(['', '', '', '']);
  const [currentOtp, setCurrentOtp] = useState(initialOtp);
  const [timer, setTimer] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputs = useRef<any>([]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      // Handle paste
      const digits = text.split('').slice(0, 4);
      const newOtp = [...otp];
      digits.forEach((d, i) => { if (index + i < 4) newOtp[index + i] = d; });
      setOtp(newOtp);
      if (newOtp.every(d => d !== '')) handleVerify(newOtp.join(''));
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputs.current[index + 1].focus();
    }

    if (newOtp.every(digit => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const finalCode = code || otp.join('');
    if (finalCode.length === 4) {
      setIsVerifying(true);
      if (finalCode === currentOtp) {
        try {
          await login({ phoneNumber, id: 'user_' + Date.now(), name, email, password, isSignup });
        } catch (error: any) {
          setIsVerifying(false);
          Alert.alert("Auth Error", error.message || "Failed to log in.");
        }
      } else {
        setIsVerifying(false);
        Alert.alert('Verification Failed', 'The code you entered does not match our records.');
        setOtp(['', '', '', '']);
        inputs.current[0]?.focus();
      }
    }
  };

  const handleResend = async () => {
    if (isResending) return;
    setIsResending(true);
    
    const newOtpCode = Math.floor(1000 + Math.random() * 9000).toString();
    setCurrentOtp(newOtpCode);
    
    try {
      await fetch('https://sms.arkesel.com/api/v2/sms/send', {
        method: 'POST',
        headers: {
          'api-key': 'UEJrVktDRnBqeWZpdmxXSG1WbHk',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: 'BorlaWura',
          message: `Your BorlaWura verification code is: ${newOtpCode}`,
          recipients: [phoneNumber.replace(/\+/g, '').replace(/\s+/g, '')]
        })
      });
      
      setIsResending(false);
      setTimer(45); // Increased wait for next resend
      Alert.alert('Code Resent', `A new verification code has been issued. (Code: ${newOtpCode})`);
    } catch (error) {
      setIsResending(false);
      setTimer(30);
      Alert.alert('Notice', 'SMS delivery delayed. Please use this code: ' + newOtpCode);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <RemixIcon name="ri-arrow-left-line" size={24} color="#0f172a" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <RemixIcon name="ri-shield-check-line" size={32} color="#10b981" />
          </View>
          
          <Text style={styles.title}>Identity Check</Text>
          <Text style={styles.subtitle}>
            Enter the 4-digit code dispatched to your mobile device <Text style={styles.bold}>{phoneNumber}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <View key={index} style={[styles.otpBox, digit !== '' && styles.otpBoxActive]}>
                <TextInput
                  ref={(ref) => { inputs.current[index] = ref; }}
                  style={styles.otpInput}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(text) => handleChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  autoFocus={index === 0}
                  selectionColor="#10b981"
                />
              </View>
            ))}
          </View>

          {isVerifying && (
            <View style={styles.verifyingRow}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={styles.verifyingText}>AUTHENTICATING...</Text>
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.timerBox}>
              {timer > 0 ? (
                <View style={styles.countdownRow}>
                  <RemixIcon name="ri-time-line" size={14} color="#94a3b8" />
                  <Text style={styles.resendText}>Request new code in {timer}s</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  onPress={handleResend} 
                  disabled={isResending}
                  style={styles.resendBtn}
                >
                  {isResending ? (
                    <ActivityIndicator size="small" color="#10b981" />
                  ) : (
                    <>
                      <RemixIcon name="ri-refresh-line" size={16} color="#10b981" />
                      <Text style={styles.resendLink}>Resend Code</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity style={styles.helpButton} onPress={() => Alert.alert("Support", "Please contact dispatch at support@borlawura.com if you are having issues with your code.")}>
              <Text style={styles.helpText}>Technical difficulties?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 10 },
  backButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, paddingHorizontal: 32, paddingTop: 20 },
  iconCircle: { width: 64, height: 64, borderRadius: 24, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontFamily: typography.bold, color: '#0f172a', marginBottom: 12 },
  subtitle: { fontSize: 15, fontFamily: typography.medium, color: '#64748b', lineHeight: 24, marginBottom: 48 },
  bold: { color: '#0f172a', fontFamily: typography.bold },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  otpBox: { width: 64, height: 74, borderRadius: 18, backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  otpBoxActive: { borderColor: '#10b981', backgroundColor: '#fff' },
  otpInput: { width: '100%', height: '100%', fontSize: 28, fontFamily: typography.bold, color: '#0f172a', textAlign: 'center' },
  verifyingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 30 },
  verifyingText: { fontSize: 12, fontFamily: typography.bold, color: '#10b981', letterSpacing: 1.5 },
  footer: { alignItems: 'center', marginTop: 20 },
  timerBox: { height: 50, justifyContent: 'center' },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resendText: { fontSize: 14, fontFamily: typography.medium, color: '#94a3b8' },
  resendBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  resendLink: { fontSize: 14, fontFamily: typography.bold, color: '#10b981' },
  helpButton: { marginTop: 40, padding: 10 },
  helpText: { fontSize: 14, fontFamily: typography.medium, color: '#94a3b8', textDecorationLine: 'underline' },
});

export default OTPPage;
