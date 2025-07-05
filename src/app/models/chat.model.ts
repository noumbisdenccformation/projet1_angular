export interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  messageType: 'TEXT' | 'FILE' | 'IMAGE';
  attachmentUrl?: string;
}

export interface ChatRoom {
  id: number;
  participants: number[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatNotification {
  id: number;
  userId: number;
  message: string;
  type: 'NEW_MESSAGE' | 'APPOINTMENT_REMINDER' | 'SYSTEM';
  isRead: boolean;
  createdAt: Date;
} 