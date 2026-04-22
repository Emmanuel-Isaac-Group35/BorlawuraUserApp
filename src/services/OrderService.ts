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
}
