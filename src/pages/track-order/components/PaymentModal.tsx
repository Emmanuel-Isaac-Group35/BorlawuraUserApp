import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ActivityIndicator, Image, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { typography } from '../../../utils/typography';
import { RemixIcon } from '../../../utils/icons';
import { OrderService } from '../../../services/OrderService';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';

interface PaymentModalProps {
  visible: boolean;
  orderId: string;
  amountDue: number;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  orderId,
  amountDue,
  paymentStatus,
  onClose,
  onSuccess
}) => {
  const [method, setMethod] = useState<'cash' | 'momo' | 'card' | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Monitor the external payment status via props
  useEffect(() => {
    if (visible && paymentStatus === 'paid') {
      onSuccess();
    }
    // Also if status is failed from webhook, show error
    if (visible && paymentStatus === 'failed') {
      setMethod(null);
      setErrorMsg('The payment gateway reported a failure. Please try another method.');
    }
  }, [paymentStatus, visible, onSuccess]);

  const handleCash = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await OrderService.updatePaymentMethod(orderId, 'cash');
      setMethod('cash');
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to update payment method.');
    } finally {
      setLoading(false);
    }
  };

  const handleHubtelCheckout = async (selectedMethod: 'momo' | 'card') => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setMethod(selectedMethod);
      
      const { checkoutUrl, clientReference } = await OrderService.initiatePayment(orderId, selectedMethod, amountDue);
      
      // Open Hubtel Checkout in an in-app browser
      await WebBrowser.openBrowserAsync(checkoutUrl);
      
      // When the browser is closed, check if the payment was successful
      setLoading(true);
      setErrorMsg(null);
      const isPaid = await OrderService.checkPaymentStatus(orderId, clientReference);
      
      if (isPaid) {
        onSuccess();
      } else {
        setErrorMsg('Payment was not completed or is still processing. Please try again if you did not pay.');
        setMethod(null);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to initiate payment.');
      setMethod(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setMethod(null);
    setErrorMsg(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.handle} />

            {/* IF PAYMENT STATUS IS FAILED OR ERROR HAPPENED */}
            {errorMsg ? (
              <View style={styles.stateContainer}>
                <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
                  <RemixIcon name="ri-close-circle-fill" size={32} color="#ef4444" />
                </View>
                <Text style={styles.title}>Payment Failed</Text>
                <Text style={styles.subText}>{errorMsg}</Text>
                
                <TouchableOpacity style={styles.primaryBtn} onPress={handleRetry}>
                  <Text style={styles.primaryBtnText}>Retry Payment</Text>
                </TouchableOpacity>
              </View>
            ) : 

            /* IF WAITING FOR CASH CONFIRMATION OR WEBHOOK */
            method ? (
              <View style={styles.stateContainer}>
                {method === 'cash' ? (
                  <>
                    <View style={[styles.iconCircle, { backgroundColor: '#ecfccb' }]}>
                      <RemixIcon name="ri-money-dollar-circle-fill" size={32} color="#65a30d" />
                    </View>
                    <Text style={styles.title}>Hand Cash to Rider</Text>
                    <Text style={styles.subText}>Please pay GHS {amountDue.toFixed(2)} to the rider.</Text>
                    <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 20 }} />
                    <Text style={styles.waitingText}>Waiting for rider to confirm receipt...</Text>
                  </>
                ) : (
                  <>
                    <View style={[styles.iconCircle, { backgroundColor: '#e0e7ff' }]}>
                      <RemixIcon name="ri-secure-payment-fill" size={32} color="#4f46e5" />
                    </View>
                    <Text style={styles.title}>Processing Payment</Text>
                    <Text style={styles.subText}>If you closed the browser before completing, please retry.</Text>
                    <ActivityIndicator size="large" color="#4f46e5" style={{ marginTop: 20 }} />
                    <Text style={styles.waitingText}>Waiting for secure confirmation from Hubtel...</Text>
                    <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#f1f5f9', marginTop: 30 }]} onPress={handleRetry}>
                      <Text style={[styles.primaryBtnText, { color: '#0f172a' }]}>Change Method / Retry</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ) : 

            /* SELECT PAYMENT METHOD */
            (
              <View style={styles.stateContainer}>
                <Text style={styles.headerTitle}>Payment Due</Text>
                
                <View style={styles.amountBox}>
                  <Text style={styles.currency}>GHS</Text>
                  <Text style={styles.amount}>{amountDue.toFixed(2)}</Text>
                </View>

                <Text style={styles.selectText}>Select Payment Method</Text>

                <TouchableOpacity 
                  style={styles.methodCard} 
                  onPress={() => handleHubtelCheckout('momo')}
                  disabled={loading}
                >
                  <View style={[styles.methodIcon, { backgroundColor: '#fef9c3' }]}>
                    <RemixIcon name="ri-smartphone-line" size={24} color="#ca8a04" />
                  </View>
                  <View style={styles.methodContent}>
                    <Text style={styles.methodTitle}>Pay with Momo</Text>
                    <Text style={styles.methodSub}>MTN, Telecel, AT via Hubtel</Text>
                  </View>
                  <RemixIcon name="ri-arrow-right-s-line" size={20} color="#cbd5e1" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.methodCard} 
                  onPress={handleCash}
                  disabled={loading}
                >
                  <View style={[styles.methodIcon, { backgroundColor: '#ecfccb' }]}>
                    <RemixIcon name="ri-money-dollar-circle-line" size={24} color="#65a30d" />
                  </View>
                  <View style={styles.methodContent}>
                    <Text style={styles.methodTitle}>Pay on Completion</Text>
                    <Text style={styles.methodSub}>Pay the rider physically</Text>
                  </View>
                  <RemixIcon name="ri-arrow-right-s-line" size={20} color="#cbd5e1" />
                </TouchableOpacity>

                {loading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#10b981" />
                  </View>
                )}
              </View>
            )}

            <View style={styles.secureFooter}>
              <RemixIcon name="ri-lock-fill" size={12} color="#94a3b8" />
              <Text style={styles.secureText}>Payments secured by Hubtel</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    width: '100%',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    minHeight: 400,
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 24,
  },
  stateContainer: {
    alignItems: 'center',
    width: '100%',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  currency: {
    fontSize: 20,
    fontFamily: typography.bold,
    color: '#0f172a',
    marginTop: 6,
    marginRight: 4,
  },
  amount: {
    fontSize: 48,
    fontFamily: typography.bold,
    color: '#0f172a',
  },
  selectText: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: '#64748b',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    borderRadius: 20,
    width: '100%',
    marginBottom: 12,
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: '#0f172a',
  },
  methodSub: {
    fontSize: 13,
    fontFamily: typography.medium,
    color: '#64748b',
    marginTop: 2,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: typography.bold,
    color: '#0f172a',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  waitingText: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: '#0f172a',
    marginTop: 16,
  },
  primaryBtn: {
    backgroundColor: '#10b981',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 30,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: typography.bold,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  secureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  secureText: {
    fontSize: 11,
    fontFamily: typography.medium,
    color: '#94a3b8',
    textTransform: 'uppercase',
  }
});
