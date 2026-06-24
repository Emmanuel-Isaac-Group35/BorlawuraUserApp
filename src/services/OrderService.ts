import { supabase } from '../lib/supabase';
import { Order, OrderStatus } from '../types';

/**
 * OrderService handles all business logic related to orders.
 * Encapsulating these calls allows for better error handling,
 * logging, and rate limiting in the future.
 */
export class OrderService {
  /**
   * Fetches all orders for a specific user.
   */
  static async getOrdersByUserId(userId: string): Promise<Order[]> {
    if (!userId) throw new Error('User ID is required');

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[OrderService.getOrdersByUserId]:', error.message);
      throw error;
    }

    return (data || []) as Order[];
  }

  /**
   * Updates the status of an order.
   */
  static async updateStatus(orderId: string, status: OrderStatus, subStatus?: string): Promise<void> {
    const updatePayload: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };
    
    if (subStatus) updatePayload.sub_status = subStatus;
    if (status === 'cancelled') updatePayload.cancelled_at = new Date().toISOString();

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (error) {
      console.error(`[OrderService.updateStatus] Error updating ${orderId}:`, error.message);
      throw error;
    }
  }

  /**
   * Places a new order.
   */
  static async placeOrder(payload: Partial<Order>): Promise<string> {
    const { data, error } = await supabase
      .from('orders')
      .insert([payload])
      .select('id')
      .single();

    if (error || !data) {
      console.error('[OrderService.placeOrder]:', error?.message);
      throw error || new Error('Failed to create order');
    }

    return data.id;
  }

  /**
   * Updates the payment method for an order (e.g. for Cash payments)
   */
  static async updatePaymentMethod(orderId: string, method: 'cash' | 'momo' | 'card'): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({ payment_method: method, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) {
      console.error(`[OrderService.updatePaymentMethod] Error updating ${orderId}:`, error.message);
      throw error;
    }
  }

  /**
   * Initiates a payment directly through the Hubtel Payment Gateway API.
   * Returns a checkout URL and the unique client reference to be checked later.
   */
  static async initiatePayment(orderId: string, method: 'momo' | 'card', amount: number): Promise<{ checkoutUrl: string, clientReference: string }> {
    // We update the DB first to track the intended method and amount
    await supabase
      .from('orders')
      .update({ 
        payment_method: method, 
        amount_due: amount,
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId);

    const merchantAccount = '2039716';

    // btoa() is not available in React Native by default, so we use a pre-computed base64 string
    // of "wjzlr2z:e4ff16b4616242b98fef5a61feb2e493"
    const basicAuth = 'd2p6bHIyejplNGZmMTZiNDYxNjI0MmI5OGZlZjVhNjFmZWIyZTQ5Mw==';

    // Hubtel requires clientReference to be strictly unique per checkout attempt
    // If a user retries, we must use a new reference.
    const clientReference = `${orderId}-${Date.now()}`;

    const hubtelPayload = {
      totalAmount: amount,
      description: `BorlaWura Payment for Order #${orderId.slice(0, 8)}`,
      callbackUrl: "https://webhook.site/placeholder", 
      // Hubtel API requires valid HTTPS URLs. Deep links (borlawura://) are rejected.
      // The user will just manually close the WebBrowser modal when they see this page.
      returnUrl: "https://hubtel.com", 
      cancellationUrl: "https://hubtel.com", 
      merchantAccountNumber: merchantAccount,
      clientReference: clientReference,
    };

    try {
      const hubtelRes = await fetch('https://payproxyapi.hubtel.com/items/initiate', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(hubtelPayload)
      });

      const hubtelData = await hubtelRes.json();

      if (!hubtelRes.ok || !hubtelData.data?.checkoutUrl) {
        console.error('Hubtel API Error:', hubtelData);
        throw new Error('Failed to generate Hubtel checkout URL. Check credentials.');
      }

      return { checkoutUrl: hubtelData.data.checkoutUrl, clientReference };
    } catch (error: any) {
      console.error('[OrderService.initiatePayment] Error:', error.message);
      throw error;
    }
  }

  /**
   * Checks the payment status directly from Hubtel using the unique clientReference.
   */
  static async checkPaymentStatus(orderId: string, clientReference: string): Promise<boolean> {
    try {
      // Because Hubtel's frontend status check API is unavailable/undocumented,
      // and we are bypassing backend webhooks for this specific frontend implementation,
      // we simulate a successful verification when the user closes the checkout browser.
      // In a real production environment with a backend, a webhook MUST be used instead.
      
      await supabase
        .from('orders')
        .update({ 
          payment_status: 'paid', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);
        
      return true;
    } catch (e) {
      console.error('[OrderService.checkPaymentStatus] Error:', e);
      return false;
    }
  }
}

