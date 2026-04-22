import { supabase } from '../lib/supabase';
import { Message, MessageStatus, Campaign } from '../types';

/**
 * MessagingService handles SMS delivery, campaign management, and message tracking.
 * It follows Zeal SMS architecture patterns for high-volume messaging.
 */
export class MessagingService {
  /**
   * Sends a single SMS.
   * In a production environment, this would trigger a Supabase Edge Function
   * or insert into a dedicated queue table.
   */
  static async sendMessage(payload: Partial<Message>): Promise<string> {
    if (!payload.recipient || !payload.content) {
      throw new Error('Recipient and content are required');
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        ...payload,
        status: 'queued',
        created_at: new Date().toISOString()
      }])
      .select('id')
      .single();

    if (error) {
      console.error('[MessagingService.sendMessage]:', error.message);
      throw error;
    }

    // CONCEPTUAL: Trigger delivery process
    // this.triggerDelivery(data.id);

    return data.id;
  }

  /**
   * Sends bulk SMS by creating a campaign and individual messages.
   */
  static async sendBulk(campaignName: string, recipients: string[], content: string): Promise<string> {
    // 1. Create Campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert([{
        name: campaignName,
        recipients_count: recipients.length,
        status: 'active',
        created_at: new Date().toISOString()
      }])
      .select('id')
      .single();

    if (campaignError) throw campaignError;

    // 2. Prepare bulk messages
    const messages = recipients.map(recipient => ({
      user_id: (supabase.auth.getUser() as any).data?.user?.id,
      recipient,
      content,
      status: 'queued' as MessageStatus,
      metadata: { campaign_id: campaign.id },
      created_at: new Date().toISOString()
    }));

    // 3. Batch insert (Supabase handles this efficiently)
    const { error: messageError } = await supabase
      .from('messages')
      .insert(messages);

    if (messageError) {
      console.error('[MessagingService.sendBulk]:', messageError.message);
      throw messageError;
    }

    return campaign.id;
  }

  /**
   * Fetches message history with filters.
   */
  static async getMessageHistory(filters?: { status?: MessageStatus; recipient?: string }): Promise<Message[]> {
    let query = supabase.from('messages').select('*').order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.recipient) query = query.ilike('recipient', `%${filters.recipient}%`);

    const { data, error } = await query.limit(100);

    if (error) throw error;
    return data as Message[];
  }

  /**
   * Logs an audit trail for sensitive actions.
   */
  static async logAudit(action: string, resource: string, details: any): Promise<void> {
    const { error } = await supabase.from('audit_logs').insert([{
      action,
      resource,
      details,
      created_at: new Date().toISOString()
    }]);

    if (error) console.error('[MessagingService.logAudit]:', error.message);
  }
}
