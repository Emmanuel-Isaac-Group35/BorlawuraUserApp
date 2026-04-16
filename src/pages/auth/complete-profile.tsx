import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { typography } from '../../utils/typography';

const CompleteProfilePage = () => {
  const { user, login } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation state
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleComplete = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      Alert.alert("Invalid Phone", "Please provide a valid phone number.");
      return;
    }
    if (!address || address.length < 5) {
      Alert.alert("Incomplete Address", "Please provide a more descriptive address.");
      return;
    }

    setIsLoading(true);
    try {
      const cleanNumber = phoneNumber.replace(/\s+/g, '');
      const finalNumber = cleanNumber.startsWith('0') ? cleanNumber.substring(1) : cleanNumber;
      const fullNumber = `+233${finalNumber}`;

      await login({
          ...user,
          phone_number: fullNumber,
          location: address.trim(),
          isProfileCompletion: true
      });
      
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile.");
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
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
           <Animated.View style={[styles.mainContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.header}>
                 <View style={styles.iconCircle}>
                    <Image 
                       source={{ uri: 'https://cdn-icons-png.flaticon.com/512/9436/9436155.png' }} 
                       style={styles.headerIcon} 
                    />
                 </View>
                 <Text style={styles.title}>You're Almost There!</Text>
                 <Text style={styles.subtitle}>
                   Welcome {user?.full_name?.split(' ')[0] || 'User'}! Join the movement by adding your pickup details.
                 </Text>
              </View>

              <View style={styles.form}>
                 <View style={styles.inputGroup}>
                   <Text style={styles.label}>Contact Number</Text>
                   <View style={styles.inputRow}>
                      <View style={styles.countryPicker}>
                         <Image source={{ uri: 'https://flagcdn.com/w40/gh.png' }} style={styles.flag} />
                         <Text style={styles.countryCode}>+233</Text>
                      </View>
                      <TextInput
                         style={styles.phoneInput}
                         placeholder="024 123 4567"
                         keyboardType="phone-pad"
                         value={phoneNumber}
                         onChangeText={setPhoneNumber}
                         placeholderTextColor="#94a3b8"
                         autoFocus={true}
                      />
                   </View>
                 </View>

                 <View style={styles.inputGroup}>
                   <View style={styles.labelRow}>
                      <Text style={styles.label}>Pickup Address</Text>
                      <Text style={styles.labelHint}>Be descriptive</Text>
                   </View>
                   <View style={styles.inputWrapper}>
                      <TextInput
                         style={styles.input}
                         placeholder="e.g. House No. 12, West Legon, Accra"
                         value={address}
                         onChangeText={setAddress}
                         placeholderTextColor="#94a3b8"
                         multiline
                         blurOnSubmit={true}
                      />
                   </View>
                 </View>

                 <View style={styles.infoBox}>
                    <Text style={styles.infoText}>📍 Your address helps our riders find you faster for scheduled pickups.</Text>
                 </View>

                 <TouchableOpacity 
                   style={[styles.submitBtn, (!phoneNumber || !address || isLoading) && styles.submitBtnDisabled]}
                   onPress={handleComplete}
                   disabled={isLoading}
                   activeOpacity={0.8}
                 >
                   {isLoading ? (
                     <ActivityIndicator color="#FFFFFF" />
                   ) : (
                     <Text style={styles.submitBtnText}>Confirm & Explore</Text>
                   )}
                 </TouchableOpacity>
              </View>
           </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { flexGrow: 1, padding: 30 },
  mainContent: { flex: 1 },
  header: { alignItems: 'center', marginTop: 20, marginBottom: 40 },
  iconCircle: {
     width: 110,
     height: 110,
     borderRadius: 35,
     backgroundColor: '#f0fdf4',
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: 24,
     borderWidth: 1,
     borderColor: '#dcfce7'
  },
  headerIcon: { width: 64, height: 64 },
  title: { fontSize: 32, fontFamily: typography.bold, color: '#0f172a', textAlign: 'center', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, fontFamily: typography.medium, color: '#64748b', textAlign: 'center', marginTop: 12, lineHeight: 24, paddingHorizontal: 10 },
  form: { flex: 1 },
  inputGroup: { marginBottom: 26 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { fontSize: 13, fontFamily: typography.bold, color: '#334155', textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: 4 },
  labelHint: { fontSize: 11, fontFamily: typography.medium, color: '#94a3b8' },
  inputWrapper: {
    minHeight: 58,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#f1f5f9',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  input: {
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#0f172a',
    paddingVertical: 14
  },
  inputRow: { flexDirection: 'row', gap: 12 },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#f1f5f9',
  },
  flag: { width: 22, height: 15, borderRadius: 2, marginRight: 10 },
  countryCode: { fontSize: 15, fontFamily: typography.bold, color: '#0f172a' },
  phoneInput: {
    flex: 1,
    height: 58,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#0f172a',
    borderWidth: 2,
    borderColor: '#f1f5f9',
  },
  infoBox: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoText: { fontSize: 13, fontFamily: typography.medium, color: '#64748b', lineHeight: 20 },
  submitBtn: {
    height: 64,
    backgroundColor: '#10b981',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  submitBtnDisabled: { backgroundColor: '#e2e8f0', shadowOpacity: 0 },
  submitBtnText: { fontSize: 17, fontFamily: typography.bold, color: '#ffffff', letterSpacing: 0.5 },
});

export default CompleteProfilePage;
