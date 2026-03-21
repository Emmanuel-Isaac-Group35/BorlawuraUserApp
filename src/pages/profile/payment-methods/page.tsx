import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Navigation } from '../../../components/feature/Navigation';
import { BottomNavigation } from '../../../components/feature/BottomNavigation';
import { RemixIcon } from '../../../utils/icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

const PaymentMethodsPage: React.FC = () => {
  const navigation = useNavigation();
  const { user: authUser } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPaymentMethods = async () => {
    if (!authUser) {
      setIsLoading(false);
      return;
    }
    const searchId = authUser.supabase_id || authUser.id;
    if (!searchId || String(searchId).startsWith('user_')) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', searchId)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('not find the table')) {
          console.log('Payment methods table not yet created.');
          setPaymentMethods([]);
        } else {
          throw error;
        }
      } else {
        const formatted = (data || []).map(p => ({
          id: p.id,
          type: p.type,
          provider: p.provider,
          number: p.account_number,
          isDefault: p.is_default,
          icon: p.type === 'mobile_money' ? 'ri-smartphone-line' : 'ri-credit-card-line'
        }));
        setPaymentMethods(formatted);
      }
    } catch (e) {
      console.error('Error fetching payment methods:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();

    const searchId = authUser?.supabase_id || authUser?.id;
    if (searchId && !String(searchId).startsWith('user_')) {
      const channel = supabase
        .channel('payment-methods-sync')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'payment_methods', 
            filter: `user_id=eq.${searchId}` 
          },
          () => fetchPaymentMethods()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authUser]);

  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newProvider, setNewProvider] = useState('');
  const [newNumber, setNewNumber] = useState('');

  const handleAddMethod = async () => {
    if (!newProvider || !newNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const searchId = authUser?.supabase_id || authUser?.id;
    const methodData = {
      user_id: searchId,
      type: 'mobile_money',
      provider: newProvider,
      account_number: `**** **** ${newNumber.slice(-4)}`,
      is_default: paymentMethods.length === 0,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('payment_methods').insert([methodData]);
      if (error) {
        if (error.code === '42P01') {
           Alert.alert('Notice', 'Database table not found. Please run the provided SQL script.');
           return;
        }
        if (error.code === '42501') {
           Alert.alert('Security Notice', 'Permission denied. Please run the SQL command to disable RLS (Security) for current testing.');
           return;
        }
        throw error;
      }
      
      setShowAddMethod(false);
      setNewProvider('');
      setNewNumber('');
      fetchPaymentMethods();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to add payment method.');
    }
  };

  const handleSetDefault = async (id: any) => {
    const searchId = authUser?.supabase_id || authUser?.id;
    try {
      await supabase.from('payment_methods').update({ is_default: false }).eq('user_id', searchId);
      await supabase.from('payment_methods').update({ is_default: true }).eq('id', id);
      fetchPaymentMethods();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (id: any) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('payment_methods').delete().eq('id', id);
              fetchPaymentMethods();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete');
            }
          }
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
            <Text style={styles.subtitle}>Manage your MoMo accounts</Text>
          </View>
        </View>

        <View style={styles.paymentMethodsList}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 20 }} />
          ) : paymentMethods.length === 0 ? (
            <View style={styles.emptyState}>
              <RemixIcon name="ri-wallet-3-line" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No payment methods added yet</Text>
              <Text style={styles.emptySubtitle}>Add your MTN, Vodafone, or AirtelTigo account</Text>
            </View>
          ) : (
            paymentMethods.map((method) => (
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
            ))
          )}
        </View>

        <TouchableOpacity
          onPress={() => setShowAddMethod(true)}
          style={styles.addButton}
        >
          <RemixIcon name="ri-add-line" size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Mobile Money</Text>
        </TouchableOpacity>

        <View style={styles.supportedCard}>
          <Text style={styles.supportedTitle}>Supported Mobile Money</Text>
          <View style={styles.supportedGrid}>
            {[
              { name: 'MTN MoMo', color: '#f97316' },
              { name: 'Vodafone Cash', color: '#dc2626' },
              { name: 'AirtelTigo', color: '#3b82f6' }
            ].map((method, index) => (
              <View key={index} style={styles.supportedItem}>
                <View style={[styles.supportedIcon, { backgroundColor: `${method.color}20` }]}>
                  <RemixIcon 
                    name="ri-smartphone-line" 
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
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={() => setShowAddMethod(false)} 
          />
          <View style={styles.modalBottomContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Mobile Money</Text>
              <TouchableOpacity
                onPress={() => setShowAddMethod(false)}
                style={styles.closeButton}
              >
                <RemixIcon name="ri-close-line" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Provider</Text>
                <TextInput
                  value={newProvider}
                  onChangeText={setNewProvider}
                  style={styles.formInput}
                  placeholder="e.g., MTN MoMo"
                  placeholderTextColor="#9ca3af"
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
                  maxLength={10}
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleAddMethod}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Confirm Add Account</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  },
  paymentActions: {
    gap: 8,
    alignItems: 'flex-end',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
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
    flex: 1,
    minWidth: '28%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
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
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
    width: '100%',
  },
  modalBottomContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
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
  formContainer: {
    gap: 16,
    marginBottom: 24,
  },
  formGroup: {
    gap: 8,
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
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
