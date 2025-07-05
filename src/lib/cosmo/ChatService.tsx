import { createClient } from '@supabase/supabase-js';

export interface CosmoMessage {
  id: string;
  content: string;
  isUser: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
  sessionId?: string;
}

export class CosmoChatService {
  private static supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  static async sendMessage(
    userId: string,
    content: string,
    isUser: boolean = true,
    sessionId?: string
  ): Promise<CosmoMessage | null> {
    try {
      const { data, error } = await this.supabase
        .from('cosmo_chat_messages')
        .insert({
          user_id: userId,
          content: content,
          is_user_message: isUser,
          session_id: sessionId,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        content: data.content,
        isUser: data.is_user_message,
        createdAt: new Date(data.created_at),
        metadata: data.metadata,
        sessionId: data.session_id
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  static async getRecentMessages(
    userId: string,
    limit: number = 50,
    page: number = 1
  ): Promise<CosmoMessage[]> {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error } = await this.supabase
        .from('cosmo_chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        isUser: msg.is_user_message,
        createdAt: new Date(msg.created_at),
        metadata: msg.metadata,
        sessionId: msg.session_id
      }));
    } catch (error) {
      console.error('Error fetching message history:', error);
      return [];
    }
  }

  static subscribeToMessages(userId: string, callback: (message: CosmoMessage) => void) {
    try {
      console.log(`Setting up message subscription for user ${userId}`);
      
      const subscription = this.supabase
        .channel('cosmo_messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'cosmo_chat_messages',
            filter: `user_id=eq.${userId}`
          },
          (payload: any) => {
            console.log('Received new message:', payload);
            const newMessage: CosmoMessage = {
              id: payload.new.id,
              content: payload.new.content,
              isUser: payload.new.is_user_message,
              createdAt: new Date(payload.new.created_at),
              metadata: payload.new.metadata,
              sessionId: payload.new.session_id
            };
            callback(newMessage);
          }
        )
        .subscribe();

      console.log('Message subscription set up successfully');
      
      return {
        unsubscribe: () => {
          console.log('Unsubscribing from messages');
          subscription.unsubscribe();
        }
      };
    } catch (error) {
      console.error('Error setting up message subscription:', error);
      throw error;
    }
  }

  static async deleteMessage(messageId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('cosmo_chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }
}