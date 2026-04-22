/**
 * Unified Type Definitions for BorlaWura User App & Zeal SMS
 */

export type OrderStatus = 'pending' | 'accepted' | 'assigned' | 'confirmed' | 'active' | 'in_progress' | 'completed' | 'cancelled' | 'scheduled';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  location?: string;
  avatar_url?: string;
  status: 'active' | 'suspended' | 'flagged' | 'rejected' | 'pending';
  push_token?: string;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  sub_status?: string;
  service_type: string;
  address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  waste_type: string;
  waste_size: string;
  notes?: string;
  scheduled_at: string;
  rider_id?: string;
  created_at: string;
  updated_at?: string;
  cancelled_at?: string;
}

export interface Rider {
  id: string;
  full_name: string;
  phone_number: string;
  vehicle_type?: string;
  vehicle_number?: string;
  status: 'online' | 'offline' | 'busy';
  rating: number;
}

/**
 * Zeal SMS Types
 */

export type MessageStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'rejected';

export interface Message {
  id: string;
  user_id: string;
  recipient: string;
  content: string;
  status: MessageStatus;
  provider_id?: string;
  cost?: number;
  metadata?: Record<string, any>;
  scheduled_at?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  template_id?: string;
  recipients_count: number;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  scheduled_at?: string;
  created_at: string;
}

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hint: string; // First 4 chars
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
}
