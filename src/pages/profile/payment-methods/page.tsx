import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Navigation } from '../../../components/feature/Navigation';
import { BottomNavigation } from '../../../components/feature/BottomNavigation';
import { RemixIcon } from '../../../utils/icons';
import { useNavigation } from '@react-navigation/native';

const PaymentMethodsPage: React.FC = () => {
  const navigation = useNavigation();
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      type: 'mobile_money',
      provider: 'MTN Mobile Money',
      number: '**** **** 8901',
      isDefault: true,
      icon: 'ri-smartphone-line'
    },
    {
      id: 2,
      type: 'card',
      provider: 'Visa',
      number: '**** **** **** 4532',
      expiry: '12/25',
      isDefault: false,
      icon: 'ri-credit-card-line'
    }
  ]);

  const [showAddMethod, setShowAddMethod] = useState(false);
  const [selectedType, setSelectedType] = useState('mobile_money');
  const [newProvider, setNewProvider] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newExpiry, setNewExpiry] = useState('');

  const handleAddMethod = () => {
    if (!newProvider || !newNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const newMethod = {
      id: Date.now(),
      type: selectedType,
      provider: newProvider,
      number: selectedType === 'mobile_money' ? `**** **** ${newNumber.slice(-4)}` : `**** **** **** ${newNumber.slice(-4)}`,
      expiry: newExpiry || undefined,
      isDefault: paymentMethods.length === 0,
      icon: selectedType === 'mobile_money' ? 'ri-smartphone-line' : 'ri-credit-card-line'
    };

    setPaymentMethods([...paymentMethods, newMethod]);
    setShowAddMethod(false);
    setNewProvider('');
    setNewNumber('');
    setNewExpiry('');
  };

  const handleSetDefault = (id: number) => {
    setPaymentMethods(paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === id
    })));
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setPaymentMethods(paymentMethods.filter(method => method.id !== id))
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Navigation />
      <BottomNavigation />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <RemixIcon name="ri-arrow-left-line" size={24} color="#1f2937" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Payment Methods</Text>
            <Text style={styles.subtitle}>Manage your payment options</Text>
          </View>
        </View>

        <View style={styles.paymentMethodsList}>
          {paymentMethods.map((method) => (
            <View key={method.id} style={styles.paymentCard}>
              <View style={styles.paymentContent}>
                <View style={styles.paymentIcon}>
                  <RemixIcon name={method.icon} size={24} color="#10b981" />
                </View>
                
                <View style={styles.paymentInfo}>
                  <View style={styles.paymentHeader}>
                    <Text style={styles.paymentProvider}>{method.provider}</Text>
                    {method.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.paymentNumber}>{method.number}</Text>
                  {method.expiry && (
                    <Text style={styles.paymentExpiry}>Expires {method.expiry}</Text>
                  )}
                </View>

                <View style={styles.paymentActions}>
                  {!method.isDefault && (
                    <TouchableOpacity
                      onPress={() => handleSetDefault(method.id)}
                      style={styles.setDefaultButton}
                    >
                      <Text style={styles.setDefaultText}>Set Default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleDelete(method.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => setShowAddMethod(true)}
          style={styles.addButton}
        >
          <RemixIcon name="ri-add-line" size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Payment Method</Text>
        </TouchableOpacity>

        <View style={styles.supportedCard}>
          <Text style={styles.supportedTitle}>Supported Payment Methods</Text>
          <View style={styles.supportedGrid}>
            {[
              { name: 'MTN MoMo', color: '#f97316' },
              { name: 'Vodafone Cash', color: '#dc2626' },
              { name: 'AirtelTigo', color: '#3b82f6' },
              { name: 'Visa', color: '#3b82f6' },
              { name: 'Mastercard', color: '#dc2626' },
              { name: 'Verve', color: '#22c55e' }
            ].map((method, index) => (
              <View key={index} style={styles.supportedItem}>
                <View style={[styles.supportedIcon, { backgroundColor: `${method.color}20` }]}>
                  <RemixIcon 
                    name={index < 3 ? 'ri-smartphone-line' : 'ri-credit-card-line'} 
                    size={16} 
                    color={method.color} 
                  />
                </View>
                <Text style={styles.supportedText}>{method.name}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Add Payment Method Modal */}
      <Modal
        visible={showAddMethod}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMethod(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBottomContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Payment Method</Text>
              <TouchableOpacity
                onPress={() => setShowAddMethod(false)}
                style={styles.closeButton}
              >
                <RemixIcon name="ri-close-line" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                onPress={() => setSelectedType('mobile_money')}
                style={[
                  styles.typeButton,
                  selectedType === 'mobile_money' && styles.typeButtonActive
                ]}
              >
                <Text style={[
                  styles.typeButtonText,
                  selectedType === 'mobile_money' && styles.typeButtonTextActive
                ]}>
                  Mobile Money
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedType('card')}
                style={[
                  styles.typeButton,
                  selectedType === 'card' && styles.typeButtonActive
                ]}
              >
                <Text style={[
                  styles.typeButtonText,
                  selectedType === 'card' && styles.typeButtonTextActive
                ]}>
                  Card
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              {selectedType === 'mobile_money' ? (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Provider</Text>
                    <TextInput
                      value={newProvider}
                      onChangeText={setNewProvider}
                      style={styles.formInput}
                      placeholder="Select provider"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Phone Number</Text>
                    <TextInput
                      value={newNumber}
                      onChangeText={setNewNumber}
                      style={styles.formInput}
                      placeholder="0XX XXX XXXX"
                      keyboardType="phone-pad"
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Card Type</Text>
                    <TextInput
                      value={newProvider}
                      onChangeText={setNewProvider}
                      style={styles.formInput}
                      placeholder="Select card type"
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Card Number</Text>
                    <TextInput
                      value={newNumber}
                      onChangeText={setNewNumber}
                      style={styles.formInput}
                      placeholder="XXXX XXXX XXXX XXXX"
                      keyboardType="number-pad"
                      maxLength={19}
                    />
                  </View>
                  <View style={styles.formRow}>
                    <View style={[styles.formGroup, styles.formGroupHalf]}>
                      <Text style={styles.formLabel}>Expiry Date</Text>
                      <TextInput
                        value={newExpiry}
                        onChangeText={setNewExpiry}
                        style={styles.formInput}
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                    </View>
                    <View style={[styles.formGroup, styles.formGroupHalf]}>
                      <Text style={styles.formLabel}>CVV</Text>
                      <TextInput
                        style={styles.formInput}
                        placeholder="XXX"
                        keyboardType="number-pad"
                        maxLength={3}
                      />
                    </View>
                  </View>
                </>
              )}
            </View>

            <TouchableOpacity
              onPress={handleAddMethod}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Add Payment Method</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PaymentMethodsPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 80,
    paddingBottom: 100,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
  },
  paymentMethodsList: {
    gap: 16,
    marginBottom: 24,
  },
  paymentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  paymentProvider: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#d1fae5',
    borderRadius: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10b981',
  },
  paymentNumber: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  paymentExpiry: {
    fontSize: 12,
    color: '#9ca3af',
  },
  paymentActions: {
    gap: 8,
  },
  setDefaultButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  setDefaultText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10b981',
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#dc2626',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  supportedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  supportedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  supportedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  supportedItem: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  supportedIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  supportedText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBottomContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#10b981',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  formContainer: {
    gap: 16,
    marginBottom: 24,
  },
  formGroup: {
    gap: 8,
  },
  formGroupHalf: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  formInput: {
    padding: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    fontSize: 14,
    color: '#1f2937',
  },
  saveButton: {
    width: '100%',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
});
