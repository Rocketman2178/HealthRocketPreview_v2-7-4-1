export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  isVerification: boolean;
  createdAt: Date;
  updatedAt: Date;
  user_name?: string;
  user_avatar_url?: string;
  reactions?: MessageReaction[];
  parentMessageId?: string;
  parentMessage?: {
    id: string;
    content: string;
    userId: string;
    user_name?: string;
    isVerification?: boolean;
    mediaUrl?: string;
    mediaType?: string;
  };
  replyCount?: number;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  userName?: string;
  createdAt: Date;
}

export interface MessageReadStatus {
  userId: string;
  chatId: string;
  lastReadAt: Date;
}

export interface ChatParticipant {
  userId: string;
  name: string;
  avatarUrl?: string;
  level: number;
  healthScore: number;
  healthspanYears: number;
  plan: string;
}