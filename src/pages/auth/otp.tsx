import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';

const OTPPage = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { login } = useAuth();
  const { phoneNumber } = route.params || { phoneNumber: '024 123 4567' };
  
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(30);
  const inputs = useRef<any>([]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(countdown);
  }, []);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputs.current[index + 1].focus();
    }

    if (newOtp.every(digit => digit !== '')) {
      // Auto verify if all digits are entered
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
      // Simulate verification and login
      await login({ phoneNumber, id: 'user_' + Date.now() });
      // Navigation is handled automatically by AuthNavigator in App.tsx
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
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Enter the code</Text>
          <Text style={styles.subtitle}>
            A 4-digit code was sent to <Text style={styles.bold}>{phoneNumber}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputs.current[index] = ref; }}
                style={styles.otpInput}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                autoFocus={index === 0}
              />
            ))}
          </View>

          <View style={styles.footer}>
            {timer > 0 ? (
              <Text style={styles.resendText}>Resend code in {timer}s</Text>
            ) : (
              <TouchableOpacity>
                <Text style={styles.resendLink}>Resend code</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.helpButton}>
              <Text style={styles.helpText}>I didn't receive a code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 40,
  },
  bold: {
    fontWeight: 'bold',
    color: '#000',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  otpInput: {
    width: 60,
    height: 70,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  footer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 20,
  },
  resendLink: {
    fontSize: 14,
    color: '#32BA7C',
    fontWeight: '600',
    marginBottom: 20,
  },
  helpButton: {
    marginTop: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textDecorationLine: 'underline',
  },
});

export default OTPPage;
